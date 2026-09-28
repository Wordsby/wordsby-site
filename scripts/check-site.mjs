// Checks the built site in dist/ (run after `astro build`; `npm run check` does both).
// Errors fail the check; warnings are printed but don't. Which findings are which
// depends on the site's mode — see below.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSite, reportFindings } from './design-lint.mjs';
import { syncPatternsFile } from './patterns-index.mjs';
import { checkQuotes } from './check-quotes.mjs';
import { siteMode } from './site-mode.mjs';
import { bespokeUsage } from './bespoke.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const mode = siteMode();
const errors = [];
const warnings = [];

// In build mode nothing is live, so a finding is advice rather than a gate: a broken
// link to a page you haven't written yet, or a colour you're still trying, shouldn't
// stop you looking at the design. In care mode the same finding fails the check.
// Invented or altered testimonials are the exception — that's a question of fact, not
// of finish, and it blocks in both modes.
const building = mode === 'build';
const fail = (message) => (building ? warnings : errors).push(message);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

function resolvesInDist(url) {
  const path = decodeURI(url.split(/[?#]/)[0]);
  const candidates = [path, join(path, 'index.html'), `${path}.html`];
  return candidates.some((c) => existsSync(join(dist, c)) && statSync(join(dist, c)).isFile());
}

if (!existsSync(dist)) {
  console.error('No dist/ folder. Run `npm run build` first (or use `npm run check`).');
  process.exit(1);
}

for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(dist, file);

  // Internal links and assets must exist.
  for (const [, url] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
    if (!resolvesInDist(url)) fail(`${page}: broken link or missing file "${url}"`);
  }

  // Every image needs an alt attribute.
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(tag)) fail(`${page}: image without alt text: ${tag.slice(0, 80)}`);
  }

  // Exactly one h1 per page.
  const h1s = html.match(/<h1\b/g)?.length ?? 0;
  if (h1s !== 1) fail(`${page}: has ${h1s} <h1> elements (expected exactly 1)`);

  // Forms pointing at a local form service won't work once deployed.
  if (/<form[^>]+action="http:\/\/localhost/.test(html)) {
    warnings.push(`${page}: form posts to a localhost form service. Set forms.endpoint in content/settings.yaml before launch.`);
  }
}

if (!syncPatternsFile({ check: true })) {
  fail('PATTERNS.md is out of date. Run: npm run patterns:index');
}

// Redirects: a migration's search rankings depend on this file being valid.
const redirectsFile = fileURLToPath(new URL('../public/_redirects', import.meta.url));
if (existsSync(redirectsFile)) {
  const lines = readFileSync(redirectsFile, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const rule = line.split('#')[0].trim();
    if (!rule) return;
    const [from, to, status] = rule.split(/\s+/);
    const at = `public/_redirects line ${index + 1}`;
    if (!to) {
      fail(`${at}: "${rule}" needs a destination.`);
    } else if (!from.startsWith('/')) {
      fail(`${at}: the path to redirect must start with "/" (found "${from}").`);
    } else if (status && !/^3\d\d$/.test(status)) {
      fail(`${at}: "${status}" isn't a redirect status. Use 301 for a move that's permanent.`);
    } else if (!status) {
      warnings.push(`${at}: no status given, so it defaults to 302 (temporary). Migrations want 301.`);
    }
  });
}

// Testimonials: every quote and credit must match content/quotes.yaml.
const quotes = checkQuotes();
errors.push(...quotes.errors);
if (quotes.note) console.log(quotes.note);

// Design lint: the mechanically checkable rules from craft/.
const design = lintSite(dist);
if (design.length > 0) {
  console.log('\nDesign lint:');
  reportFindings(design);
  console.log('');
}
for (const f of design.filter((f) => f.severity === 'P0')) {
  fail(`${f.id} in ${f.file}: ${f.message}`);
}
for (const f of design.filter((f) => f.severity !== 'P0')) {
  warnings.push(`${f.id} in ${f.file}: ${f.message}`);
}

// Every page is built from one route, so a bespoke section's CSS ships on all of them
// whether or not a page uses it. An experiment you've moved on from is dead weight.
if (building) {
  const unused = bespokeUsage().filter((section) => section.usedBy.length === 0);
  for (const section of unused) {
    warnings.push(`src/sections/${section.name}.astro isn't used by any page. Its CSS still ships on every page — delete it, or put it on a page.`);
  }
}

if (building) {
  console.log('\nBuild mode: findings below are advice, not gates. Nothing here fails the check.');
  console.log('Run `npm run graduate` when this site is ready to go live, and they start to block.');
}

const uniqueWarnings = [...new Set(warnings)];
for (const w of uniqueWarnings) console.warn(`${building ? 'advice' : 'warning'}: ${w}`);
for (const e of errors) console.error(`error: ${e}`);

if (errors.length) {
  console.error(`\n✗ Site check failed with ${errors.length} error(s).`);
  process.exit(1);
}
const noted = uniqueWarnings.length;
const label = building ? (noted === 1 ? 'advisory' : 'advisories') : noted === 1 ? 'warning' : 'warnings';
console.log(`\n✓ Site check passed in ${mode} mode (${htmlFiles(dist).length} pages${noted ? `, ${noted} ${label}` : ''}).`);
