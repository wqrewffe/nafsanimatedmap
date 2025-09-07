import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load env files (e.g. .env, .env.production)
    const env = loadEnv(mode, '.', '');

  // Prefer explicit VITE_BASE_URL, then VERCEL_URL (from env files or Vercel), then fallback to '/'.
  // import.meta.env may not be strongly typed here; cast to 'any' to read runtime vars.
  const meta: any = (import.meta as any);
  const explicitBase = (env.VITE_BASE_URL || meta.env?.VITE_BASE_URL || '').trim();
  const vercelUrl = (env.VERCEL_URL || meta.env?.VERCEL_URL || '').trim();

    let base = '/';
    if (explicitBase) {
      base = explicitBase.endsWith('/') ? explicitBase : `${explicitBase}/`;
    } else if (vercelUrl) {
      base = `https://${vercelUrl.replace(/https?:\/\//, '')}/`;
    } else if (mode === 'production') {
      // As a convenience, when building for production locally you can hardcode your deployed URL here.
      base = 'https://nafsanimatedmap.vercel.app/';
    }

    return {
      base,
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Use project root so alias works in ESM/TS contexts without __dirname
          '@': path.resolve('.', '.'),
        }
      }
    };
});
