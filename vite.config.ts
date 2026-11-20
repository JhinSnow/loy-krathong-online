import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 850,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/jspdf')) {
            return 'export-vendor';
          }
        }
      }
    }
  }
})
