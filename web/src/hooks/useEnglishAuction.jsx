import {useState,useEffect,useCallback} from 'react'

import { useWeb3React } from '@web3-react/core'

import { getEnglishAuction } from './utils'
import { EIP712DOMAIN, AuctionAuthSig, Auction, Bid } from './type-hashes'
import {ethers} from 'ethers'

const AUCTIONS_KEY_MAP = 'AuctionsKeyMap'; // this semi colon was important to stringify

function parseAuctionForSig(auction) {
  let parsedAuction = Object.assign({}, auction)
  parsedAuction.bidStart = ethers.utils.formatUnits(auction.bidStart, 0)
  parsedAuction.deadline = Math.floor(auction.deadline.getTime() / 1000)
  return parsedAuction

}

export const useCreateAuction = (auction)=> {
  const [auctionData, setAuctionData] = useState({
    auctioneer: '',
    nft: '',
    nftId: 0,
    token: '',
    bidStart: 0,
    deadline: new Date(),
    bids: [],
    bidSigs: []
  })
  const [networkParams, setNetworkParams] = useState({
    host: '',
    storage: ''
  })
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
      nft: data.nft,
      nftId: data.nftId,
      token: data.token,
      bidStart: data.bidStart,
      deadline: data.deadline
    }
    const parsedInitAuction = parseAuctionForSig(initAuction)
    const signer = provider.getSigner()
    console.log(signer)
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

  const defineNetwork = useCallback((hostChoice, networkChoice) => {
    setNetworkParams({host:hostChoice, storage:networkChoice})
  }, [])

  const publishAuction = useCallback(() => {
    // roomkey = auctioneer-nft-nftid-token-startBid-deadline-authSig

    const roomKey = `${auctionData.auctionSigHash}`
    const keyMap = JSON.parse(localStorage.getItem(AUCTIONS_KEY_MAP)) || []
    keyMap.push(roomKey)
    localStorage.setItem(AUCTIONS_KEY_MAP, JSON.stringify(keyMap))
    localStorage.setItem(roomKey, JSON.stringify({auctionData, networkParams}))
    setRoomKey(roomKey)
    return roomKey

  }, [auctionData])

  return { auctionData, networkParams, roomKey, createAuction, defineNetwork, publishAuction }
}

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
export const useAuctions = (defaultRoomKey=null) => {
  const [keyMap, setKeyMap] = useState(getKeyMap())
  const [auctions, setAuctions] = useState(getAuctions(keyMap))
  const [auction, setAuction] = useState(defaultRoomKey ? getAuction(defaultRoomKey): {})


  const fetchAuctions = useCallback((filter,sort) => {
    setAuctions(getAuction()())
  },[])

  const fetchAuction = useCallback((roomKey) => {
    setAuction(getAuction(roomKey))
  },[])


  return {auction, auctions, keyMap, fetchAuction, fetchAuctions}
}
