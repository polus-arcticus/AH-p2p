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

// Simple peer registry with TTL
const peerRegistry = new Map()
const PEER_TTL = 5 * 60 * 1000 // 5 minutes
const HEARTBEAT_INTERVAL = 60 * 1000 // 1 minute

// Cleanup stale peers and broadcast relay info
const heartbeat = () => {
  const now = Date.now()
  
  // Cleanup stale peers
  for (const [peerId, data] of peerRegistry.entries()) {
    if (now - data.timestamp > PEER_TTL) {
      peerRegistry.delete(peerId)
      console.log('Peer removed (stale):', peerId)
    }
  }

  // Announce relay status
  const relayInfo = {
    peerId: node.peerId.toString(),
    multiaddrs: node.getMultiaddrs().map(ma => ma.toString()),
    connectedPeers: peerRegistry.size,
    timestamp: now
  }
  node.services.pubsub.publish(TOPICS.PEER_ANNOUNCE, 
    new TextEncoder().encode(JSON.stringify(relayInfo))
  )
}

// Start heartbeat after node is ready
setTimeout(() => {
  heartbeat()
  setInterval(heartbeat, HEARTBEAT_INTERVAL)
}, 1000)

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

console.log(`Node started with id ${node.peerId.toString()}`)
console.log('Listening on:')
node.getMultiaddrs().forEach((ma) => console.log(ma.toString()))

node.addEventListener('connection:open', (evt) => {
  console.log('New connection from:', evt.detail.remoteAddr.toString())
})

node.addEventListener('connection:close', (evt) => {
  console.log('Connection closed to:', evt.detail.remoteAddr.toString())
})

// Subscribe to all required topics
const TOPICS = {
  PEER_ANNOUNCE: 'ah-p2p.market/peer-announce',
  PEER_REQUEST: 'ah-p2p.market/peer-request', 
  PEER_LIST: 'ah-p2p.market/peer-list'
}

Object.values(TOPICS).forEach(topic => {
  node.services.pubsub.subscribe(topic)
})

node.services.pubsub.addEventListener('message', (evt) => {
  const {topic, data} = evt.detail
  console.log('topic', topic)
  switch (topic) {
    case TOPICS.PEER_ANNOUNCE:
      const json = JSON.parse(new TextDecoder().decode(data))
      // Store or update peer info
      peerRegistry.set(json.peerId, {
        ...json,
        timestamp: Date.now()
      })
      console.log('Peer announced:', json.peerId)
      break
    case TOPICS.PEER_REQUEST:
      // Send back all known peers
      const peers = Array.from(peerRegistry.values())
      node.services.pubsub.publish(TOPICS.PEER_LIST, 
        new TextEncoder().encode(JSON.stringify(peers))
      )
      break
    default:
      console.log('unknown topic', topic)
  }
})
