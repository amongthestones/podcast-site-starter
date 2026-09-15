import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };

const site =
  env.SITE_URL ||
  env.URL ||
  (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  undefined;

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
