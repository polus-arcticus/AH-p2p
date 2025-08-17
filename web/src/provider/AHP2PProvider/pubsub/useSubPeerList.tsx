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
        
        // Only handle peer-related topics, ignore OrbitDB replication messages
        if (topic === TOPICS.PEER_LIST) {
          console.log('📡 Peer list topic:', topic)
          console.log('📡 Peer list data:', data)
          
          try {
            const peerListJson: Record<string, string> = JSON.parse(new TextDecoder().decode(data))
            delete peerListJson[orbit.ipfs.libp2p.peerId.toString()]
            console.log('Peer list received from hub:', peerListJson)
            // Store peer directory without connecting immediately
            // Connections will be established on-demand when entering auction rooms
            console.log('Updated peer directory. Available peers:', Object.keys(peerListJson).length)
            setPeerList(peerListJson)

            resolve(peerListJson)
          } catch (error) {
            console.warn('Failed to parse peer list data:', error)
          }
        }
        // Ignore all other topics (including OrbitDB replication messages)
      }
      const { pubsub } = orbit.ipfs.libp2p.services
      peerListListenerRef.current = listener
      pubsub.addEventListener('message', listener)
      
      // Subscribe only to PEER_LIST (hub will send us updates)
      pubsub.subscribe(TOPICS.PEER_LIST)
      
      // Announce ourselves to the hub and request current peer list
      pubsub.publish(TOPICS.PEER_ANNOUNCE, new TextEncoder().encode(JSON.stringify({
        peerId: orbit.ipfs.libp2p.peerId.toString(),
        multiaddrs: selfAddress.toString()
      })))
      pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())
      orbit.ipfs.libp2p.addEventListener('peer:disconnect', (evt) => {
        console.log('Disconnected from peer:', evt.detail)
        console.log('tostring', evt.detail.toString())
        delete peerList[evt.detail.toString()]
        setPeerList({ ...peerList })
      })
    })
  }, [orbit])

  const unSubPeerList = useCallback(() => {
    if (!orbit?.ipfs || !peerListListenerRef.current) return
    const { pubsub } = orbit.ipfs.libp2p.services
    pubsub.unsubscribe(TOPICS.PEER_LIST)
    pubsub.removeEventListener('message', peerListListenerRef.current)
    peerListListenerRef.current = null
  }, [orbit])

  return {
    peerList,
    subPeerList,
    unSubPeerList
  }
}
