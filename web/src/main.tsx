import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HeliaProvider } from './providers/HeliaProvider.tsx'
import { BrowserRouter, Routes, Route } from "react-router";
import { Auction } from './pages/Auction';
import { ActiveAuctions } from './pages/ActiveAuctions';
import { NavBar } from './components/NavBar.tsx';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeliaProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
          <NavBar />
                     <Routes>
             <Route path="/" element={<App />} />
             <Route path="/auctions" element={<ActiveAuctions />} />
             <Route path="/room/:roomId" element={<Auction />} />
           </Routes>
        </div>
      </BrowserRouter>
    </HeliaProvider>
  </StrictMode>
)
