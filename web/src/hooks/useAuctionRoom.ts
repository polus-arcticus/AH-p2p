import { useContext, useEffect, useState } from 'react'

import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'
import { useAuctionsDB } from './useAuctionsDB'
import { useParams } from 'react-router'
export const useAuctionRoom = () => {
    const {auctionId} = useParams()
    const {loading} = useContext(AHP2PContext)
    const {joinAuction, getAuction} = useAuctionsDB()

    const [auction, setAuction] = useState<any>(null)
    const [room, setRoom] = useState<any>(null)

    useEffect(() => {
        if (loading) return 
        const init = async () => {
            if (auctionId) {
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
        room
    }
} 