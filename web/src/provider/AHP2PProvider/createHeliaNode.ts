import { IDBBlockstore } from 'blockstore-idb'
import { IDBDatastore } from 'datastore-idb'
import { createLibp2p } from 'libp2p'
import { noise } from "@chainsafe/libp2p-noise"
import { yamux } from "@chainsafe/libp2p-yamux"
import { webRTC } from "@libp2p/webrtc"
import { webSockets } from "@libp2p/websockets"
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2"
import { identify } from "@libp2p/identify"
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createHelia } from 'helia'
import { multiaddr, type Multiaddr  } from '@multiformats/multiaddr'

import { stabilizeConnection } from "./utils/stabilizeConnection"
import { waitForWebRTCAddress } from "./utils/waitForWebRTCAddress"



export const createHeliaNode = async (): Promise<{ helia: any, selfWebRTCMultiaddr: Multiaddr | null }> => {
    const datastoreName = 'ah-p2p-datastore'
    const blockstoreName = 'ah-p2p-blockstore'

    const datastore = new IDBDatastore(datastoreName)
    const blockstore = new IDBBlockstore(blockstoreName)

    await datastore.open()
    await blockstore.open()

    const options = {

        addresses: {
            listen: [
                '/p2p-circuit',
                '/webrtc'
            ]
        },
        transports: [
            webSockets({}),
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
            pubsub: gossipsub({
                allowPublishToZeroTopicPeers: true,
            })
        }
    }
    let libp2p
    let helia
    let selfWebRTCMultiaddr: Multiaddr | null = null
    try {
        libp2p = await createLibp2p(options)
        helia = await createHelia({ libp2p, datastore, blockstore })

        const relay = `/dns4/ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV`
        await helia.libp2p.dial(multiaddr(relay))
        console.log('Dialing relay', relay)
        await stabilizeConnection(helia)
        console.log('connection stabilized')

        selfWebRTCMultiaddr = await waitForWebRTCAddress(helia)
        console.log('WebRTC Multiaddr', selfWebRTCMultiaddr.toString())


    } catch (e) {
        console.error(e)
    }

    return {
        helia,
        selfWebRTCMultiaddr
    }
}