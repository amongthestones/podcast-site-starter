import file from '../podcast.config.json' with { type: 'json' };

export const feedUrl = (process.env.PODCAST_FEED_URL || file.feedUrl || '').trim() || undefined;
