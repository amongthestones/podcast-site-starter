import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };

// SITE_URL wins. Netlify sets URL, Cloudflare Pages sets CF_PAGES_URL (a
// preview-style address, so set SITE_URL once you have a custom domain).
const site = env.SITE_URL || env.URL || env.CF_PAGES_URL || undefined;

export default defineConfig({
  site,
  trailingSlash: 'always',
});
