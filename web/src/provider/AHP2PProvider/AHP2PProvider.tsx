import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useOrbitDB } from "./useOrbitDB";
import type {Orbit} from '@orbit/core-types'

import { useSubPeerList } from "./pubsub/useSubPeerList";

export const AHP2PContext = createContext({
  orbit: null as Orbit | null,
  loading: true,
  err: '',
  peerList: {}
})

export const AHP2PProvider = ({ children }: { children: ReactNode }) => {
  const { 
    loading: orbitLoading,
    error: orbitError,
    orbit
  } = useOrbitDB()
  const { 
    peerList,
    subPeerList,
    unSubPeerList
  } = useSubPeerList()
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (orbit) {
      subPeerList()
    }

    return () => {
      unSubPeerList()
    }
  }, [orbit])

  useEffect(() => {
    if (orbitError) {
      setErr(orbitError)
    }
  }, [orbitError])

  useEffect(() => {
    if (orbitLoading) {
      setLoading(true)
    }
  }, [orbitLoading])

  return (
    <AHP2PContext.Provider value={{
      orbit,
      loading,
      err,
      peerList
    }}>
      {children}
    </AHP2PContext.Provider>
  )
}
