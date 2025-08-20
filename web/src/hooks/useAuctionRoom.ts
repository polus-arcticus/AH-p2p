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
        
        // Set up bidirectional connection listener
        /*
        const { pubsub } = orbit.ipfs.libp2p.services
        const myPeerId = orbit.ipfs.libp2p.peerId.toString()
        const connectionTopic = `ah-p2p.market/connections`
        
        const connectionListener = (event: CustomEvent<any>) => {
            console.log('🔗 Peer connection event full object:', JSON.stringify(event, null, 2))
            console.log('🔗 Event detail:', event.detail)
            console.log('🔗 Event type:', event.type)
            
            // Try different ways to extract peer info
            let remotePeerId = null
            let webrtcAddress = null
            
            // Method 1: Check event.detail
            if (event.detail) {
                console.log('📋 Detail keys:', Object.keys(event.detail))
                remotePeerId = event.detail.remotePeer?.toString() || event.detail.peerId?.toString()
                
                if (event.detail.connection?.remoteAddr) {
                    webrtcAddress = event.detail.connection.remoteAddr.toString()
                }
            }
            
            // Method 2: Check if peer info is directly on event
            if (!remotePeerId && event.remotePeer) {
                remotePeerId = event.remotePeer.toString()
            }
            
            // Method 3: Check libp2p connections directly
            if (!webrtcAddress) {
                try {
                    const connections = orbit.ipfs.libp2p.getConnections()
                    console.log('🔌 All connections:', connections.length)
                    const latestConnection = connections[connections.length - 1]
                    if (latestConnection) {
                        remotePeerId = latestConnection.remotePeer.toString()
                        webrtcAddress = latestConnection.remoteAddr.toString()
                        console.log('🎯 Latest connection peer:', remotePeerId)
                        console.log('🎯 Latest connection addr:', webrtcAddress)
                    }
                } catch (error) {
                    console.error('❌ Error getting connections:', error)
                }
            }
            
            console.log('🆔 Final remote peer ID:', remotePeerId)
            console.log('🌐 Final WebRTC address:', webrtcAddress)
            // dial this webrtc address
            orbit.ipfs.libp2p.dial(multiaddr(webrtcAddress as string), { 
                signal: AbortSignal.timeout(30000) // 30 second timeout
            })
            
            // Publish connection info including WebRTC address
            pubsub.publish(connectionTopic, new TextEncoder().encode(JSON.stringify({
                type: 'peer:connect',
                peerId: myPeerId,
                remotePeerId,
                webrtcAddress,
                timestamp: Date.now()
            })))

        }
        
        orbit.ipfs.libp2p.addEventListener('peer:connect', connectionListener)
        
        // Async setup function
        const setupSubscriptions = async () => {
            // Subscribe to shared connection topic
            const connectionTopic = `ah-p2p.market/connections`
            console.log('🔗 Subscribing to shared connection topic:', connectionTopic)
        
            await pubsub.subscribe(connectionTopic)
            await pubsub.subscribe('ah-p2p.market/test')  // Test topic for debugging
            
            // Wait a moment for subscriptions to propagate in the mesh
            await new Promise(resolve => setTimeout(resolve, 2000))
            console.log('✅ Subscriptions established, mesh should be ready')
            
            // Also log all current subscriptions for debugging
            console.log('📋 Current pubsub subscriptions:', Array.from(pubsub.getSubscribers()))
        }
        
        setupSubscriptions()
        
                */
        // Cleanup function to reset ref on unmount
        return () => {
            initializedRef.current = false
            /*
            pubsub.removeEventListener('peer:discovery', connectionListener)
            pubsub.unsubscribe('ah-p2p.market/connections')
            pubsub.unsubscribe('ah-p2p.market/test')
            console.log('🛡️ Connection listener cleanup complete')
            */
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