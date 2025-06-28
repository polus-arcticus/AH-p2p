import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, localhost } from 'wagmi/chains'
import { injected, unstable_connector } from '@wagmi/core'

export const config = createConfig({
  chains: [mainnet, sepolia, localhost],
  transports: {
    [mainnet.id]: unstable_connector(injected),
    [sepolia.id]: unstable_connector(injected),
    [localhost.id]: unstable_connector(injected),
  },
})