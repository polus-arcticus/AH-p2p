import {
  useCallback,
  useEffect,
  useState
} from "react";

import { createHeliaNode } from "./createHeliaNode";
import { getWalletInterface } from "./utils/getWalletInterface";
import { useWalletClient } from "wagmi";
import { createOrbitDB, useIdentityProvider  } from '@orbitdb/core'
import { OrbitDBIdentityProviderEthereum } from "@orbitdb/identity-provider-ethereum";
import type { OrbitDB } from '@orbitdb/core-types'

export const useOrbit = () => {
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const [orbit, setOrbit] = useState<OrbitDB | null>(null)
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(true)

  const { data: walletClient } = useWalletClient()

  const startOrbit = useCallback(async () => {
    if (!walletClient) return

    try {
      setLoading(true)
      setError(null)

      const helia = await createHeliaNode() 

      const walletInterface = getWalletInterface({
        address: walletClient.account.address,
        walletClient
      })

      const ethProvider = OrbitDBIdentityProviderEthereum.default({ wallet: walletInterface })

      const orbit = await createOrbitDB({
        ipfs: helia,
        identity: { provider: ethProvider }
      }) as OrbitDB

      setOrbit(orbit)
      setLoading(false)

    } catch (err:unknown) {
      setError(err as Error)
      setLoading(false)
    }
  }, [walletClient])



  useEffect(() => {
    if (!walletClient) return
    startOrbit()
  }, [startOrbit, walletClient])

  return {
    orbit,
    error,
    loading
  }
}
