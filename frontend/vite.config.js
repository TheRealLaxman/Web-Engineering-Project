import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
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
              test: /node_modules[\\/](?:react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/,
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
})
