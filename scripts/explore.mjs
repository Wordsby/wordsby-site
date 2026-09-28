// Build the same pages several ways at once, screenshot each, and put them on one
// page to compare. Exploring a design one round-trip at a time is the slowest part
// of making a site look like something; seeing four at once is the fast part.
//
//   npm run explore                                  home page, four contrasting directions
//   npm run explore -- /about/ /classes/             other pages
//   npm run explore -- --directions billboard,mono-bold
//   npm run explore -- --count 6
//   npm run explore -- --adopt billboard             write the winner into brand.yaml
//   npm run explore -- --compare /a/ /b/ /c/         compare whole page compositions
//
// Two things are worth varying. `--directions` (the default) holds the page still and
// changes the design system: type, colour, rhythm, shape. `--compare` does the
// opposite — one build, one system, several pages that lay the same content out in
// genuinely different ways. The first answers "which system suits this client", the
// second answers "what should this page be". Neither substitutes for the other, and
// the second is usually the one that decides whether a page is any good.
//
// Each variant is a full build with brand.yaml's design direction overridden, so what
// you're looking at is the real site, not a mock-up.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const directionsDir = join(root, 'design/directions');
const outRoot = join(root, '.explore');
const brandFile = join(root, 'brand/brand.yaml');

// --- arguments --------------------------------------------------------------

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};
const adopt = option('adopt');
const comparing = args.includes('--compare');
const only = option('directions')?.split(',').map((s) => s.trim()).filter(Boolean);
const count = Number(option('count') ?? 4);
// Only these take a value, so a page path after a boolean flag isn't swallowed.
const VALUE_FLAGS = ['--adopt', '--directions', '--count'];
const paths = args
  .filter((arg, index) => !arg.startsWith('--') && !VALUE_FLAGS.includes(args[index - 1]))
  .map((path) => (path.startsWith('/') ? path : `/${path}`));
if (!paths.length) paths.push('/');

// --- the catalogue ----------------------------------------------------------

