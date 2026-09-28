// Reading and writing a site's mode. The mode decides whether the checks block, so
// a silent misread would either strand a live site without gates or leave a design
// phase unable to move.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const settingsFile = fileURLToPath(new URL('../content/settings.yaml', import.meta.url));
const original = readFileSync(settingsFile, 'utf8');

const { siteMode, setSiteMode, MODES } = await import('./site-mode.mjs');

afterEach(() => writeFileSync(settingsFile, original));

test('the starter ships in build mode', () => {
  assert.equal(siteMode(), 'build');
});

test('a site with no mode line is in care mode', () => {
  // Sites created before modes existed are live sites. Defaulting the other way would
  // quietly drop the gates on every one of them.
  writeFileSync(settingsFile, original.replace(/^mode:.*$/m, ''));
  assert.equal(siteMode(), 'care');
});

test('setSiteMode round-trips and keeps the rest of the file', () => {
  setSiteMode('care');
  assert.equal(siteMode(), 'care');
  setSiteMode('build');
  assert.equal(siteMode(), 'build');
  assert.equal(readFileSync(settingsFile, 'utf8'), original);
});

test('an unknown mode is refused rather than guessed at', () => {
  assert.throws(() => setSiteMode('freestyle'), /Unknown mode/);
  writeFileSync(settingsFile, original.replace(/^mode:.*$/m, 'mode: freestyle'));
  assert.throws(() => siteMode(), /must be one of/);
});

test('a file with no mode line to change says so', () => {
  writeFileSync(settingsFile, original.replace(/^mode:.*$/m, ''));
  assert.throws(() => setSiteMode('care'), /no top-level "mode:" line/);
});

test('the modes are exactly build and care', () => {
  assert.deepEqual(MODES, ['build', 'care']);
});
