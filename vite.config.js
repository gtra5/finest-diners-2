import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  build: {
    // Modern browsers only (Chrome/Edge 80+, Safari 14+, Firefox 78+) — skips
    // legacy ES5 transforms, producing smaller and faster-parsing output.
    target: 'es2020',
    // Route-level lazy() already splits pages; this splits the big shared
    // vendors so they're cached once across the whole app and can be
    // preloaded by the browser.
    rollupOptions: {
      output: {
        // Rolldown requires a function; the object form is Rollup-only.
        manualChunks(id) {
          // React + router: one cached chunk, loaded on the first paint.
          if (id.includes('node_modules/react')) return 'react-vendor';
          // Framer Motion drives all entrance animations on Home/Menu/etc.
          if (id.includes('node_modules/framer-motion')) return 'motion-vendor';
          // Networking + state.
          if (id.includes('node_modules/axios')) return 'http-vendor';
          if (id.includes('node_modules/zustand')) return 'http-vendor';
        },
      },
    },
    // Three.js, Leaflet, Swiper, Socket.IO stay inside their lazy route chunks
    // (OrderTracking/About) — nobody downloads them to browse the menu.
    chunkSizeWarningLimit: 1000,
  },
})