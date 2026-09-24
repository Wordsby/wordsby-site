// Pulls an existing website into .ingest/ so an agent can rebuild it here.
//
// Usage: npm run ingest -- https://example.com [--source auto|wp|crawl] [--limit 40]
//
// Two sources, one output shape:
//   wp     — the WordPress REST API. Structured, clean, knows what's content and
//            what's chrome. Preferred whenever it's open.
//   crawl  — plain HTML from the sitemap (or by following links). Works on any
//            site, but has to guess where the content ends and the theme begins,
//            so its output always needs a human read.
//
// "auto" tries wp, falls back to crawl.
//
// Output:
//   .ingest/inventory.json   every page, its metadata, links, images, forms
//   .ingest/pages/<slug>.md  each page as Markdown, for the agent to work from
//   .ingest/media/           downloaded images
//   .ingest/brand.md         a first guess at logo, colors, and fonts
//
// Nothing here writes to content/ — importing is a judgment call, not a copy.
// See skills/import-site/SKILL.md.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'Mozilla/5.0 (compatible; SiteIngest/1.0; +site migration for the site owner)';
const POLITE_DELAY_MS = 250;
const DEFAULT_LIMIT = 60;

// --- arguments ---------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const target = args.find((a) => !a.startsWith('--') && a.includes('.'));
const source = flag('source', 'auto');
const limit = Number(flag('limit', DEFAULT_LIMIT));

if (!target) {
  console.error('Usage: npm run ingest -- https://example.com [--source auto|wp|crawl] [--limit 40]');
  process.exit(1);
}
const site = new URL(target.startsWith('http') ? target : `https://${target}`);

const outDir = fileURLToPath(new URL('../.ingest/', import.meta.url));
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'pages'), { recursive: true });
mkdirSync(join(outDir, 'media'), { recursive: true });

// --- fetching ----------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'text') {
  const response = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await sleep(POLITE_DELAY_MS);
  return as === 'json' ? response.json() : as === 'buffer' ? Buffer.from(await response.arrayBuffer()) : response.text();
}

async function tryGet(url, as = 'text') {
  try {
    return await get(url, as);
  } catch {
    return null;
  }
}

// --- HTML helpers ------------------------------------------------------------

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', copy: '©', reg: '®', trade: '™',
};

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

const stripTags = (html) => decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

function attr(tag, name) {
  const match = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(tag);
  return match ? decodeEntities(match[1]) : null;
}

function metaContent(html, selector) {
  const match = new RegExp(`<meta[^>]+(?:name|property)=["']${selector}["'][^>]*>`, 'i').exec(html);
  return match ? attr(match[0], 'content') : null;
}

/** Many sites set only one of these. Prefer the hand-written one. */
function description(html) {
  return metaContent(html, 'description') || metaContent(html, 'og:description') || null;
}

/** Themes hide images behind lazy-loading attributes. Check them all. */
function imageSource(tag) {
  return (
    attr(tag, 'data-src') ||
    attr(tag, 'data-lazy-src') ||
    attr(tag, 'src') ||
    attr(tag, 'data-srcset')?.split(',')[0]?.trim().split(' ')[0] ||
    attr(tag, 'srcset')?.split(',')[0]?.trim().split(' ')[0] ||
    null
  );
}

/** Remove the parts of a page that are never content. */
function stripChrome(html) {
  return html
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(header|nav|footer|aside)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

/**
 * Find the element most likely to hold the page's content.
 * Prefers explicit landmarks, then falls back to whichever block has the most
 * text in paragraphs — the same idea reader modes use.
 */
function extractMain(html) {
  const body = stripChrome(html);
  for (const tag of ['main', 'article']) {
    const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(body);
    if (match && stripTags(match[1]).length > 200) return match[1];
  }
  const candidates = [...body.matchAll(/<(div|section)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => m[2])
    .filter((chunk) => !/<(div|section)\b/i.test(chunk));
  const best = candidates.sort((a, b) => paragraphText(b) - paragraphText(a))[0];
  return best && paragraphText(best) > 200 ? best : body;
}

function paragraphText(html) {
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].reduce((total, m) => total + stripTags(m[1]).length, 0);
}

// --- HTML to Markdown --------------------------------------------------------

function toMarkdown(html, pageUrl) {
  let text = html;

  text = text.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, ''); // includes WordPress block comments

  // Inline first, so block handling doesn't have to care about them.
  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => `**${stripTags(inner)}**`);
  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => `_${stripTags(inner)}_`);
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => `\`${stripTags(inner)}\``);
  text = text.replace(/<br\s*\/?>/gi, '\n');

  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, (tag, inner) => {
    const href = attr(tag, 'href');
    const label = stripTags(inner);
    if (!label) return '';
    if (!href || href.startsWith('#')) return label;
    return `[${label}](${absolute(href, pageUrl)})`;
  });

  text = text.replace(/<img[^>]*>/gi, (tag) => {
    const src = imageSource(tag);
    const alt = attr(tag, 'alt') ?? '';
    return src ? `\n![${alt}](${absolute(src, pageUrl)})\n` : '';
  });

  // Blocks.
  text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, inner) => {
    const content = stripTags(inner);
    return content ? `\n\n${'#'.repeat(Number(level))} ${content}\n\n` : '';
  });
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => `\n\n> ${stripTags(inner)}\n\n`);
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => `\n- ${collapse(inner)}`);
  text = text.replace(/<\/(ul|ol)>/gi, '\n\n');
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => `\n\n${collapse(inner)}\n\n`);
  text = text.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

  text = decodeEntities(text.replace(/<[^>]+>/g, ' '));
  // Icon fonts leave behind empty emphasis: <i class="icon"></i> becomes "_ _".
  text = text.replace(/(\*\*|_)\s*\1/g, '');

  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const collapse = (html) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').trim();

