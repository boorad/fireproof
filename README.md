# 🔥 Fireproof

Fireproof is a realtime database for today's interactive applications. It uses immutable data and distributed protocols 
to offer a new kind of database that:
- can be embedded in any page or app, with a flexible data ownership model
- scales without incurring developer costs, thanks to Filecoin
- uses cryptographically verifiable protocols (what plants crave)

Learn more about the [concepts and architecture behind Fireproof](https://fireproof.storage/documentation/how-the-database-engine-works/), or jump to the [quick start](#quick-start) for React and server-side examples.

## Quick Start

Look in the `examples/` directory for projects using the database, or see [examples on CodePen](https://codepen.io/jchrisa/pen/GRYJJEM). If you are adding Fireproof to an existing page, just install it and try some operations.

```sh
npm install @fireproof/core
```

In your `app.js` or `app.tsx` file:

```js
import { Fireproof } from '@fireproof/core'
const fireproof = Fireproof.storage("my-db")
const ok = await fireproof.put({ hello: 'world' })
const doc = await fireproof.get(ok.id)
```

🤫 I like to drop a `window.fireproof = fireproof` in there as a development aid.

### ChatGPT Quick Start

Paste this to GPT 4 or 3.5 to enable it to write apps using Fireproof:

```
Fireproof/API/Usage: import { Fireproof, Listener, Index } from '@fireproof/core'; const db = fireproof.storage('app-db-name'); const ok = await db.put({ any: 'json' }); const doc = await db.get(ok.id); await db.del(doc._id); const all = await db.allDocuments(); all.rows.map(({key, value}) => value); const listener = new Listener(db); listener.on('*', updateReactStateFn); const index = new Index(db, (doc, map) => map(doc.any, {custom: Object.keys(doc)})); const result = await index.query({range : ['a', 'z']}); result.rows.map(({ key }) => key);
```

In the same prompt, describe the app you want to build. Here are some examples that worked for us:

* Create a react app using Fireproof for tracking party invites. It should have a text input that creates a new document with the guest name, and an Index that lists all guests in a &lt;ul&gt;. ([Running copy here.](https://codepen.io/jchrisa/pen/zYmogWO))
* Build a React app that allows you to create profiles for dogs, and browse to each profile. It should be optimized for mobile. Use Tailwind.
* Build a photo grid app that with drag and drop ordering that references photos by url. Use tailwind and render all photos as squares. Keep grid arrangement in fireproof with one document for each gallery, that is: 4-16 photos arranged into a layout.
* Build an app using React, Fireproof, MagicLink, and Tailwind that allows user to create one-question multiple choice polls and collect the answers.
* Create a note taking app using React, Tailwind, and Fireproof that stores each note as a large text string in a Fireproof document, and uses an Index to split the text of the documents into tokens for full text search. The app has an input field to search the documents via an index query.

Please share your successes with us here or on [Twitter.](https://twitter.com/FireproofStorge)

### Status

Fireproof is alpha software, ready for you to evaluate for your future applications. For now, [check out our React TodoMVC implementation running in browser-local mode.](https://main--lucky-naiad-5aa507.netlify.app/) It demonstrates document persistence, index queries, and event subscriptions, and uses the [`useFireproof()` React hook.](https://github.com/fireproof-storage/fireproof/blob/main/packages/fireproof/hooks/use-fireproof.tsx)

[![Test](https://github.com/jchris/fireproof/actions/workflows/test.yml/badge.svg)](https://github.com/jchris/fireproof/actions/workflows/test.yml)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Usage

```js
import { Fireproof } from 'fireproof';

async function main() {
  const database = Fireproof.storage('my-db');
  const ok = await database.put({
    name: 'alice',
    age: 42
  });
  
  const doc = await database.get(ok.id);
  console.log(doc.name); // 'alice'
}

main();
```

## Features

### Document Store

A simple put, get, and delete interface for keeping track of all your JSON documents. Once your data is in Fireproof you can access it from any app or website. Fireproof document store uses MVCC versioning and Merkle clocks so you can always recover the version you are looking for.

```js
const { id, ref } = await database.put({
    _id: 'three-thousand'
    name: 'André',
    age: 47
});
const doc = await database.get('three-thousand', {mvcc : true}) // mvcc is optional
// {
//    _id  : 'three-thousand'
//    _clock : CID(bafy84...agfw7)
//    name : 'André',
//    age  : 47
// }
```

The `_clock` allows you to query a stable snapshot of that version of the database. Fireproof uses immutable data structures under the hood, so you can always rollback to old data. Files can be embedded anywhere in your document using IPFS links like `{"/":"bafybeih3e3zdiehbqfpxzpppxrb6kaaw4xkbqzyr2f5pwr5refq2te2ape"}`, with API sugar coming soon.

### Flexible Indexes

Fireproof indexes are defined by custom JavaScript functions that you write, allowing you to easily index and search your data in the way that works best for your application. Easily handle data variety and schema drift by normalizing any data to the desired index.

```js
const index = new Index(database, function (doc, map) {
  map(doc.age, doc.name)
})
const { rows, ref } = await index.query({ range: [40, 52] })
// [ { key: 42, value: 'alice', id: 'a1s3b32a-3c3a-4b5e-9c1c-8c5c0c5c0c5c' },
//   { key: 47, value: 'André', id: 'three-thousand' } ]
```

### Realtime Updates

Subscribe to query changes in your application, so your UI updates automatically. Use the supplied React hooks, our Redux connector, or simple function calls to be notified of relevant changes.

```js
const listener = new Listener(database, function(doc, emit) {
  if (doc.type == 'member') {
    emit('member')
  }
})
listener.on('member', (id) => {
  const doc = await db.get(id)
  alert(`Member update ${doc.name}`)
})
```

### Self-sovereign Identity

Fireproof is so easy to integrate with any site or app because you can get started right away, and set up an account later. By default users write to their own database copy, so you can get pretty far before you even have to think about API keys. [Authorization is via non-extractable keypair](https://ucan.xyz), like TouchID / FaceID.

### Automatic Replication

Documents changes are persisted to [Filecoin](https://filecoin.io) via [web3.storage](https://web3.storage), and made available over [IPFS] and on a global content delivery network. All you need to do to sync state is send a link to the latest database head, and Fireproof will take care of the rest. [Learn how to enable replication.](#status)

### Cryptographic Proofs

The [UCAN protocol](https://ucan.xyz) verifiably links Fireproof updates to authorized agents via cryptographic proof chains. These proofs are portable like bearer tokens, but because invocations are signed by end-user device keys, UCAN proofs don't need to be hidden to be secure, allowing for delegation of service capabilities across devices and parties. Additionally, Fireproof's Merkle clocks and hash trees are immutable and self-validating, making merging changes safe and efficient. Fireproof makes cryptographic proofs available for all of its operations, making it an ideal verifiable document database for smart contracts and other applications running in trustless environments. [Proof chains provide performance benefits as well](https://purrfect-tracker-45c.notion.site/Data-Routing-23c37b269b4c4c3dacb60d0077113bcb), by allowing recipients to skip costly I/O operations and instead cryptographically verify that changes contain all of the required context.

## Limitations 💣

### Security

Until encryption support is enabled, all data written to Fireproof is public. There are no big hurdles for this feature but it's not ready yet.

### Replication

Currently Fireproof writes transactions and proofs to [CAR files](https://ipld.io/specs/transport/car/carv2/) which are well suited for peer and cloud replication. They are stored in IndexedDB locally, with cloud replication coming very soon.

### Pre-beta Software

While the underlying data structures and libraries Fireproof uses are trusted with billions of dollars worth of data, Fireproof started in February of 2023. Results may vary.

## Thanks 🙏

Fireproof is a synthesis of work done by people in the web community over the years. I couldn't even begin to name all the folks who made pivotal contributions. Without npm, React, and VS Code all this would have taken so much longer. Thanks to everyone who supported me getting into database development via Apache CouchDB, one of the original document databases. The distinguishing work on immutable datastructures comes from the years of consideration [IPFS](https://ipfs.tech), [IPLD](https://ipld.io), and the [Filecoin APIs](https://docs.filecoin.io) have enjoyed.

Thanks to Alan Shaw and Mikeal Rogers without whom this project would have never got started. The core Merkle hash-tree clock is based on [Alan's Pail](https://github.com/alanshaw/pail), and you can see the repository history goes all the way back to work begun as a branch of that repo. Mikeal wrote [the prolly trees implementation](https://github.com/mikeal/prolly-trees).

# Contributing

To contribute please follow these steps for local setup and installation of the project

1. Click on the "Fork" button in the top-right corner of the repository's page. This will create a copy of the repository in your account.
2. Clone the forked repository to your local machine using Git.
3. Now cd to the target directory, or load the directory in your IDE, and open up a terminal.
4. Write the command `pnpm install`. This will install all the dependencies that are listed in the `package.json` file.
5. Now change the directory to packages/fireproof using the command `cd packages/fireproof`.
6. See the `package.json` file to work with all the listed commands and try them out. You can also test your application locally using `npm test`.
7. Also change directory to `examples/todomvc` and run the command `npm run dev` to load up a simple application to understand the use of Fireproof as a real-time database.
8. Keep contributing :) See [projects](https://github.com/fireproof-storage/fireproof/projects?query=is%3Aopen) and [issues](https://github.com/fireproof-storage/fireproof/issues) for ideas where to get started.

Feel free to join in. All welcome. [Open an issue](https://github.com/jchris/fireproof/issues)!

# License

Dual-licensed under [MIT or Apache 2.0](https://github.com/jchris/fireproof/blob/main/LICENSE.md)
