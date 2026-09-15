import { getPodcast } from '../lib/feed';
import { config } from '../site.config';

// Read by the optional Netlify scheduled function to see whether the live
// site is out of date.
export async function GET() {
  if (!config.feedUrl) {
    return Response.json({ configured: false });
  }
  const { fingerprint, episodes } = await getPodcast();
  return new Response(
    JSON.stringify({ fingerprint, episodes: episodes.length, builtAt: new Date().toISOString() }, null, 2),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
