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
        super(new ContractSpec(["AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAAB0xpc3RpbmcAAAAAAQAAAAoAAAAAAAAAAAAAAAhQbGF0Zm9ybQAAAAAAAAAAAAAABkZlZUJwcwAAAAAAAAAAAAAAAAALSW5pdGlhbGl6ZWQA",
            "AAAAAQAAAAAAAAAAAAAAB0xpc3RpbmcAAAAAAwAAAAAAAAAGYWN0aXZlAAAAAAABAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAABnNlbGxlcgAAAAAAEw==",
            "AAAABQAAAAAAAAAAAAAAC0xpc3RlZEV2ZW50AAAAAAEAAAAMbGlzdGVkX2V2ZW50AAAAAwAAAAAAAAACaWQAAAAAAAoAAAAAAAAAAAAAAAZzZWxsZXIAAAAAABMAAAAAAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAAAg==",
            "AAAABQAAAAAAAAAAAAAADUNhbmNlbGVkRXZlbnQAAAAAAAABAAAADmNhbmNlbGVkX2V2ZW50AAAAAAACAAAAAAAAAAJpZAAAAAAACgAAAAAAAAAAAAAABnNlbGxlcgAAAAAAEwAAAAAAAAAC",
            "AAAABQAAAAAAAAAAAAAAC0JvdWdodEV2ZW50AAAAAAEAAAAMYm91Z2h0X2V2ZW50AAAAAwAAAAAAAAACaWQAAAAAAAoAAAAAAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAAAg==",
            "AAAAAAAAAAAAAAAEaW5pdAAAAAIAAAAAAAAACHBsYXRmb3JtAAAAEwAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAA==",
            "AAAAAAAAAAAAAAAEbGlzdAAAAAMAAAAAAAAAAmlkAAAAAAAKAAAAAAAAAAZzZWxsZXIAAAAAABMAAAAAAAAABXByaWNlAAAAAAAACwAAAAA=",
            "AAAAAAAAAAAAAAAGY2FuY2VsAAAAAAACAAAAAAAAAAJpZAAAAAAACgAAAAAAAAAGc2VsbGVyAAAAAAATAAAAAA==",
            "AAAAAAAAADtCdXllciBwdXJjaGFzZXMgYSBsaXN0aW5nIHdpdGggbmF0aXZlL2lzc3VlZCB0b2tlbiB2aWEgU0FDLgAAAAADYnV5AAAAAAMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAACaWQAAAAAAAoAAAAAAAAABWJ1eWVyAAAAAAAAEwAAAAA=",
            "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAAmlkAAAAAAAKAAAAAQAAA+gAAAfQAAAAB0xpc3RpbmcA"]), options);
        this.options = options;
    }
    fromJSON = {
        init: (this.txFromJSON),
        list: (this.txFromJSON),
        cancel: (this.txFromJSON),
        buy: (this.txFromJSON),
        get: (this.txFromJSON)
    };
}
