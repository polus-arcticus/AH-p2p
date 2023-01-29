import {
  Container
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { CreateAuctionForm } from './CreateAuctionForm'
export const Create = () => {
  return (
    <Container maxW={'6xl'}>
      <Heading>Create Auction</Heading>
      <CreateAuctionForm />
    </Container>
  )
}
