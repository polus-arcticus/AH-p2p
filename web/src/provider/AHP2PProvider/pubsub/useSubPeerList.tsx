import {
	useState,
	useEffect,
	useCallback
} from 'react'

import { TOPICS } from '../utils/topics'
import { useContext } from 'react'
import { AHP2PContext } from '../AHP2PProvider'
import { multiaddr } from '@multiformats/multiaddr'
import type { PubSubMessageEvent } from '../../../types/orbitdb'

export const useSubPeerList = () => {
  const { orbit } = useContext(AHP2PContext)
	const [peerList, setPeerList] = useState<Record<string, string>>({})

	const subPeerList = useCallback(async () => {
		if (!orbit?.ipfs) return

		return new Promise<Record<string, string>>((resolve) => {
			const peerListListener = async (evt: PubSubMessageEvent) => {
				const { topic, data } = evt.detail
				if (topic === TOPICS.PEER_LIST) {
					const peerListJson: Record<string, string> = JSON.parse(new TextDecoder().decode(data))
					console.log('Peer list', peerListJson)
					delete peerListJson[orbit.ipfs.libp2p.peerId.toString()]
					setPeerList(peerListJson)

					// Dial WebRTC connections to peers
					for (const [peerId, webrtcMultiaddr] of Object.entries(peerListJson)) {
						console.log('Dialing WebRTC connection to peer:', peerId)
						try {
							await orbit.ipfs.libp2p.dial(multiaddr(webrtcMultiaddr))
							console.log('Successfully established WebRTC connection to:', peerId)
						} catch (error) {
							console.error('Failed to dial WebRTC connection to', peerId, error)
						}
					}

					resolve(peerListJson)
				}
			}
			orbit.ipfs.libp2p.services.pubsub.addEventListener('message', peerListListener)
			orbit.ipfs.libp2p.services.pubsub.subscribe(TOPICS.PEER_LIST)
			orbit.ipfs.libp2p.services.pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())
		})
	}, [orbit])

	return {
		peerList,
		subPeerList
	}
}
