import {useState,useEffect,useCallback} from 'react'

import { useWeb3React } from '@web3-react/core'

import { getEnglishAuction } from './utils'
import { EIP712DOMAIN, AuctionAuthSig, Auction, Bid } from './type-hashes'
import {ethers} from 'ethers'

import * as IPFS from 'ipfs-core'
import Room from '@/pubsub/index'
import decoding from '@/pubsub/decoding'
const AUCTIONS_KEY_MAP = 'AuctionsKeyMap'; // this semi colon was important to stringify
const getKeyMap = () => {
  return JSON.parse(localStorage.getItem(AUCTIONS_KEY_MAP)) || []; 
}
const getAuctions = (keyMap) => {
  const auct = keyMap.map((key, i) => {
    return JSON.parse(localStorage.getItem(key)) || [];
  })
  return auct
}
const getAuction = (roomKey) => {
  return JSON.parse(localStorage.getItem(roomKey))
}

const setAuctionCompleted = (roomKey) => {
  const auction = getAuction(roomKey)
  auction.completed = true
  localStorage.setItem(roomKey, JSON.stringify(auction))
}

function parseAuctionForSig(auction) {
  let parsedAuction = Object.assign({}, auction)
  parsedAuction.bidStart = ethers.utils.parseUnits(auction.bidStart, 'ether')
  parsedAuction.deadline = Math.floor(auction.deadline.getTime() / 1000)
  return parsedAuction

}
function parseBidForSig(bid) {
  let parsedBid = Object.assign({}, bid)
  parsedBid.amount = ethers.utils.parseUnits(bid.amount, 'ether')
  return parsedBid
}

function parseConsumeForSig(roomKey) {
  const {auctionData, connection}= getAuction(roomKey)
  auctionData.deadline = Math.floor(new Date(auctionData.deadline).getTime() / 1000)
  // merge bidsigs into bids array
  auctionData.bids = auctionData.bids.map((bid, i) => {
    bid.bidSig = auctionData.bidSigs[i]
    return bid
  })
  // sort with them inside
  auctionData.bids = auctionData.bids.sort((a,b) => Number(b.amount) - Number(a.amount))
  // take them back into bidSig array order of sorted
  auctionData.bidSigs = auctionData.bids.map((bid) => {
    return bid.bidSig
  })
  auctionData.bids = auctionData.bids.map((bid) => {
    bid.amount = ethers.utils.parseUnits(bid.amount, 'ether')
    return bid
  })
  return auctionData

} 

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


