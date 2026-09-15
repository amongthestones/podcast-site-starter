import type { Episode } from './feed';
import { getPodcast } from './feed';
import { config } from '../site.config';

// Props every layout's Archive component receives.
export interface ArchivePage {
  page: number;
  totalPages: number;
  totalEpisodes: number;
  episodes: Episode[];
  newerHref?: string;
  olderHref?: string;
}

// Archive URLs: /episodes/, /episodes/page/2/
export function archiveHref(page: number): string {
  const base = `/${config.episodePath}/`;
  return page === 1 ? base : `${base}page/${page}/`;
}

export async function getArchivePage(page: number): Promise<ArchivePage> {
  const { episodes } = await getPodcast();
  const perPage = config.episodesPerPage;
  const totalPages = Math.max(1, Math.ceil(episodes.length / perPage));

  return {
    page,
    totalPages,
    totalEpisodes: episodes.length,
    episodes: episodes.slice((page - 1) * perPage, page * perPage),
    newerHref: page > 1 ? archiveHref(page - 1) : undefined,
    olderHref: page < totalPages ? archiveHref(page + 1) : undefined,
  };
}
