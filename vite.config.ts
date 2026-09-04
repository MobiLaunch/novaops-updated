import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["posicon.svg", "icon.ico"],
      manifest: {
        name: "NovaOps — Repair Shop Management",
        short_name: "NovaOps",
        description: "Repair shop ticketing, inventory, and POS console.",
        theme_color: "#7C3AED",
        background_color: "#F8F7FC",
        display: "standalone",
        start_url: "/dashboard",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Cache the app shell for offline load; never cache Supabase/API
        // responses — a repair shop's live ticket/inventory data must never
        // come from a stale cache.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
