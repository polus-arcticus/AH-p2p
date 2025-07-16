import { type ReactNode, createContext, useState, useEffect, useCallback, useContext } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { createOrbitDB, type OrbitDB as OrbitDBType } from '@orbitdb/core'
import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'
import type { Helia } from '@helia/interface'

import { getWalletInterface } from '../utils/blockchain'
import { PubsubService } from '../services/pubsub'

// Types
export interface ActiveAuction {
  id: string
  creator: string
  title: string
  description: string
  nftContract: string
  nftTokenId: string
  tokenContract: string
  startingBid: string
  currentHighBid: string
  bidCount: number
  endTime: number
  createdAt: number
  signature?: string
  sigHash?: string
}

export interface AuctionDB extends ActiveAuction {
  bids: Bid[]
  status: 'active' | 'ended' | 'cancelled'
}

export interface Bid {
  bidder: string
  amount: string
  timestamp: number
  signature?: string
}

// Extend PubsubService to include our custom events and methods
interface ExtendedPubsubService extends PubsubService {
  onAuctionCreated?: (auction: ActiveAuction) => void
  broadcastAuction: (auction: ActiveAuction) => void
  initialize: () => Promise<void>
}

export interface AHP2PContextType {
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
  activeAuctions: ActiveAuction[]
  createAuction: (auctionData: Omit<ActiveAuction, 'id' | 'creator' | 'createdAt' | 'currentHighBid' | 'bidCount'>) => Promise<string | undefined>
  placeBid: (auctionId: string, amount: string) => Promise<void>
  getAuction: (auctionId: string) => Promise<AuctionDB | undefined>
  refreshAuctions: () => Promise<void>
  pubsub: ExtendedPubsubService | null
}

const AHP2PContext = createContext<AHP2PContextType>({} as AHP2PContextType)

export const useAHP2P = () => useContext(AHP2PContext)

