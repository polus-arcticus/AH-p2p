import { IDBBlockstore } from 'blockstore-idb'
import { IDBDatastore } from 'datastore-idb'
import { createLibp2p } from 'libp2p'
import { noise } from "@chainsafe/libp2p-noise"
import { yamux } from "@chainsafe/libp2p-yamux"
import { webRTC } from "@libp2p/webrtc"
import { webSockets } from "@libp2p/websockets"
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2"
import { identify } from "@libp2p/identify"
import { ping } from "@libp2p/ping"
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createHelia } from 'helia'
import { multiaddr, type Multiaddr  } from '@multiformats/multiaddr'

import { stabilizeConnection } from "./utils/stabilizeConnection"
import { waitForWebRTCAddress } from "./utils/waitForWebRTCAddress"
import { createPersistentPeerId } from "./utils/createPersistentPeerId"
import { webTransport } from '@libp2p/webtransport'
import { enable, disable } from '@libp2p/logger'

import type { WalletClient } from 'viem'



export const createHeliaNode = async (
    address: `0x${string}`,
    walletClient: WalletClient
): Promise<{ 
    helia: any,
    selfWebRTCMultiaddr: Multiaddr | null,
    dbAddrs: Record<string, string>,
    connectionError: boolean
}> => {
    const datastoreName = 'ah-p2p-datastore'
    const blockstoreName = 'ah-p2p-blockstore'

    const datastore = new IDBDatastore(datastoreName)
    const blockstore = new IDBBlockstore(blockstoreName)

    await datastore.open()
    await blockstore.open()

    // Generate persistent peer ID from Ethereum wallet signature
    const privateKey = await createPersistentPeerId(address, walletClient)

    const options = {
        privateKey,

        addresses: {
            listen: [
                '/p2p-circuit',
                '/webrtc'
            ]
        },
        transports: [
            webSockets({}),
            webTransport(),
            webRTC(),
            circuitRelayTransport()
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        connectionGater: {
            denyDialMultiaddr: () => {
                return false
            }
        },
        services: {
            identify: identify(),
            ping: ping(),
            pubsub: gossipsub({
                allowPublishToZeroTopicPeers: true,
            })
        }
    }
    let libp2p
    let helia
    let selfWebRTCMultiaddr: Multiaddr | null = null
    let dbAddrs: Record<string, string> = {}
    let connectionError = false
    
    try {
        libp2p = await createLibp2p(options)
        helia = await createHelia({ libp2p, datastore, blockstore })

        const relay = `/dns4/relay.ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV`
        await helia.libp2p.dial(multiaddr(relay))
        console.log('Dialing relay', relay)
        dbAddrs = await stabilizeConnection(helia)
        console.log('dbAddrs', dbAddrs)
        console.log('connection stabilized')

        selfWebRTCMultiaddr = await waitForWebRTCAddress(helia)
        console.log('WebRTC Multiaddr', selfWebRTCMultiaddr.toString())

        enable('*,*:debug')
    } catch (e) {
        console.error(e)
        connectionError = true
    }

    return {
        helia,
        selfWebRTCMultiaddr,
        dbAddrs,
        connectionError
    }
}