// Tests for check-quotes.mjs. Run with `npm test` (node --test).
// Each test builds a small fixture site in a temp folder: pages plus a quote record.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { checkQuotes, parseRecord } from './check-quotes.mjs';

const PORSCHE = `My brand new Porsche was rear ended by an inattentive driver. The damages to my custom ordered car was in excess of $19,000. Frustrated, I contacted Stan about a diminished value claim.

Upon hiring him, he went to work on it immediately. After all was said and done, Stan was able to convince the insurance company to pay me $9,000 in diminished value!

I couldn't ask for a better result or customer service.
`;

const KIM = `“After the accident the insurance company refused to give us enough. He was always available to answer questions and displayed substantial knowledge and experience in this areaif you've been in an accident, consulting Stan is the best choice you can make. ”
`;

const RECORD = [
  { name: 'Matthew R.', source: 'https://example.com/contact/', quote: PORSCHE },
  { name: 'Josh B', source: 'https://example.com/contact/', quote: 'Stan was able to make them pay $50,800 including sales tax. Stan is the man.\n' },
  { name: 'G.Smith, Brentwood, TN.', source: 'https://example.com/contact/', quote: 'Stan immediately took over my claim. I highly recommend this business.\n' },
  { name: 'Kim I.', source: 'https://example.com/contact/', quote: KIM },
];