export const AHP2PProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [activeAuctions, setActiveAuctions] = useState<ActiveAuction[]>([])
  const [orbitdb, setOrbitdb] = useState<OrbitDBType | null>(null)
  const [pubsub, setPubsub] = useState<ExtendedPubsubService | null>(null)
  const [helia, setHelia] = useState<Helia | null>(null)
  
  // Register the Ethereum identity provider
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize with an empty config object
        await OrbitDBIdentityProviderEthereum.default({} as any)
      } catch (err) {
        console.error('Error initializing OrbitDB Ethereum identity provider:', err)
        setError(err instanceof Error ? err : new Error('Failed to initialize identity provider'))
      }
    }
    init()
  }, [])
  const walletClient = useWalletClient()
  const { address } = useAccount()

  // Initialize OrbitDB with Helia
  const initialize = useCallback(async () => {
    if (!address || !walletClient.data || helia) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Create identity provider with wallet
      const identityProvider = OrbitDBIdentityProviderEthereum.default({
        wallet: getWalletInterface({
          address,
          walletClient: walletClient.data
        })
      })

      // Initialize OrbitDB with Helia
      const orbitdb = await createOrbitDB({
        ipfs: helia as any, // Type assertion to bypass type checking
        directory: './orbitdb/ah-p2p',
        identity: identityProvider as any
      })

      setOrbitdb(orbitdb)
      
      // Initialize pubsub service
      const pubsubService = new PubsubService(helia as any, orbitdb)
      await pubsubService.initialize()
      setPubsub(pubsubService)
      
      // Load active auctions
      await refreshAuctions()
      
      setIsInitialized(true)
      setIsLoading(false)
      
    } catch (err) {
      console.error('Error initializing AHP2P:', err)
      setError(err instanceof Error ? err : new Error('Failed to initialize AHP2P'))
      setIsLoading(false)
    }
  }, [address, walletClient.data, helia])

  // Create a new auction
  const createAuction = async (auctionData: Omit<ActiveAuction, 'id' | 'creator' | 'createdAt' | 'currentHighBid' | 'bidCount'>): Promise<string | undefined> => {
    if (!orbitdb || !address) return
    
    try {
      const timestamp = Date.now()
      const auctionId = `${address}-${timestamp}`
      
      const auction: AuctionDB = {
        ...auctionData,
        id: auctionId,
        creator: address,
        createdAt: timestamp,
        currentHighBid: auctionData.startingBid,
        bidCount: 0,
        bids: [],
        status: 'active'
      }
      
      // Create a new database for this auction
      const db = await orbitdb.docs(`auction-${auctionId}`, {
        accessController: {
          write: ['*'] // Public write access for now, can be restricted later
        }
      } as any) // Type assertion to bypass type checking
      
      // @ts-ignore - TypeScript doesn't know about the put method
      await db.put(auctionId, auction)
      
      // Add to active auctions
      const activeAuction: ActiveAuction = {
        ...auctionData,
        id: auctionId,
        creator: address,
        createdAt: timestamp,
        currentHighBid: auctionData.startingBid,
        bidCount: 0
      }
      
      setActiveAuctions(prev => [...prev, activeAuction])
      
      // Broadcast new auction
      pubsub?.broadcastAuction(activeAuction)
      
      return auctionId
      
    } catch (err) {
      console.error('Error creating auction:', err)
      throw err
    }
  }
  
  // Place a bid on an auction
  const placeBid = async (auctionId: string, amount: string): Promise<void> => {
    if (!orbitdb || !address) return
    
    try {
      // @ts-ignore - TypeScript doesn't know about the docs method
      const db = await orbitdb.docs(`auction-${auctionId}`)
      // @ts-ignore - TypeScript doesn't know about the get method
      const auction = await db.get(auctionId) as AuctionDB | undefined
      
      if (!auction) throw new Error('Auction not found')
      if (auction.status !== 'active') throw new Error('Auction is not active')
      if (parseFloat(amount) <= parseFloat(auction.currentHighBid)) {
        throw new Error('Bid amount must be higher than current highest bid')
      }
      
      const bid: Bid = {
        bidder: address,
        amount,
        timestamp: Date.now()
      }
      
      // Update auction with new bid
      // @ts-ignore - TypeScript doesn't know about the put method
      await db.put(auctionId, {
        ...auction,
        currentHighBid: amount,
        bidCount: (auction.bidCount || 0) + 1,
        bids: [...(auction.bids || []), bid]
      })
      
      // Update active auctions list
      setActiveAuctions(prev => 
        prev.map(a => a.id === auctionId ? { ...a, currentHighBid: amount, bidCount: a.bidCount + 1 } : a)
      )
      
    } catch (err) {
      console.error('Error placing bid:', err)
      throw err
    }
  }
  
  // Get auction details
  const getAuction = async (auctionId: string): Promise<AuctionDB | undefined> => {
    if (!orbitdb) return
    
    try {
      // @ts-ignore - TypeScript doesn't know about the docs method
      const db = await orbitdb.docs(`auction-${auctionId}`)
      // @ts-ignore - TypeScript doesn't know about the get method
      return await db.get(auctionId) as AuctionDB | undefined
    } catch (err) {
      console.error('Error getting auction:', err)
      return undefined
    }
  }
  
  // Refresh active auctions list
  const refreshAuctions = async () => {
    if (!orbitdb) return
    
    try {
      // In a real app, you might want to query a list of active auctions
      // For now, we'll just return the current list
      // This could be enhanced with indexing or querying capabilities
      console.log('Refreshing auctions...')
    } catch (err) {
      console.error('Error refreshing auctions:', err)
    }
  }
  
  // Initialize when Helia is available
  useEffect(() => {
    if (helia && !isInitialized && !isLoading) {
      initialize()
    }
  }, [helia, initialize, isInitialized, isLoading])
  
  // Listen for new auctions from pubsub
  useEffect(() => {
    if (!pubsub) return
    
    const handleNewAuction = (auction: ActiveAuction) => {
      setActiveAuctions(prev => {
        // Avoid duplicates
        if (prev.some(a => a.id === auction.id)) return prev
        return [...prev, auction]
      })
    }
    
    // Subscribe to auction updates
    const pubsubService = pubsub as ExtendedPubsubService
    if (pubsubService) {
      pubsubService.onAuctionCreated = handleNewAuction
    }
    
    return () => {
      if (pubsub) {
        pubsub.onAuctionCreated = undefined
      }
    }
  }, [pubsub])
  
  return (
    <AHP2PContext.Provider
      value={{
        isInitialized,
        isLoading,
        error,
        activeAuctions,
        createAuction,
        placeBid,
        getAuction,
        refreshAuctions,
        pubsub
      }}
    >
      {children}
    </AHP2PContext.Provider>
  )
}

export default AHP2PProvider
