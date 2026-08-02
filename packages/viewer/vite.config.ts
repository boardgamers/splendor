import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: "src/viewer.ts",
      name: "splendor",
      formats: ["iife"],
      fileName: () => "splendor-viewer.iife.js"
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) => (asset.names?.some((n) => n.endsWith(".css")) ? "splendor-viewer.css" : "[name]-[hash][extname]")
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false
  },
  define: {
    __DEV__: JSON.stringify(command === "serve")
  }
}));
