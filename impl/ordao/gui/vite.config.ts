import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: { preserveSymlinks: true },
    force: true
  },
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    watch: {
      followSymlinks: true
    } 
  }
})
