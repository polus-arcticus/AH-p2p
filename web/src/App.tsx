import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
// import the following libraries if using a build environment such as vite.
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { webRTC } from '@libp2p/webrtc'
import { noise } from '@chainsafe/libp2p-noise'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { multiaddr } from '@multiformats/multiaddr'
import { WebRTC as WebRTCMatcher } from '@multiformats/multiaddr-matcher'
import pRetry from 'p-retry'
import delay from 'delay'

const options = {
  addresses: {
    listen: [
      '/webrtc'
    ]
  },
  transports: [
    webSockets(),
    webRTC(),
    circuitRelayTransport()
  ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  connectionGater: {
    denyDialMultiaddr: () => {
      return false
    }
  },
  services: {
    identify: identify()
  }
}

const libp2p = await createLibp2p(options)
const ipfs1 = await createHelia({ libp2p })

ipfs1.libp2p.addEventListener('connection:open', (evt) => {
  console.log('New connection to:', evt.detail.remoteAddr.toString())
})

ipfs1.libp2p.addEventListener('connection:close', (evt) => {
  console.log('Connection closed to:', evt.detail.remoteAddr.toString())
})

/*The creation and deployment of a circuit relay is not covered in this documentation. However, you can use the one bundled with the OrbitDB unit tests by cloning the OrbitDB repository, installing the dependencies and then running `npm run webrtc` from the OrbitDB project's root dir. Once running, the webrtc relay server will print a number of addresses it is listening on. Use the address /ip4/127.0.0.1/tcp/12345/ws/p2p when specifying the relay for browser 1.
*/
const relay = `/dns4/ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV`

await ipfs1.libp2p.dial(multiaddr(relay))

const a1 = await pRetry(async () => {
  const addr = ipfs1.libp2p.getMultiaddrs().filter(ma => WebRTCMatcher.matches(ma)).pop()

  if (addr == null) {
    await delay(10)
    throw new Error('No WebRTC address found')
  }

  return addr
})

console.log('ipfs1 address discovered: ', a1)


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
