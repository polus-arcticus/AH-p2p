import {useState,useEffect,useCallback} from 'react'

import { useWeb3React } from '@web3-react/core'

import { EIP712DOMAIN, AuctionAuthSig, Auction, Bid } from './type-hashes'
import {ethers} from 'ethers'

import * as IPFS from 'ipfs-core'
import Room from '@/pubsub/index'
import decoding from '@/pubsub/decoding'
import {
  getEnglishAuction,
  getAuction,
  getAuctions,
  getKeyMap,
  setAuctionCompleted,
  parseAuctionForSig,
  parseBidForSig,
  parseConsumeForSig,
} from '@/hooks/utils'

export const useCreateAuction = (auction)=> {
  const [auctionData, setAuctionData] = useState({
    auctioneer: '',
    auctioneerNonce: '',
    nft: '',
    nftId: '0',
    token: '',
    bidStart: '0',
    deadline: new Date(),
    bids: [],
    bidSigs: []
  })
  const [connection, setConnection] = useState({connection: 'ipfs-localstorage'})
  const [roomKey, setRoomKey] = useState(null)

  //const [chain, setChain] = useState(null)
  const [contract, setContract] = useState(null)
  const { account, provider, chainId } = useWeb3React()

  const fetchEnglishAuction = useCallback(() =>{
    const englishAuction = getEnglishAuction(provider)
    setContract(englishAuction)
  }, [])

  const createAuction = useCallback(async (data) => {
    const englishAuction = getEnglishAuction(provider)

    let domain = {
      name:  'EnglishAuction',
      version: '1',
      chainId: chainId,
      verifyingContract: englishAuction.address
    }
    let initAuction = {
      auctioneer: data.auctioneer,
      auctioneerNonce: (await englishAuction.usedNonces(account)).toString(),
      nft: data.nft,
      nftId: data.nftId,
      token: data.token,
      bidStart: data.bidStart,
      deadline: data.deadline
    }
    const parsedInitAuction = parseAuctionForSig(initAuction)
    const signer = provider.getSigner()
    const auctionSigHash = ethers.utils.keccak256(await signer._signTypedData(
      domain,
      { AuctionAuthSig },
      parsedInitAuction
    ))
    let auction ={
      ...initAuction,
      auctionSigHash: auctionSigHash,
      bids: [],
      bidSigs: []
    }
    setAuctionData(auction)


  }, [account, provider])

  const defineNetwork = useCallback((connectionChoice) => {
    setConnection({connection: connectionChoice})
  }, [])

  const publishAuction = useCallback(() => {
    // roomkey = auctioneer-nft-nftid-token-startBid-deadline-authSig

    const roomKey = `${auctionData.auctionSigHash}`
    const keyMap = JSON.parse(localStorage.getItem(AUCTIONS_KEY_MAP)) || []
    keyMap.push(roomKey)
    localStorage.setItem(AUCTIONS_KEY_MAP, JSON.stringify(keyMap))
    localStorage.setItem(roomKey, JSON.stringify({auctionData, connection, completed: false}))
    setRoomKey(roomKey)
    return roomKey

  }, [auctionData])

  return { auctionData, connection, roomKey, createAuction, defineNetwork, publishAuction }
}

export const useAuctions = ({defaultRoomKey=null,defaultFilter=null}={}) => {
  const [keyMap, setKeyMap] = useState(getKeyMap())
  const [auctions, setAuctions] = useState(getAuctions(getKeyMap()))
  const [auction, setAuction] = useState(defaultRoomKey ? getAuction(defaultRoomKey): {})


  const fetchAuctions = useCallback((filter=defaultFilter,sort=null) => {
    const storage = getAuctions(getKeyMap())
    if (filter) {
      const {filterKey, filterValue} = filter
      setAuctions(storage.filter((item) => {
        return item[filterKey] == filterValue
      }))
    } else {
      setAuctions(getAuctions(getKeyMap()))
    }

  },[])
  useEffect(() => {
    fetchAuctions()
  },[])
  return {auctions, keyMap, fetchAuctions}
}



export const useIpfsAuctionsRoom = () => {
  const [ipfsAuctions, setIpfsAuctions] = useState([])
  const [ipfsAuctionsKeyMap, setIpfsAuctionsKeyMap] = useState([])
  const [ipfsAuctionsPeerCount, setIpfsAuctionsPeerCount] =useState(0)
  const [room, setRoom] = useState({
    leave: () => null,
    broadcast: () => null
  })
  const [peers ,setPeers] = useState({})


  const fetchIpfsAuctions = useCallback(async () => {
    const instance = await IPFS.create({
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
    const roomInstance = new Room(instance, 'active-auctions-room')

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
          const localKeyMap = getKeyMap()
          const remoteKeyMap = payload.keyMap
          remoteKeyMap.forEach((remoteRoomKey, i) => {
            console.log(remoteRoomKey)
            const localAuction = localStorage.getItem(remoteRoomKey) || false
            console.log('local auction', localAuction)
            // i
            if (!localAuction) {
              console.log('!localAuction == true')
              localStorage.setItem(remoteRoomKey, JSON.stringify(payload.auctions[i]))
              localKeyMap.push(remoteRoomKey)
              localStorage.setItem(AUCTIONS_KEY_MAP, JSON.stringify(localKeyMap))
              setIpfsAuctionsKeyMap(old => [...old, remoteRoomKey])
              setIpfsAuctions(old => [...old, payload.auctions[i]])
            } 
          })
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
        const localKeyMap = getKeyMap()
        const localAuctions = getAuctions(localKeyMap).filter((auction) => auction.completed == false)
        console.log('localAuctions', localAuc)
        if (localAuctions) {
          await roomInstance.broadcast(JSON.stringify({message: 'new-peer-auctions', auctions: localAuctions, keyMap:localKeyMap }))
        }

      } catch (e) {
        console.log(e)
      }
    })
    setRoom(roomInstance)
  }, [])

  const broadcastExistence = useCallback(() => {
      const localKeyMap = getKeyMap()
      const localAuctions = getAuctions(localKeyMap).filter((auction) => auction.completed == false)
      room.broadcast(JSON.stringify({
        message: 'new-peer-auctions',
        auctions: localAuctions,
        keyMap:localKeyMap
      }))
  }, [room])

  useEffect(() => {
    fetchIpfsAuctions()
  }, [])

  return {
    ipfsAuctions,
    ipfsAuctionsKeyMap,
    ipfsAuctionsPeerCount,
    fetchIpfsAuctions,
    broadcastExistence
  }
}
