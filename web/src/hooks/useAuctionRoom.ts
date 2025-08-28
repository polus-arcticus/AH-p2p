import {
    useCallback,
    useContext,
    useEffect,
    useState,
    useRef
} from 'react'

import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'
import { useAuctionsDB } from './useAuctionsDB'
import { useParams } from 'react-router'
import { multiaddr } from '@multiformats/multiaddr'
import { useAuctionSignature, type BidMessage, type AuctionMessage } from './useAuctionSignature'
import { parseEther } from 'viem'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { useStaticData } from './useStaticData'
export const useAuctionRoom = () => {
    const initializedRef = useRef(false)
    const { auctionId } = useParams()
    const { orbit, selfAddress, peerId } = useContext(AHP2PContext)
    const { address } = useAccount()
    const { getAuction, updateAuction } = useAuctionsDB()
    const { signBid, signAuction } = useAuctionSignature()
    const { staticData } = useStaticData()
    const {
        data: hash,
        isPending,
        writeContract
    } = useWriteContract()

    const [auction, setAuction] = useState<any>(null)
    const [room, setRoom] = useState<any>(null)
    const [roomError, setRoomError] = useState<string | null>(null)

    const postChatMessage = useCallback(async (message: string) => {
        if (!room || !address) return

        await room.put({
            _id: 'message:' + Math.floor(Date.now() / 1000),
            type: 'message',
            message,
            timestamp: Date.now(),
            user: address
        })

    }, [room, address])

    // Hook to read current nonce for the bidder
    const { data: currentNonce } = useReadContract({
        address: staticData?.englishAuctionAddr as `0x${string}`,
        abi: staticData?.englishAuctionAbi,
        functionName: 'usedNonces',
        args: address ? [address] : undefined,
        query: {
            enabled: !!(address && staticData)
        }
    })

    const postBid = useCallback(async (bid: string) => {
        console.log('🎯 Posting bid:', bid)
        if (!room || !address || !auction || !address) return

        try {
            // Validate auction signature hash exists
            if (!auction.auctionSigHash) {
                throw new Error('Auction signature hash is missing - cannot place bid')
            }

            // Get current nonce from contract
            const bidderNonce = currentNonce ? BigInt(currentNonce.toString()) : BigInt(0)
            console.log('📊 Using nonce from contract:', bidderNonce.toString())

            // Create bid message for signing
            const bidMessage: BidMessage = {
                bidder: address,
                amount: parseEther(bid),
                bidderNonce: bidderNonce,
                auctionSigHash: auction.auctionSigHash
            }

            // Sign the bid
            const signature = await signBid(bidMessage)

            // Store bid with signature and message data
            await room.put({
                _id: 'bid:' + Math.floor(Date.now() / 1000),
                type: 'bid',
                bid,
                bidMessage,
                signature,
                timestamp: Date.now(),
                user: address
            })
        } catch (error) {
            console.error('Failed to sign and post bid:', error)
            throw error
        }
    }, [room, address, auction, signBid, currentNonce])

    const fetchMessages = useCallback(async () => {
        if (!room || !address) return
        const messages = await room.all()
        console.log('messages', messages)
        return messages
    }, [room, address])

    const watchRoom = useCallback((onRoomUpdate?: (event: any) => void) => {
        console.log('🎮 Room watcher enabled')
        if (!room || !address) return

        // Clean up any existing listeners first
        room.events.removeAllListeners('update')

        // Listen for room updates (messages, bids, etc.)
        room.events.on('update', (event) => {
            console.log('🎮 Room update event:', event)
            // Call the provided callback to handle room update
            if (onRoomUpdate) {
                onRoomUpdate(event)
            }
        })

        // Return cleanup function for component to use
        return () => {
            console.log('🛡️ Room watcher disabled')
            room.events.removeAllListeners('update')
            console.log('🛡️ Room watcher cleanup complete')
        }
    }, [room, address])


    const completeAuction = useCallback(async () => {
        if (!room || !address || !auction) return

        await room.put({
            _id: 'completion:' + Math.floor(Date.now() / 1000),
            type: 'message',
            message: '🏆 Auction completed! The battle has ended.',
            timestamp: Date.now(),
            user: address,
            isSystemMessage: true
        })
        let updatedAuction = auction
        updatedAuction.endTime = Math.floor(Date.now() / 1000);
        updateAuction(updatedAuction)

        console.log('✅ Auction completion message posted to room')
    }, [room, address])

    const consumeAuction = useCallback(async (): Promise<{ auctionMessage: any; finalSignature: string; bidsCount: number; hash?: `0x${string}` } | undefined> => {
        if (!room || !address || !auction) return

        try {
            console.log('🎯 Consuming auction:', auction.id)

            // Fetch all bids from the room
            const bids = await room.query((doc: any) => doc.type === 'bid')
            console.log('bids', bids)
            console.log('📊 Found bids:', bids.length)

            // Prepare bid messages and signatures for the auction signature
            const bidMessages: BidMessage[] = []
            const bidSigs: string[] = []

            bids.forEach((bidEntry: any) => {
                if (bidEntry.bidMessage && bidEntry.signature) {
                    bidMessages.push(bidEntry.bidMessage)
                    bidSigs.push(bidEntry.signature)
                }
            })

            // Create the complete auction message following the test pattern
            const auctionMessage: AuctionMessage = {
                auctioneer: address,
                auctioneerNonce: auction.auctioneerNonce && typeof auction.auctioneerNonce !== 'undefined' ? BigInt(auction.auctioneerNonce.toString()) : BigInt(0),
                nft: auction.nftContract,
                nftId: BigInt(auction.nftTokenId),
                token: auction.tokenContract,
                bidStart: parseEther(auction.startingBid),
                deadline: Math.floor(auction.endTime / 1000),
                auctionSigHash: auction.auctionSigHash,
                bids: bidMessages.map(bid => ({
                    bidder: bid.bidder,
                    amount: BigInt(bid.amount.toString()),
                    bidderNonce: BigInt(bid.bidderNonce.toString()),
                    auctionSigHash: bid.auctionSigHash
                })),
                bidSigs
            }

            console.log('📝 Signing final auction with', bidMessages.length, 'bids')

            // Sign the complete auction
            const auctionSignature = await signAuction(auctionMessage)

            // Extract v, r, s from signature (following test pattern)
            const auctionSigNo0x = auctionSignature.substring(2)
            const r = '0x' + auctionSigNo0x.substring(0, 64) as `0x${string}`
            const s = '0x' + auctionSigNo0x.substring(64, 128) as `0x${string}`
            const v = parseInt(auctionSigNo0x.substring(128, 130), 16)

            // Convert the auction message for contract call (convert string fields to proper types)
            const contractAuctionMessage = {
                ...auctionMessage,
                auctioneerNonce: BigInt(auctionMessage.auctioneerNonce.toString()),
                nftId: BigInt(auctionMessage.nftId.toString()),
                bidStart: BigInt(auctionMessage.bidStart.toString()),
                bids: auctionMessage.bids.map(bid => ({
                    ...bid,
                    bidderNonce: BigInt(bid.bidderNonce.toString()),
                    amount: BigInt(bid.amount.toString())
                }))
            }

            console.log('Debug: Contract message after type conversion:', contractAuctionMessage)
            console.log('Calling consumeAuction with:', {
                v, r, s,
                auction: contractAuctionMessage,
                bidCount: bids.length
            })

            // Call the contract and wrap in Promise
            return new Promise((resolve, reject) => {
                if (!staticData) {
                    reject(new Error('Static data not loaded'))
                    return
                }
                
                writeContract({
                    address: staticData.englishAuctionAddr as `0x${string}`,
                    abi: staticData.englishAuctionAbi,
                    functionName: 'consumeAuction',
                    args: [v, r, s, contractAuctionMessage]
                }, {
                    onSuccess: (data) => {
                        console.log('data', data)
                        console.log('✅ Auction consumed successfully with signature:', auctionSignature)
                        console.log('🔄 Transaction submitted, hash will be available shortly')
                        
                        const result = {
                            auctionMessage: contractAuctionMessage,
                            finalSignature: auctionSignature,
                            bidsCount: bidMessages.length,
                            contractCall: { v, r, s },
                            hash: data
                        }
                        resolve(result)
                    },
                    onError: (error) => {
                        console.error('❌ Failed to consume auction:', error)
                        reject(error)
                    }
                })
            })


        } catch (error) {
            console.error('❌ Failed to consume auction:', error)
            throw error
        }
    }, [room, address, auction, signAuction, writeContract])

    const joinAuctionRoom = useCallback(async (auctionId: string) => {
        if (!orbit || !selfAddress) {
            setRoomError('P2P system not initialized')
            return null
        }
        
        try {
            setRoomError(null)
            const auction = await getAuction(auctionId)
            console.log('useAuctionRoom::joinAuctionRoom::auction', auction)
            if (!auction) {
                setRoomError('Auction not found')
                return null
            }
            
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
                                        setRoomError('Failed to open auction room')
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
                                        updateAuction(auction)
                                        resolve()
                                    }).catch(error => {
                                        console.error('❌ Failed to open room (fallback):', error)
                                        setRoomError('Failed to open auction room')
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
            console.error('Error joining auction room:', e)
            setRoomError('Failed to join auction room')
            return null
        }
    }, [orbit, selfAddress, getAuction, updateAuction])

    useEffect(() => {
        if (initializedRef.current) return
        if (!orbit || !auctionId || !selfAddress || !address) return

        const init = async () => {
            console.log("initializing auction room")
            const result = await joinAuctionRoom(auctionId)
            console.log("result", result)
            if (result) {
                const { auction, room } = result
                setAuction(auction)
                setRoom(room)
                initializedRef.current = true
            } else {
                console.error('Failed to join auction room:', auctionId)
            }
        }
        init()

        return () => {
            initializedRef.current = false
        }
    }, [auctionId, orbit, address, selfAddress, joinAuctionRoom])



    const highBid = useCallback(() => {
        if (!room) return null
        // This would typically fetch the highest bid from the room
        // For now, return a placeholder
        return null
    }, [room])

    return {
        auction,
        room,
        roomError,
        joinAuctionRoom,
        postChatMessage,
        postBid,
        fetchMessages,
        watchRoom,
        consumeAuction,
        completeAuction,
        highBid,
    }
}