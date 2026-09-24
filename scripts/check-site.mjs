// Checks the built site in dist/ (run after `astro build`; `npm run check` does both).
// Errors fail the check; warnings are printed but don't.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSite, reportFindings } from './design-lint.mjs';
import { syncPatternsFile } from './patterns-index.mjs';
import { checkQuotes } from './check-quotes.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const errors = [];
const warnings = [];

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
    if (!resolvesInDist(url)) errors.push(`${page}: broken link or missing file "${url}"`);
  }

  // Every image needs an alt attribute.
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(tag)) errors.push(`${page}: image without alt text: ${tag.slice(0, 80)}`);
  }

  // Exactly one h1 per page.
  const h1s = html.match(/<h1\b/g)?.length ?? 0;
  if (h1s !== 1) errors.push(`${page}: has ${h1s} <h1> elements (expected exactly 1)`);

  // Forms pointing at a local form service won't work once deployed.
  if (/<form[^>]+action="http:\/\/localhost/.test(html)) {
    warnings.push(`${page}: form posts to a localhost form service. Set forms.endpoint in content/settings.yaml before launch.`);
  }
}

if (!syncPatternsFile({ check: true })) {
  errors.push('PATTERNS.md is out of date. Run: npm run patterns:index');
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
      errors.push(`${at}: "${rule}" needs a destination.`);
    } else if (!from.startsWith('/')) {
      errors.push(`${at}: the path to redirect must start with "/" (found "${from}").`);
    } else if (status && !/^3\d\d$/.test(status)) {
      errors.push(`${at}: "${status}" isn't a redirect status. Use 301 for a move that's permanent.`);
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
  errors.push(`${f.id} in ${f.file}: ${f.message}`);
}
for (const f of design.filter((f) => f.severity !== 'P0')) {
  warnings.push(`${f.id} in ${f.file}: ${f.message}`);
}

const uniqueWarnings = [...new Set(warnings)];
for (const w of uniqueWarnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);

if (errors.length) {
  console.error(`\n✗ Site check failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`\n✓ Site check passed (${htmlFiles(dist).length} pages${uniqueWarnings.length ? `, ${uniqueWarnings.length} warning(s)` : ''}).`);
