import type { APIContext } from 'astro';
import { getPodcast } from '../lib/feed';
import { config } from '../site.config';

export async function GET({ site }: APIContext) {
  if (!site) {
    return new Response('Set SITE_URL to generate a sitemap.', { status: 200 });
  }

  const { episodes } = await getPodcast();
  const urls = [
    { loc: new URL('/', site).href, lastmod: episodes[0]?.pubDate },
    { loc: new URL(`/${config.episodePath}/`, site).href, lastmod: episodes[0]?.pubDate },
    ...episodes.map((episode) => ({ loc: new URL(episode.path, site).href, lastmod: episode.pubDate })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(({ loc, lastmod }) => `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
