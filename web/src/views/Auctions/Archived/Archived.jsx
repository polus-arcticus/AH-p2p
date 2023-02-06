import {
  Container
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { Table } from '@/views/Auctions/Table'
import {useAuctions} from '@/hooks/useEnglishAuction'

export const Archived = () => {
  const {auctions, fetchAuctions} = useAuctions(null,{filterKey:'completed',filterValue:true})
  console.log('archived', auctions)
  return (
    <Container maxW={'6xl'}>
      <Heading mb="2.5%">Archived Auctions</Heading>
      <Table auctions={auctions} />
    </Container>
  )
}
