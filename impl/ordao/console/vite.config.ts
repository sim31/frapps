import { defineConfig } from 'vite'
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: { preserveSymlinks: true },
    force: true
  },
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    watch: {
      followSymlinks: true,
    } 
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docsIndex: resolve(__dirname, 'public/index.html'),
        orconsole: resolve(__dirname, "public/classes/ORClient.html")
      },
    },
  }
})
