import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef
} from 'react'

import { TOPICS } from '../utils/topics'
import { multiaddr } from '@multiformats/multiaddr'
import type { OrbitDB } from '@orbitdb/core'
import type { Multiaddr } from '@multiformats/multiaddr'

type PubSubMessageEvent = CustomEvent<{ topic: string; data: Uint8Array }>

export const useSubPeerList = (orbit: OrbitDB | null) => {
  const [peerList, setPeerList] = useState<Record<string, string>>({})
  const peerListListenerRef = useRef<((evt: PubSubMessageEvent) => Promise<void>) | null>(null)

  const subPeerList = useCallback(async (selfAddress: Multiaddr) => {
    console.log('subPeerList')
    console.log('orbit', orbit)
    console.log('orbit?.ipfs', orbit?.ipfs)

    if (!orbit?.ipfs) return

    return new Promise<Record<string, string>>((resolve) => {
      const listener = async (evt: PubSubMessageEvent) => {
        const { topic, data } = evt.detail
        console.log('topic', topic)
        console.log('data', data)
        
        if (topic === TOPICS.PEER_LIST) {
          const peerListJson: Record<string, string> = JSON.parse(new TextDecoder().decode(data))
          delete peerListJson[orbit.ipfs.libp2p.peerId.toString()]
          setPeerList(peerListJson)
          console.log('Peer list received from hub:', peerListJson)

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

      peerListListenerRef.current = listener
      orbit.ipfs.libp2p.services.pubsub.addEventListener('message', listener)
      
      // Subscribe only to PEER_LIST (hub will send us updates)
      orbit.ipfs.libp2p.services.pubsub.subscribe(TOPICS.PEER_LIST)
      
      // Announce ourselves to the hub and request current peer list
      orbit.ipfs.libp2p.services.pubsub.publish(TOPICS.PEER_ANNOUNCE, new TextEncoder().encode(JSON.stringify({
        peerId: orbit.ipfs.libp2p.peerId.toString(),
        multiaddrs: selfAddress.toString()
      })))
      orbit.ipfs.libp2p.services.pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())
    })
  }, [orbit])

  const unSubPeerList = useCallback(() => {
    if (!orbit?.ipfs || !peerListListenerRef.current) return

    orbit.ipfs.libp2p.services.pubsub.unsubscribe(TOPICS.PEER_LIST)
    orbit.ipfs.libp2p.services.pubsub.removeEventListener('message', peerListListenerRef.current)
    peerListListenerRef.current = null
  }, [orbit])

  return {
    peerList,
    subPeerList,
    unSubPeerList
  }
}
