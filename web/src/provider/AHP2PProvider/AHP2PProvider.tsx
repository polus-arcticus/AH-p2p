import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useOrbitDB } from "../useOrbitDB/useOrbitDB";
export const AHP2PContext = createContext({

})

export const AHP2PProvider = ({ children }: { children: ReactNode }) => {
  const { 
    loading: orbitDBLoading,
    error: orbitDBError,
    orbitDB
  } = useOrbitDB()


  useEffect(() => {


  }, [orbitDB])
  return (
    <AHP2PContext.Provider value={{

      }}>
      {children}
    </AHP2PContext.Provider>
  )
}
