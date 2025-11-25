import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3014,
        open: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild'
    },
    optimizeDeps: {
        include: ['three', 'gsap', 'lenis']
    }
});
