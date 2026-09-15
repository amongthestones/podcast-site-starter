import { checkFeed } from '../../rebuild/check-feed.mjs';

// Netlify scheduled function. Runs on published deploys only, never locally.
export default async () => {
  const feedUrl = process.env.PODCAST_FEED_URL;
  const hookUrl = process.env.BUILD_HOOK_URL;
  const siteUrl = process.env.SITE_URL || process.env.URL;

  if (!feedUrl || !hookUrl || !siteUrl) {
    console.log('Set PODCAST_FEED_URL and BUILD_HOOK_URL to turn on automatic rebuilds.');
    return new Response('Not configured', { status: 200 });
  }

  const { rebuilt } = await checkFeed({ feedUrl, siteUrl, hookUrl });
  return new Response(rebuilt ? 'Rebuild triggered' : 'No changes', { status: 200 });
};

export const config = { schedule: '@hourly' };
