// Which half of a site's life this repo is in, for the scripts that run outside Astro.
// The Astro side reads the same field through src/lib/mode.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const settingsFile = fileURLToPath(new URL('../content/settings.yaml', import.meta.url));

export const MODES = ['build', 'care'];

/** "build" while the site is being designed, "care" once it's live and looked after. */
export function siteMode() {
  const mode = parse(readFileSync(settingsFile, 'utf8'))?.mode ?? 'care';
  if (!MODES.includes(mode)) {
    throw new Error(`content/settings.yaml has mode: ${mode}. It must be one of: ${MODES.join(', ')}.`);
  }
  return mode;
}

/** Rewrite the mode in place, leaving every comment and the rest of the file alone. */
export function setSiteMode(next) {
  if (!MODES.includes(next)) throw new Error(`Unknown mode "${next}". Use one of: ${MODES.join(', ')}.`);
  const raw = readFileSync(settingsFile, 'utf8');
  if (!/^mode:.*$/m.test(raw)) {
    throw new Error('content/settings.yaml has no top-level "mode:" line to change. Add one: mode: care');
  }
  writeFileSync(settingsFile, raw.replace(/^mode:.*$/m, `mode: ${next}`));
  return next;
}
