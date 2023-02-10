
import {useState,useEffect,useCallback} from 'react'

import { useWeb3React } from '@web3-react/core'

import { EIP712DOMAIN, AuctionAuthSig, Auction, Bid } from '@/hooks/type-hashes'
import {ethers} from 'ethers'

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


export const useCreateAuction = (auction)=> {
  const { account, provider, chainId } = useWeb3React()

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

  return {
    auctionData,
    connection,
    roomKey,
    createAuction,
    defineNetwork,
    publishAuction
  }
}
