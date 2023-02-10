import { create } from 'ipfs-core'
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext
} from 'react'

const Context = createContext({ ipfs: null, error: null })

export const IpfsProvider = ({children}) => {
  const [ipfs, setIpfs] =  useState(null)
  const [error, setError] =  useState(null)
  
  const startIpfs = useCallback(async () => {
    if (ipfs) {
      console.log('IPFS already started')
    } else if (window.ipfs && window.ipfs.enable) {
      console.log('Found window.ipfs')
      //ipfs = await window.ipfs.enable({ commands: ['id'] })
      // potential entry for other options
    } else {
      try {
        console.time('IPFS Started')
        setIpfs(await create({
          repo: '/ipfs/repos/'+ Math.random()+'ok',
          EXPERIMENTAL: { pubsub: true },
          config: {
            Addresses: {
              Swarm: [
                `/ip4/${import.meta.env.VITE_DOMAIN}/tcp/80/ws/p2p-webrtc-star`
              ]
            }
          }
        }))
        console.timeEnd('IPFS Started')
      } catch (error) {
        console.error('IPFS init error:', error)
        ipfs = null
        setError(error)
      }
    }

  }, [])
  useEffect(() => {
    startIpfs()
  }, [])
  return (
  <Context.Provider
    value={{ipfs, error}}
    >{children}</Context.Provider>
  )
}
export const useIpfs = () => {
  const ipfs = useContext(Context)
  return ipfs
}
