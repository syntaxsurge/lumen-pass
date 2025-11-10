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
        super(new ContractSpec(["AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABU93bmVyAAAAAAAAAQAAAAAAAAAFRW50cnkAAAAAAAABAAAAEA==",
            "AAAABQAAAAAAAAAAAAAACFNldEV2ZW50AAAAAQAAAAlzZXRfZXZlbnQAAAAAAAACAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAAAAAACGNvbnRyYWN0AAAAEwAAAAAAAAAC",
            "AAAAAAAAAAAAAAAEaW5pdAAAAAEAAAAAAAAABW93bmVyAAAAAAAAEwAAAAA=",
            "AAAAAAAAAAAAAAADc2V0AAAAAAIAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAtjb250cmFjdF9pZAAAAAATAAAAAA==",
            "AAAAAAAAAAAAAAAGcmVtb3ZlAAAAAAABAAAAAAAAAARuYW1lAAAAEAAAAAA=",
            "AAAAAAAAAAAAAAAHcmVzb2x2ZQAAAAABAAAAAAAAAARuYW1lAAAAEAAAAAEAAAPoAAAAEw=="]), options);
        this.options = options;
    }
    fromJSON = {
        init: (this.txFromJSON),
        set: (this.txFromJSON),
        remove: (this.txFromJSON),
        resolve: (this.txFromJSON)
    };
}
