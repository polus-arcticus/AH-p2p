import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Routes, Route } from "react-router";
import { WagmiProvider } from 'wagmi'
import { config } from './config.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AHP2PProvider } from './provider/AHP2PProvider/AHP2PProvider.tsx'
import { NavBar } from './components/NavBar';
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AHP2PProvider>
            <NavBar />
            <Routes>
              <Route path="/" element={<App />} />
            </Routes>
        </AHP2PProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </WagmiProvider>
)
