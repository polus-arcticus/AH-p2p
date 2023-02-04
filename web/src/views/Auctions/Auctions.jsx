import {
  Container
} from '@chakra-ui/react'
import GridListWithCTA from './GridListWithCTA'
import { Outlet } from 'react-router-dom'
export const Auctions = () => {
  return (
    <Container maxW={'6xl'}>
      <Outlet />
    </Container>
  )
}
