import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: env.VITE_ADMIN_WEB_URL ? [new URL(env.VITE_ADMIN_WEB_URL).hostname] : undefined,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_URL || 'http://localhost:3002',
          changeOrigin: true,
        },
      },
    },
  }
})