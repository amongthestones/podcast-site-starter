import { feedFingerprint } from './fingerprint.mjs';

// Used by the optional Netlify scheduled function. Compares the live feed
// with /build-info.json on the deployed site and calls the build hook only
// when they differ, so checks are free and builds happen only on changes.
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
