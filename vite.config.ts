/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Genera archivos .gz para que el servidor los sirva más rápido
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Genera archivos .br (Brotli) para compresión máxima en navegadores modernos
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    })
  ],
  build: {
    // Terser es más agresivo que esbuild para minificación final
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Elimina console.logs
        drop_debugger: true, // Elimina debuggers
      },
      format: {
        comments: false, // Elimina comentarios
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa las dependencias de node_modules en un chunk separado (vendor)
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('supabase')) return 'vendor-supabase';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
