import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useOrbitDB } from "./useOrbitDB";
import type { AHP2PContextType } from "../../types/orbitdb";

export const AHP2PContext = createContext<AHP2PContextType>({
  orbit: null,
  loading: true,
  error: null
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
      orbit,
      loading: orbitDBLoading,
      error: orbitDBError
    }}>
      {children}
    </AHP2PContext.Provider>
  )
}
