import { useState, useEffect } from 'react'

import { Container } from '@chakra-ui/react'

import { useAuctionRoom } from '@/hooks/useEnglishAuction'
import {useWeb3React} from '@web3-react/core'
import {useNft, useTokenAllowance} from '@/hooks/useExamples'

import {useParams} from 'react-router-dom'

import  {BasicStatistics} from './BasicStatistics'

export const Auction = () => {
  const {account} = useWeb3React()

  const {
    allowance:nftAllowance,
    fetchAllowance:fetchNftAllowance,
    createAllowance: createNftAllowance
  } = useNft()

  const {
    allowance:tokenAllowance,
    fetchAllowance:fetchTokenAllowance,
    createAllowance: createTokenAllowance
  } = useTokenAllowance()

  const params = useParams()

  const {
    bidCount,
    auction,
    highBid,
    room,
    peerCount,
    submitBid,
    submitAuction,
  } = useAuctionRoom(params.roomKey)

  const handleSubmitBid = async (value) => {
    console.log(value)
    await submitBid(value)
  }
  const handleSubmitAuction = async () => {
    await submitAuction()
  }
  const handleApproveNft = async () => {
    await createNftAllowance(auction.nft)
  }
  const handleApproveToken = async () => {
    await createTokenAllowance(auction.token)
  }

  useEffect(() => {
    if (account && auction) {
      fetchNftAllowance(auction.nft)
      fetchTokenAllowance(auction.token)

    }
  }, [account])

  return (
    <Container maxW={"6xl"}>
      <BasicStatistics
        account={account}
        nftAllowance={nftAllowance}
        tokenAllowance={tokenAllowance}
        highBid={highBid}
        bidCount={bidCount}
        handleSubmitBid={handleSubmitBid}
        handleSubmitAuction ={handleSubmitAuction}
        handleApproveNft={handleApproveNft}
        handleApproveToken={handleApproveToken}
        auction={auction}
        peerCount={peerCount}
      />
    </Container>
  )
}
