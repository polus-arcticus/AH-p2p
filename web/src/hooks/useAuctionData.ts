import { useContext } from 'react'
import { useAccount } from 'wagmi'
import { HeliaContext } from '../providers/HeliaProvider'

export const useAuctionData = (roomId: string | undefined) => {
    const { address } = useAccount()
    const { activeAuctions } = useContext(HeliaContext)
    
    // Find the auction details for this room
    const auction = activeAuctions.find(a => a.id === roomId)
    const isAuctioneer = auction && address && auction.creator === address.toLowerCase()
    const isAuctionEnded = auction && auction.endTime <= Date.now()
    
    return {
        auction,
        isAuctioneer: !!isAuctioneer,
        isAuctionEnded: !!isAuctionEnded
    }
} 