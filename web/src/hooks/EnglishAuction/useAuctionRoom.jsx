import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import { useIpfsAuctionsRoom } from '@/hooks/useEnglishAuction'
import { useWeb3React } from '@web3-react/core'
import Room from '@/pubsub/index'
import decoding from '@/pubsub/decoding'
import {
  AUCTIONS_KEY_MAP,
  ARCHIVES_KEY_MAP,
  getKeyMap,
  getEnglishAuction,
  getAuction,
  getAuctions,
  getAuctionsKeyMap,
  getArchivesKeyMap,
  setAuctionCompleted,
  parseAuctionForSig,
  parseBidForSig,
  parseConsumeForSig,
} from '@/hooks/utils'
import { EIP712DOMAIN, AuctionAuthSig, Auction, Bid } from '@/hooks/type-hashes'
import { useIpfs } from '@/hooks/useIpfs'
export const useAuctionRoom = ({defaultRoomKey=null}= {}) => {
  const toast = useToast()
  const {ipfs, errors, starting} = useIpfs()
  const [isComplete, setIsComplete] = useState(false)
  const { broadcastExistence } = useIpfsAuctionsRoom()
  const { account, provider, chainId } = useWeb3React()
  const [auction, setAuction] = useState(null)
  const [network, setNetwork] = useState(null)
  const [bidCount, setBidCount] =useState(null)
  const [highBid, setHighBid] = useState(null)
  const [bids, setBids] = useState(null)
  const [bidSigs, setBidSigs] = useState(null)

  const [roomKey, setRoomKey] = useState(defaultRoomKey)
  const [room, setRoom] = useState({leave: () => null, broadcast: () => null})
  const [peers ,setPeers] = useState({})
  const [peerCount, setPeerCount] = useState(0)

  const fetchAuction = useCallback((roomKey) => {
    const auct = getAuction(roomKey)
    setIsComplete(auct.completed)
    console.log('completed', auct.completed)
    setAuction(auct.auctionData)
    setNetwork(auct.connection)
  },[auction])

  const fetchRoom = useCallback(async (newRoomKey=null) => {
    const key = newRoomKey ? newRoomKey: roomKey
    console.log('ipfs::fetchroom', ipfs)
    const roomInstance = new Room(ipfs, key)
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
      const auct = getAuction(roomKey)
      switch (payload.message) {
        case 'new-bid':
          auct.auctionData.bids.push(payload.bid)
          auct.auctionData.bidSigs.push(payload.bidSig)
          localStorage.setItem(roomKey, JSON.stringify(auct))
          setBids(old => [...old, payload.bid])
          setBidSigs(old => [...old, payload.bidSig])
          setBidCount(old => old + 1)
          if (payload.bid.amount > highBid) {
            setHighBid(payload.bid.amount)
          }
          
          toast({
            status: 'success',
            title: 'New Bid Detected!',
            description: 'Adding new bid to the permit chain',
            duration: 9000,
            isClosable: true
          })
          break
        case 'bids':
          const localBidSigs = auct.auctionData.bidSigs
          const remoteBidSigs = payload.bidSigs
          remoteBidSigs.forEach((rbs, i) => {
            if (localBidSigs.find((lbs) => lbs == rbs )) {
              console.log('local bid found')
            } else {
              auct.auctionData.bids.push(payload.bids[i])
              auct.auctionData.bidSigs.push(payload.bidSigs[i])
            }
          })
          localStorage.setItem(roomKey, JSON.stringify(auct))
          setBids(auct.auctionData.bids)
          setBidSigs(auct.auctionData.bidSigs)
          setBidCount(auct.auctionData.bids.length)
          let highest
          if (auct.auctionData.bids.length > 1) {
            highest = auct.auctionData.bids.sort((a,b) => Number(b.amount) - Number(a.amount))[0].amount
          } else {
            highest = auct.auctionData.bidStart
          }
          console.log('highest', highest)
          setHighBid(highest)
          toast({
            status: 'success',
            title: 'Bids!',
            description: 'New Auctions Detected',
            duration: 9000,
            isClosable: true
          })
          break
        case 'auction-complete':
          console.log('payload.receipt', payload.receipt)
          auct.receipt = payload.receipt
          auct.completed = true
          localStorage.setItem(roomKey, JSON.stringify(auct))
          let auctionsKeyMap =  getKeyMap(AUCTIONS_KEY_MAP)
          let archivesKeyMap =  getKeyMap(ARCHIVES_KEY_MAP)
          auctionsKeyMap = auctionsKeyMap.filter(key => key !== payload.roomKey)
          archivesKeyMap.push(payload.roomKey)

          localStorage.setItem(AUCTIONS_KEY_MAP, JSON.stringify(auctionsKeyMap))
          localStorage.setItem(ARCHIVES_KEY_MAP, JSON.stringify(archivesKeyMap))
          setIsComplete(true)
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
  },[auction, ipfs])

  const leaveRoom = useCallback(async() => {
    console.log('called leaveroom', room)
    return await room.leave()
  }, [room])

  const submitBid = useCallback(async (amount) => {
    const auct = getAuction(roomKey)
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
      auct.auctionData.bids.push(initBid)
      auct.auctionData.bidSigs.push(bidSig)
      localStorage.setItem(roomKey, JSON.stringify(auct))
      await room.broadcast(JSON.stringify({message: 'new-bid', bid: initBid, bidSig: bidSig}))
      // Makes more sense for auction to do a sendTo(peer, message)
    } catch (e) {
      console.log(e)
      console.log('failed to retreive usedNonces')
      return false
    }
      return true
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
      room.broadcast(JSON.stringify({message:'auction-complete', roomKey: roomKey, receipt: receipt}))
      /*
      const auct = getAuction(roomKey)
      auct.completed = true
      localStorage.setItem(roomKey, JSON.stringify(auct))
      let auctionsKeyMap =  getKeyMap(AUCTIONS_KEY_MAP)
      let archivesKeyMap =  getKeyMap(ARCHIVES_KEY_MAP)
      auctionsKeyMap = auctionsKeyMap.filter(key => key !== roomKey)
      archivesKeyMap.push(roomKey)

      localStorage.setItem(AUCTIONS_KEY_MAP, JSON.stringify(auctionsKeyMap))
      localStorage.setItem(ARCHIVES_KEY_MAP, JSON.stringify(archivesKeyMap))
      */
    } catch (e) {
      console.log(e)
      return false
    }
      return true
  }, [account,provider,room])

  const broadcastBids = useCallback(async() => {
    const auction = getAuction(roomKey)
    console.log(auction)
    await room.broadcast(JSON.stringify({message: 'bids', bids: auction.auctionData.bids, bidSigs:auction.auctionData.bidSigs }))
  }, [room])

  useEffect(() => {
    let initAuct = {}
    let initNetwork = {}
    let initBidCount = 0;
    let initHighBid = 0;
    let initBids = [];
    let initBidSigs = []
    if (defaultRoomKey) {
      const {
        completed: initCompleted,
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
      setIsComplete(initCompleted)
      setAuction(initAuct)
      setNetwork(initNetwork)
      setBidCount(initBidCount)
      setHighBid(initHighBid)
      setBids(initBids)
      setBidSigs(initBidSigs)
    }
    return function cleanup() {
      room.leave()
    }
  }, [])

  useEffect(() => {
    if (room && !isComplete) {
      const interval = setInterval(() => {
        console.log('Broadcasting auctiondata: This will be called every 100 seconds');
        broadcastBids()
        
      }, 100*1000);
      return () => {
        clearInterval(interval)
        if (room) room.leave()
      }
    }
  }, [isComplete, room])

  useEffect(() => {
    if (starting && !isComplete) {
      console.log('ipfs not yet started')
    } else {
      fetchRoom()
    }
    return () => {
      console.log('trying to leave room')
      if (room) room.leave()
    }
  }, [starting])
  return {
    isComplete:isComplete,
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
