import React from 'react'
import ReactDOM from 'react-dom/client'

import { Web3ReactProvider, Web3ReactHooks   } from '@web3-react/core'
import { MetaMask  } from '@web3-react/metamask'
import { hooks as metaMaskHooks, metaMask  } from './connectors/metaMask'

import { extendTheme, ChakraProvider } from '@chakra-ui/react'
import { Home } from '@/views/Home/Home'
import { Docs } from '@/views/Docs/Docs'
import { Auction } from '@/views/Auction/Auction'
import  WithSubnavigation  from '@/components/Navbar'
import LargeWithAppLinksAndSocial from '@/components/LargeWithAppLinksAndSocial'
import {
  createBrowserRouter,
  RouterProvider,

} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <div>error</div>,
  },
  {
    path: "/docs",
    element: <Docs />,
    errorElement: <div>error</div>,
  },
  {
    path: "/auctions",
    element: <Auction />,
    errorElement: <div>error</div>,
  },

]);

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
  <React.StrictMode>
    <Web3ReactProvider connectors={connectors}>
      <ChakraProvider theme={theme}>
        <WithSubnavigation />
        <RouterProvider router={router} />
        <LargeWithAppLinksAndSocial />
      </ChakraProvider>
    </Web3ReactProvider>
  </React.StrictMode>,
)
