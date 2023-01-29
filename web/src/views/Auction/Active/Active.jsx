
import {
  Container
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { ActiveAuctions } from './ActiveAuctions'
export const Active = () => {
  return (
    <Container maxW={'6xl'}>
      <Heading>Active Auctions</Heading>
      <ActiveAuctions />
    </Container>
  )
}
