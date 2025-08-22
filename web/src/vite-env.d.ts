/// <reference types="vite/client" />

// Module declarations for packages without TypeScript definitions
declare module '@orbitdb/identity-provider-ethereum' {
  const _default: any;
  export { _default as default };
}

declare module '@orbitdb/core' {
  import type { Helia } from "helia";
  import type { Libp2p, PeerId, ServiceMap } from "@libp2p/interface";

  // Main OrbitDB interface
  export interface OrbitDB<T extends ServiceMap = ServiceMap> {
    id: string;
    open(address: string, options?: OpenDatabaseOptions): Promise<BaseDatabase>;
    stop(): Promise<void>;
    ipfs: Helia<Libp2p<T>>;
    directory: string;
    identity: Identity;
    peerId: PeerId;
  }

  // Identity interface
  export interface Identity {
    id: string;
    publicKey: string;
    type: string;
    sign: (identity: Identity, data: string) => Promise<string>;
    verify: (signature: string, publicKey: string, data: string) => Promise<boolean>;
  }

  // Database interfaces
  export interface DocumentsDatabase {
    type: string;
    address: string;
    name: string;
    put(doc: any): Promise<void>;
    query(filter: (doc:any) => boolean): Promise<any[]>;
    events: Events;
    all(): Promise<any[]>;
    close(): Promise<void>;
    drop(): Promise<void>;
  }

  export interface OpenDatabaseOptions {
    type?: string;
    meta?: { [key: string]: string | number | boolean };
    sync?: boolean;
    Database?: BaseDatabase;
    AccessController?: any;
    headsStorage?: any;
    entryStorage?: any;
    indexStorage?: any;
    referencesCount?: number;
  }

  // Main functions
  export function createOrbitDB<T extends ServiceMap = ServiceMap>(args: {
    ipfs: Helia<Libp2p<T>>;
    id?: string;
    identity?: Identity;
    identities?: any;
    directory?: string;
  }): Promise<OrbitDB<T>>;

  export function useIdentityProvider(provider: any): void;

  // Database type functions
  export function KeyValue(): any;
  export function Documents(args?: { indexBy: string }): any;
}
