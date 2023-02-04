import { useState, useEffect } from 'react'
import { useAuctionRoom } from '@/hooks/useEnglishAuction'
import {useParams} from 'react-router-dom'
import  {BasicStatistics} from './BasicStatistics'
import { Container } from '@chakra-ui/react'
export const Auction = () => {
  const params = useParams()
  const { bidCount, highBid, auction, room, peerCount, submitBid } = useAuctionRoom(params.roomKey)
  const handleSubmitBid = async (value) => {
    console.log(value)
    await submitBid(value)
  }

  return (
    <Container maxW={"6xl"}>
      <BasicStatistics highBid={highBid} bidCount={bidCount} handleSubmitBid={handleSubmitBid} auction={auction} peerCount={peerCount} />
    </Container>
  )
}
