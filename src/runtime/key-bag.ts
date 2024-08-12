import {
  CoerceURI,
  CryptoRuntime,
  KeyedResolvOnce,
  Logger,
  ResolveSeq,
  Result,
  runtimeFn,
  toCryptoRuntime,
  URI,
} from "@adviser/cement";
import { KeyWithFingerPrint } from "../blockstore/types.js";
import { SysContainer } from "./sys-container.js";
import { ensureLogger } from "../utils.js";
import { base58btc } from "multiformats/bases/base58";
// import { getFileSystem } from "./gateways/file/gateway.js";

export type { KeyBagProviderFile } from "./key-bag-file.js";
export type { KeyBagProviderIndexDB } from "./key-bag-indexdb.js";

export class KeyBag {
  readonly logger: Logger;
  constructor(readonly rt: KeyBagRuntime) {
    this.logger = ensureLogger(rt, "KeyBag", {
      id: rt.id(),
    });
    this.logger.Debug().Msg("KeyBag created");
  }
  async subtleKey(key: string) {
    return await this.rt.crypto.importKey(
      "raw", // raw or jwk
      base58btc.decode(key),
      // hexStringToUint8Array(key), // raw data
      "AES-GCM",
      false, // extractable
      ["encrypt", "decrypt"],
    );
  }

  async toKeyWithFingerPrint(keyStr: string): Promise<Result<KeyWithFingerPrint>> {
    this.logger.Debug().Str("key", keyStr).Msg("toKeyWithFingerPrint-1");
    const material = base58btc.decode(keyStr); //
    this.logger.Debug().Str("key", keyStr).Msg("toKeyWithFingerPrint-2");
    const key = await this.subtleKey(keyStr);
    this.logger.Debug().Str("key", keyStr).Msg("toKeyWithFingerPrint-3");
    const fpr = await this.rt.crypto.digestSHA256(material);
    this.logger.Debug().Str("key", keyStr).Msg("toKeyWithFingerPrint-4");
    return Result.Ok({
      key,
      fingerPrint: base58btc.encode(new Uint8Array(fpr)),
    });
  }

  readonly _seq = new ResolveSeq<Result<KeyWithFingerPrint>>();
  async setNamedKey(name: string, key: string): Promise<Result<KeyWithFingerPrint>> {
    return this._seq.add(() => this._setNamedKey(name, key));
  }

  // avoid deadlock
  async _setNamedKey(name: string, key: string): Promise<Result<KeyWithFingerPrint>> {
    const item = {
      name,
      key: key,
    };
    const bag = await this.rt.getBag();
    this.logger.Debug().Str("name", name).Msg("setNamedKey");
    await bag.set(name, item);
    return await this.toKeyWithFingerPrint(item.key);
  }

  async getNamedKey(name: string, failIfNotFound = false): Promise<Result<KeyWithFingerPrint>> {
    const id = Math.random().toString();
    // this.logger.Debug().Str("id", id).Str("name", name).Msg("getNamedKey--1");
    return this._seq.add(async () => {
      // this.logger.Debug().Str("id", id).Str("name", name).Msg("getNamedKey-0");
      const bag = await this.rt.getBag();
      // this.logger.Debug().Str("id", id).Str("name", name).Msg("getNamedKey-1");
      const named = await bag.get(name);
      // this.logger.Debug().Str("id", id).Str("name", name).Msg("getNamedKey-2");
      if (named) {
        // this.logger.Debug().Str("id", id).Str("name", name).Msg("found getNamedKey");
        const fpr = await this.toKeyWithFingerPrint(named.key);
        this.logger.Debug().Str("id", id).Str("name", name).Result("fpr", fpr).Msg("fingerPrint getNamedKey");
        return fpr;
      }
      if (failIfNotFound) {
        this.logger.Debug().Str("id", id).Str("name", name).Msg("failIfNotFound getNamedKey");
        return Result.Err(new Error(`Key not found: ${name}`));
      }
      // this.logger.Debug().Str("id", id).Str("name", name).Msg("createKey getNamedKey-pre");
      const ret = await this._setNamedKey(name, base58btc.encode(this.rt.crypto.randomBytes(this.rt.keyLength)));
      this.logger.Debug().Str("id", id).Str("name", name).Result("fpr", ret).Msg("createKey getNamedKey-post");
      return ret;
    });
  }
}

