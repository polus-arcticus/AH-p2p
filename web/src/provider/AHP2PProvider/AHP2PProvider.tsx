import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useOrbit } from "./useOrbit";
import type { OrbitDB } from '@orbitdb/core'
import type { BaseDatabase } from '@orbitdb/core'
import { useSubPeerList } from "./pubsub/useSubPeerList";
import type { Multiaddr } from "@multiformats/multiaddr";

export const AHP2PContext = createContext({
  orbit: null as OrbitDB | null,
  selfAddress: null as Multiaddr | null,
  loading: true,
  err: '',
  peerList: {},
  auctionsDB: null as BaseDatabase | null
})

export const AHP2PProvider = ({ children }: { children: ReactNode }) => {
  const { 
    loading: orbitLoading,
    error: orbitError,
    orbit,
    selfAddress,
    auctionsDB
  } = useOrbit()
  const { 
    peerList,
    subPeerList,
    unSubPeerList
  } = useSubPeerList(orbit)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (orbit && selfAddress) {
      subPeerList(selfAddress)
    }

    return () => {
      console.log('unsubbing peer list')
      unSubPeerList()
    }
  }, [orbit, selfAddress])

  useEffect(() => {
    if (orbitError) {
      setErr(orbitError.message)
    }
  }, [orbitError])

  useEffect(() => {
    if (orbitLoading) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [orbitLoading])

  return (
    <AHP2PContext.Provider value={{
      orbit,
      selfAddress,
      loading,
      err: err || '',
      peerList,
      auctionsDB
    }}>
      {children}
    </AHP2PContext.Provider>
  )
}
