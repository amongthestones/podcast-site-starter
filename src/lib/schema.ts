import type { Episode, Show } from './feed';
import { isoDuration } from './format';

// Schema.org data for search engines. Shared by every layout.

export function seriesSchema(show: Show, site?: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: show.title,
    description: show.summary,
    url: site?.href,
    image: show.image,
    author: show.author ? { '@type': 'Person', name: show.author } : undefined,
    webFeed: show.feedUrl,
    inLanguage: show.language,
  };
}

export function episodeSchema(episode: Episode, show: Show, site?: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title,
    description: episode.summary,
    url: site ? new URL(episode.path, site).href : undefined,
    datePublished: episode.pubDate.toISOString(),
    image: episode.image,
    episodeNumber: episode.number,
    timeRequired: isoDuration(episode.durationSeconds),
    associatedMedia: episode.audioUrl
      ? { '@type': 'MediaObject', contentUrl: episode.audioUrl, encodingFormat: episode.audioType }
      : undefined,
    partOfSeries: { '@type': 'PodcastSeries', name: show.title, url: site?.href },
  };
}
