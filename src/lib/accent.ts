import sharp from 'sharp';
import { config } from '../site.config';

type Rgb = [number, number, number];

let cached: Promise<string | undefined> | undefined;

// CSS that overrides the style's accent color, or undefined to keep it.
// "accent" in podcast.config.json can be "" (style default), "auto" (picked
// from the cover art), or a hex color like "#0f766e".
export function getAccentCss(coverImage?: string): Promise<string | undefined> {
  cached ??= loadAccentCss(coverImage);
  return cached;
}

async function loadAccentCss(coverImage?: string): Promise<string | undefined> {
  const setting = config.accent.trim().toLowerCase();
  if (!setting) return undefined;

  let light: string;
  let dark: string;

  if (setting === 'auto') {
    const color = coverImage ? await coverColor(coverImage) : undefined;
    if (!color) return undefined;
    const [h, s] = rgbToHsl(color);
    // Fixed lightness keeps links readable whatever the art looks like.
    light = hsl(h, Math.min(s, 0.85), 0.38);
    dark = hsl(h, Math.min(s, 0.9), 0.7);
  } else if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(setting)) {
    // A brand color stays exact in light mode. Dark mode gets a lighter
    // version of the same hue so it stays readable on dark backgrounds.
    light = setting;
    const [h, s, l] = rgbToHsl(hexToRgb(setting));
    dark = hsl(h, s, Math.max(l, 0.68));
  } else {
    console.warn(`[podcast-site] Unknown accent "${config.accent}". Use "", "auto", or a hex color like "#0f766e".`);
    return undefined;
  }

  return `:root{--custom-accent-light:${light};--custom-accent-dark:${dark}}`;
}

// The most common vivid color in the cover art. Grays, near-black, and
// near-white are skipped, so mostly monochrome art returns undefined and
// the style's own accent stays. Any failure also returns undefined.
async function coverColor(url: string): Promise<Rgb | undefined> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return undefined;

    const { data } = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(48, 48, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Group pixels into 24 hue buckets, weighted by how vivid they are.
    const buckets = Array.from({ length: 24 }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0; i < data.length; i += 3) {
      const rgb: Rgb = [data[i], data[i + 1], data[i + 2]];
      const [h, s, l] = rgbToHsl(rgb);
      const vividness = s * (1 - Math.abs(l - 0.5) * 2);
      if (vividness < 0.15) continue;
      const bucket = buckets[Math.floor(h * 24) % 24];
      bucket.weight += vividness;
      bucket.r += rgb[0] * vividness;
      bucket.g += rgb[1] * vividness;
      bucket.b += rgb[2] * vividness;
    }

    const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a));
    // Ignore a few stray colored pixels in otherwise gray art.
    if (best.weight < 20) return undefined;
    return [best.r / best.weight, best.g / best.weight, best.b / best.weight];
  } catch {
    return undefined;
  }
}

function hexToRgb(hex: string): Rgb {
  const full = hex.length === 4 ? hex.replace(/[0-9a-f]/g, '$&$&') : hex;
  const n = parseInt(full.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}
