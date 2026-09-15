import { appendFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { feedUrl } from './config.mjs';
import { feedFingerprint } from './fingerprint.mjs';

const STATUS_FILE = new URL('../feed-status.json', import.meta.url);

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

if (!feedUrl) {
  console.log('No feedUrl in podcast.config.json yet. Nothing to check.');
  setOutput('changed', 'false');
  process.exit(0);
}

const response = await fetch(feedUrl, { headers: { 'User-Agent': 'podcast-site-starter' } });
if (!response.ok) {
  console.error(`Feed request failed: ${response.status}`);
  process.exit(1);
}
const live = feedFingerprint(await response.text());

let saved = null;
try {
  saved = JSON.parse(await readFile(STATUS_FILE, 'utf8'));
} catch {}

if (saved?.fingerprint === live.fingerprint) {
  console.log(`No feed changes (${live.episodes} episodes).`);
  setOutput('changed', 'false');
  process.exit(0);
}

const status = { fingerprint: live.fingerprint, episodes: live.episodes, changedAt: new Date().toISOString() };
await writeFile(STATUS_FILE, JSON.stringify(status, null, 2) + '\n');
console.log(`Feed changed (${saved?.episodes ?? 'none'} -> ${live.episodes} episodes).`);
setOutput('changed', 'true');
setOutput('episodes', String(live.episodes));
