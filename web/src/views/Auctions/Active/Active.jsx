import {useState, useEffect} from 'react'
import {
  Container,
  Flex,
  Box
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { Table } from '@/views/Auctions/Table'
import {
  useAuctions,
  useIpfsAuctionsRoom
} from '@/hooks/useEnglishAuction'
import { PeersCard } from '@/components/Cards/PeersCard'


export const Active = () => {
  const {
    auctions:localAuctions,
    fetchAuctions:fetchLocalAuctions
  } = useAuctions({defaultFilter:{filterKey:'completed',filterValue:false}})

  const [auctions, setAuctions] = useState(localAuctions)
  const [roomStatus, setRoomStatus] = useState('warning')
  const {
    ipfsAuctions,
    ipfsAuctionsPeerCount,
    fetchIpfsAuctions,
    broadcastExistence
  } = useIpfsAuctionsRoom()
  useEffect(() => {
    console.log('delta ipfsAuctions')
    setAuctions(old => [...old, ...ipfsAuctions])
    console.log(auctions, 'auctions active')
  }, [ipfsAuctions])
    useEffect(() => {

      const interval = setInterval(() => {
        console.log('This will be called every 10 seconds');
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
