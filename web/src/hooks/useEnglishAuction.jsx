import {useState,useEffect,useCallback} from 'react'

import { useWeb3React } from '@web3-react/core'

import { EIP712DOMAIN, AuctionAuthSig, Auction, Bid } from './type-hashes'
import {ethers} from 'ethers'

import * as IPFS from 'ipfs-core'
import Room from '@/pubsub/index'
import decoding from '@/pubsub/decoding'
import {
  AUCTIONS_KEY_MAP,
  getEnglishAuction,
  getAuction,
  getAuctions,
  getAuctionsKeyMap,
  setAuctionCompleted,
  parseAuctionForSig,
  parseBidForSig,
  parseConsumeForSig,
} from '@/hooks/utils'
import {useIpfs} from '@/hooks/useIpfs'
export const useIpfsAuctionsRoom = () => {
  const {ipfs, error, starting} = useIpfs()
  const [roomStatus, setRoomStatus] = useState(false)
  const [ipfsAuctions, setIpfsAuctions] = useState([])
  const [ipfsAuctionsKeyMap, setIpfsAuctionsKeyMap] = useState([])
  const [ipfsAuctionsPeerCount, setIpfsAuctionsPeerCount] =useState(0)
  const [room, setRoom] = useState(null)
  const [peers ,setPeers] = useState({})

  const fetchIpfsAuctions = useCallback(async () => {
    const roomInstance = new Room(ipfs, 'active-auctions-room')
    console.log('roomInstance', roomInstance)
    roomInstance.on('peer joined', (peer) => {
      console.log('Peer joined the room', peer, ipfsAuctionsPeerCount)
      if (!peers[peer]) {
        peers[peer] = true
        setPeers(old => {
          old[peer] = true
          return old
        })
        setIpfsAuctionsPeerCount(old => old + 1)
      } else {
        console.log('peer join oversent')
        console.log('test')
      }
    })

    roomInstance.on('message', (msg) => {
      console.log('message received', msg)
      const payload = JSON.parse(decoding(msg.data))
      console.log('payload', payload)
      switch (payload.message) {
        case 'new-peer-auctions':
          const localKeyMap = getAuctionsKeyMap()
          const remoteKeyMap = payload.keyMap
          remoteKeyMap.forEach((remoteRoomKey, i) => {
            console.log(remoteRoomKey)
            const localAuction = localStorage.getItem(remoteRoomKey) || false
            console.log('local auction', localAuction)
            if (!localAuction) {
              console.log('!localAuction == true')
              localKeyMap.push(remoteRoomKey)
              localStorage.setItem(remoteRoomKey, JSON.stringify(payload.auctions[i]))
              setIpfsAuctionsKeyMap(old => [...old, remoteRoomKey])
              setIpfsAuctions(old => [...old, payload.auctions[i]])
            } 
          })
          localStorage.setItem(AUCTIONS_KEY_MAP, JSON.stringify(localKeyMap))
      }
    })

    roomInstance.on('peer left', (peer) => {
      console.log('Peer left...', peer)
      if (peers[peer]) {
        peers[peer] = false
        setPeers(old => {
          old[peer] = false
          return old
        })
        setIpfsAuctionsPeerCount(old => old - 1)
      }
    })

    // now started to listen to room
    roomInstance.on('subscribed', async () => {
      console.log('Now connected!')
      try {
        const localKeyMap = getAuctionsKeyMap()
        const localAuctions = getAuctions(localKeyMap).filter((auction) => auction.completed == false)
        console.log('localAuctions', localAuc)
        if (localAuctions) {
          await roomInstance.broadcast(JSON.stringify({message: 'new-peer-auctions', auctions: localAuctions, keyMap:localKeyMap }))
        }

      } catch (e) {
        console.log(e)
      }
    })
    console.log('setting room instance')
    setRoom(roomInstance)
    setRoomStatus(true)
  }, [ipfs])

  const broadcastExistence = useCallback(async () => {
    console.log('insidebroadcast exist')
    if (room) {
      const localKeyMap = getAuctionsKeyMap()
      const localAuctions = getAuctions(localKeyMap).filter((auction) => auction.completed == false)
      console.log('b4 broadcast')
      await room.broadcast(JSON.stringify({
        message: 'new-peer-auctions',
        auctions: localAuctions,
        keyMap:localKeyMap
      }))
    }
  }, [room])

  useEffect(() => {
    if (room) {
      const interval = setInterval(() => {
        console.log('Broadcasting auctiondata: This will be called every 5 seconds');
        broadcastExistence()
        
      }, 5*1000);
      return () => {
        clearInterval(interval)
        if (room) room.leave()
      }
    }
  }, [room])

  useEffect(() => {
    console.log('starting', starting)
    console.log('fetching ipfs auctions room-ipfs')
    if (starting) {
      console.log('ipfs not yet started')
    } else {
      fetchIpfsAuctions()
    }
  }, [starting])

  return {
    ipfsAuctions,
    ipfsAuctionsKeyMap,
    ipfsAuctionsPeerCount,
    fetchIpfsAuctions,
    broadcastExistence,
    roomStatus
  }
}
