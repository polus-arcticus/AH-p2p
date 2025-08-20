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
export const useAuctionRoom = () => {
    const initializedRef = useRef(false)
    const {auctionId} = useParams()
    const {orbit, selfAddress} = useContext(AHP2PContext)
    const {joinAuction, getAuction} = useAuctionsDB()

    const [auction, setAuction] = useState<any>(null)
    const [room, setRoom] = useState<any>(null)

    const postChatMessage = useCallback(async (message: string) => {
        if (!room) return

        await room.put({
            _id: 'message:' + Math.floor(Date.now()/1000),
            type: 'message',
            message,
            timestamp: Date.now(),
            user: 'You'
        })

    }, [room])

    const postBid = useCallback(async (bid: string) => {
        if (!room) return

        await room.put({
            _id: 'bid:' + Math.floor(Date.now() / 1000),
            type: 'bid',
            bid,
            timestamp: Date.now(),
            user: 'You'
        })
    }, [room])

    const fetchMessages = useCallback(async () => {
        if (!room) return
        const messages = await room.all()
        console.log('messages', messages)
        return messages
    }, [room])

    const watchRoom = useCallback((onRoomUpdate?: (event: any) => void) => {
        console.log('🎮 Room watcher enabled')
        if (!room) return
        
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
    }, [room])

    useEffect(() => {
        if (initializedRef.current) return
        if (!orbit || !auctionId || !selfAddress) return 
        
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
    }, [auctionId, orbit, selfAddress, joinAuction])



    return {
        auction,
        room,
        postChatMessage,
        postBid,
        fetchMessages,
        watchRoom,
    }
} 