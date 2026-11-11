import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Base44 sandbox preview (BASE44_PREVIEW_MODE=1) serves this dev server through
  // a proxied host whose sandbox id changes, so allow the platform's host domain
  // wildcard there only. Unset, Vite keeps its default host allowlist.
  const previewMode = process.env.BASE44_PREVIEW_MODE === '1';
  const sandboxHostDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 4000,
    },
    server: {
      allowedHosts:
        previewMode && sandboxHostDomain ? [`.${sandboxHostDomain}`] : undefined,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
