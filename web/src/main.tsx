import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HeliaProvider } from './providers/HeliaProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <HeliaProvider>
      <App />
    </HeliaProvider>
)
