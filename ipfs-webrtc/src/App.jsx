import { useState, useEffect, useCallback } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
//import IPFSPubsub from 'orbit-db-pubsub'
import * as IPFS from 'ipfs-core'
import Room from './pubsub/index'
import {multiaddr} from '@multiformats/multiaddr'
console.log(multiaddr)
console.log('Room', Room)
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import * as WebSocketsFilters from '@libp2p/websockets/filters'
console.log('wsf', WebSocketsFilters)
import {mplex}  from '@libp2p/mplex'
import {plaintext} from 'libp2p/insecure'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import rtc from 'rtc'
const rtcSession = rtc({room:'test-room'})
rtcSession.on('ready', () => {
  console.log('bidirectional browser communication handled by webrtc')
})
function App() {
	const [libp2p, setLibp2p] = useState(null)
	const [ipfs, setIpfs] = useState(null)
	const [room, setRoom] = useState(null)
	const [pubsub, setPubsub] = useState(null)
	const fetchLibp2pNode = useCallback(async () => {
		const libp2pNode = await createLibp2p({
			transports: [
        new  webSockets({
        })
			],
			streamMuxers: [
				mplex()
			],
			connectionEncryption: [
				plaintext()
			],
			pubsub: gossipsub({
				emitSelf: true
			}),
			nat: {
				enabled: false
			}
		})
		await libp2pNode.start()
		const ipfs = await IPFS.create({
      repo: '/ipfs/repos/'+ Math.random()+'ok',
      EXPERIMENTAL: { pubsub: true },
      config: {
        Addresses: {
          Swarm: [
            '/ip4/192.168.1.69/tcp/80/ws/p2p-webrtc-star'

          ]
        }
      }
    })
      //const ps = new IPFSPubsub(ipfs, 'my-room')
      const room = new Room(ipfs, 'my-room')
		room.on('peer joined', (peer) => {
			console.log('Peer joined the room', peer)

		})

		room.on('peer left', (peer) => {
			console.log('Peer left...', peer)

		})

		// now started to listen to room
		room.on('subscribed', () => {
			console.log('Now connected!')
		})
    setLibp2p(libp2pNode)
    setRoom(room)
    //setPubsub(ps)
    

	},[])

	const fetchIpfs = useCallback(async () => {
/*
		console.log('fetching ipfs')
		const ipfs = await IPFS.create({ repo: Math.random()+'ok', EXPERIMENTAL: { pubsub: true }})

		const room = new Room(libp2p, 'room-name')
		room.on('peer joined', (peer) => {
			console.log('Peer joined the room', peer)

		})

		room.on('peer left', (peer) => {
			console.log('Peer left...', peer)

		})

		// now started to listen to room
		room.on('subscribed', () => {
			console.log('Now connected!')
		})


		console.log('ipfs', ipfs)
		setIpfs(ipfs)
		setPubsub(room)
    */
	}, [])

	const addPeer = useCallback(async () => {
	})

	useEffect(()=> {
		fetchLibp2pNode()
		//fetchIpfs()

	},[])

	const handleAddSwarm = () => {

	}

	return (
		<div className="App">
      <div>hello yay</div>
			<button onClick={async () => {
				console.log('attempting to publish')
        //await pubsub.publish('room-name','hello broadcast')
        await room.broadcast('hello broadcast')
			}}>Publish</button>
			<button onClick={async () => {
				const newMessageCb = (evt) => {
					console.log('pubsubu new message received')
					console.log('evt', evt)
				}
				const newPeerCb = (evt) => {
					console.log('pubusub new peer')
					console.log('evt', evt)
				}
        //await pubsub.subscribe('room-name', newMessageCb, newPeerCb)
			}}>Subscribe</button>
		</div>
	)
}

export default App
