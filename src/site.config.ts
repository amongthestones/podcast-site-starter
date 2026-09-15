import file from '../podcast.config.json';

// Settings live in podcast.config.json so owners can edit them in GitHub's
// web editor. Environment variables override the file, for local testing
// and for hosts where you'd rather not commit a change. See .env.example.

function env(key: string): string | undefined {
  const value = process.env[key] ?? import.meta.env[key];
  return value ? String(value).trim() : undefined;
}

function list(value?: string): string[] | undefined {
  return value?.split(/[\s,]+/).filter(Boolean);
}

export const config = {
  feedUrl: env('PODCAST_FEED_URL') ?? (file.feedUrl.trim() || undefined),
  layout: env('LAYOUT') ?? file.layout ?? 'classic',
  style: env('STYLE') ?? file.style ?? 'warm',
  accent: env('ACCENT') ?? file.accent ?? '',
  episodePath: (env('EPISODE_PATH') ?? file.episodePath ?? 'episodes').replace(/^\/+|\/+$/g, ''),
  slugSource: (env('SLUG_SOURCE') ?? file.slugSource) === 'title' ? 'title' : 'link',
  episodesPerPage: 20,
  latestOnHome: 5,
  subscribeAuto: (env('SUBSCRIBE_AUTO') ?? String(file.findSubscribeLinks)) !== 'false',
  subscribeLinks: list(env('SUBSCRIBE_LINKS')) ?? (file.subscribeLinks as string[]) ?? [],
} as const;
