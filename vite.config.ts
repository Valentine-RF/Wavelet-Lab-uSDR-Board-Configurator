import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, type PluginOption } from "vite";

// Manus platform plugins — only loaded when running inside the Manus environment
const manusPlugins: PluginOption[] = [];

if (process.env.MANUS_PLATFORM) {
  // Dynamic requires are resolved at startup by Vite's Node runner
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsxLocPlugin } = require("@builder.io/vite-plugin-jsx-loc");
  const { vitePluginManusRuntime } = require("vite-plugin-manus-runtime");
  manusPlugins.push(jsxLocPlugin(), vitePluginManusRuntime());
}

// HMR configuration - use environment variable or auto-detect
const hmrHost = process.env.VITE_HMR_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss(), ...manusPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],
    // HMR config: use env var if set, otherwise let Vite auto-detect
    hmr: hmrHost ? {
      protocol: 'wss',
      host: hmrHost,
      clientPort: 443,
    } : true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
