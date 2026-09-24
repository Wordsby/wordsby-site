// Regenerates the installed-patterns table in PATTERNS.md from each src/patterns/*/SKILL.md.
// Usage: node scripts/patterns-index.mjs          (update PATTERNS.md)
//        node scripts/patterns-index.mjs --check  (exit 1 if PATTERNS.md is out of date)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = new URL('../', import.meta.url);
const START = '<!-- patterns:start -->';
const END = '<!-- patterns:end -->';

export function patternsTable() {
  const dir = new URL('src/patterns/', root);
  const rows = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => {
      const skill = new URL(`${entry.name}/SKILL.md`, dir);
      if (!existsSync(skill)) throw new Error(`src/patterns/${entry.name}/ is missing SKILL.md`);
      const frontmatter = readFileSync(skill, 'utf8').match(/^---\n([\s\S]*?)\n---/);
      const meta = frontmatter ? parse(frontmatter[1]) : {};
      if (meta.name !== entry.name) {
        throw new Error(`src/patterns/${entry.name}/SKILL.md must have "name: ${entry.name}" in its frontmatter`);
      }
      const version = meta.metadata?.version ?? '?';
      return `| [${meta.name}](src/patterns/${meta.name}/SKILL.md) | ${version} | ${meta.description} |`;
    })
    .sort();
  return ['| Pattern | Version | Use it for |', '|---|---|---|', ...rows].join('\n');
}

/** Returns true if PATTERNS.md already matches (or was updated to match) the installed patterns. */
export function syncPatternsFile({ check = false } = {}) {
  const file = new URL('PATTERNS.md', root);
  const current = readFileSync(file, 'utf8');
  const start = current.indexOf(START);
  const end = current.indexOf(END);
  if (start === -1 || end === -1) throw new Error(`PATTERNS.md must contain ${START} and ${END} markers`);
  const next = `${current.slice(0, start + START.length)}\n${patternsTable()}\n${current.slice(end)}`;
  if (next === current) return true;
  if (!check) writeFileSync(file, next);
  return !check;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const ok = syncPatternsFile({ check });
  if (!ok) {
    console.error('PATTERNS.md is out of date. Run: npm run patterns:index');
    process.exit(1);
  }
  if (!check) console.log('PATTERNS.md is up to date.');
}
