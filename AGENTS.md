# Agent guide

Read this before changing the site. It tells you where things live and which rules protect the site owner.

## What this is

A static Astro site built from one podcast RSS feed. Every build fetches the feed, then makes a home page, an episode archive, and one page per episode. There is no CMS and no database. The feed is the only source of content.

## Commands

```sh
npm install
cp .env.example .env    # then set PODCAST_FEED_URL
npm run dev             # local preview at http://localhost:4321
npm run build           # static output in dist/
```

Test with a real feed. Any public podcast feed works, for example a Castos feed at `https://feeds.castos.com/<id>`.

## Where things live

| Change | File |
|---|---|
| Owner settings (feed URL, theme, episode folder, subscribe links) | `podcast.config.json` |
| How settings are read (env vars override the file) | `src/site.config.ts`, `rebuild/config.mjs` |
| Reading and cleaning the feed | `src/lib/feed.ts` |
| Archive paging, schema data, accent color | `src/lib/archive.ts`, `src/lib/schema.ts`, `src/lib/accent.ts` |
| Subscribe links (finding and matching platforms) | `src/lib/subscribe.ts` |
| Dates, durations, episode labels | `src/lib/format.ts` |
| Page shell: head tags, header, footer | `src/layouts/Base.astro` |
| Layouts (page structure) | `src/themes/<layout>/Home.astro`, `Archive.astro`, `Episode.astro` |
| Layout and style list | `src/themes/registry.ts` |
| Styles (colors, fonts, corners) | `src/themes/styles.css` |
| Styles shared by all layouts | `src/styles/global.css` |
| Shared pieces (meta line, player, nav, pagination, subscribe) | `src/components/` |
| Setup page (shown until a feed URL is set) | `src/components/Setup.astro` |
| Theme preview (dev only, `/themes/`) | `src/dev/ThemePreview.astro`, `src/dev/ThemeFrame.astro` |
| Routes (data and schema, then hand off to the layout) | `src/pages/` |
| Automatic updates (GitHub Action) | `.github/workflows/check-feed.yml`, `rebuild/update-feed-status.mjs` |
| Automatic updates (optional Netlify function) | `netlify/functions/check-feed.mjs`, `rebuild/check-feed.mjs` |
| Host config | `netlify.toml`, `vercel.json`, `wrangler.jsonc` |

`[section]` is the episode folder name from `episodePath` (default `episodes`).

## Rules

**Never change episode URLs by accident.** Slugs come from `episodeSlug()` and `slugify()` in `src/lib/feed.ts`. They match the show's old website links (Castos-hosted or WordPress), and search engines and listeners depend on them. If you touch that logic, build before and after and compare the file list in `dist/`.

**Don't hardcode content.** Show title, art, episodes, and descriptions all come from the feed. To add fixed content (an About page, a contact link), add a new page or component. Don't write it into feed-driven templates.

**Show the feed as it is.** The site lists exactly the episodes in the feed. Don't add caching that keeps episodes the feed has dropped.

**Keep show notes sanitized.** `cleanHtml()` strips scripts, styles, and inline attributes from feed HTML. Add a tag to its allow list only if you need it, and never allow `script`, `style`, `iframe`, or event attributes.

**Keep the fingerprint in one place.** `rebuild/fingerprint.mjs` is shared by the build (`/build-info.json`), the GitHub Action, and the Netlify function. If they ever compute it differently, the site redeploys on every check or never.

**Every page must build without a feed URL.** Until one is set, the site is only the setup page. New routes need `if (!config.feedUrl) return [];` in `getStaticPaths`.

**Don't edit `feed-status.json` by hand.** The GitHub Action owns it.

**Themes only render.** Layout components receive data as props or from `getPodcast()`. They never fetch, transform, or filter feed data, and never build URLs by hand (use `episode.path` and `archiveHref()`). This keeps every theme safe to switch.

**Keep layout CSS scoped.** Every layout's CSS is bundled into every page, even when that layout isn't active. Put layout styles in scoped `<style>` blocks. Any global rule must start with `html[data-layout="<name>"]` so it only applies when that layout is on.

**No client-side JavaScript unless the task needs it.** Pages ship as plain HTML and CSS.

## Gotchas

**Fingerprint dates.** `rebuild/fingerprint.mjs` skips the channel's `lastBuildDate` and `pubDate`. Hosts can rewrite those on every request, and including them makes every check look like a change.

**Duplicate slugs.** Episodes with the same slug get `-2`, `-3`, assigned oldest first. That way an existing episode's URL doesn't change when a newer episode reuses its title.

**Style order.** `warm` must stay the first block in `src/themes/styles.css`. It also styles `:root` (the setup page has no style set), and later blocks override it only because they come after it.

**JSON-LD escaping.** `Base.astro` replaces `<` in schema JSON so show notes can't close the `<script>` tag. Keep that when changing schema output.

**Theme preview URLs.** The dev preview uses path params (`/themes/grid/bold/home/`), not query strings. Astro drops query strings on prerendered pages, even in dev.

**Trailing slashes.** Castos-hosted episode links have no trailing slash. `wrangler.jsonc` (`auto-trailing-slash`) and `vercel.json` (`trailingSlash`) redirect them so old links keep working. Netlify does this by default.

**Empty feed fields.** `text()` in `src/lib/feed.ts` handles tags that arrive as strings, objects with attributes, or missing. Use it for any new tag you read.

## Common tasks

**Restyle the site:** change the style's tokens in `src/themes/styles.css`, or add a new style. Most redesigns need nothing else.

**Add a style:** copy a block in `src/themes/styles.css` (light and dark), rename it, and add the name to `STYLES` in `src/themes/registry.ts`. Use `var(--custom-accent-light, <color>)` for `--accent` so the owner's accent setting still works.

**Add a layout:** copy a folder in `src/themes/` (for example `classic/` to `cards/`), change its markup and scoped styles, and register it in `LAYOUTS` in `src/themes/registry.ts`. Keep the three components and their props: `Home` (no props), `Archive` (`ArchivePage` from `src/lib/archive.ts`), `Episode` (`episode`, `newer`, `older`). Check it at `/themes/` in dev.

**Add a page:** create `src/pages/about.astro` and wrap the content in `<Base title="About">`. Add a nav link in `src/layouts/Base.astro`. Guard it with the setup check used in `src/pages/index.astro`.

**Add a subscribe platform:** add an entry to `PLATFORMS` in `src/lib/subscribe.ts`. Match on hostname only. Set `autoDiscover: false` if the site's social links could be mistaken for it (like YouTube).

**Show more feed data (transcripts, chapters, guests):** read the tag in `toEpisode()` in `src/lib/feed.ts`, add the field to the `Episode` type, then render it in the episode page.
