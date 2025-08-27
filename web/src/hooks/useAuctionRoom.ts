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
    const { joinAuction, getAuction, updateAuction } = useAuctionsDB()
    const { signBid, signAuction } = useAuctionSignature()
    const { staticData } = useStaticData()
    const {
        data: hash,
        isPending,
        writeContract
    } = useWriteContract()

    const [auction, setAuction] = useState<any>(null)
    const [room, setRoom] = useState<any>(null)

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

    useEffect(() => {
        if (initializedRef.current) return
        if (!orbit || !auctionId || !selfAddress || !address) return

        const init = async () => {
            console.log("initializing")
            const result = await joinAuction(auctionId)
            console.log("result", result)
            if (result) {
                const { auction, room } = result
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



    const highBid = useCallback(() => {
        if (!room) return null
        // This would typically fetch the highest bid from the room
        // For now, return a placeholder
        return null
    }, [room])

    return {
        auction,
        room,
        postChatMessage,
        postBid,
        fetchMessages,
        watchRoom,
        consumeAuction,
        completeAuction,
        highBid,
    }
}