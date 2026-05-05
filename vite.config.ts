import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'

// Vite config: forwards /api/gemini/* to https://generativelanguage.googleapis.com/v1beta/*
// and injects the GEMINI_API_KEY server-side so the key never enters the
// browser bundle. Browser code calls relative /api/gemini paths only.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const geminiKey = env.GEMINI_API_KEY

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/api\/gemini/, '/v1beta'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq: { setHeader: (n: string, v: string) => void }, req: IncomingMessage) => {
              if (geminiKey) {
                proxyReq.setHeader('x-goog-api-key', geminiKey)
              }
              proxyReq.setHeader('Content-Type', 'application/json')
              if (req.url) {
                // eslint-disable-next-line no-console
                console.log(`[gemini proxy] ${req.method} ${req.url.split('?')[0]}`)
              }
            })
          },
        },
      },
    },
  }
})
