import type { Multiaddr } from '@multiformats/multiaddr'

import { WebRTC  } from '@multiformats/multiaddr-matcher'

export const waitForWebRTCAddress = async (
  helia
) => {
  return new Promise<Multiaddr>(
    (resolve) => {
    const interval = setInterval(() => {
      const selfWebRTCMultiaddr = helia.libp2p.getMultiaddrs().find(ma => WebRTC.matches(ma))
      console.log('WebRTC Multiaddr', selfWebRTCMultiaddr?.toString())
      if (selfWebRTCMultiaddr) {
        clearInterval(interval)
        resolve(selfWebRTCMultiaddr)
      }
    }, 1000)
  })
}
