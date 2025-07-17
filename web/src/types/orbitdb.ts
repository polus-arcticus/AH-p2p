import type { Helia } from 'helia'
import type { Libp2p } from 'libp2p'
import type { PubSub } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'

// OrbitDB Core Types
export interface OrbitDBOptions {
  ipfs: Helia
  identity?: {
    provider: any
  }
  directory?: string
}

export interface Database {
  address: string
  name: string
  type: string
  close(): Promise<void>
  drop(): Promise<void>
}

export interface DocumentsDatabase extends Database {
  put(doc: any): Promise<string>
  get(hash: string): Promise<any>
  query(mapper?: (doc: any) => any): Promise<any[]>
  del(hash: string): Promise<string>
}

export interface KeyValueDatabase extends Database {
  put(key: string, value: any): Promise<string>
  get(key: string): Promise<any>
  del(key: string): Promise<string>
  all(): Promise<Record<string, any>>
}

export interface EventsDatabase extends Database {
  add(event: any): Promise<string>
  get(hash: string): Promise<any>
  iterator(options?: { amount?: number }): AsyncIterable<any>
}

export interface Orbit {
  open(name: string, options?: { type?: 'documents' | 'keyvalue' | 'events' }): Promise<Database>
  stop(): Promise<void>
  identity: {
    id: string
    publicKey: string
    sign: (data: Uint8Array) => Promise<Uint8Array>
    verify: (signature: Uint8Array, data: Uint8Array, publicKey: string) => Promise<boolean>
  }
  ipfs: Helia
}

// Custom Helia with libp2p types
export interface CustomLibp2p extends Libp2p {
  services: {
    pubsub: PubSub
    identify: any
  }
  peerId: {
    toString(): string
  }
  getMultiaddrs(): Multiaddr[]
  dial(multiaddr: Multiaddr): Promise<any>
}

export interface CustomHelia extends Helia {
  libp2p: CustomLibp2p
}

// Wallet interface for Ethereum provider
export interface WalletInterface {
  address: `0x${string}`
  getAddress(): `0x${string}`
  signMessage(message: string): Promise<string>
}

// PubSub message event
export interface PubSubMessageEvent {
  detail: {
    topic: string
    data: Uint8Array
    from?: string
  }
}

// P2P Context types
export interface AHP2PContextType {
  orbit: Orbit | null
  loading: boolean
  error: string | null
}
