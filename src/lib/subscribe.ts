import { config } from '../site.config';
import type { Show } from './feed';

export interface SubscribeLink {
  id: string;
  label: string;
  href: string;
}

interface Platform {
  id: string;
  label: string;
  match: (url: URL) => boolean;
  autoDiscover: boolean;
}

const onHost = (...hosts: string[]) => (url: URL) =>
  hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));

const PLATFORMS: Platform[] = [
  { id: 'apple', label: 'Apple Podcasts', match: onHost('podcasts.apple.com', 'itunes.apple.com'), autoDiscover: true },
  { id: 'spotify', label: 'Spotify', match: onHost('open.spotify.com'), autoDiscover: true },
  { id: 'youtube-music', label: 'YouTube Music', match: onHost('music.youtube.com'), autoDiscover: true },
  { id: 'amazon', label: 'Amazon Music', match: (url) => /^music\.amazon\./.test(url.hostname), autoDiscover: true },
  { id: 'pocketcasts', label: 'Pocket Casts', match: onHost('pca.st', 'pocketcasts.com'), autoDiscover: true },
  { id: 'overcast', label: 'Overcast', match: onHost('overcast.fm'), autoDiscover: true },
  { id: 'castbox', label: 'Castbox', match: onHost('castbox.fm'), autoDiscover: true },
  { id: 'goodpods', label: 'Goodpods', match: onHost('goodpods.com'), autoDiscover: true },
  { id: 'iheart', label: 'iHeartRadio', match: onHost('iheart.com'), autoDiscover: true },
  { id: 'podcastaddict', label: 'Podcast Addict', match: onHost('podcastaddict.com'), autoDiscover: true },
  { id: 'deezer', label: 'Deezer', match: onHost('deezer.com'), autoDiscover: true },
  { id: 'pandora', label: 'Pandora', match: onHost('pandora.com'), autoDiscover: true },
  { id: 'playerfm', label: 'Player FM', match: onHost('player.fm'), autoDiscover: true },
  { id: 'youtube', label: 'YouTube', match: onHost('youtube.com', 'youtu.be'), autoDiscover: false },
];

let cached: Promise<SubscribeLink[]> | undefined;

export function getSubscribeLinks(show: Show): Promise<SubscribeLink[]> {
  cached ??= loadSubscribeLinks(show);
  return cached;
}

async function loadSubscribeLinks(show: Show): Promise<SubscribeLink[]> {
  const discovered = await discoverLinks(show.website);
  const manual = config.subscribeLinks.map((href) => toLink(href, false)).filter((link) => link !== undefined);

  const byId = new Map<string, SubscribeLink>();
  for (const link of [...discovered, ...manual]) byId.set(link.id, link);

  const order = (id: string) => {
    const index = PLATFORMS.findIndex((platform) => platform.id === id);
    return index === -1 ? PLATFORMS.length : index;
  };
  return [...byId.values()].sort((a, b) => order(a.id) - order(b.id));
}

async function discoverLinks(website?: string): Promise<SubscribeLink[]> {
  if (!config.subscribeAuto || !website) return [];

  for (const pathname of ['/subscribe', '/']) {
    try {
      const response = await fetch(new URL(pathname, website), {
        headers: { 'User-Agent': 'podcast-site-starter' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) continue;

      const hrefs = [...(await response.text()).matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
      const links = hrefs.map((href) => toLink(href, true)).filter((link) => link !== undefined);
      const unique = [...new Map(links.reverse().map((link) => [link.id, link])).values()];
      if (unique.length) return unique;
    } catch {}
  }
  return [];
}

function toLink(href: string, discovering: boolean): SubscribeLink | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;

  const platform = PLATFORMS.find((p) => p.match(url));
  if (platform) {
    if (discovering && !platform.autoDiscover) return undefined;
    return { id: platform.id, label: platform.label, href: url.href };
  }
  if (discovering) return undefined;
  const name = url.hostname.replace(/^www\./, '');
  return { id: name, label: name, href: url.href };
}
