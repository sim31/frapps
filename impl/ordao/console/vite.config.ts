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
        orclient: resolve(__dirname, "classes/ORClient.html"),
        orcontext: resolve(__dirname, "classes/ORContext.html"),
        config: resolve(__dirname, "interfaces/Config.html"),
        onchainActionRes: resolve(__dirname, "interfaces/OnchainActionRes.html"),
        proposeRes: resolve(__dirname, "interfaces/ProposeRes.html"),
        execRes: resolve(__dirname, "types/ExecRes.html"),
        defaultConfig: resolve(__dirname, "variables/defaultConfig.html"),
      },
    },
  }
})
