import 'dotenv/config'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { createLibp2p } from 'libp2p'
import { loadOrCreatePrivateKey } from './loadOrCreatePeerId.js'
const privateKey = await loadOrCreatePrivateKey()
const node = await createLibp2p({
  privateKey,
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/9001/ws'],
    announce: ['/dns4/ah-p2p.market/tcp/443/wss']
  },
  transports: [
    webSockets()
  ],
  connectionEncrypters: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ],
  services: {
    identify: identify(),
    relay: circuitRelayServer()
  }
})

console.log(`Node started with id ${node.peerId.toString()}`)
console.log('Listening on:')
node.getMultiaddrs().forEach((ma) => console.log(ma.toString()))
