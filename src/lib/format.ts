export function formatDate(date: Date, language: string): string {
  try {
    return date.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatDuration(seconds?: number): string | undefined {
  if (!seconds) return undefined;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours} hr ${minutes} min` : `${Math.max(minutes, 1)} min`;
}

// Schema.org wants ISO 8601 durations, like PT1H2M3S.
export function isoDuration(seconds?: number): string | undefined {
  if (!seconds) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

export function episodeLabel(episode: { season?: number; number?: number }): string | undefined {
  if (episode.season && episode.number) return `S${episode.season} E${episode.number}`;
  if (episode.number) return `Episode ${episode.number}`;
  if (episode.season) return `Season ${episode.season}`;
  return undefined;
}
