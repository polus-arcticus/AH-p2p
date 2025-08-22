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
import { useAuctionSignature, type BidMessage } from './useAuctionSignature'
import { parseEther } from 'viem'
import { useAccount } from 'wagmi'
export const useAuctionRoom = () => {
    const initializedRef = useRef(false)
    const {auctionId} = useParams()
    const {orbit, selfAddress, peerId} = useContext(AHP2PContext)
    const {address} = useAccount()
    const {joinAuction, getAuction} = useAuctionsDB()
    const {signBid} = useAuctionSignature()

    const [auction, setAuction] = useState<any>(null)
    const [room, setRoom] = useState<any>(null)

    const postChatMessage = useCallback(async (message: string) => {
        if (!room || !address) return

        await room.put({
            _id: 'message:' + Math.floor(Date.now()/1000),
            type: 'message',
            message,
            timestamp: Date.now(),
            user: address
        })

    }, [room, address])

    const postBid = useCallback(async (bid: string) => {
        console.log('🎯 Posting bid:', bid)
        if (!room || !address || !auction || !address) return

        try {
            // Validate auction signature hash exists
            if (!auction.auctionSigHash) {
                throw new Error('Auction signature hash is missing - cannot place bid')
            }

            // Create bid message for signing
            const bidMessage: BidMessage = {
                bidder: address,
                amount: parseEther(bid),
                bidderNonce: BigInt(Math.floor(Date.now() / 1000)), // Simple nonce
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
    }, [room, address, auction, signBid])

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

    useEffect(() => {
        if (initializedRef.current) return
        if (!orbit || !auctionId || !selfAddress || !address) return 
        
        const init = async () => {
                console.log("initializing")
                const result = await joinAuction(auctionId)
                console.log("result", result)
                if (result) {
                    const {auction, room} = result
                    setAuction(auction)
                    setRoom(room)
                    initializedRef.current = true
                } else {
                    console.error('Failed to join auction:', auctionId)
                }
        }
        init()
        
        return () => {
            initializedRef.current = false
        }
    }, [auctionId, orbit, address, selfAddress, joinAuction])



    return {
        auction,
        room,
        postChatMessage,
        postBid,
        fetchMessages,
        watchRoom,
    }
} 