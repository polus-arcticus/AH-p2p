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
import type { Orbit, CustomHelia } from "../../types/orbitdb";
import type { OrbitDB } from '@orbitdb/core-types'

export const useOrbitDB = () => {
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const [orbit, setOrbit] = useState<OrbitDB | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const { data: walletClient } = useWalletClient()

  const startBootstrapNode = useCallback(async () => {
    if (!walletClient) return

    try {
      setLoading(true)
      setError(null)

      const helia = await createHeliaNode() as CustomHelia

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize OrbitDB')
      setLoading(false)
    }
  }, [walletClient])



  useEffect(() => {
    if (!walletClient) return
    startBootstrapNode()
  }, [startBootstrapNode, walletClient])

  return {
    orbit,
    error,
    loading
  }
}