/** Builds a fixture site and returns the check's result. */
function run(items, record = RECORD) {
  const root = mkdtempSync(join(tmpdir(), 'check-quotes-'));
  try {
    mkdirSync(join(root, 'content/pages'), { recursive: true });
    const sections = items === null ? [] : [{ pattern: 'testimonials', heading: 'Reviews', items }];
    writeFileSync(join(root, 'content/pages/index.md'), `---\n${stringify({ title: 'Home', description: 'x', sections })}---\n`);
    if (record !== null) {
      writeFileSync(join(root, 'content/quotes.yaml'), typeof record === 'string' ? record : stringify(record));
    }
    return checkQuotes(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const passes = (result) => assert.deepEqual(result.errors, []);
function fails(result, ...fragments) {
  assert.equal(result.errors.length, 1, `expected one error, got:\n${result.errors.join('\n')}`);
  for (const fragment of fragments) assert.match(result.errors[0], fragment);
}

test('an exact quote passes', () => {
  passes(run([{ quote: PORSCHE, name: 'Matthew R.' }]));
});

test('differences in spacing, line breaks, and curly quotes pass', () => {
  const retyped = PORSCHE.replace(/\n+/g, ' ').replace('  ', ' ').replace("couldn't", 'couldn’t').replace('Porsche was', 'Porsche  was');
  passes(run([{ quote: retyped, name: 'Matthew R.' }]));
  passes(run([{ quote: 'After the accident the insurance company refused to give us enough.', name: 'Kim I.' }]));
});

test('one unbroken passage passes', () => {
  passes(run([{ quote: 'Frustrated, I contacted Stan about a diminished value claim. Upon hiring him, he went to work on it immediately.', name: 'Matthew R.' }]));
});

test('an added hyphen fails, and says what changed', () => {
  fails(
    run([{ quote: 'My brand new Porsche was rear-ended by an inattentive driver.', name: 'Matthew R.' }]),
    /index\.md/,
    /Matthew R\./,
    /changes "rear ended" to "rear-ended"/,
  );
});

test('passages joined with an ellipsis pass', () => {
  passes(run([{ quote: 'My brand new Porsche was rear ended by an inattentive driver. … Stan was able to convince the insurance company to pay me $9,000 in diminished value!', name: 'Matthew R.' }]));
  passes(run([{ quote: 'My brand new Porsche was rear ended by an inattentive driver... I couldn\'t ask for a better result or customer service.', name: 'Matthew R.' }]));
});

test('passages joined without an ellipsis fail', () => {
  fails(
    run([{ quote: 'Frustrated, I contacted Stan about a diminished value claim. After all was said and done, Stan was able to convince the insurance company to pay me $9,000 in diminished value!', name: 'Matthew R.' }]),
    /leaves out "Upon hiring him, he went to work on it immediately\."/,
    /no ellipsis/,
  );
});

test('passages out of order fail', () => {
  fails(
    run([{ quote: "I couldn't ask for a better result or customer service. … My brand new Porsche was rear ended by an inattentive driver.", name: 'Matthew R.' }]),
    /different order/,
  );
});

test('a passage that starts or ends partway through a word fails', () => {
  fails(run([{ quote: 'ear ended by an inattentive driver.', name: 'Matthew R.' }]));
});

test('"Josh B." for "Josh B" fails', () => {
  fails(
    run([{ quote: 'Stan is the man.', name: 'Josh B.' }]),
    /credits the customer differently/,
    /On the page: name "Josh B\."/,
    /In the record \(https:\/\/example\.com\/contact\/\): name "Josh B"/,
  );
});

test('splitting a published credit into name and role fails', () => {
  fails(
    run([{ quote: 'I highly recommend this business.', name: 'G. Smith', role: 'Brentwood, TN' }]),
    /name "G\. Smith", role "Brentwood, TN"/,
    /name "G\.Smith, Brentwood, TN\.", no role/,
  );
  fails(run([{ quote: 'I highly recommend this business.', name: 'G.Smith', role: 'Brentwood, TN.' }]));
});

test('a quote missing from the record fails and says to add it', () => {
  fails(
    run([{ quote: 'The best pottery class in town, hands down.', name: 'Dana R.' }]),
    /"Dana R\."/,
    /isn't in content\/quotes\.yaml/,
    /word for word/,
  );
});

test('a site with testimonials but no record fails', () => {
  fails(run([{ quote: 'Stan is the man.', name: 'Josh B' }], null), /no content\/quotes\.yaml/);
});

test('a site with no testimonials passes with a note', () => {
  const result = run(null, null);
  passes(result);
  assert.match(result.note, /No testimonials/);
});

test('an approved change to the words passes; unapproved changes still fail', () => {
  const record = structuredClone(RECORD);
  record[3].approved = [{ change: "areaif you've", to: "area. If you've", reason: 'Typo on the old site; client agreed 2026-09-16.' }];
  const fixed = "He was always available to answer questions and displayed substantial knowledge and experience in this area. If you've been in an accident, consulting Stan is the best choice you can make.";
  passes(run([{ quote: fixed, name: 'Kim I.' }], record));
  passes(run([{ quote: KIM, name: 'Kim I.' }], record)); // the original is still fine
  fails(run([{ quote: fixed, name: 'Kim I.' }]), /changes "areaif" to "area\. If"/);
  fails(run([{ quote: fixed.replace('questions', 'any questions'), name: 'Kim I.' }], record), /adds "any"/);
});

test('an approved change to the credit passes', () => {
  const record = structuredClone(RECORD);
  record[2].approved = [{ name: 'G. Smith', role: 'Brentwood, TN', reason: 'Client asked for the place on its own line, 2026-09-16.' }];
  passes(run([{ quote: 'I highly recommend this business.', name: 'G. Smith', role: 'Brentwood, TN' }], record));
  passes(run([{ quote: 'I highly recommend this business.', name: 'G.Smith, Brentwood, TN.' }], record));
  fails(run([{ quote: 'I highly recommend this business.', name: 'G. Smith', role: 'Brentwood, TN.' }], record));
});

test('the record itself is validated', () => {
  assert.match(parseRecord('- name: A\n  quote: Hi\n').errors.join('\n'), /"source" is missing/);
  assert.match(
    parseRecord('- name: A\n  source: x\n  quote: Hi there\n  approved:\n    - name: B\n').errors.join('\n'),
    /needs a "reason"/,
  );
  assert.match(
    parseRecord('- name: A\n  source: x\n  quote: Hi there\n  approved:\n    - change: Bye\n      to: Hello\n      reason: r\n').errors.join('\n'),
    /isn't in the recorded quote/,
  );
  assert.match(parseRecord('- name: A\n  source: x\n  quote: Hi\n  aproved: []\n').errors.join('\n'), /unknown field "aproved"/);
});
