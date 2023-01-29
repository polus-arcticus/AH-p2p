import {
  Container
} from '@chakra-ui/react'
import GridListWithCTA from './GridListWithCTA'
import { Outlet } from 'react-router-dom'
export const Auction = () => {
  return (
    <Container maxW={'6xl'}>
      <GridListWithCTA />
      <Outlet />
    </Container>
  )
}
