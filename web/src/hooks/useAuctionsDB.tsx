import {
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react'
import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'
import { IPFSAccessController } from '@orbitdb/core'
import { useAuctionSignature, type AuctionAuthSigMessage } from './useAuctionSignature'
import { parseEther } from 'viem'

export type AuctionData = {
    _id: string
    nftContract: string
    nftTokenId: string
    tokenContract: string
    startingBid: string
    endTime: string
    signature: string
    auctionSigHash: string
    auctioneerNonce: string
    signatureMessage: AuctionAuthSigMessage
    peers: Record<string, string>
    roomAddress: string
    createdAt: number
    auctioneer: string
}


export const useAuctionsDB = () => {
    const {auctionsDB, orbit, selfAddress} = useContext(AHP2PContext)
    const { signAuctionAuth, address } = useAuctionSignature()

    const createAuction = useCallback(async (auctionData: any) => {
        if (!auctionsDB || !orbit || !selfAddress || !address) return
        
        try {
            console.log('🎯 Creating auction with signature...')
            
            // Generate unique auction ID and nonce
            const _id = 'auction' + Date.now()
            const auctioneerNonce = BigInt(Date.now())
            // Prepare signature message
            const signatureMessage: AuctionAuthSigMessage = {
                auctioneer: address,
                auctioneerNonce,
                nft: auctionData.nftContract,
                nftId: BigInt(auctionData.nftTokenId),
                token: auctionData.tokenContract,
                bidStart: parseEther(auctionData.startingBid),
                deadline: auctionData.endTime
            }

            console.log('📝 Signing auction authorization...', signatureMessage)
            
            // Sign the auction authorization
            const { signature, sigHash } = await signAuctionAuth(signatureMessage)
            
            console.log('✅ Auction signed successfully:', { signature, sigHash })

            // Create the room for P2P communication
            const room = await orbit.open(_id, {
                type: 'documents',
                AccessController: IPFSAccessController({
                    write: ['*']
                })
            })

            // Store auction with signature data
            const auction = await auctionsDB.put({
                _id,
                ...auctionData,
                // Add signature data
                signature,
                auctionSigHash: sigHash,
                auctioneerNonce: auctioneerNonce.toString(),
                signatureMessage,
                // P2P data
                peers: {[orbit.ipfs.libp2p.peerId.toString()]: selfAddress.toString()},
                roomAddress: room.address.toString(),
                // Metadata
                createdAt: Date.now(),
                auctioneer: address
            })

            console.log('🎯 Auction created with signature:', auction)
            return auction
            
        } catch (error) {
            console.error('❌ Failed to create auction:', error)
            throw error
        }
    }, [auctionsDB, orbit, selfAddress, signAuctionAuth, address])

    const getAuctions = useCallback(async () => {
        if (!auctionsDB) return
        const auctionsArray = await auctionsDB.all()
        // Convert array to object with auction.key as key
        const auctionsObject = auctionsArray.reduce((acc: Record<string, any>, auction: any) => {
            acc[auction.key] = auction.value
            return acc
        }, {})
        return auctionsObject
    }, [auctionsDB])

    const updateAuction = useCallback(async (update: any) => {
        if (!auctionsDB) return
        await auctionsDB.put({
            ...update
        })
    }, [auctionsDB])

    const getAuction = useCallback(async (auctionId: string) => {
        if (!auctionsDB) return
        const auction = await auctionsDB.query((doc) => doc._id === auctionId)
        console.log('getAuction:auction', auction)
        return auction[0]
    }, [auctionsDB])    



    const watchAuctions = useCallback((onNewAuction?: (auction: any) => void) => {
        console.log('watchAuctions called with:', { 
            hasAuctionsDB: !!auctionsDB, 
            hasOrbit: !!orbit, 
            hasSelfAddress: !!selfAddress 
        })
        
        if (!auctionsDB || !orbit || !selfAddress) {
            console.warn('watchAuctions early return - missing dependencies')
            return
        }
        
        // Clean up any existing listeners first
        auctionsDB.events.removeAllListeners('update')
    
        console.log('🎯 Auctions watcher enabled')
        
        // Listen for both local updates and remote replication
        auctionsDB.events.on('update', (event) => {
            console.log('🎯 Auctions DB update event:', event)
            // Call the provided callback to handle new auction
            if (onNewAuction) {
                onNewAuction(event.payload)
            }
        })

        
        // Return cleanup function for component to use
        return () => {
            console.log('watcher disabled')
            auctionsDB.events.removeAllListeners('update')
            console.log('🛡️ Auctions watcher cleanup complete')
        }
    }, [auctionsDB, orbit, selfAddress])

    return {
        createAuction,
        getAuctions,
        getAuction,
        updateAuction,
        watchAuctions
    }
}
