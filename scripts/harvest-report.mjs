// What's bespoke on this site, and what each file needs before it could be a pattern.
// The reading list for skills/harvest, and for deciding whether a section is worth
// generalising at all: one used on one page probably isn't.
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bespokeUsage, harvestNotes } from './bespoke.mjs';
import { siteMode } from './site-mode.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sections = bespokeUsage();

console.log(`Mode: ${siteMode()}`);

if (!sections.length) {
  console.log('\nNo bespoke sections. Every page is assembled from patterns.');
  process.exit(0);
}

console.log(`\n${sections.length} bespoke section${sections.length === 1 ? '' : 's'} in src/sections/:\n`);

for (const section of sections) {
  const where = section.usedBy.length ? section.usedBy.join(', ') : 'not used by any page';
  console.log(`  ${section.name}  (${where})`);
  console.log(`    ${relative(root, section.file)}`);
  const notes = harvestNotes(section);
  if (!notes.length) {
    console.log('    ready: uses tokens and takes its content as props');
  } else {
    for (const note of notes) {
      const found = note.hits.length ? ` (${note.hits.slice(0, 6).join(', ')}${note.hits.length > 6 ? '…' : ''})` : '';
      console.log(`    ${note.id}${found}: ${note.note}`);
    }
  }
  console.log('');
}

console.log('A section used on one page and unlikely to return is fine to leave bespoke —');
console.log('harvest the ones that earned it. skills/harvest/SKILL.md has the procedure.');
