import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Port 3000 on purpose: the API's CORS allowlist and the session cookie are
    // both set up for this origin, so the backend needs no change.
    port: 3000,
    strictPort: true,
  },
});
