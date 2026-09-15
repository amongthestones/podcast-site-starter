# Podcast Site Starter

A podcast website built from your RSS feed. No WordPress, no plugin, no database.

**Status:** prototype.

## Deploy in 2 steps

**Step 1.** Click a button. It copies this project to your GitHub account and deploys it.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/amongthestones/podcast-site-starter)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Famongthestones%2Fpodcast-site-starter&project-name=podcast-site&repository-name=podcast-site)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/amongthestones/podcast-site-starter)

**Step 2.** Your new site shows a setup page. Follow its link to `podcast.config.json` in your repo, paste your feed URL, and commit:

```json
"feedUrl": "https://feeds.castos.com/abc12",
```

Your site rebuilds with your show and episodes in a minute or two. New episodes appear automatically after that.

**Prefer another host?** Click **Use this template** at the top of this page, add your feed URL, then import the repo on any static host. Astro is detected automatically, so there are no build settings to type.

## What you get

- A home page with your show art, description, subscribe buttons, and latest episodes
- An episode archive at `/episodes/`
- A page for every episode in your feed, with a player and show notes
- Episode URLs that match Castos-hosted websites: `yoursite.com/episodes/episode-title/`
- Subscribe buttons found automatically from your Castos website
- Podcast schema, Open Graph tags, and a sitemap for search engines
- A guide for AI coding agents (`AGENTS.md`), so you can ask one to restyle or extend the site

The site shows exactly the episodes your feed lists. If your host limits the feed to your latest 100 episodes, the site has 100 episode pages.

## Automatic updates

You don't need to set anything up. Every 4 hours, a GitHub Action checks your feed. When something changed, it commits a small file called `feed-status.json`, and your host redeploys on that commit.

**Cost:** free for public repos. Private repos use about 180 of GitHub's 2,000 free minutes a month. To check less often, edit the `cron` line in `.github/workflows/check-feed.yml`.

**Update right away:** open your repo's **Actions** tab, pick **Check feed for new episodes**, and click **Run workflow**.

### Netlify without GitHub Actions

Netlify can run the check itself instead.

1. In Netlify, go to **Project configuration > Build & deploy > Build hooks** and add a hook.
2. Go to **Environment variables** and add `BUILD_HOOK_URL` with the hook address.
3. Redeploy.
4. In GitHub, go to the **Actions** tab and disable **Check feed for new episodes**, so updates don't deploy twice.

This checks hourly and builds only when the feed changed.

## Settings

Edit `podcast.config.json` in your repo.

| Setting | What it does |
|---|---|
| `feedUrl` | Your podcast's RSS feed. Required. |
| `episodePath` | Folder for episode pages. Default `episodes`. |
| `slugSource` | `link` (default) takes each episode's URL from its link in the feed. `title` builds it from the title. |
| `findSubscribeLinks` | Set to `false` to stop finding subscribe links automatically. |
| `subscribeLinks` | Extra listening links. See below. |

Environment variables on your host override the file. See `.env.example`. On Cloudflare, also set `SITE_URL` to your site's address so canonical links and the sitemap work.

## Subscribe buttons

These fill in automatically. On each build, the site reads the subscribe page of your Castos-hosted website and picks up links to Apple Podcasts, Spotify, Amazon Music, Pocket Casts, Overcast, and other podcast apps.

To add a link Castos doesn't list, add it to `subscribeLinks`. The app is detected from the address, and your link replaces a found link for the same app:

```json
"subscribeLinks": ["https://www.youtube.com/@yourshow"]
```

YouTube links are never picked up automatically, because a website's YouTube link is often a social link, not the podcast.

## Keeping your old links

**Moving from a Castos-hosted website:** episode links already match (`/episodes/episode-title`). Point your domain here and old links keep working.

**Moving from WordPress with Seriously Simple Podcasting:** your old links look like `yoursite.com/podcast/episode-title/`. Set `"episodePath": "podcast"`.

Either way, open a few old episode links on the new site before you switch your domain. If they don't load, try `"slugSource": "title"`.

## Local development

```sh
npm install
cp .env.example .env    # set PODCAST_FEED_URL
npm run dev
```
