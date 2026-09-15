import { createHash } from 'node:crypto';

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
