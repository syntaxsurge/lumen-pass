import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABQAAAAAAAAAAAAAAElNwbGl0RXhlY3V0ZWRFdmVudAAAAAAAAQAAABRzcGxpdF9leGVjdXRlZF9ldmVudAAAAAIAAAAAAAAABXBheWVyAAAAAAAAEwAAAAAAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAC",
            "AAAAAAAAAK1TcGxpdCBgYW1vdW50YCBvZiB0aGUgZ2l2ZW4gYHRva2VuYCAoU0FDIG9yIGlzc3VlZCBhc3NldCkgZnJvbSBgcGF5ZXJgCnRvIHRoZSBsaXN0IG9mIGByZWNpcGllbnRzYCwgdXNpbmcgYmFzaXMgcG9pbnRzIGluIGBzaGFyZXNfYnBzYC4KVGhlIGBwYXllcmAgbXVzdCBhdXRob3JpemUgdGhpcyBjYWxsLgAAAAAAAAVzcGxpdAAAAAAAAAUAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAAAAAApyZWNpcGllbnRzAAAAAAPqAAAAEwAAAAAAAAAKc2hhcmVzX2JwcwAAAAAD6gAAAAQAAAAAAAAABmFtb3VudAAAAAAACwAAAAA="]), options);
        this.options = options;
    }
    fromJSON = {
        split: (this.txFromJSON)
    };
}
