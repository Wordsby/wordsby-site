// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { parse } from 'yaml';

// The production URL lives in content/settings.yaml so there's one place to change it.
const settings = parse(readFileSync(new URL('./content/settings.yaml', import.meta.url), 'utf8'));

// https://astro.build/config
export default defineConfig({
  site: settings?.site?.url,
});
