import { getPodcast } from '../lib/feed';

// Read by rebuild/check-feed.mjs to see whether the live site is out of date.
export async function GET() {
  const { fingerprint, episodes } = await getPodcast();
  return new Response(
    JSON.stringify({ fingerprint, episodes: episodes.length, builtAt: new Date().toISOString() }, null, 2),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
