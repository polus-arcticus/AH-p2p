import {
    useContext,
    useState,
    useEffect,
    useCallback
} from 'react'
import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'

export const useAuctionsDB = () => {
    const {auctionsDB} = useContext(AHP2PContext)


    const createAuction = useCallback(async (auctionData: any) => {
        if (!auctionsDB) return
        console.log(auctionsDB)
        const auction = await auctionsDB.set('test-auction', auctionData)

        return auction
    }, [auctionsDB])

    const getAuctions = useCallback(async () => {
        if (!auctionsDB) return
        const auctions = await auctionsDB.get()
        return auctions
    }, [auctionsDB])

    const getAuction = useCallback(async (auctionId: string) => {
        if (!auctionsDB) return
        const auction = await auctionsDB.get(auctionId)
        return auction
    }, [auctionsDB])


    return {
        createAuction,
        getAuctions,
        getAuction
    }
}
