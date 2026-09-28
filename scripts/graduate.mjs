// Move a site from build mode to care mode: the point where a design stops being
// explored and starts being looked after. Everything bespoke has to become a pattern
// first, because care mode's promise is that a page is assembled from things with a
// schema, a version and a SKILL.md — that's what makes an edit safe a year from now.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bespokeUsage } from './bespoke.mjs';
import { setSiteMode, siteMode } from './site-mode.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--check');
const back = args.includes('--to-build');

if (back) {
  setSiteMode('build');
  console.log('This site is back in build mode. Checks advise instead of blocking, and');
  console.log('bespoke sections in src/sections/ can be used again.');
  process.exit(0);
}

if (siteMode() === 'care') {
  console.log('This site is already in care mode. To reopen it for design work: npm run graduate -- --to-build');
  process.exit(0);
}

const inUse = bespokeUsage().filter((section) => section.usedBy.length > 0);
if (inUse.length) {
  console.error('Not ready for care mode yet. These bespoke sections are still on pages:\n');
  for (const section of inUse) console.error(`  ${section.name} — used by ${section.usedBy.join(', ')}`);
  console.error('\nTurn each into a pattern, or replace it with one. The procedure is in');
  console.error('skills/harvest/SKILL.md, and `npm run harvest-report` says what each one needs.');
  process.exit(1);
}

if (dryRun) {
  console.log('Nothing bespoke is in use. `npm run graduate` would switch this site to care mode.');
  process.exit(0);
}

setSiteMode('care');
console.log('Switched to care mode. Running the checks the way CI will run them…\n');

try {
  execFileSync('npm', ['run', 'check'], { cwd: root, stdio: 'inherit' });
} catch {
  console.error('\nThe site is in care mode, but the checks fail. They block now — fix them');
  console.error('before this goes live, or reopen the design with: npm run graduate -- --to-build');
  process.exit(1);
}

console.log('\nThis site is in care mode. From here:');
console.log('  - pages are assembled from patterns in PATTERNS.md');
console.log('  - every value comes from a design token');
console.log('  - the checks block, and work in the agency\'s territory gets passed on (rule 7)');
