import 'dotenv/config'

import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { autoNAT } from '@libp2p/autonat'

import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB, IPFSAccessController, useIdentityProvider  } from '@orbitdb/core'

import { loadOrCreatePrivateKey } from './loadOrCreatePeerId.js'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'
import { Wallet } from '@ethersproject/wallet'
import { enable, disable } from '@libp2p/logger'

// Topics definition
const TOPICS = {
  PEER_ANNOUNCE: 'ah-p2p.market/peer-announce',
  PING: 'ah-p2p.market/ping',
  PONG: 'ah-p2p.market/pong',
  PEER_REQUEST: 'ah-p2p.market/peer-request', 
  PEER_LIST: 'ah-p2p.market/peer-list'

}


const peerList =  {}



const main = async () => {
  const ethersWallet = new Wallet(process.env.OWNER_KEY)
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const provider = OrbitDBIdentityProviderEthereum.default({
    wallet: ethersWallet
  })

  const privateKey = await loadOrCreatePrivateKey()

  const blockstore = new LevelBlockstore("./ah-p2p/blockstore")
  const datastore = new LevelDatastore("./ah-p2p/datastore")

  const node = await createLibp2p({
    privateKey,
    datastore,
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
      autoNat: autoNAT(),
      relay: circuitRelayServer(),
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
      })
    }
  })

  enable('*,*:debug')

  const helia = await createHelia({
    datastore,
    blockstore,
    libp2p: node
  })

  const orbit = await createOrbitDB({
    ipfs:helia,
    directory: './ah-p2p/orbitdb',
  })

  const auctionsDB = await orbit.open(
    'ah-p2p/auctions',
    {
      type: 'documents',
      AccessController: IPFSAccessController({ write: ['*'] })
    }
  )

  node.services.pubsub.subscribe(TOPICS.PEER_REQUEST)
  node.services.pubsub.subscribe(TOPICS.PEER_ANNOUNCE)
  node.services.pubsub.subscribe(TOPICS.PING)
  node.services.pubsub.addEventListener('message', (evt) => {
    console.log('Received message pubsub')
    const {topic, data} = evt.detail
    console.log('topic', topic)
    switch (topic) {
      case TOPICS.PEER_ANNOUNCE:
        console.log('Received peer announce')
        const peerAnnounce = JSON.parse(new TextDecoder().decode(data))
        console.log('Peer announce', peerAnnounce)

        peerList[peerAnnounce.peerId] = peerAnnounce.multiaddrs
        console.log('peerlist', peerList)
        break
      case TOPICS.PEER_REQUEST:
        // Send back all connected peers
        console.log('Received peer request')
        node.services.pubsub.publish(TOPICS.PEER_LIST, 
          new TextEncoder().encode(JSON.stringify(peerList))
        )
        console.log(`Sent ${peerList.length} connected peers`)
        break
      case TOPICS.PING:
        console.log('Received ping')
        node.services.pubsub.publish(TOPICS.PONG,
          new TextEncoder().encode(JSON.stringify({
            auctionsDBAddress: auctionsDB.address.toString()
          })))
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
    console.log('evt', evt.detail.remotePeer)
    delete peerList[evt.detail.remotePeer.toString()]
    console.log('peerList', peerList )
    console.log('Connection closed to:', evt.detail.remoteAddr.toString())
  })
}

main()

