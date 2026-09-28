// Prints which half of its life this site is in, and what that means for you.
import { siteMode } from './site-mode.mjs';

const mode = siteMode();
const explanations = {
  build: [
    'build — this site is being designed.',
    '',
    '  - Pages can use bespoke sections from src/sections/ as well as patterns.',
    '  - Styling is free: design tokens are there if you want them, not required.',
    '  - `npm run check` reports findings as advice. Only altered testimonials block.',
    '  - Nothing is live, so nothing is routed to the agency for approval.',
    '',
    'Explore designs:  npm run explore',
    'Go live:          npm run graduate',
  ],
  care: [
    'care — this site is live and looked after.',
    '',
    '  - Pages are assembled from the patterns in PATTERNS.md.',
    '  - Every colour, size and spacing comes from a design token.',
    '  - `npm run check` blocks on what it finds.',
    '  - Work in the agency\'s territory gets passed on rather than done (rule 7 in AGENTS.md).',
    '',
    'Reopen the design: npm run graduate -- --to-build',
  ],
};

console.log(explanations[mode].join('\n'));
