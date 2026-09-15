# Podcast Site Starter

A podcast website built from your RSS feed. No WordPress, no plugin, no database.

**Status:** prototype.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/amongthestones/podcast-site-starter)

## What you get

- A home page with your show art, description, subscribe buttons, and latest episodes
- An episode archive at `/episodes/`
- A page for every episode in your feed, with a player and show notes
- Episode URLs that match Castos-hosted websites: `yoursite.com/episodes/episode-title/`
- Podcast schema, Open Graph tags, and a sitemap for search engines
- A guide for AI coding agents (`AGENTS.md`), so you can ask one to restyle or extend the site

The site shows exactly the episodes your feed lists. If your host limits the feed to your latest 100 episodes, the site has 100 episode pages.

## Deploy on Netlify

1. Click **Deploy to Netlify** above.
2. Paste your podcast's RSS feed URL.
3. Deploy.

**Turn on automatic updates** (recommended):

1. In Netlify, go to **Project configuration > Build & deploy > Build hooks** and add a hook.
2. Go to **Environment variables** and add `BUILD_HOOK_URL` with the hook address.
3. Trigger one more deploy.

Every hour, the site checks your feed. It rebuilds only when something changed, so it uses almost no build minutes.

## Deploy on Cloudflare Pages

1. Fork this repo.
2. In Cloudflare, create a Pages project from your fork.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: `PODCAST_FEED_URL`, `SITE_URL`, and `NODE_VERSION` = `22`
3. Deploy.

**Turn on automatic updates:** Cloudflare Pages can't run scheduled builds, so a GitHub Action does the hourly check instead.

1. In Cloudflare, go to **Settings > Builds > Deploy hooks** and add a hook.
2. In your GitHub fork, go to **Settings > Secrets and variables > Actions**.
   - Variables: `PODCAST_FEED_URL`, `SITE_URL`
   - Secret: `BUILD_HOOK_URL` with the deploy hook address
3. Go to the **Actions** tab and enable workflows. GitHub turns them off in forks.

GitHub pauses scheduled workflows after 60 days with no commits. If updates stop, run the workflow by hand from the Actions tab to restart it.

## Update right after publishing

Automatic checks run hourly. To update sooner:

- **Netlify:** click **Trigger deploy** on the Deploys page.
- **Cloudflare:** click **Retry deployment**, or run the **Check feed for new episodes** workflow in GitHub.

## Settings

All settings are environment variables. See `.env.example`.

| Variable | What it does |
|---|---|
| `PODCAST_FEED_URL` | Your RSS feed. Required. |
| `SITE_URL` | Your site's address, like `https://example.com`. |
| `EPISODE_PATH` | Folder for episodes. Default `episodes`. |
| `SLUG_SOURCE` | `link` (default) takes each episode's slug from its feed link. `title` builds it from the title. |
| `APPLE_PODCASTS_URL`, `SPOTIFY_URL`, `YOUTUBE_URL` | Subscribe buttons. RSS always shows. |
| `BUILD_HOOK_URL` | Turns on automatic updates. |

## Keeping your old links

**Moving from a Castos-hosted website:** episode links already match (`/episodes/episode-title`). Point your domain here and old links keep working.

**Moving from WordPress with Seriously Simple Podcasting:** your old links look like `yoursite.com/podcast/episode-title/`. Set `EPISODE_PATH=podcast`.

Either way, open a few old episode links on the new site before you switch your domain. If they don't load, try `SLUG_SOURCE=title`.

## Local development

```sh
npm install
cp .env.example .env
npm run dev
```
