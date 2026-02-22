import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Group vendor chunks strategically for better caching and loading
          if (id.includes("node_modules")) {
            // Core React libraries in one chunk
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            // Firebase in separate chunk as it's large
            if (id.includes("firebase") || id.includes("@firebase")) {
              return "vendor-firebase";
            }
            // UI libraries together
            if (id.includes("framer-motion") || id.includes("@radix-ui") || id.includes("lucide")) {
              return "vendor-ui";
            }
            // Everything else in vendor chunk
            return "vendor";
          }
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification and tree-shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["**/*"],
      workbox: {
        globPatterns: ["**/*"],
        // Optimize service worker for faster loading
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "firebase-storage-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "StarBoard",
        short_name: "StarBoard",
        theme_color: "#191970",
        background_color: "#191970",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
      },
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
