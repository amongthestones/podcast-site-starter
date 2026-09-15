import { checkFeed } from '../../rebuild/check-feed.mjs';
import { feedUrl } from '../../rebuild/config.mjs';

// Optional alternative to the GitHub Action, for Netlify sites that don't
// want to use GitHub Actions minutes. Does nothing until BUILD_HOOK_URL is
// set. Runs on published deploys only, never locally.
export default async () => {
  const hookUrl = process.env.BUILD_HOOK_URL;
  const siteUrl = process.env.SITE_URL || process.env.URL;

  if (!feedUrl || !hookUrl || !siteUrl) {
    return new Response('Not configured', { status: 200 });
  }

  const { rebuilt } = await checkFeed({ feedUrl, siteUrl, hookUrl });
  return new Response(rebuilt ? 'Rebuild triggered' : 'No changes', { status: 200 });
};

export const config = { schedule: '@hourly' };
