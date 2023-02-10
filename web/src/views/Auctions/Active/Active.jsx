import {useState, useEffect} from 'react'
import {
  Container,
  Flex,
  Box
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { Table } from '@/views/Auctions/Table'
import {
  useIpfsAuctionsRoom
} from '@/hooks/useEnglishAuction'
import {useAuctions} from '@/hooks/EnglishAuction/useAuctions'
import { PeersCard } from '@/components/Cards/PeersCard'


export const Active = () => {
  const {
    auctions:localAuctions,
    fetchAuctions:fetchLocalAuctions
  } = useAuctions(
    { 
      defaultFilter: {
        filterKey: ((item) => item.auctionData.deadline),
        filterValue: ((item, now=(new Date()).getTime()) => {
          return now <= (new Date(item)).getTime()})
      }
    }
  )

  const [auctions, setAuctions] = useState([])
  const [roomStatus, setRoomStatus] = useState('warning')
  const {
    ipfsAuctions,
    ipfsAuctionsPeerCount,
    fetchIpfsAuctions,
    broadcastExistence
  } = useIpfsAuctionsRoom()
  useEffect(() => {
    setAuctions(old => [...old, ...ipfsAuctions])
  }, [ipfsAuctions])
  useEffect(() => {
    setAuctions(localAuctions)
  }, [localAuctions])
    useEffect(() => {

      const interval = setInterval(() => {
        broadcastExistence()
          
      }, 10000);
      return () => clearInterval(interval)
    }, [])
  return (
    <Container maxW={'6xl'}>
        <Heading my="2.5%">
          Active Auctions
        </Heading>
      <Flex
      mb="1.25%">
          <PeersCard
            size={0}
            peerCount={ipfsAuctionsPeerCount ? ipfsAuctionsPeerCount: 'No Connections'}
            stat={ipfsAuctionsPeerCount}
            status={ipfsAuctionsPeerCount > 0 ? 'success': 'warning'}
          />
      </Flex>
      <Table auctions={auctions} />
    </Container>
  )
}
