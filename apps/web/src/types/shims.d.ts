declare module 'split_router' {
  export class Client {
    constructor(opts: any)
    split(args: any, opts?: any): Promise<any>
  }
}
declare module 'marketplace' {
  export class Client {
    constructor(opts: any)
    list(args: any, opts?: any): Promise<any>
    cancel(args: any, opts?: any): Promise<any>
    buy(args: any, opts?: any): Promise<any>
    get(args: any, opts?: any): Promise<any>
  }
}
declare module 'registrar' {
  export class Client {
    constructor(opts: any)
    init(args: any, opts?: any): Promise<any>
    set(args: any, opts?: any): Promise<any>
    remove(args: any, opts?: any): Promise<any>
    resolve(args: any, opts?: any): Promise<any>
  }
}
