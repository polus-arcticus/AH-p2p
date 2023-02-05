import {
  Container
} from '@chakra-ui/react'
import { Heading  } from '@chakra-ui/react'
import { CreateAuctionForm } from './Form/Form'
export const Create = () => {
  return (
    <Container maxW={'6xl'}>
      <Heading>Create Auction</Heading>
      <CreateAuctionForm />
    </Container>
  )
}
