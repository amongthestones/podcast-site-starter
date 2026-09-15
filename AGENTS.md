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
| Owner settings (feed URL, episode folder, subscribe links) | `podcast.config.json` |
| How settings are read (env vars override the file) | `src/site.config.ts`, `rebuild/config.mjs` |
| Reading and cleaning the feed | `src/lib/feed.ts` |
| Subscribe links (finding and matching platforms) | `src/lib/subscribe.ts` |
| Dates, durations, episode labels | `src/lib/format.ts` |
| Page shell: head tags, header, footer | `src/layouts/Base.astro` |
| Colors, fonts, spacing | `src/styles/global.css` (tokens at the top) |
| Home page | `src/components/Home.astro` |
| Setup page (shown until a feed URL is set) | `src/components/Setup.astro` |
| Episode archive (`/episodes/`, `/episodes/page/2/`) | `src/components/EpisodeArchive.astro` |
| Single episode page | `src/pages/[section]/[slug].astro` |
| Episode card in lists | `src/components/EpisodeList.astro` |
| Subscribe buttons (display) | `src/components/Subscribe.astro` |
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

**No client-side JavaScript unless the task needs it.** Pages ship as plain HTML and CSS.

## Common tasks

**Restyle the site:** edit the tokens at the top of `src/styles/global.css` first. Most redesigns need nothing else.

**Add a page:** create `src/pages/about.astro` and wrap the content in `<Base title="About">`. Add a nav link in `src/layouts/Base.astro`.

**Add a subscribe platform:** add an entry to `PLATFORMS` in `src/lib/subscribe.ts`. Match on hostname only. Set `autoDiscover: false` if the site's social links could be mistaken for it (like YouTube).

**Show more feed data (transcripts, chapters, guests):** read the tag in `toEpisode()` in `src/lib/feed.ts`, add the field to the `Episode` type, then render it in the episode page.
