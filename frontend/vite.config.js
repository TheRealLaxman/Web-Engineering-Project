import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command }) => ({
  resolve: {
    alias:
      command === 'build'
        ? [
            {
              find: /^react-router\/dom$/,
              replacement: fileURLToPath(
                new URL('./node_modules/react-router/dist/production/dom-export.mjs', import.meta.url),
              ),
            },
            {
              find: /^react-router$/,
              replacement: fileURLToPath(
                new URL('./node_modules/react-router/dist/production/index.mjs', import.meta.url),
              ),
            },
          ]
        : [],
  },
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      open: false,
    }),
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 250,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 20,
            },
            {
              name: 'router-vendor',
              test: /node_modules[\\/](?:react-router|react-router-dom|@remix-run|cookie|set-cookie-parser)[\\/]/,
              priority: 20,
            },
            {
              name: 'query',
              test: /node_modules[\\/]@tanstack[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
}))
