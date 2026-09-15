import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };

// SITE_URL wins. Otherwise use the address the host provides: Netlify sets
// URL, Vercel sets VERCEL_PROJECT_PRODUCTION_URL (no protocol). Cloudflare
// sets nothing useful, so set SITE_URL there.
const site =
  env.SITE_URL ||
  env.URL ||
  (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  undefined;

export default defineConfig({
  site,
  trailingSlash: 'always',
});
