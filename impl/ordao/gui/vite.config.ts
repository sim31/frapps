import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['ortypes/node_modules/respect1155'],
  },
  build: {
    commonjsOptions: {
      include: [/typechain-types/, /node_modules/],
    },
  }
})
