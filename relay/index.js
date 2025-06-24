import 'dotenv/config'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { createLibp2p } from 'libp2p'
import { loadOrCreatePrivateKey } from './loadOrCreatePeerId.js'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
const privateKey = await loadOrCreatePrivateKey()

// Topics definition
  const TOPICS = {
    PING: 'ah-p2p.market/ping',
    PONG: 'ah-p2p.market/pong',
    PEER_REQUEST: 'ah-p2p.market/peer-request', 
    PEER_LIST: 'ah-p2p.market/peer-list'
  }

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
    relay: circuitRelayServer(),
    pubsub: gossipsub({
      allowPublishToZeroTopicPeers: true,
    })
  }
})


node.services.pubsub.subscribe(TOPICS.PEER_REQUEST)
node.services.pubsub.subscribe(TOPICS.PING)

node.services.pubsub.addEventListener('message', (evt) => {
  console.log('Received message pubsub')
  const {topic, data} = evt.detail
  console.log('topic', topic)
  switch (topic) {
    case TOPICS.PEER_REQUEST:
      // Send back all connected peers
      console.log('Received peer request')
      const connectedPeers = node.getConnections().map(conn => ({
        peerId: conn.remotePeer.toString(),
        multiaddrs: conn.remoteAddr.toString(),
        timestamp: Date.now()
      }))
      node.services.pubsub.publish(TOPICS.PEER_LIST, 
        new TextEncoder().encode(JSON.stringify(connectedPeers))
      )
      console.log(`Sent ${connectedPeers.length} connected peers`)
      break
    case TOPICS.PING:
      console.log('Received ping')
      node.services.pubsub.publish(TOPICS.PONG, new Uint8Array())
      break
    default:
      console.log('unknown topic', topic)
  }
})

console.log(`Node started with id ${node.peerId.toString()}`)
console.log('Listening on:')
node.getMultiaddrs().forEach((ma) => console.log(ma.toString()))

node.addEventListener('connection:open', (evt) => {
  console.log('New connection from:', evt.detail.remoteAddr.toString())

})

node.addEventListener('connection:close', (evt) => {
  console.log('Connection closed to:', evt.detail.remoteAddr.toString())
})