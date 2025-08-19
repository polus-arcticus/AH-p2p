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
export const useAuctionRoom = () => {
    const initializedRef = useRef(false)
    const {auctionId} = useParams()
    const {loading, orbit, selfAddress} = useContext(AHP2PContext)
    const {joinAuction, getAuction} = useAuctionsDB()

    const [auction, setAuction] = useState<any>(null)
    const [room, setRoom] = useState<any>(null)
    const [messages, setMessages] = useState<any>([])
    const [peers, setPeers] = useState<any>([])

    const postChatMessage = useCallback(async (message: string) => {
        if (!room) return

        await room.put({
            type: 'message',
            message,
            timestamp: Date.now(),
            user: 'You'
        })

    }, [room])

    const postBid = useCallback(async (bid: string) => {
        if (!room) return

        await room.put({
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

    const watchRoom = useCallback(async () => {
        console.log('watching room')
        if (!room) return
        const listener = room.events.on('update', (event) => {
            console.log('event', event)
        })

        return () => {
            listener.remove()
        }
    }, [room])

    useEffect(() => {
        if (initializedRef.current) return
        if (!orbit || !auctionId) return 
        const init = async () => {
                console.log("auctionID")
                const result = await joinAuction(auctionId)
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
        
        // Cleanup function to reset ref on unmount
        return () => {
            initializedRef.current = false
        }
    }, [auctionId, orbit])



    return {
        joinAuction,
        getAuction,
        auction,
        room,
        postChatMessage,
        postBid,
        fetchMessages,
        watchRoom,
        peers
    }
} 