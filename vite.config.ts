import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      strategies: "generateSW",
      injectRegister: "auto",
      manifest: {
        name: "PNS Tracker",
        short_name: "PNS",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        // runtimeCaching: [
        //   {
        //     urlPattern:
        //       /^https:\/\/firestore\.googleapis\.com\/(?!.*\/Listen\/channel).*/i,
        //     handler: "NetworkFirst",
        //     options: {
        //       cacheName: "firebase-data",
        //       expiration: {
        //         maxEntries: 100,
        //         maxAgeSeconds: 24 * 60 * 60, // 24 hours
        //       },
        //       cacheableResponse: {
        //         statuses: [0, 200],
        //       },
        //     },
        //   },
        //   {
        //     urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        //     handler: "CacheFirst",
        //     options: {
        //       cacheName: "google-fonts",
        //       expiration: {
        //         maxEntries: 10,
        //         maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        //       },
        //     },
        //   },
        //   {
        //     urlPattern: /\.(?:js|css)$/i,
        //     handler: "StaleWhileRevalidate",
        //     options: {
        //       cacheName: "static-resources",
        //       expiration: {
        //         maxEntries: 50,
        //         maxAgeSeconds: 24 * 60 * 60, // 24 hours
        //       },
        //     },
        //   },
        //   {
        //     urlPattern: new RegExp("^https://.*"),
        //     handler: "NetworkFirst",
        //     options: {
        //       cacheName: "external-resources",
        //       networkTimeoutSeconds: 10,
        //       expiration: {
        //         maxEntries: 50,
        //         maxAgeSeconds: 24 * 60 * 60, // 24 hours
        //       },
        //       cacheableResponse: {
        //         statuses: [0, 200],
        //       },
        //     },
        //   },
        // ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        disableDevLogs: true,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
