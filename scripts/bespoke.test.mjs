// What stands between a bespoke section and being a pattern. `npm run graduate` refuses
// on the strength of this, so a missed usage would let a bespoke section reach a live site.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sectionsDir = fileURLToPath(new URL('../src/sections/', import.meta.url));
const pagesDir = fileURLToPath(new URL('../content/pages/', import.meta.url));

const { bespokeSections, bespokeUsage, harvestNotes } = await import('./bespoke.mjs');

const written = [];
function write(path, contents) {
  mkdirSync(fileURLToPath(new URL('.', `file://${path}`)), { recursive: true });
  writeFileSync(path, contents);
  written.push(path);
}

afterEach(() => {
  for (const path of written.splice(0)) rmSync(path, { force: true });
});

const section = (name, body) => write(`${sectionsDir}${name}.astro`, body);
const page = (name, body) => write(`${pagesDir}${name}.md`, body);

test('a section is found by filename, without the extension', () => {
  section('test-hero', '<section>hi</section>');
  assert.ok(bespokeSections().some((s) => s.name === 'test-hero'));
});

test('usage is read from the pages that reference it', () => {
  section('test-hero', '<section>hi</section>');
  page('_test-a', '---\ntitle: A\ndescription: A\nsections:\n  - section: test-hero\n---\n');
  page('_test-b', '---\ntitle: B\ndescription: B\nsections:\n  - pattern: hero\n    heading: Not this one\n---\n');
  const found = bespokeUsage().find((s) => s.name === 'test-hero');
  assert.deepEqual(found.usedBy, ['_test-a']);
});

test('a name that only appears as a prefix of another is not a use', () => {
  // "- section: test-hero-wide" must not count as a use of "test-hero".
  section('test-hero', '<section>hi</section>');
  page('_test-c', '---\ntitle: C\ndescription: C\nsections:\n  - section: test-hero-wide\n---\n');
  assert.deepEqual(bespokeUsage().find((s) => s.name === 'test-hero').usedBy, []);
});

test('hard-coded values in the style block are reported with what to use instead', () => {
  section(
    'test-raw',
    `---\nconst { heading } = Astro.props;\n---\n<h2>{heading}</h2>\n<style>\n  h2 { color: #ff00ff; font-size: 18px; font-family: Inter; }\n</style>\n`,
  );
  const notes = harvestNotes(bespokeSections().find((s) => s.name === 'test-raw'));
  assert.deepEqual(notes.map((n) => n.id).sort(), ['colour', 'font', 'size', 'type']);
});

test('tokens and fluid sizes are not reported', () => {
  section(
    'test-clean',
    `---\nconst { heading } = Astro.props;\n---\n<h2>{heading}</h2>\n<style>\n  h2 { color: var(--fg); font-size: clamp(2rem, 5vw, 3rem); font-family: var(--font-heading); padding: var(--space-4); }\n</style>\n`,
  );
  assert.deepEqual(harvestNotes(bespokeSections().find((s) => s.name === 'test-clean')), []);
});

test('a hex in the markup is not mistaken for a hard-coded colour', () => {
  // Copy can legitimately mention one; only the style block decides reusability.
  section('test-copy', `---\nconst { heading } = Astro.props;\n---\n<p>Our brand blue is #1F4E79.</p>\n<style>\n  p { color: var(--fg); }\n</style>\n`);
  assert.deepEqual(harvestNotes(bespokeSections().find((s) => s.name === 'test-copy')), []);
});

test('a section with no props is flagged: a pattern takes its content in', () => {
  section('test-static', `<section><h2>Twenty years in one room</h2></section>\n<style>\n  h2 { color: var(--fg); }\n</style>\n`);
  const notes = harvestNotes(bespokeSections().find((s) => s.name === 'test-static'));
  assert.deepEqual(notes.map((n) => n.id), ['content']);
});
