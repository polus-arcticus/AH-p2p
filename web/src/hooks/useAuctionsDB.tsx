import {
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react'
import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'
import { multiaddr } from '@multiformats/multiaddr'
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
                bidStart: auctionData.startingBid,
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

    const joinAuction = useCallback(async (auctionId: string) => {
        if (!auctionsDB || !orbit || !selfAddress) return
        try {
            const auction = (await auctionsDB.query((doc: any) => doc._id === auctionId))[0]
            console.log('useAuctionsDB::joinAuction::auction', auction)
            if (!auction) throw new Error('Auction not found')
            let room;
            const peers = auction.peers
            // Use Promise.race to connect to first available peer, then continue others async
            const peerEntries = Object.entries(peers)
            delete peers[orbit.ipfs.libp2p.peerId.toString()]

            if (peerEntries.length > 0) {
                console.log('🎯 Racing to connect to', peerEntries.length, 'peers...')
                
                // Create bidirectional connection promises for all peers
                const connectionPromises = peerEntries.map(([peerId, webrtcMultiaddr]) => {
                    console.log('🔄 Establishing bidirectional connection with peer:', peerId)
                    console.log('webrtcMultiaddr', webrtcMultiaddr)
                    
                    return orbit.ipfs.libp2p.dial(multiaddr(webrtcMultiaddr as string), { 
                        signal: AbortSignal.timeout(30000) // 30 second timeout
                    })
                        .then(async () => {
                            console.log('⚡ Outbound connection established to peer:', peerId)
                            return { peerId, success: true }
                        })
                        .catch((error) => {
                            console.warn('❌ Failed to connect to peer:', peerId, error)
                            return { peerId, success: false, error }
                        })
                })

                // Resolve immediately on first successful connection
                await new Promise<void>((resolve) => {
                    let resolved = false
                    let successCount = 0
                    let failureCount = 0
                    
                    // Handle each connection individually
                    connectionPromises.forEach(promise => {
                        promise.then(result => {
                            if (result.success) {
                                successCount++
                                if (!resolved) {
                                    resolved = true
                                    console.log('🚀 First peer connected! Opening room immediately...')
                                    console.log('roomAddress', auction.roomAddress)
                                    orbit.open(auction.roomAddress).then(openedRoom => {
                                        console.log('🎮 Room opened successfully:', openedRoom)
                                        room = openedRoom
                                        resolve()
                                    }).catch(error => {
                                        console.error('❌ Failed to open room:', error)
                                        resolve() // Still resolve to prevent hanging
                                    })
                                }
                            } else {
                                failureCount++
                                // Check if all connections have failed
                                if (failureCount === peerEntries.length && !resolved) {
                                    resolved = true
                                    console.warn('⚠️ All peer connections failed, opening room anyway')
                                    orbit.open(auction.roomAddress).then(openedRoom => {
                                        console.log('🎮 Room opened (fallback):', openedRoom)
                                        room = openedRoom

                                        auction.peers[orbit.ipfs.libp2p.peerId.toString()] = selfAddress.toString()
                                        auctionsDB.put(auction)
                                        resolve()
                                    }).catch(error => {
                                        console.error('❌ Failed to open room (fallback):', error)
                                        resolve() // Still resolve to prevent hanging
                                    })
                                }
                            }
                        })
                    })
                    
                    // Continue all remaining connections in background
                    Promise.allSettled(connectionPromises).then((results) => {
                        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
                        console.log(`🌐 Final mesh status: ${successful}/${peerEntries.length} peers connected`)
                    })
                })
            }
            console.log('orbit identity', orbit.identity)
            console.log('libp2p peerid', orbit.ipfs.libp2p.peerId.toString())
            return {auction, room}
        } catch (e) {
            console.error('Error joining auction:', e)
        }
    }, [auctionsDB, orbit, selfAddress])


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
        joinAuction,
        updateAuction,
        watchAuctions
    }
}
