import file from '../podcast.config.json' with { type: 'json' };

// Same lookup as src/site.config.ts: the env var wins over the committed file.
export const feedUrl = (process.env.PODCAST_FEED_URL || file.feedUrl || '').trim() || undefined;
