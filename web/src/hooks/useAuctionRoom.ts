import {
    useCallback,
    useContext,
    useEffect,
    useState
} from 'react'

import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'
import { useAuctionsDB } from './useAuctionsDB'
import { useParams } from 'react-router'
export const useAuctionRoom = () => {
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
        if (!room) return
        const listener = room.events.on('update', (event) => {
            console.log('event', event)
        })
        listener()

        return () => {
            listener.remove()
        }
    }, [room])

    useEffect(() => {
        if (loading) return 
        const init = async () => {
            console.log('init')
            if (auctionId) {
                console.log("auctionID")
                const auction = await getAuction(auctionId)
                const room = await joinAuction(auctionId)
                setAuction(auction)
                setRoom(room)
            }
        }
        init()
    }, [auctionId, loading])



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