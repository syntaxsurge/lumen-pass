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
    1: { message: "AlreadyPaid" },
    2: { message: "NotIssuer" },
    3: { message: "NotFound" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAALQWxyZWFkeVBhaWQAAAAAAQAAAAAAAAAJTm90SXNzdWVyAAAAAAAAAgAAAAAAAAAITm90Rm91bmQAAAAD",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAAB0ludm9pY2UAAAAAAQAAAAYAAAAAAAAAAAAAAAZOZXh0SWQAAA==",
            "AAAAAQAAAAAAAAAAAAAAB0ludm9pY2UAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAAAAAARwYWlkAAAAAQAAAAAAAAAFcGF5ZXIAAAAAAAPoAAAAEwAAAAAAAAAJcmVmZXJlbmNlAAAAAAAD6AAAABA=",
            "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAAAAAAA",
            "AAAAAAAAAAAAAAAFaXNzdWUAAAAAAAAEAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAABXBheWVyAAAAAAAD6AAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAJcmVmZXJlbmNlAAAAAAAD6AAAABAAAAABAAAABg==",
            "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAA+gAAAfQAAAAB0ludm9pY2UA",
            "AAAAAAAAAAAAAAAJbWFya19wYWlkAAAAAAAAAgAAAAAAAAACaWQAAAAAAAYAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAA=",
            "AAAAAAAAAAAAAAAFY291bnQAAAAAAAAAAAAAAQAAAAY="]), options);
        this.options = options;
    }
    fromJSON = {
        issue: (this.txFromJSON),
        get: (this.txFromJSON),
        mark_paid: (this.txFromJSON),
        count: (this.txFromJSON)
    };
}
