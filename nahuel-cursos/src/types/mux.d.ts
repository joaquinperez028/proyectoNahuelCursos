declare module '@mux/mux-node' {
  export interface MuxOptions {
    tokenId: string;
    tokenSecret: string;
  }

  export class Mux {
    constructor(options: MuxOptions);
    readonly Video: {
      Uploads: {
        create: (options: any) => Promise<any>;
        get: (id: string) => Promise<any>;
      };
      Assets: {
        get: (id: string) => Promise<any>;
      };
    };
  }
} 