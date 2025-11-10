import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const Errors = {
    1: { message: "AlreadyInitialized" },
    2: { message: "InvalidPrice" },
    3: { message: "InvalidDuration" },
    4: { message: "FeeBpsTooHigh" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAAxJbnZhbGlkUHJpY2UAAAACAAAAAAAAAA9JbnZhbGlkRHVyYXRpb24AAAAAAwAAAAAAAAANRmVlQnBzVG9vSGlnaAAAAAAAAAQ=",
            "AAAABQAAAAAAAAAAAAAAEVN1YnNjcmlwdGlvbkV2ZW50AAAAAAAAAQAAABJzdWJzY3JpcHRpb25fZXZlbnQAAAAAAAMAAAAAAAAABHVzZXIAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAAGZXhwaXJ5AAAAAAAEAAAAAAAAAAI=",
            "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABgAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAABBkdXJhdGlvbl9sZWRnZXJzAAAABAAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAAAAAAhwbGF0Zm9ybQAAA+gAAAATAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAABXRva2VuAAAAAAAAEw==",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABwAAAAAAAAAAAAAAB0NyZWF0b3IAAAAAAAAAAAAAAAAFVG9rZW4AAAAAAAAAAAAAAAAAAAVQcmljZQAAAAAAAAAAAAAAAAAACER1cmF0aW9uAAAAAAAAAAAAAAAIUGxhdGZvcm0AAAAAAAAAAAAAAAZGZWVCcHMAAAAAAAEAAAAAAAAABkV4cGlyeQAAAAAAAQAAABM=",
            "AAAAAAAAAAAAAAAEaW5pdAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAAEGR1cmF0aW9uX2xlZGdlcnMAAAAEAAAAAAAAAAhwbGF0Zm9ybQAAA+gAAAATAAAAAAAAAAdmZWVfYnBzAAAAAAQAAAAA",
            "AAAAAAAAAAAAAAAJc3Vic2NyaWJlAAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAABA==",
            "AAAAAAAAAAAAAAAJaXNfbWVtYmVyAAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAAAQ==",
            "AAAAAAAAAAAAAAAKZXhwaXJlc19hdAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6AAAAAQ=",
            "AAAAAAAAAAAAAAAFcHJpY2UAAAAAAAAAAAAAAQAAAAs=",
            "AAAAAAAAAAAAAAAGY29uZmlnAAAAAAAAAAAAAQAAB9AAAAAGQ29uZmlnAAA="]), options);
        this.options = options;
    }
    fromJSON = {
        init: (this.txFromJSON),
        subscribe: (this.txFromJSON),
        is_member: (this.txFromJSON),
        expires_at: (this.txFromJSON),
        price: (this.txFromJSON),
        config: (this.txFromJSON)
    };
}
