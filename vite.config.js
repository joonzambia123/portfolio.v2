import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

// Copy cms-data to public folder for production builds
function copyCmsData() {
  return {
    name: 'copy-cms-data',
    buildStart() {
      try {
        const srcDir = join(process.cwd(), 'cms-data')
        const destDir = join(process.cwd(), 'public', 'cms-data')
        
        // Create destination directory
        mkdirSync(destDir, { recursive: true })
        
        // Copy all JSON files
        const files = readdirSync(srcDir).filter(f => f.endsWith('.json'))
        files.forEach(file => {
          copyFileSync(join(srcDir, file), join(destDir, file))
        })
        
        console.log('✓ Copied cms-data to public folder')
      } catch (error) {
        console.warn('Could not copy cms-data:', error.message)
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyCmsData()],
  // Enable JSON imports
  json: {
    stringify: false,
  },
  // Allow importing from cms-data folder
  resolve: {
    alias: {
      '@cms-data': '/cms-data',
    },
  },
  // Build optimizations for performance
  build: {
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Enable minification
    minify: 'esbuild',
    // CSS code splitting
    cssCodeSplit: true,
    // Inline small assets to reduce HTTP requests
    assetsInlineLimit: 4096,
    // Module preload for faster initial load
    modulePreload: {
      polyfill: false, // Modern browsers don't need polyfill
    },
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
        },
      },
    },
    // Source maps only in development
    sourcemap: false,
  },
})
