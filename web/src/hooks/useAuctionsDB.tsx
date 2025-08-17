import {
    useContext,
    useState,
    useEffect,
    useCallback
} from 'react'
import { AHP2PContext } from '../provider/AHP2PProvider/AHP2PProvider'
import { multiaddr } from '@multiformats/multiaddr'
export const useAuctionsDB = () => {
    const {auctionsDB, orbit, selfAddress} = useContext(AHP2PContext)


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
        const auctions = await auctionsDB.all()
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
        if (!auctionsDB || !orbit || !selfAddress) return
        try {
            const auction = await getAuction(auctionId)
            if (!auction) return
            const room = await orbit.open(auction.roomAddress)
            if (!room) throw new Error('Room not found')

            const peers = await room.query((doc) => doc.type === 'peer')
            console.log('peers', peers)

            // Use Promise.race to connect to first available peer, then continue others async
            const peerEntries = Object.entries(peers)
            if (peerEntries.length > 0) {
                console.log('🎯 Racing to connect to', peerEntries.length, 'peers...')
                
                // Create connection promises for all peers
                const connectionPromises = peerEntries.map(([peerId, webrtcMultiaddr]) => 
                    orbit.ipfs.libp2p.dial(multiaddr(webrtcMultiaddr as string))
                        .then(() => {
                            console.log('⚡ Successfully connected to peer:', peerId)
                            return { peerId, success: true }
                        })
                        .catch((error) => {
                            console.warn('❌ Failed to connect to peer:', peerId, error)
                            return { peerId, success: false, error }
                        })
                )

                // Custom promise that resolves as soon as ANY peer connects
                await new Promise<void>((resolve) => {
                    let resolved = false
                    
                    // Race all connections - resolve on first success
                    Promise.race(connectionPromises.filter(p => 
                        p.then(result => result.success ? result : Promise.reject())
                            .catch(() => null) // Ignore rejections in race
                    )).then(() => {
                        if (!resolved) {
                            resolved = true
                            console.log('🚀 First peer connected! Room ready for battle!')
                            resolve()
                        }
                    }).catch(() => {
                        // If all peers fail in race, still resolve to return room
                        if (!resolved) {
                            resolved = true
                            console.warn('⚠️ No peers connected in race, but room still accessible')
                            resolve()
                        }
                    })

                    // Continue all remaining connections in background
                    Promise.allSettled(connectionPromises).then((results) => {
                        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
                        console.log(`🌐 Final mesh status: ${successful}/${peerEntries.length} peers connected`)
                    })
                })
            }
            console.log('orbit identity', orbit.identity)
            console.log('libp2p peerid', orbit.ipfs.libp2p.peerId.toString())
            await auctionsDB.put({
                _id: 'peer' + Date.now(),
                type: 'peer',
                peerId: orbit.ipfs.libp2p.peerId.toString(),
                webrtcMultiaddr: selfAddress.toString()
            })

            return room
        } catch (e) {
            console.error('Error joining auction:', e)
        }
    }, [auctionsDB, orbit, selfAddress])


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
