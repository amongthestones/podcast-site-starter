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
| Settings (feed URL, episode folder, subscribe links, page sizes) | `src/site.config.ts` (values come from env vars) |
| Reading and cleaning the feed | `src/lib/feed.ts` |
| Dates, durations, episode labels | `src/lib/format.ts` |
| Page shell: head tags, header, footer | `src/layouts/Base.astro` |
| Colors, fonts, spacing | `src/styles/global.css` (tokens at the top) |
| Home page | `src/pages/index.astro` |
| Episode archive (`/episodes/`, `/episodes/page/2/`) | `src/components/EpisodeArchive.astro` |
| Single episode page | `src/pages/[section]/[slug].astro` |
| Episode card in lists | `src/components/EpisodeList.astro` |
| Subscribe buttons | `src/components/Subscribe.astro` |
| Automatic rebuilds | `rebuild/`, `netlify/functions/check-feed.mjs`, `.github/workflows/check-feed.yml` |

`[section]` is the episode folder name from `EPISODE_PATH` (default `episodes`).

## Rules

**Never change episode URLs by accident.** Slugs come from `episodeSlug()` and `slugify()` in `src/lib/feed.ts`. They match the show's old website links (Castos-hosted or WordPress), and search engines and listeners depend on them. If you touch that logic, build before and after and compare the file list in `dist/`.

**Don't hardcode content.** Show title, art, episodes, and descriptions all come from the feed. To add fixed content (an About page, a contact link), add a new page or component. Don't write it into feed-driven templates.

**Show the feed as it is.** The site lists exactly the episodes in the feed. Don't add caching that keeps episodes the feed has dropped.

**Keep show notes sanitized.** `cleanHtml()` strips scripts, styles, and inline attributes from feed HTML. Add a tag to its allow list only if you need it, and never allow `script`, `style`, `iframe`, or event attributes.

**Keep the fingerprint in one place.** `rebuild/fingerprint.mjs` is shared by the build (`/build-info.json`) and the rebuild checker. If the two ever compute it differently, the site rebuilds every hour or never.

**No client-side JavaScript unless the task needs it.** Pages ship as plain HTML and CSS.

## Common tasks

**Restyle the site:** edit the tokens at the top of `src/styles/global.css` first. Most redesigns need nothing else.

**Add a page:** create `src/pages/about.astro` and wrap the content in `<Base title="About">`. Add a nav link in `src/layouts/Base.astro`.

**Add a subscribe platform:** add an env var in `src/site.config.ts`, then add it to the `links` array in `src/components/Subscribe.astro`, and document it in `.env.example`.

**Show more feed data (transcripts, chapters, guests):** read the tag in `toEpisode()` in `src/lib/feed.ts`, add the field to the `Episode` type, then render it in the episode page.
