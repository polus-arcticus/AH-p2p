import {
	useState,
	useEffect,
	useCallback
} from 'react'

import {TOPICS} from '../utils/topics'

import { useContext } from 'react'
import { AHP2PContext } from '../AHP2PProvider'
import { multiaddr } from 'multiaddr'

export const useSubPeerList = () => {
  const { orbit } = useContext(AHP2PContext)
	const [peerList, setPeerList] = useState([])



	const subPeerList = useCallback(async () => {

		new Promise<Record<string, string>>((resolve) => {
			const peerListListener = async (evt: { detail: { topic: string, data: Uint8Array } }) => {
				const { topic, data } = evt.detail
				if (topic === TOPICS.PEER_LIST) {
					const peerListJson: Record<string, string> = JSON.parse(new TextDecoder().decode(data))
					console.log('Peer list', peerListJson)
					delete peerListJson[helia.libp2p.peerId.toString()]
					setPeerList(peerListJson)

					// Dial WebRTC connections to peers
					for (const [peerId, webrtcMultiaddr] of Object.entries(peerListJson)) {
						console.log('Dialing WebRTC connection to peer:', peerId)
						try {
							await helia.libp2p.dial(multiaddr(webrtcMultiaddr))
							console.log('Successfully established WebRTC connection to:', peerId)
						} catch (error) {
							console.error('Failed to dial WebRTC connection to', peerId, error)
						}
					}

					resolve(peerListJson)
				}
			}
			orbit.helia.libp2p.services.pubsub.addEventListener('message', peerListListener)
			orbit.helia.libp2p.services.pubsub.subscribe(TOPICS.PEER_LIST)
			orbit.helia.libp2p.services.pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())
		})
	}, [])


	return {}
}
