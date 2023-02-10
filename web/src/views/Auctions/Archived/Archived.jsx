import {
  Container
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { Table } from '@/views/Auctions/Table'
import {useAuctions} from '@/hooks/EnglishAuction/useAuctions'
import {
  ARCHIVES_KEY_MAP
} from '@/hooks/utils'
export const Archived = () => {
  const {
    auctions,
    fetchAuctions
  } = useAuctions(
    {
      defaultKeyMap: ARCHIVES_KEY_MAP,
      defaultFilter:{
        filterKey:((item) => item.completed),
        filterValue:((item) => item == true)
      }
    }
  )
  console.log('archived', auctions)
  return (
    <Container maxW={'6xl'}>
      <Heading mb="2.5%">Archived Auctions</Heading>
      <Table auctions={auctions} />
    </Container>
  )
}
