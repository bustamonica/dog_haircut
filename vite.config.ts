import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'

// Vite config: forwards /api/replicate/* to https://api.replicate.com/v1/*
// and injects the REPLICATE_API_TOKEN server-side so the key never enters
// the browser bundle. Browser code calls relative /api/replicate paths only.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const token = env.REPLICATE_API_TOKEN

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/replicate': {
          target: 'https://api.replicate.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/api\/replicate/, '/v1'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq: { setHeader: (name: string, value: string) => void }, req: IncomingMessage) => {
              if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`)
              }
              proxyReq.setHeader('Content-Type', 'application/json')
              proxyReq.setHeader('Prefer', 'wait=30')
              if (req.url) {
                // Useful when debugging in the dev terminal
                // eslint-disable-next-line no-console
                console.log(`[replicate proxy] ${req.method} ${req.url}`)
              }
            })
          },
        },
      },
    },
  }
})
