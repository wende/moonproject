import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          three: ['three'],
          vendor: ['three']
        }
      }
    },
    // Enable tree shaking and minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (disable in production if needed)
    sourcemap: false
  },
  // Optimize development server
  server: {
    hmr: {
      overlay: false
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['three']
  }
});