function loadDirections() {
  return readdirSync(directionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const slug = entry.name;
      const config = parse(readFileSync(join(directionsDir, slug, 'direction.yaml'), 'utf8'));
      const design = join(directionsDir, slug, 'DESIGN.md');
      return { slug, config, suits: existsSync(design) ? suitsLine(readFileSync(design, 'utf8')) : '' };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** The first paragraph under "## Suits", which is what you need to choose between two. */
function suitsLine(markdown) {
  const match = markdown.match(/##\s+Suits\s*\n+([^\n]+)/);
  return match ? match[1].trim() : '';
}

const catalogue = loadDirections();
const bySlug = new Map(catalogue.map((d) => [d.slug, d]));

// --- adopting a winner ------------------------------------------------------

if (adopt) {
  if (!bySlug.has(adopt)) {
    console.error(`No design direction named "${adopt}". Available: ${catalogue.map((d) => d.slug).join(', ')}`);
    process.exit(1);
  }
  const raw = readFileSync(brandFile, 'utf8');
  if (!/^(\s*)direction:.*$/m.test(raw)) {
    console.error('brand/brand.yaml has no "direction:" line under design:. Add one, then try again.');
    process.exit(1);
  }
  writeFileSync(brandFile, raw.replace(/^(\s*)direction:.*$/m, `$1direction: ${adopt}`));
  console.log(`brand/brand.yaml now uses the "${adopt}" direction (${bySlug.get(adopt).config.name}).`);
  console.log('Rebuild to see it: npm run check');
  process.exit(0);
}

// --- comparing compositions -------------------------------------------------

if (comparing) {
  if (paths.length < 2) {
    console.error('--compare needs at least two pages, e.g. npm run explore -- --compare /a/ /b/');
    process.exit(1);
  }
  rmSync(outRoot, { recursive: true, force: true });
  mkdirSync(outRoot, { recursive: true });

  const dist = join(outRoot, 'compare', 'dist');
  const shots = join(outRoot, 'compare', 'shots');
  const env = { ...process.env, WORDSBY_DIST: dist, WORDSBY_SHOTS: shots };

  process.stdout.write(`Comparing ${paths.length} compositions — building… `);
  try {
    run('npx', ['astro', 'build', '--outDir', dist], env);
  } catch (error) {
    console.log('failed.\n');
    console.error(tail(error.stdout || error.message));
    process.exit(1);
  }
  process.stdout.write('shooting… ');
  mkdirSync(shots, { recursive: true });
  try {
    run('node', ['scripts/screenshots.mjs', ...paths], env);
  } catch (error) {
    console.log('failed.\n');
    console.error(tail(error.stdout || error.message));
    process.exit(1);
  }
  console.log('done.');

  const columns = paths.map((path) => ({
    title: titleOf(dist, path) ?? path,
    subtitle: path,
    shots: `compare/shots`,
    name: pageName(path),
  }));
  writeFileSync(join(outRoot, 'index.html'), comparisonHtml(columns));
  console.log(`\nCompare them: ${join(outRoot, 'index.html')}`);
  process.exit(0);
}

/** Screenshot filenames are derived from the path the same way screenshots.mjs does it. */
function pageName(path) {
  return path.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';
}

/** A built page's <title>, so the sheet is labelled with the page rather than its path. */
function titleOf(dist, path) {
  const file = join(dist, path.replace(/^\//, ''), 'index.html');
  if (!existsSync(file)) return null;
  const match = readFileSync(file, 'utf8').match(/<title>([^<]*)<\/title>/);
  return match ? match[1].trim() : null;
}

function comparisonHtml(columns) {
  const cells = columns
    .map(
      (c) => `
    <section class="variant">
      <header>
        <h2>${escapeHtml(c.subtitle)}</h2>
        <p class="suits">${escapeHtml(c.title)}</p>
      </header>
      <figure>
        <figcaption>desktop</figcaption>
        <img loading="lazy" src="${c.shots}/${c.name}-desktop.png" alt="${escapeHtml(c.subtitle)} at desktop width">
      </figure>
      <figure class="mobile">
        <figcaption>mobile</figcaption>
        <img loading="lazy" src="${c.shots}/${c.name}-mobile.png" alt="${escapeHtml(c.subtitle)} at mobile width">
      </figure>
    </section>`,
    )
    .join('');
  return sheetHtml('Composition comparison', `The same content, laid out ${columns.length} ways, in one design system.`, cells);
}

// --- choosing what to try ---------------------------------------------------

/** The traits two directions can differ on. A spread across these is what makes a comparison useful. */
function traits({ config }) {
  return [
    config.canvas ?? 'light',
    config.space.rhythm,
    config.shape.radius,
    config.shape.elevation,
    config.typography.heading_case ?? 'none',
    config.typography.scale >= 1.25 ? 'big-scale' : 'small-scale',
    config.typography.heading.family === config.typography.body.family ? 'one-face' : 'two-faces',
  ];
}

const distance = (a, b) => traits(a).filter((trait, i) => trait !== traits(b)[i]).length;

/**
 * Start from the direction the site already uses — you need the baseline to judge the
 * rest against — then greedily add whichever is least like everything chosen so far.
 * Picking at random tends to hand you four directions that differ only in their fonts.
 */
function chooseDirections() {
  if (only) {
    const unknown = only.filter((slug) => !bySlug.has(slug));
    if (unknown.length) {
      console.error(`Unknown design direction(s): ${unknown.join(', ')}.`);
      console.error(`Available: ${catalogue.map((d) => d.slug).join(', ')}`);
      process.exit(1);
    }
    return only.map((slug) => bySlug.get(slug));
  }
  const current = parse(readFileSync(brandFile, 'utf8'))?.design?.direction;
  const chosen = bySlug.has(current) ? [bySlug.get(current)] : [catalogue[0]];
  while (chosen.length < Math.min(count, catalogue.length)) {
    const next = catalogue
      .filter((d) => !chosen.includes(d))
      .map((d) => ({ d, score: Math.min(...chosen.map((c) => distance(c, d))) }))
      .sort((a, b) => b.score - a.score || a.d.slug.localeCompare(b.d.slug))[0];
    chosen.push(next.d);
  }
  return chosen;
}

const chosen = chooseDirections();

// --- build and shoot each variant -------------------------------------------

rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

console.log(`Exploring ${chosen.length} directions on ${paths.join(', ')}.\n`);

const results = [];
for (const [index, direction] of chosen.entries()) {
  const label = `${index + 1}/${chosen.length}`;
  const dist = join(outRoot, direction.slug, 'dist');
  const shots = join(outRoot, direction.slug, 'shots');
  process.stdout.write(`[${label}] ${direction.slug} — building… `);
  const env = {
    ...process.env,
    WORDSBY_VARIANT: JSON.stringify({ design: { direction: direction.slug } }),
    WORDSBY_DIST: dist,
    WORDSBY_SHOTS: shots,
  };
  try {
    run('npx', ['astro', 'build', '--outDir', dist], env);
  } catch (error) {
    console.log('failed.');
    results.push({ direction, error: tail(error.stdout || error.message) });
    continue;
  }
  process.stdout.write('shooting… ');
  mkdirSync(shots, { recursive: true });
  try {
    run('node', ['scripts/screenshots.mjs', ...paths], env);
  } catch (error) {
    console.log('screenshots failed.');
    results.push({ direction, error: tail(error.stdout || error.message) });
    continue;
  }
  console.log('done.');
  results.push({ direction, shots });
}

function run(command, commandArgs, env) {
  return execFileSync(command, commandArgs, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
}

const tail = (output) => String(output).trim().split('\n').slice(-6).join('\n');

// --- the comparison sheet ---------------------------------------------------

const sheetFile = join(outRoot, 'index.html');
writeFileSync(sheetFile, compareHtml(results, paths));

console.log(`\nCompare them: ${sheetFile}`);
console.log(`Pick one:     npm run explore -- --adopt <direction>`);

function compareHtml(results, paths) {
  const columns = results
    .map(({ direction, shots, error }) => {
      const images = error
        ? `<pre class="error">${escapeHtml(error)}</pre>`
        : paths
            .map(
              (path) => `
          <figure>
            <figcaption>${escapeHtml(path)} — desktop</figcaption>
            <img loading="lazy" src="${direction.slug}/shots/${pageName(path)}-desktop.png" alt="${escapeHtml(direction.config.name)} at ${escapeHtml(path)}, desktop width">
          </figure>
          <figure class="mobile">
            <figcaption>${escapeHtml(path)} — mobile</figcaption>
            <img loading="lazy" src="${direction.slug}/shots/${pageName(path)}-mobile.png" alt="${escapeHtml(direction.config.name)} at ${escapeHtml(path)}, mobile width">
          </figure>`,
            )
            .join('');
      return `
    <section class="variant">
      <header>
        <h2>${escapeHtml(direction.config.name)}</h2>
        <p class="slug"><code>${escapeHtml(direction.slug)}</code></p>
        <p class="suits">${escapeHtml(direction.suits)}</p>
        <p class="adopt"><code>npm run explore -- --adopt ${escapeHtml(direction.slug)}</code></p>
      </header>
      ${images}
    </section>`;
    })
    .join('');

  return sheetHtml('Design exploration', `The same site, built ${results.length} ways. Full-page screenshots at 1280px and 390px. Scroll each column; they are real builds, not mock-ups.`, columns);
}

/** The comparison sheet's shell, shared by both modes. */
function sheetHtml(title, lede, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; --edge: color-mix(in srgb, currentColor 15%, transparent); }
  body { margin: 0; padding: 2rem clamp(1rem, 4vw, 3rem); font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; }
  h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
  .lede { margin: 0 0 2rem; opacity: 0.7; max-width: 60ch; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 2rem; align-items: start; }
  .variant { border: 1px solid var(--edge); border-radius: 10px; overflow: hidden; }
  .variant header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--edge); }
  .variant h2 { margin: 0; font-size: 1.1rem; }
  .slug { margin: 0.25rem 0 0.5rem; opacity: 0.6; }
  .suits { margin: 0 0 0.25rem; font-size: 0.9rem; opacity: 0.8; }
  .adopt code { font-size: 0.8rem; background: color-mix(in srgb, currentColor 8%, transparent); padding: 0.25rem 0.4rem; border-radius: 4px; }
  figure { margin: 0; border-top: 1px solid var(--edge); }
  figcaption { padding: 0.5rem 1.25rem; font-size: 0.8rem; opacity: 0.6; }
  img { display: block; width: 100%; height: auto; }
  .mobile img { width: min(100%, 390px); margin: 0 auto 1rem; box-shadow: 0 0 0 1px var(--edge); }
  .error { margin: 1.25rem; padding: 0.75rem; white-space: pre-wrap; font-size: 0.8rem; background: color-mix(in srgb, red 10%, transparent); border-radius: 6px; }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="lede">${lede}</p>
<div class="grid">${body}
</div>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
