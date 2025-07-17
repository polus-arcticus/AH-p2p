import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useOrbitDB } from "./useOrbitDB";
import type {Orbit} from '@types/orbitdb'
export const AHP2PContext = createContext({
  orbit: {} as Orbit
})

export const AHP2PProvider = ({ children }: { children: ReactNode }) => {
  const { 
    loading: orbitDBLoading,
    error: orbitDBError,
    orbit
  } = useOrbitDB()


  useEffect(() => {


  }, [orbit])
  return (
    <AHP2PContext.Provider value={{
      orbit
      }}>
      {children}
    </AHP2PContext.Provider>
  )
}
