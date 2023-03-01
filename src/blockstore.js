import { parse } from 'multiformats/link'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import * as Block from 'multiformats/block'
import { CID } from 'multiformats/cid'
import * as CBW from '@ipld/car/buffer-writer'
import { CarReader } from '@ipld/car'

// const sleep = ms => new Promise(r => setTimeout(r, ms))

/**
 * @typedef {Object} AnyBlock
 * @property {import('./link').AnyLink} cid - The CID of the block
 * @property {Uint8Array} bytes - The block's data
 *
 * @typedef {Object} Blockstore
 * @property {function(import('./link').AnyLink): Promise<AnyBlock|undefined>} get - A function to retrieve a block by CID
 * @property {function(import('./link').AnyLink, Uint8Array): Promise<void>} put - A function to store a block's data and CID
 *
 * A blockstore that caches writes to a transaction and only persists them when committed.
 * @implements {Blockstore}
 */
export default class TransactionBlockstore {
  /** @type {Map<string, Uint8Array>} */
  #oldBlocks = new Map()

  #valet = new Map() // cars by cid

  #instanceId = 'blkz.' + Math.random().toString(36).substring(2, 4)
  #inflightTransactions = new Set()

  /**
   * Get a block from the store.
   *
   * @param {import('./link').AnyLink} cid
   * @returns {Promise<AnyBlock | undefined>}
   */
  async get (cid) {
    const key = cid.toString()
    // it is safe to read from the in-flight transactions becauase they are immutable
    // const bytes = this.#oldBlocks.get(key) || await this.#valetGet(key)
    const bytes = await this.#transactionsGet(key) || await this.commitedGet(key)
    // const bytes = this.#blocks.get(key) || await this.#valetGet(key)
    // console.log('bytes', typeof bytes)
    if (!bytes) throw new Error('Missing block: ' + key)
    return { cid, bytes }
  }

  // this iterates over the in-flight transactions
  // and returns the first matching block it finds
  async #transactionsGet (key) {
    for (const transaction of this.#inflightTransactions) {
      const got = await transaction.get(key)
      if (got && got.bytes) return got.bytes
    }
  }

  async commitedGet (key) {
    return this.#oldBlocks.get(key) || await this.#valetGet(key)
  }

  /**
   * Add a block to the store. Usually bound to a transaction by a closure.
   * It sets the lastCid property to the CID of the block that was put.
   * This is used by the transaction as the head of the car when written to the valet.
   * We don't have to worry about which transaction we are when we are here because
   * we are the transactionBlockstore.
   *
   * @param {import('./link').AnyLink} cid
   * @param {Uint8Array} bytes
   */
  async put (cid, bytes) {
    throw new Error('use a transaction to put')
  }

  /**
   * Iterate over all blocks in the store.
   *
   * @yields {AnyBlock}
   * @returns {AsyncGenerator<AnyBlock>}
   */
  * entries () {
    // todo needs transaction blocks?
    // for (const [str, bytes] of this.#blocks) {
    //   yield { cid: parse(str), bytes }
    // }
    for (const [str, bytes] of this.#oldBlocks) {
      yield { cid: parse(str), bytes }
    }
  }

  /**
     * Begin a transaction. Ensures the uncommited blocks are empty at the begining.
     * Returns the blocks to read and write during the transaction.
     * @returns {InnerBlockstore}
     * @memberof TransactionBlockstore
     */
  begin (label = '') {
    const innerTransactionBlockstore = new InnerBlockstore(label, this)
    this.#inflightTransactions.add(innerTransactionBlockstore)
    return innerTransactionBlockstore
  }

  /**
     * Commit the transaction. Writes the blocks to the store.
     * @returns {Promise<void>}
     * @memberof TransactionBlockstore
     */
  async commit (innerBlockstore) {
    await this.#doCommit(innerBlockstore)
  }

  // first get the transaction blockstore from the map of transaction blockstores
  // then copy it to oldBlocks
  // then write the transaction blockstore to a car
  // then write the car to the valet
  // then remove the transaction blockstore from the map of transaction blockstores
  #doCommit = async (innerBlockstore) => {
    for (const { cid, bytes } of innerBlockstore.entries()) {
      this.#oldBlocks.set(cid.toString(), bytes) // unnecessary string conversion
    }
    // await this.#valetWriteTransaction(innerBlockstore)
  }

  /**
   * Group the blocks into a car and write it to the valet.
   * @param {InnerBlockstore} innerBlockstore
   * @returns {Promise<void>}
   * @memberof TransactionBlockstore
   * @private
   */
  #valetWriteTransaction = async (innerBlockstore) => {
    if (innerBlockstore.lastCid) {
      const newCar = await blocksToCarBlock(this.lastCid, innerBlockstore)
      this.#valet.set(newCar.cid.toString(), newCar.bytes)
    }
  }

  /**
   * Internal function to load blocks from persistent storage.
   * Currently it just searches all the cars for the block, but in the future
   * we need to index the block CIDs to the cars, and reference that to find the block.
   * This index will also allow us to use accelerator links for the gateway when needed.
   * It can itself be a prolly tree...
   * @param {string} cid
   * @returns {Promise<Uint8Array|undefined>}
   */
  #valetGet = async (cid) => {
    for (const [, carBytes] of this.#valet) {
      const reader = await CarReader.fromBytes(carBytes)
      const gotBlock = await reader.get(CID.parse(cid))
      if (gotBlock) {
        return gotBlock.bytes
      }
    }
  }

  /**
     * Retire the transaction. Clears the uncommited blocks.
     * @returns {void}
     * @memberof TransactionBlockstore
     */
  retire (innerBlockstore) {
    this.#inflightTransactions.delete(innerBlockstore)
  }
}

