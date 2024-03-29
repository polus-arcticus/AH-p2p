import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

import { nodePolyfills  } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      crypto: 'true',
      path: 'true'
    })
  ],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, '/src')  }],
  },
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true
    },
    hmr: {
      clientPort: process.env.PORT ? process.env.PORT: 5173 //symettric inner outer port mapping
    },
    port: process.env.PORT ? process.env.PORT: 5173
  }
})
