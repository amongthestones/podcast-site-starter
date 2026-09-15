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

// Adds the /themes preview page during `npm run dev` only, so it never
// ships on a live site.
const themePreview = {
  name: 'theme-preview',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/themes/[...view]', entrypoint: new URL('./src/dev/ThemePreview.astro', import.meta.url) });
      injectRoute({ pattern: '/themes/[layout]/[style]/[view]', entrypoint: new URL('./src/dev/ThemeFrame.astro', import.meta.url) });
    },
  },
};

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [themePreview],
});
