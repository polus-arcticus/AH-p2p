import { useState, useEffect } from 'react'
import { useAuctionRoom } from '@/hooks/useEnglishAuction'
import {useParams} from 'react-router-dom'
import  {BasicStatistics} from './BasicStatistics'
import { Container } from '@chakra-ui/react'
export const Auction = () => {
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
  console.log('auc', auction)
  const handleSubmitBid = async (value) => {
    console.log(value)
    await submitBid(value)
  }
  const handleSubmitAuction = async () => {
    await submitAuction()
  }

  return (
    <Container maxW={"6xl"}>
      <BasicStatistics
        highBid={highBid}
        bidCount={bidCount}
        handleSubmitBid={handleSubmitBid}
        handleSubmitAuction ={handleSubmitAuction}
        auction={auction}
        peerCount={peerCount}
      />
    </Container>
  )
}
