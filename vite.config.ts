import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  root: 'src',
  plugins: [react(), vanillaExtractPlugin()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        '': resolve(__dirname, 'src/index.html'),
      },
      output: {
        entryFileNames: `assets/[name]/bundle.js`,
      },
    },
  },
})
