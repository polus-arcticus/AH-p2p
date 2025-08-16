import {
    useContext,
    useState,
    useEffect,
    useCallback
} from 'react'
import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'

export const useAuctionsDB = () => {
    const {auctionsDB, orbit} = useContext(AHP2PContext)


    const createAuction = useCallback(async (auctionData: any) => {
        if (!auctionsDB || !orbit) return
        const _id = 'auction' + Date.now()

        const room = await orbit.open(_id, {
            type: 'documents'
        })

        const auction = await auctionsDB.put({
            _id,
            ...auctionData,
            roomAddress: room.address.toString()
        })

        console.log('auction', auction)
        return auction
    }, [auctionsDB])

    const getAuctions = useCallback(async () => {
        if (!auctionsDB) return
        const auctions = await auctionsDB.query(() => true)
        console.log('auctions', auctions)
        return auctions
    }, [auctionsDB])

    const getAuction = useCallback(async (auctionId: string) => {
        if (!auctionsDB) return
        const auction = await auctionsDB.query((doc) => doc._id === auctionId)
        console.log('getAuction:auction', auction)
        return auction[0]
    }, [auctionsDB])    

    const joinAuction = useCallback(async (auctionId: string) => {
        if (!auctionsDB || !orbit) return
        try {
            const auction = await getAuction(auctionId)
            if (!auction) return
            const room = await orbit.open(auction.roomAddress)
            if (!room) throw new Error('Room not found')
            return room
        } catch (e) {
            console.error('Error joining auction:', e)
        }
    }, [auctionsDB, orbit])


    const watchAuctions = useCallback(async () => {
        if (!auctionsDB) return
        const listener = auctionsDB.events.on('update', (event) => {
            console.log('event', event)
        })
        listener()

        return () => {
            listener.remove()
        }
    }, [auctionsDB])


    return {
        createAuction,
        getAuctions,
        getAuction, 
        joinAuction,
        watchAuctions
    }
}
