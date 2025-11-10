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




export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"InvalidPrice"},
  3: {message:"InvalidDuration"},
  4: {message:"FeeBpsTooHigh"}
}



export interface Config {
  creator: string;
  duration_ledgers: u32;
  fee_bps: u32;
  platform: Option<string>;
  price: i128;
  token: string;
}

export type DataKey = {tag: "Creator", values: void} | {tag: "Token", values: void} | {tag: "Price", values: void} | {tag: "Duration", values: void} | {tag: "Platform", values: void} | {tag: "FeeBps", values: void} | {tag: "Expiry", values: readonly [string]};

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  init: ({creator, token, price, duration_ledgers, platform, fee_bps}: {creator: string, token: string, price: i128, duration_ledgers: u32, platform: Option<string>, fee_bps: u32}, options?: {
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
   * Construct and simulate a subscribe transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  subscribe: ({user}: {user: string}, options?: {
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
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a is_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_member: ({user}: {user: string}, options?: {
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
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a expires_at transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  expires_at: ({user}: {user: string}, options?: {
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
  }) => Promise<AssembledTransaction<Option<u32>>>

  /**
   * Construct and simulate a price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  price: (options?: {
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
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  config: (options?: {
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
  }) => Promise<AssembledTransaction<Config>>

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
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAAxJbnZhbGlkUHJpY2UAAAACAAAAAAAAAA9JbnZhbGlkRHVyYXRpb24AAAAAAwAAAAAAAAANRmVlQnBzVG9vSGlnaAAAAAAAAAQ=",
        "AAAABQAAAAAAAAAAAAAAEVN1YnNjcmlwdGlvbkV2ZW50AAAAAAAAAQAAABJzdWJzY3JpcHRpb25fZXZlbnQAAAAAAAMAAAAAAAAABHVzZXIAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAAGZXhwaXJ5AAAAAAAEAAAAAAAAAAI=",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABgAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAABBkdXJhdGlvbl9sZWRnZXJzAAAABAAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAAAAAAhwbGF0Zm9ybQAAA+gAAAATAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAABXRva2VuAAAAAAAAEw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABwAAAAAAAAAAAAAAB0NyZWF0b3IAAAAAAAAAAAAAAAAFVG9rZW4AAAAAAAAAAAAAAAAAAAVQcmljZQAAAAAAAAAAAAAAAAAACER1cmF0aW9uAAAAAAAAAAAAAAAIUGxhdGZvcm0AAAAAAAAAAAAAAAZGZWVCcHMAAAAAAAEAAAAAAAAABkV4cGlyeQAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAAEGR1cmF0aW9uX2xlZGdlcnMAAAAEAAAAAAAAAAhwbGF0Zm9ybQAAA+gAAAATAAAAAAAAAAdmZWVfYnBzAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAJc3Vic2NyaWJlAAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAABA==",
        "AAAAAAAAAAAAAAAJaXNfbWVtYmVyAAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAKZXhwaXJlc19hdAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6AAAAAQ=",
        "AAAAAAAAAAAAAAAFcHJpY2UAAAAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAGY29uZmlnAAAAAAAAAAAAAQAAB9AAAAAGQ29uZmlnAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        subscribe: this.txFromJSON<u32>,
        is_member: this.txFromJSON<boolean>,
        expires_at: this.txFromJSON<Option<u32>>,
        price: this.txFromJSON<i128>,
        config: this.txFromJSON<Config>
  }
}