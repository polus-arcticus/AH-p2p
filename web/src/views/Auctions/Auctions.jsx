import { useEffect } from 'react'
import {
  Container
} from '@chakra-ui/react'
import GridListWithCTA from './GridListWithCTA'
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
export const Auctions = () => {
  const location = useLocation()
  useEffect(() => {
    console.log('location', location)
  },[location])
  return (
    <Container maxW={'6xl'}>
      {location.pathname == '/auctions/' && <GridListWithCTA />}
      <Outlet />
    </Container>
  )
}
