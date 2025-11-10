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





export interface Client {
  /**
   * Construct and simulate a split transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Split `amount` of the given `token` (SAC or issued asset) from `payer`
   * to the list of `recipients`, using basis points in `shares_bps`.
   * The `payer` must authorize this call.
   */
  split: ({token, payer, recipients, shares_bps, amount}: {token: string, payer: string, recipients: Array<string>, shares_bps: Array<u32>, amount: i128}, options?: {
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
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAAElNwbGl0RXhlY3V0ZWRFdmVudAAAAAAAAQAAABRzcGxpdF9leGVjdXRlZF9ldmVudAAAAAIAAAAAAAAABXBheWVyAAAAAAAAEwAAAAAAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAC",
        "AAAAAAAAAK1TcGxpdCBgYW1vdW50YCBvZiB0aGUgZ2l2ZW4gYHRva2VuYCAoU0FDIG9yIGlzc3VlZCBhc3NldCkgZnJvbSBgcGF5ZXJgCnRvIHRoZSBsaXN0IG9mIGByZWNpcGllbnRzYCwgdXNpbmcgYmFzaXMgcG9pbnRzIGluIGBzaGFyZXNfYnBzYC4KVGhlIGBwYXllcmAgbXVzdCBhdXRob3JpemUgdGhpcyBjYWxsLgAAAAAAAAVzcGxpdAAAAAAAAAUAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAAAAAApyZWNpcGllbnRzAAAAAAPqAAAAEwAAAAAAAAAKc2hhcmVzX2JwcwAAAAAD6gAAAAQAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    split: this.txFromJSON<null>
  }
}