// What's in src/sections/, where it's used, and what stands between it and being a
// pattern. Read by `npm run harvest-report` and by `npm run graduate`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sectionsDir = join(root, 'src/sections');
const pagesDir = join(root, 'content/pages');

/** Every bespoke section file, by name. */
export function bespokeSections() {
  if (!existsSync(sectionsDir)) return [];
  return readdirSync(sectionsDir)
    .filter((file) => file.endsWith('.astro'))
    .map((file) => ({ name: file.replace(/\.astro$/, ''), file: join(sectionsDir, file) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Markdown pages, recursively, as { id, file, raw }. */
export function contentPages(dir = pagesDir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return contentPages(path, `${prefix}${entry.name}/`);
    if (!entry.name.endsWith('.md')) return [];
    return [{ id: `${prefix}${entry.name.replace(/\.md$/, '')}`, file: path, raw: readFileSync(path, 'utf8') }];
  });
}

/** Which pages reference each bespoke section. */
export function bespokeUsage() {
  const pages = contentPages();
  return bespokeSections().map((section) => ({
    ...section,
    usedBy: pages
      .filter((page) => new RegExp(`^\\s*-\\s+section:\\s*["']?${section.name}["']?\\s*$`, 'm').test(page.raw))
      .map((page) => page.id),
  }));
}

// What a pattern may not contain. Each is a reason this file isn't reusable yet.
//
// Declarations are matched with their value so the value can be examined: a lookahead
// after "font-size:" is defeated by backtracking over the space, and quietly passes
// everything.
const DECLARATIONS = [
  { id: 'font', property: 'font-family', note: 'use --font-heading or --font-body' },
  // A literal type size, whatever the unit. clamp() and other fluid values are fine in
  // a pattern; it's fixed sizes tied to one direction's scale that don't travel.
  { id: 'type', property: 'font-size', note: 'use --text-sm, --text-base, --text-lg …' },
];

const LITERALS = [
  { id: 'colour', pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(/g, note: 'use --bg, --fg, --accent or --button-bg' },
  { id: 'size', pattern: /\b\d*\.?\d+px\b/g, note: 'use --space-*, --radius or --border-width' },
];

/** A value that comes from a token, or computes one, is already portable. */
const derived = (value) => /\bvar\(|\bclamp\(|\bcolor-mix\(/.test(value);

/** What would have to change before a bespoke section could become a pattern. */
export function harvestNotes(section) {
  const source = readFileSync(section.file, 'utf8');
  // Only the style block matters: markup can legitimately mention a hex in copy.
  const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const notes = [];

  for (const { id, property, note } of DECLARATIONS) {
    const hits = [
      ...new Set(
        [...styles.matchAll(new RegExp(`${property}\\s*:([^;}]+)`, 'g'))]
          .map((match) => match[1].trim())
          .filter((value) => !derived(value))
          .map((value) => `${property}: ${value}`),
      ),
    ];
    if (hits.length) notes.push({ id, hits, note });
  }

  for (const { id, pattern, note } of LITERALS) {
    const hits = [...new Set(styles.match(pattern) ?? [])];
    if (hits.length) notes.push({ id, hits, note });
  }

  if (!/Astro\.props/.test(source)) {
    notes.push({ id: 'content', hits: [], note: 'the copy looks hard-coded — a pattern takes its content through Astro.props' });
  }
  return notes;
}
