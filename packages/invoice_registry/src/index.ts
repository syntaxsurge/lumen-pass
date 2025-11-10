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
  1: {message:"AlreadyPaid"},
  2: {message:"NotIssuer"},
  3: {message:"NotFound"}
}

export type DataKey = {tag: "Invoice", values: readonly [u64]} | {tag: "NextId", values: void};


export interface Invoice {
  amount: i128;
  id: u64;
  issuer: string;
  paid: boolean;
  payer: Option<string>;
  reference: Option<string>;
}

export interface Client {
  /**
   * Construct and simulate a issue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  issue: ({issuer, payer, amount, reference}: {issuer: string, payer: Option<string>, amount: i128, reference: Option<string>}, options?: {
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
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({id}: {id: u64}, options?: {
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
  }) => Promise<AssembledTransaction<Option<Invoice>>>

  /**
   * Construct and simulate a mark_paid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mark_paid: ({id, issuer}: {id: u64, issuer: string}, options?: {
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
   * Construct and simulate a count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  count: (options?: {
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
  }) => Promise<AssembledTransaction<u64>>

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
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAALQWxyZWFkeVBhaWQAAAAAAQAAAAAAAAAJTm90SXNzdWVyAAAAAAAAAgAAAAAAAAAITm90Rm91bmQAAAAD",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAAB0ludm9pY2UAAAAAAQAAAAYAAAAAAAAAAAAAAAZOZXh0SWQAAA==",
        "AAAAAQAAAAAAAAAAAAAAB0ludm9pY2UAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAAAAAARwYWlkAAAAAQAAAAAAAAAFcGF5ZXIAAAAAAAPoAAAAEwAAAAAAAAAJcmVmZXJlbmNlAAAAAAAD6AAAABA=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAAAAAAA",
        "AAAAAAAAAAAAAAAFaXNzdWUAAAAAAAAEAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAABXBheWVyAAAAAAAD6AAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAJcmVmZXJlbmNlAAAAAAAD6AAAABAAAAABAAAABg==",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAA+gAAAfQAAAAB0ludm9pY2UA",
        "AAAAAAAAAAAAAAAJbWFya19wYWlkAAAAAAAAAgAAAAAAAAACaWQAAAAAAAYAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAFY291bnQAAAAAAAAAAAAAAQAAAAY=" ]),
      options
    )
  }
  public readonly fromJSON = {
    issue: this.txFromJSON<u64>,
        get: this.txFromJSON<Option<Invoice>>,
        mark_paid: this.txFromJSON<null>,
        count: this.txFromJSON<u64>
  }
}