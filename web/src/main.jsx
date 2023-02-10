import React, {useEffect} from 'react'
import ReactDOM from 'react-dom/client'
import {App} from '@/App'
import { Web3ReactProvider, Web3ReactHooks   } from '@web3-react/core'
import { MetaMask  } from '@web3-react/metamask'
import { hooks as metaMaskHooks, metaMask  } from './connectors/metaMask'
import { extendTheme, ChakraProvider } from '@chakra-ui/react'


import { IpfsProvider } from '@/hooks/useIpfs'

const colors = {
  brand: {
    900: '#1a365d',
    800: '#153e75',
    700: '#2a69ac',
  },

}
const theme = extendTheme({colors})

// 1. import `ChakraProvider` component
const connectors = [
  [metaMask, metaMaskHooks]
]

ReactDOM.createRoot(document.getElementById('root')).render(
    <Web3ReactProvider connectors={connectors}>
      <IpfsProvider>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
      </IpfsProvider>
    </Web3ReactProvider>
)
