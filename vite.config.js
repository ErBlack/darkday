import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: 'page',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
