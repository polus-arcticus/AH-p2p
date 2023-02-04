import {useState, useEffect} from 'react'
import { useWeb3React } from '@web3-react/core'
import {NavBar} from '@/components/NavBar'
import { Router } from '@/router'
import {Footer} from '@/components/Footer'
export const App = () => {
  const data = useWeb3React()
  const {connector} = useWeb3React()
  useEffect(() => {
    connector.connectEagerly().catch(() => {
      console.debug('Failed to connect eagerly to metamask')
    })
  }, [])
  return (<Router />)
}
