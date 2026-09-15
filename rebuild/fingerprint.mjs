import { createHash } from 'node:crypto';

// A short hash of everything in the feed that should change the site.
// The build publishes it at /build-info.json, and the rebuild checker
// compares it with the live feed to decide whether a rebuild is needed.
//
// Gotcha: dates the host rewrites on every request (lastBuildDate) must be
// left out, or every check looks like a change and the site rebuilds hourly.
export function feedFingerprint(xml) {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? [];
  const channelHead = xml
    .split(/<item[\s>]/)[0]
    .replace(/<lastBuildDate>[\s\S]*?<\/lastBuildDate>/g, '')
    .replace(/<pubDate>[\s\S]*?<\/pubDate>/g, '');

  const hash = createHash('sha256');
  for (const part of [channelHead, ...items]) {
    hash.update(part.replace(/\s+/g, ' ').trim());
  }

  return { fingerprint: hash.digest('hex').slice(0, 16), episodes: items.length };
}
