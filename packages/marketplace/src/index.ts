import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export type DataKey = {tag: "Listing", values: readonly [u128]} | {tag: "Platform", values: void} | {tag: "FeeBps", values: void} | {tag: "Initialized", values: void};


export interface Listing {
  active: boolean;
  price: i128;
  seller: string;
}




export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  init: ({platform, fee_bps}: {platform: string, fee_bps: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a list transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list: ({id, seller, price}: {id: u128, seller: string, price: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a cancel transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel: ({id, seller}: {id: u128, seller: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a buy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Buyer purchases a listing with native/issued token via SAC.
   */
  buy: ({token, id, buyer}: {token: string, id: u128, buyer: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({id}: {id: u128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<Listing>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAAB0xpc3RpbmcAAAAAAQAAAAoAAAAAAAAAAAAAAAhQbGF0Zm9ybQAAAAAAAAAAAAAABkZlZUJwcwAAAAAAAAAAAAAAAAALSW5pdGlhbGl6ZWQA",
        "AAAAAQAAAAAAAAAAAAAAB0xpc3RpbmcAAAAAAwAAAAAAAAAGYWN0aXZlAAAAAAABAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAABnNlbGxlcgAAAAAAEw==",
        "AAAABQAAAAAAAAAAAAAAC0xpc3RlZEV2ZW50AAAAAAEAAAAMbGlzdGVkX2V2ZW50AAAAAwAAAAAAAAACaWQAAAAAAAoAAAAAAAAAAAAAAAZzZWxsZXIAAAAAABMAAAAAAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADUNhbmNlbGVkRXZlbnQAAAAAAAABAAAADmNhbmNlbGVkX2V2ZW50AAAAAAACAAAAAAAAAAJpZAAAAAAACgAAAAAAAAAAAAAABnNlbGxlcgAAAAAAEwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAC0JvdWdodEV2ZW50AAAAAAEAAAAMYm91Z2h0X2V2ZW50AAAAAwAAAAAAAAACaWQAAAAAAAoAAAAAAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAAAg==",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAIAAAAAAAAACHBsYXRmb3JtAAAAEwAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAAEbGlzdAAAAAMAAAAAAAAAAmlkAAAAAAAKAAAAAAAAAAZzZWxsZXIAAAAAABMAAAAAAAAABXByaWNlAAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAAGY2FuY2VsAAAAAAACAAAAAAAAAAJpZAAAAAAACgAAAAAAAAAGc2VsbGVyAAAAAAATAAAAAA==",
        "AAAAAAAAADtCdXllciBwdXJjaGFzZXMgYSBsaXN0aW5nIHdpdGggbmF0aXZlL2lzc3VlZCB0b2tlbiB2aWEgU0FDLgAAAAADYnV5AAAAAAMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAACaWQAAAAAAAoAAAAAAAAABWJ1eWVyAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAAmlkAAAAAAAKAAAAAQAAA+gAAAfQAAAAB0xpc3RpbmcA" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        list: this.txFromJSON<null>,
        cancel: this.txFromJSON<null>,
        buy: this.txFromJSON<null>,
        get: this.txFromJSON<Option<Listing>>
  }
}