/**
 * Runs a function on an inner blockstore, then persists the change to a car writer
 * or other outer blockstore.
 * @param {string} label
 * @param {TransactionBlockstore} blockstore
 * @param {(innerBlockstore: Blockstore) => Promise<any>} doFun
 * @returns {Promise<any>}
 * @memberof TransactionBlockstore
 */
export const doTransaction = async (label, blockstore, doFun) => {
  if (!blockstore.commit) return await doFun(blockstore)
  const innerBlockstore = blockstore.begin(label)
  try {
    const result = await doFun(innerBlockstore)
    await blockstore.commit(innerBlockstore)
    return result
  } catch (e) {
    console.trace(`Transaction ${label} failed`, e)
    throw e
  } finally {
    blockstore.retire(innerBlockstore)
  }
}

const blocksToCarBlock = async (lastCid, blocks) => {
  let size = 0
  const headerSize = CBW.headerLength({ roots: [lastCid] })
  size += headerSize
  for (const [cid, bytes] of blocks) {
    size += CBW.blockLength({ cid: CID.parse(cid), bytes })
  }
  const buffer = new Uint8Array(size)
  const writer = await CBW.createWriter(buffer, { headerSize })

  writer.addRoot(lastCid)

  for (const [cid, bytes] of blocks) {
    writer.write({ cid: CID.parse(cid), bytes })
  }
  await writer.close()
  return await Block.encode({ value: writer.bytes, hasher: sha256, codec: raw })
}

/** @implements {BlockFetcher} */
export class InnerBlockstore { // if there are no further changes, just use MemoryBlockstore from ./block.js
  /** @type {Map<string, Uint8Array>} */
  #blocks = new Map()
  lastCid = null
  label = ''
  parentBlockstore = null

  constructor (label, parentBlockstore) {
    this.label = label
    this.parentBlockstore = parentBlockstore
  }

  /**
   * @param {import('./link').AnyLink} cid
   * @returns {Promise<AnyBlock | undefined>}
   */
  async get (cid) {
    const key = cid.toString()
    let bytes = this.#blocks.get(key)
    if (bytes) { return { cid, bytes } }
    bytes = await this.parentBlockstore.commitedGet(key)
    if (bytes) {
      return { cid, bytes }
    }
  }

  /**
   * @param {import('./link').AnyLink} cid
   * @param {Uint8Array} bytes
   */
  async put (cid, bytes) {
    // console.log('put', cid)
    this.#blocks.set(cid.toString(), bytes)
    this.lastCid = cid
  }

  * entries () {
    for (const [str, bytes] of this.#blocks) {
      yield { cid: parse(str), bytes }
    }
  }
}