export const useAuctionRoom = (defaultRoomKey=null) => {
  const { broadcastExistence } = useIpfsAuctionsRoom()
  const { account, provider, chainId } = useWeb3React()
  const [auction, setAuction] = useState(null)
  const [network, setNetwork] = useState(null)
  const [bidCount, setBidCount] =useState(null)
  const [highBid, setHighBid] = useState(null)
  const [bids, setBids] = useState(null)
  const [bidSigs, setBidSigs] = useState(null)

  const [roomKey, setRoomKey] = useState(defaultRoomKey)
  const [room, setRoom] = useState({leave: () => null})
  const [ipfs, setIpfs] = useState({})
  const [peers ,setPeers] = useState({})
  const [peerCount, setPeerCount] = useState(0)

  const fetchAuction = useCallback((roomKey) => {
    const auctionData = getAuction(roomKey)
    setAuction(auctionData.auctionData)
    setNetwork(auctionData.connection)
  },[auction])

  const fetchRoom = useCallback(async (newRoomKey=null) => {
    const key = newRoomKey ? newRoomKey: roomKey
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
    const roomInstance = new Room(instance, key)

    roomInstance.on('peer joined', (peer) => {
      console.log('Peer joined the room', peer, peerCount)
      if (!peers[peer]) {
        peers[peer] = true
        setPeers(old => {
          old[peer] = true
          return old
        })
        setPeerCount(old => old + 1)
      } else {
        console.log('peer join oversent')
        console.log('test')
      }
    })

    roomInstance.on('message', (msg) => {
      console.log('message received', msg)
      const payload = JSON.parse(decoding(msg.data))
      switch (payload.message) {
        case 'bid':

          const auct = JSON.parse(localStorage.getItem(roomKey))
          auct.auctionData.bids.push(payload.bid)
          auct.auctionData.bidSigs.push(payload.bidSig)
          localStorage.setItem(roomKey, JSON.stringify(auct))
          setBids(old => [...old, payload.bid])
          setBidSigs(old => [...old, payload.bidSig])
          setBidCount(old => old + 1)
          if (payload.bid.amount > highBid) {
            setHighBid(payload.bid.amount)
          }

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
        setPeerCount(old => old - 1)
      }
    })

    // now started to listen to room
    roomInstance.on('subscribed', () => {
      console.log('Now connected!')
      broadcastExistence()
    })
    setRoom(roomInstance)
    setRoomKey(key)
    setIpfs(instance)
  },[auction])

  const leaveRoom = useCallback(async() => {
    console.log('called leaveroom', room)
    return await room.leave()
  }, [room])

  const submitBid = useCallback(async (amount) => {
    const englishAuction = getEnglishAuction(provider)
    try {
      const latestNonce = (await englishAuction.usedNonces(account)).toString()
      let domain = {
        name:  'EnglishAuction',
        version: '1',
        chainId: chainId,
        verifyingContract: englishAuction.address
      }
      let initBid = {
        bidder: account,
        amount: amount,
        bidderNonce: latestNonce,
        auctionSigHash: roomKey
      }
      const parsedInitBid = parseBidForSig(initBid)
      const signer = provider.getSigner()
      const bidSig = await signer._signTypedData(
        domain,
        { Bid },
        parsedInitBid
      )
      await room.broadcast(JSON.stringify({message: 'bid', bid: initBid, bidSig: bidSig}))
      // Makes more sense for auction to do a sendTo(peer, message)
    } catch (e) {
      console.log(e)
      console.log('failed to retreive usedNonces')
    }
  }, [provider, account, room, chainId])

  const submitAuction = useCallback(async () => {
    console.log('submit auction')
    const signer = provider.getSigner()
    const contract = getEnglishAuction(signer)

    const domain = {
      name:  'EnglishAuction',
      version: '1',
      chainId: chainId,
      verifyingContract: contract.address
    }
    const digest = parseConsumeForSig(roomKey)
    const auctionSig = await signer._signTypedData(
      domain,
      { Auction, Bid },
      digest
    )
    const auctionSigNo0x = auctionSig.substring(2)
    const r = '0x' + auctionSigNo0x.substring(0,64);
    const s = '0x' + auctionSigNo0x.substring(64,128);
    const v = parseInt(auctionSigNo0x.substring(128,130), 16)

    try {
      const tx = await contract.consumeAuction(v,r,s,digest)
      console.log('tx', tx)
      const receipt = await tx.wait(1)
      console.log('receipt', receipt)
      setAuctionCompleted(roomKey)
    } catch (e) {
      console.log(e)
      return
    }
  }, [account,provider,room])

  useEffect(() => {
    let initAuct = {}
    let initNetwork = {}
    let initBidCount = 0;
    let initHighBid = 0;
    let initBids = [];
    let initBidSigs = []
    if (defaultRoomKey) {
      const {
        auctionData:initAuct,
        connection: initNetwork
      } = getAuction(defaultRoomKey)
      initBidCount = initAuct.bids.length
      initHighBid = initAuct.bids.length ?
        (initAuct.bids.reduce((a,b) => {
          return (a.amount > b.amount) ? a : b
        }).amount):
        initAuct.bidStart
      initBids = initAuct.bids
      initBidSigs = initAuct.bidSigs
      setAuction(initAuct)
      setNetwork(initNetwork)
      setBidCount(initBidCount)
      setHighBid(initHighBid)
      setBids(initBids)
      setBidSigs(initBidSigs)
    }
    fetchRoom(defaultRoomKey)
    return function cleanup() {
      //leaveRoom()
    }
  }, [])
  return {
    fetchRoom:fetchRoom,
    auction:auction,
    room:room,
    ipfs:ipfs,
    peers:peers,
    peerCount:peerCount,
    highBid:highBid,
    bidCount:bidCount,
    submitBid:submitBid,
    submitAuction:submitAuction,
    leaveRoom:leaveRoom
  }
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
            const localAuction = localStorage.getItem(remoteRoomKey) || null
            console.log('local auction', localAuction)
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

  const broadcastExistence = useCallback(async () => {
      const localKeyMap = getKeyMap()
      const localAuctions = getAuctions(localKeyMap).filter((auction) => auction.completed == false)
      setInterval(async () => {
        console.log('trying to send auction')
        await room.broadcast(JSON.stringify({
          message: 'new-peer-auctions',
          auctions: localAuctions,
          keyMap:localKeyMap
        }))
      }, 15*1000)

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
