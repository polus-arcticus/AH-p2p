import type { Helia } from 'helia'
import type { Libp2p } from 'libp2p'
import type { PubSub } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'

// Import official OrbitDB types
import type { 
  OrbitDB,
  Database,
  DocumentsDatabase as OfficialDocumentsDatabase,
  KeyValueDatabase as OfficialKeyValueDatabase,
  EventsDatabase as OfficialEventsDatabase,
  OrbitDBOptions as OfficialOrbitDBOptions
} from '@orbitdb/core-types'

// Re-export official types
export type { 
  OrbitDB as Orbit,
  Database,
  DocumentsDatabase,
  KeyValueDatabase, 
  EventsDatabase,
  OrbitDBOptions
} from '@orbitdb/core-types'

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
  orbit: OrbitDB | null
  loading: boolean
  error: string | null
}
