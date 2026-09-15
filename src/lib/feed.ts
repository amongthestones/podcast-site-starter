import { XMLParser } from 'fast-xml-parser';
import sanitizeHtml from 'sanitize-html';
import { config } from '../site.config';
import { feedFingerprint } from '../../rebuild/fingerprint.mjs';

export interface Show {
  title: string;
  description: string;
  summary: string;
  author: string;
  image?: string;
  language: string;
  categories: string[];
  explicit: boolean;
  feedUrl: string;
  website?: string;
}

export interface Episode {
  id: string;
  slug: string;
  path: string;
  title: string;
  pubDate: Date;
  contentHtml: string;
  summary: string;
  audioUrl?: string;
  audioType?: string;
  audioBytes?: number;
  durationSeconds?: number;
  image?: string;
  season?: number;
  number?: number;
  explicit: boolean;
}

export interface Podcast {
  show: Show;
  episodes: Episode[];
  fingerprint: string;
}

// Every page calls getPodcast(), so fetch the feed once per build.
let cached: Promise<Podcast> | undefined;

export function getPodcast(): Promise<Podcast> {
  cached ??= loadPodcast();
  return cached;
}

export function episodeHref(slug: string): string {
  return `/${config.episodePath}/${slug}/`;
}

async function loadPodcast(): Promise<Podcast> {
  if (!config.feedUrl) {
    throw new Error('PODCAST_FEED_URL is not set. Add it to .env locally or to your host\'s environment variables.');
  }

  const response = await fetch(config.feedUrl, { headers: { 'User-Agent': 'podcast-site-starter' } });
  if (!response.ok) throw new Error(`Could not fetch ${config.feedUrl}: ${response.status}`);
  const xml = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    parseTagValue: false,
    htmlEntities: true,
    isArray: (name) => name === 'item' || name === 'itunes:category',
  });
  const channel = parser.parse(xml)?.rss?.channel;
  if (!channel) throw new Error(`${config.feedUrl} does not look like a podcast RSS feed.`);

  const show: Show = {
    title: text(channel.title),
    description: text(channel.description),
    summary: plainText(text(channel['itunes:summary']) || text(channel.description)),
    author: text(channel['itunes:author']),
    image: channel['itunes:image']?.href || text(channel.image?.url) || undefined,
    language: text(channel.language) || 'en',
    categories: (channel['itunes:category'] ?? []).map((c: any) => c.text).filter(Boolean),
    explicit: isExplicit(channel['itunes:explicit']),
    feedUrl: config.feedUrl,
    website: showWebsite(channel),
  };

  // The site shows exactly what the feed lists. If the host caps the feed
  // at N episodes, older episodes drop off the site too.
  const drafts = (channel.item ?? [])
    .map((item: any) => toEpisode(item, show))
    .filter((draft: EpisodeDraft) => draft.title)
    .sort((a: EpisodeDraft, b: EpisodeDraft) => a.pubDate.getTime() - b.pubDate.getTime());

  // Duplicate slugs get -2, -3 like WordPress, assigned oldest first so an
  // existing episode's URL doesn't change when a newer one reuses its title.
  const usedSlugs = new Map<string, number>();
  const episodes: Episode[] = drafts
    .map(({ slugBase, ...draft }: EpisodeDraft) => {
      const count = (usedSlugs.get(slugBase) ?? 0) + 1;
      usedSlugs.set(slugBase, count);
      const slug = count === 1 ? slugBase : `${slugBase}-${count}`;
      return { ...draft, slug, path: episodeHref(slug) };
    })
    .reverse();

  return { show, episodes, fingerprint: feedFingerprint(xml).fingerprint };
}

// Castos feeds link each episode to the show's Castos-hosted website
// (show.castos.com/episodes/...). Prefer that over the channel link, which
// some shows point at a different site.
function showWebsite(channel: any): string | undefined {
  for (const item of channel.item ?? []) {
    try {
      const url = new URL(text(item.link));
      if (url.pathname.startsWith('/episodes/')) return url.origin;
    } catch {
      // Not a URL. Keep looking.
    }
  }
  try {
    return new URL(text(channel.link)).origin;
  } catch {
    return undefined;
  }
}

type EpisodeDraft =Omit<Episode, 'slug' | 'path'> & { slugBase: string };

function toEpisode(item: any, show: Show): EpisodeDraft {
  const title = text(item['itunes:title']) || text(item.title);
  const contentHtml = cleanHtml(text(item['content:encoded']) || text(item.description));
  const enclosure = item.enclosure;

  return {
    id: text(item.guid) || enclosure?.url || title,
    slugBase: episodeSlug(item, title),
    title,
    pubDate: new Date(text(item.pubDate)),
    contentHtml,
    summary: truncate(plainText(text(item['itunes:subtitle']) || text(item['itunes:summary']) || contentHtml), 220),
    audioUrl: enclosure?.url,
    audioType: enclosure?.type,
    audioBytes: Number(enclosure?.length) || undefined,
    durationSeconds: parseDuration(text(item['itunes:duration'])),
    image: item['itunes:image']?.href || show.image,
    season: Number(text(item['itunes:season'])) || undefined,
    number: Number(text(item['itunes:episode'])) || undefined,
    explicit: isExplicit(item['itunes:explicit']),
  };
}

// Episode URLs must stay stable across rebuilds, and should match the show's
// old website so links keep working. Castos feeds link each episode to its
// Castos-hosted page (show.castos.com/episodes/episode-slug), so the link's
// last segment is the slug that site already uses.
function episodeSlug(item: any, title: string): string {
  if (config.slugSource === 'link') {
    try {
      const segments = new URL(text(item.link)).pathname.split('/').filter(Boolean);
      const last = segments.at(-1);
      if (last) return slugify(decodeURIComponent(last)) || slugify(title);
    } catch {
      // No usable link. Fall back to the title.
    }
  }
  return slugify(title);
}

// Close to WordPress's sanitize_title: strip accents, apostrophes, and
// punctuation, then join words with hyphens.
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z0-9#]+;/g, '')
    .replace(/['‘’"“”]/g, '')
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return text((value as Record<string, unknown>)['#text']);
  return String(value).trim();
}

function isExplicit(value: unknown): boolean {
  return ['yes', 'true', 'explicit'].includes(text(value).toLowerCase());
}

// Show notes often arrive pasted from Word or Google Docs. Keep structure,
// drop inline styles, classes, and anything executable.
function cleanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'a', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'h4', 'img', 'hr', 'code', 'pre'],
    allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      h1: 'h2',
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener', target: '_blank' }),
    },
    exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length,
  });
}

function plainText(html: string): string {
  // Turn block tags into spaces first, or "<li>One</li><li>Two</li>" becomes "OneTwo".
  const spaced = html.replace(/<\/?(p|br|li|ul|ol|div|h[1-6]|blockquote)\b[^>]*>/gi, ' ');
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return value.slice(0, value.lastIndexOf(' ', length)).replace(/[.,;:]$/, '') + '...';
}

// itunes:duration is either plain seconds ("3723") or clock time ("1:02:03").
function parseDuration(value: string): number | undefined {
  if (!value) return undefined;
  const seconds = value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}
