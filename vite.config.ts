import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Simplify chunking - let Vite handle most of it automatically
        manualChunks(id) {
          // Only explicitly chunk node_modules
          if (id.includes('node_modules')) {
            // Keep React ecosystem together
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react';
            }
            // Keep Firebase together
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase';
            }
            // Everything else goes to vendor
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1500,
    // Minify and optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: 'auto',
      // Disable service worker in development
      devOptions: {
        enabled: false,
      },
      workbox: {
        // Only precache essential files
        globPatterns: ['index.html', 'manifest.json', 'icon*.png'],
        // Don't wait for service worker to control the page
        clientsClaim: true,
        skipWaiting: true,
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache JS/CSS files
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 24 * 60 * 60 // 60 days
              }
            }
          },
          {
            // Cache Firebase API calls
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              }
            }
          }
        ]
      },
      manifest: false, // Use existing manifest.json
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
  include: ['sonner']
}

});
