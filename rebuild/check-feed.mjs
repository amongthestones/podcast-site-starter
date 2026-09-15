import { pathToFileURL } from 'node:url';
import { feedFingerprint } from './fingerprint.mjs';

// Rebuilds the site only when the feed has changed since the last build.
// Checking is cheap, so it can run hourly without using build minutes.
// Shared by the Netlify scheduled function and the GitHub Action.
export async function checkFeed({ feedUrl, siteUrl, hookUrl, log = console.log }) {
  const feedResponse = await fetch(feedUrl, { headers: { 'User-Agent': 'podcast-site-starter' } });
  if (!feedResponse.ok) throw new Error(`Feed request failed: ${feedResponse.status}`);
  const live = feedFingerprint(await feedResponse.text());

  let built = null;
  try {
    const response = await fetch(new URL('/build-info.json', siteUrl), { cache: 'no-store' });
    if (response.ok) built = await response.json();
  } catch {
    // No live site yet, or it is down. Rebuilding is the safe choice.
  }

  if (built?.fingerprint === live.fingerprint) {
    log(`No feed changes (${live.episodes} episodes). Skipping rebuild.`);
    return { rebuilt: false };
  }

  log(`Feed changed (${built?.episodes ?? '?'} -> ${live.episodes} episodes). Triggering rebuild.`);
  const hookResponse = await fetch(hookUrl, { method: 'POST' });
  if (!hookResponse.ok) throw new Error(`Build hook failed: ${hookResponse.status}`);
  return { rebuilt: true };
}

// CLI: `npm run check-feed`, used by the GitHub Action.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { PODCAST_FEED_URL, SITE_URL, BUILD_HOOK_URL } = process.env;
  if (!PODCAST_FEED_URL || !SITE_URL || !BUILD_HOOK_URL) {
    // Exit cleanly so forks without rebuilds set up don't get failing runs.
    console.log('Set PODCAST_FEED_URL, SITE_URL, and BUILD_HOOK_URL to turn on automatic rebuilds.');
    process.exit(0);
  }
  checkFeed({ feedUrl: PODCAST_FEED_URL, siteUrl: SITE_URL, hookUrl: BUILD_HOOK_URL }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
