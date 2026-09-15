// Every setting comes from an environment variable, so hosts can configure
// the site without anyone editing code. See .env.example for descriptions.

function env(key: string): string | undefined {
  const value = process.env[key] ?? import.meta.env[key];
  return value ? String(value).trim() : undefined;
}

export const config = {
  feedUrl: env('PODCAST_FEED_URL'),
  episodePath: (env('EPISODE_PATH') ?? 'episodes').replace(/^\/+|\/+$/g, ''),
  slugSource: env('SLUG_SOURCE') === 'title' ? 'title' : 'link',
  episodesPerPage: 20,
  latestOnHome: 5,
  subscribeAuto: env('SUBSCRIBE_AUTO') !== 'false',
  subscribeLinks: (env('SUBSCRIBE_LINKS') ?? '').split(/[\s,]+/).filter(Boolean),
} as const;
