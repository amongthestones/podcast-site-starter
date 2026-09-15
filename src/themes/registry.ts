import { config } from '../site.config';

import ClassicHome from './classic/Home.astro';
import ClassicArchive from './classic/Archive.astro';
import ClassicEpisode from './classic/Episode.astro';
import GridHome from './grid/Home.astro';
import GridArchive from './grid/Archive.astro';
import GridEpisode from './grid/Episode.astro';
import MinimalHome from './minimal/Home.astro';
import MinimalArchive from './minimal/Archive.astro';
import MinimalEpisode from './minimal/Episode.astro';

export const LAYOUTS = {
  classic: { Home: ClassicHome, Archive: ClassicArchive, Episode: ClassicEpisode },
  grid: { Home: GridHome, Archive: GridArchive, Episode: GridEpisode },
  minimal: { Home: MinimalHome, Archive: MinimalArchive, Episode: MinimalEpisode },
};

export const STYLES = ['warm', 'midnight', 'newsprint', 'bold'] as const;

export type LayoutName = keyof typeof LAYOUTS;
export type StyleName = (typeof STYLES)[number];

const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[podcast-site] ${message}`);
}

export function getTheme(override: { layout?: string; style?: string } = {}) {
  let layout = override.layout ?? config.layout;
  let style = override.style ?? config.style;

  if (!(layout in LAYOUTS)) {
    warnOnce(`Unknown layout "${layout}". Using "classic". Options: ${Object.keys(LAYOUTS).join(', ')}.`);
    layout = 'classic';
  }
  if (!STYLES.includes(style as StyleName)) {
    warnOnce(`Unknown style "${style}". Using "warm". Options: ${STYLES.join(', ')}.`);
    style = 'warm';
  }

  return {
    layoutName: layout as LayoutName,
    styleName: style as StyleName,
    layout: LAYOUTS[layout as LayoutName],
  };
}