export interface KeyItem {
  readonly name: string;
  readonly key: string;
}
export type KeyBagFile = Record<string, KeyItem>;

export interface KeyBagOpts {
  // in future you can encrypt the keybag with ?masterkey=xxxxx
  readonly url: CoerceURI;
  // readonly key: string; // key to encrypt the keybag
  readonly crypto: CryptoRuntime;
  readonly keyLength: number; // default: 16
  readonly logger: Logger;
  readonly keyRuntime: KeyBagRuntime;
}

export interface KeyBagProvider {
  get(id: string): Promise<KeyItem | undefined>;
  set(id: string, item: KeyItem): Promise<void>;
}
export interface KeyBagRuntime {
  readonly url: URI;
  readonly crypto: CryptoRuntime;
  readonly logger: Logger;
  readonly keyLength: number;
  // readonly key?: FPCryptoKey;
  getBag(): Promise<KeyBagProvider>;
  id(): string;
}

export type KeyBackProviderFactory = (url: URI, logger: Logger) => Promise<KeyBagProvider>;

export interface KeyBagProviderFactoryItem {
  readonly protocol: string;
  // if this is set the default protocol selection is overridden
  readonly override?: boolean;
  readonly factory: KeyBackProviderFactory;
}

const keyBagProviderFactories = new Map<string, KeyBagProviderFactoryItem>(
  [
    {
      protocol: "file:",
      factory: async (url: URI, logger: Logger) => {
        const { KeyBagProviderFile } = await import("./key-bag-file.js");
        return new KeyBagProviderFile(url, logger);
      },
    },
    {
      protocol: "indexdb:",
      factory: async (url: URI, logger: Logger) => {
        const { KeyBagProviderIndexDB } = await import("./key-bag-indexdb.js");
        return new KeyBagProviderIndexDB(url, logger);
      },
    },
  ].map((i) => [i.protocol, i]),
);

export function registerKeyBagProviderFactory(item: KeyBagProviderFactoryItem) {
  const protocol = item.protocol.endsWith(":") ? item.protocol : item.protocol + ":";
  keyBagProviderFactories.set(protocol, {
    ...item,
    protocol,
  });
}

function defaultKeyBagOpts(kbo: Partial<KeyBagOpts>): KeyBagRuntime {
  if (kbo.keyRuntime) {
    return kbo.keyRuntime;
  }
  const logger = ensureLogger(kbo, "KeyBag");
  let url: URI;
  if (kbo.url) {
    url = URI.from(kbo.url);
    logger.Debug().Url(url).Msg("from opts");
  } else {
    let bagFnameOrUrl = SysContainer.env.get("FP_KEYBAG_URL");
    if (!bagFnameOrUrl) {
      const override = Array.from(keyBagProviderFactories.values()).find((i) => i.override);
      if (override) {
        bagFnameOrUrl = `${override.protocol}//fp-keybag`;
      } else {
        if (runtimeFn().isBrowser) {
          bagFnameOrUrl = "indexdb://fp-keybag";
        } else {
          const home = SysContainer.env.get("HOME");
          bagFnameOrUrl = `file://${home}/.fireproof/keybag`;
        }
      }
    }
    url = URI.from(bagFnameOrUrl);
    logger.Debug().Len(keyBagProviderFactories).Url(url).Msg("from env");
  }
  const keyProviderItem = keyBagProviderFactories.get(url.protocol);
  if (!keyProviderItem) {
    throw logger.Error().Url(url).Msg("unsupported protocol").AsError();
  }
  if (url.hasParam("masterkey")) {
    throw logger.Error().Url(url).Msg("masterkey is not supported").AsError();
  }
  return {
    url,
    crypto: kbo.crypto || toCryptoRuntime(),
    logger,
    keyLength: kbo.keyLength || 128 / 8,
    getBag: () => keyProviderItem.factory(url, logger),
    id: () => url.toString(),
  };
}

const _keyBags = new KeyedResolvOnce<KeyBag>();
export async function getKeyBag(kbo: Partial<KeyBagOpts> = {}): Promise<KeyBag> {
  await SysContainer.start();
  const rt = defaultKeyBagOpts(kbo);
  return _keyBags.get(rt.id()).once(async () => new KeyBag(rt));
}
