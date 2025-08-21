import { useMemo } from 'react'

interface SignedBidData {
    bid: {
        bidder: string
        amount: string
        bidderNonce: string
        auctionSigHash: string
    }
    signature: string
    timestamp: number
}

export const useSignedBids = (chatMessages: any[], currentRoom: string | null) => {
    const signedBids = useMemo(() => {
        const bids: SignedBidData[] = []
        
        chatMessages
            .filter(msg => msg.roomId === currentRoom && msg.message.startsWith('BID:'))
            .forEach(msg => {
                try {
                    const parts = msg.message.split(':')
                    if (parts.length >= 4 && parts[2] === 'SIGNED') {
                        // Extract JSON data from the message
                        const jsonStart = msg.message.indexOf(':SIGNED:') + 8
                        const signedBidJson = msg.message.substring(jsonStart)
                        const signedBidData: SignedBidData = JSON.parse(signedBidJson)
                        
                        // Validate the bid data structure
                        if (signedBidData.bid && signedBidData.signature && signedBidData.timestamp) {
                            bids.push(signedBidData)
                        }
                    }
                } catch (error) {
                    console.warn('Failed to parse signed bid:', error)
                }
            })

        // Sort bids by amount (highest first) as required by the contract
        return bids.sort((a, b) => parseFloat(b.bid.amount) - parseFloat(a.bid.amount))
    }, [chatMessages, currentRoom])

    // Separate the bids and signatures arrays as expected by the contract
    const bids = signedBids.map(item => item.bid)
    const bidSigs = signedBids.map(item => item.signature)

    // Get highest bid for display
    const highestBid = signedBids.length > 0 ? signedBids[0] : null

    return {
        signedBids,
        bids,
        bidSigs,
        highestBid,
        bidCount: signedBids.length
    }
} 