function absolute(href, pageUrl) {
  try {
    return new URL(href, pageUrl).href;
  } catch {
    return href;
  }
}

// --- page assembly -----------------------------------------------------------

function slugFor(url) {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
  return path === '' ? 'index' : path.replace(/\.html?$/, '').replace(/[^a-z0-9/-]/gi, '-').toLowerCase();
}

function pageRecord({ url, title, description, markdown, html }) {
  const headings = [...(html ?? '').matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((m) => ({ level: Number(m[1]), text: stripTags(m[2]) }))
    .filter((h) => h.text);
  const images = [...markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map(([, alt, src]) => ({ src, alt }));
  const forms = [...(html ?? '').matchAll(/<form[\s\S]*?<\/form>/gi)].map((m) => ({
    action: attr(m[0], 'action'),
    fields: [...m[0].matchAll(/<(input|textarea|select)[^>]*>/gi)]
      .map((f) => ({ name: attr(f[0], 'name'), type: attr(f[0], 'type') ?? f[1].toLowerCase() }))
      .filter((f) => f.name && !/^(submit|hidden)$/i.test(f.type ?? '')),
  }));

  return {
    url,
    slug: slugFor(url),
    title,
    description,
    headings,
    images,
    forms,
    wordCount: markdown.split(/\s+/).filter(Boolean).length,
  };
}

// --- source: WordPress REST API ---------------------------------------------

async function fromWordPress() {
  const api = `${site.origin}/wp-json/wp/v2`;
  const pages = await tryGet(`${api}/pages?per_page=100&_embed=1`, 'json');
  if (!Array.isArray(pages)) return null;
  const posts = (await tryGet(`${api}/posts?per_page=100&_embed=1`, 'json')) ?? [];

  const entries = [...pages, ...(Array.isArray(posts) ? posts : [])].slice(0, limit);
  console.log(`WordPress REST API: ${pages.length} page(s), ${Array.isArray(posts) ? posts.length : 0} post(s).`);

  return Promise.all(
    entries.map(async (entry) => {
      const url = entry.link;
      const html = entry.content?.rendered ?? '';
      const markdown = toMarkdown(html, url);
      // The rendered page carries metadata the API doesn't (description, forms).
      const page = (await tryGet(url)) ?? '';
      return {
        ...pageRecord({ url, title: stripTags(entry.title?.rendered ?? ''), description: description(page), markdown, html: html + page }),
        type: entry.type,
        markdown,
      };
    }),
  );
}

// --- source: crawl -----------------------------------------------------------

async function discoverUrls() {
  const found = new Set();

  for (const path of ['/sitemap.xml', '/wp-sitemap.xml', '/sitemap_index.xml']) {
    const xml = await tryGet(`${site.origin}${path}`);
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    for (const loc of locs) {
      if (loc.endsWith('.xml')) {
        const child = await tryGet(loc);
        for (const inner of child ? [...child.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()) : []) {
          if (inner.startsWith(site.origin)) found.add(inner);
        }
      } else if (loc.startsWith(site.origin)) {
        found.add(loc);
      }
    }
    if (found.size) return [...found];
  }

  // No sitemap: follow same-origin links from the home page, one level deep.
  const home = await tryGet(site.origin);
  found.add(site.origin + '/');
  for (const [tag] of (home ?? '').matchAll(/<a[^>]+href=["'][^"']+["'][^>]*>/gi)) {
    const href = absolute(attr(tag, 'href') ?? '', site.origin);
    if (href.startsWith(site.origin) && !/\.(jpg|png|pdf|zip|svg|webp|gif)$/i.test(href)) found.add(href.split('#')[0]);
  }
  return [...found];
}

async function fromCrawl() {
  const urls = (await discoverUrls()).slice(0, limit);
  console.log(`Crawl: ${urls.length} URL(s) discovered.`);

  const pages = [];
  for (const url of urls) {
    const html = await tryGet(url);
    if (!html) continue;
    const title = stripTags(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
    const markdown = toMarkdown(extractMain(html), url);
    pages.push({ ...pageRecord({ url, title, description: description(html), markdown, html }), type: 'page', markdown });
  }
  return pages;
}

// --- brand guess -------------------------------------------------------------

// Page builders ship stock palettes. A color being present proves nothing; a color
// being *used* by the page's own CSS is the real signal.
const FRAMEWORK_DEFAULTS = new Set([
  '#D4D4D4', '#54595F', '#7A7A7A', '#61CE70', '#023047', // Elementor kit defaults
  '#D9534F', '#5CB85C', '#5BC0DE', '#F0AD4E', '#292B2C', '#0275D8', // Bootstrap
  '#FFFFFF', '#000000',
]);

/** Every stylesheet the given pages pull in, plus their inline <style> blocks. */
async function collectCss(pageUrls) {
  const sheets = new Map();
  for (const pageUrl of pageUrls) {
    const html = await tryGet(pageUrl);
    if (!html) continue;
    [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].forEach(([, css], i) => {
      sheets.set(`${pageUrl}#inline-${i}`, css);
    });
    for (const [tag] of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)) {
      const href = absolute(attr(tag, 'href') ?? '', pageUrl).split('?')[0];
      if (!href.startsWith(site.origin) || sheets.has(href)) continue;
      const css = await tryGet(href);
      if (css) sheets.set(href, css);
    }
  }
  return sheets;
}

/**
 * A stylesheet the site's own editor generated for one page, rather than a theme
 * or plugin default. Colors here were chosen by someone.
 */
function isAuthoredCss(url) {
  return url.includes('#inline-') || /\/uploads\/.*\/post-\d+\.css/.test(url) || /\/uploads\//.test(url);
}

async function guessBrand(homeHtml, pageUrls) {
  const sheets = await collectCss(pageUrls);

  const declared = new Map(); // custom property -> value
  const uses = new Map(); // custom property -> times referenced in authored CSS
  const literals = [];
  const backgrounds = new Set();
  const fontDeclarations = [];

  for (const [url, css] of sheets) {
    const authored = isAuthoredCss(url);
    for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) {
      const clean = value.trim();
      if (/^#[0-9a-f]{3,8}$/i.test(clean)) declared.set(name, clean.toUpperCase());
    }
    for (const [, name] of css.matchAll(/var\(\s*(--[\w-]+)/g)) {
      if (authored) uses.set(name, (uses.get(name) ?? 0) + 1);
    }
    if (authored) for (const [hex] of css.matchAll(/#[0-9a-f]{6}\b/gi)) literals.push(hex.toUpperCase());
    for (const [, src] of css.matchAll(/url\(["']?([^"')]+\.(?:jpe?g|png|webp|gif|svg))["']?\)/gi)) {
      const full = absolute(src, url.split('#')[0]);
      // Only the media library is the client's; /plugins/ and /themes/ are UI chrome.
      if (/\/uploads\//.test(full)) backgrounds.add(full);
    }
    for (const [, family] of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      if (first && !/^(inherit|initial|var\(|-apple|system-ui|sans-serif|serif|monospace)/i.test(first) && !/icon/i.test(first)) {
        fontDeclarations.push(first);
      }
    }
  }

  // Colors the page CSS actually paints with, most-used first.
  const usedVariables = [...declared.entries()]
    .map(([name, value]) => ({ name, value, uses: uses.get(name) ?? 0, frameworkDefault: FRAMEWORK_DEFAULTS.has(value) }))
    .filter((c) => c.uses > 0 || !c.frameworkDefault)
    .sort((a, b) => b.uses - a.uses);

  const logos = [...homeHtml.matchAll(/<img[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /logo/i.test(tag))
    .map((tag) => ({ src: absolute(imageSource(tag) ?? '', site.origin), alt: attr(tag, 'alt') }))
    .filter((logo) => logo.src);

  return {
    logos,
    palette: usedVariables.slice(0, 14),
    literalColors: tally(literals.filter((hex) => !FRAMEWORK_DEFAULTS.has(hex))).slice(0, 10),
    fonts: tally(fontDeclarations).slice(0, 8),
    backgroundImages: [...backgrounds],
    stylesheetsRead: sheets.size,
  };
}

function tally(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
}

// --- media -------------------------------------------------------------------

async function downloadMedia(pages, brand) {
  const sources = new Set();
  for (const page of pages) for (const image of page.images) sources.add(image.src);
  for (const logo of brand.logos) if (logo.src) sources.add(logo.src);
  for (const background of brand.backgroundImages) sources.add(background);

  const saved = [];
  for (const src of [...sources].slice(0, 80)) {
    const data = await tryGet(src, 'buffer');
    if (!data) continue;
    const name = sanitizeFilename(src);
    writeFileSync(join(outDir, 'media', name), data);
    saved.push({ src, file: `media/${name}`, bytes: data.length });
  }
  return saved;
}

function sanitizeFilename(src) {
  const raw = basename(new URL(src, site.origin).pathname) || 'image';
  const ext = extname(raw) || '.img';
  return raw.replace(/[^a-z0-9._-]/gi, '-').replace(ext, '').slice(0, 60).toLowerCase() + ext.toLowerCase();
}

// --- run ---------------------------------------------------------------------

console.log(`Ingesting ${site.origin} (source: ${source})\n`);

let pages = null;
if (source === 'wp' || source === 'auto') {
  pages = await fromWordPress();
  if (!pages && source === 'wp') {
    console.error('The WordPress REST API is not available. Try --source crawl.');
    process.exit(1);
  }
  if (!pages) console.log('No WordPress REST API; falling back to a crawl.');
}
if (!pages) pages = await fromCrawl();
if (!pages.length) {
  console.error('Nothing could be read from that site.');
  process.exit(1);
}

const home = (await tryGet(site.origin)) ?? '';
const brand = await guessBrand(home, [site.origin + '/', ...pages.map((p) => p.url)]);
const media = await downloadMedia(pages, brand);

const navigation = [...home.matchAll(/<nav[\s\S]*?<\/nav>/gi)]
  .flatMap((m) => [...m[0].matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)])
  .map((m) => ({ label: stripTags(m[2]), href: absolute(m[1], site.origin) }))
  .filter((link, i, all) => link.label && all.findIndex((l) => l.href === link.href) === i)
  .slice(0, 20);

for (const page of pages) {
  const front = [
    '---',
    `source_url: ${page.url}`,
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description ?? '')}`,
    '---',
    '',
  ].join('\n');
  const name = `${page.slug.replace(/\//g, '--')}.md`;
  writeFileSync(join(outDir, 'pages', name), front + page.markdown + '\n');
}

const inventory = {
  site: site.origin,
  ingestedAt: new Date().toISOString(),
  source: pages[0]?.type && source !== 'crawl' ? 'wp' : 'crawl',
  pages: pages.map(({ markdown, ...rest }) => ({ ...rest, file: `pages/${rest.slug.replace(/\//g, '--')}.md` })),
  navigation,
  brand,
  media,
};
writeFileSync(join(outDir, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n');

writeFileSync(
  join(outDir, 'brand.md'),
  [
    `# Brand guess for ${site.origin}`,
    '',
    `Read from ${brand.stylesheetsRead} stylesheet(s). **Confirm everything with the client.**`,
    '',
    'Page builders ship a stock palette, so presence in a stylesheet proves nothing. The list below is',
    "ranked by how often the site's own page CSS actually paints with each color, which is the closest",
    'thing to a deliberate choice you can read from the outside. Anything marked as a framework default',
    'came with the theme.',
    '',
    '## Colors, most-used first',
    ...(brand.palette.length
      ? brand.palette.map(
          (c) =>
            `- \`${c.value}\` — used ${c.uses} time${c.uses === 1 ? '' : 's'} (\`${c.name}\`)${c.frameworkDefault ? ' — framework default' : ''}`,
        )
      : ['- none found']),
    '',
    ...(brand.literalColors.length
      ? ['## Colors written directly into page CSS', ...brand.literalColors.map((c) => `- \`${c.value}\` (${c.count})`), '']
      : []),
    '## Logos found',
    ...(brand.logos.length ? brand.logos.map((l) => `- ${l.src}${l.alt ? ` (alt: "${l.alt}")` : ''}`) : ['- none detected']),
    '',
    '## Background images',
    ...(brand.backgroundImages.length ? brand.backgroundImages.map((src) => `- ${src}`) : ['- none found']),
    '',
    '## Typefaces referenced',
    ...(brand.fonts.length ? brand.fonts.map((f) => `- ${f.value} (${f.count})`) : ['- none found']),
    '',
  ].join('\n'),
);

console.log(`\n✓ ${pages.length} page(s), ${media.length} image(s) → .ingest/`);
for (const page of inventory.pages) {
  console.log(`  ${page.url}  (${page.wordCount} words${page.forms.length ? `, ${page.forms.length} form` : ''})`);
}
