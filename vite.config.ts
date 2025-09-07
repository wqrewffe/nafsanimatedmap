import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Use a relative base for both dev and production so built HTML uses
  // relative asset paths (./assets/...), which prevents absolute-root
  // requests that can be rewritten to index.html by some hosting setups.
  const base = './';
    return {
      base,
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      server: {
        host: true,
        port: Number(env.PORT) || 3000,
      },
      preview: {
        host: true,
        port: Number(env.PORT) || 3000,
        // Allow both Vercel and Render preview hosts
        allowedHosts: ['nafsanimatedmap.vercel.app'],
      },
      // Primary base used for production assets. Alternate deploy URL: https://nafsanimatedmap.vercel.app/
    };
});
