
import {
  Container
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { ActiveAuctions } from './ActiveAuctions'
import { MyCurrentAuctions } from './MyCurrentAuctions'
import {useAuctions} from '@/hooks/useEnglishAuction'
export const Active = () => {
  const {auctions} = useAuctions()
  console.log(auctions)
  return (
    <Container maxW={'6xl'}>
      <Heading mb="2.5%">Active Auctions</Heading>
      <ActiveAuctions auctions={auctions} />
    </Container>
  )
}
