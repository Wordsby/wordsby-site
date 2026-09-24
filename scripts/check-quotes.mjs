// Checks every testimonial on the site against content/quotes.yaml, the committed
// record of what each customer actually wrote and how they were credited.
//
// Runs inside `npm run check` (via check-site.mjs), or on its own:
//   node scripts/check-quotes.mjs
//
// Rules:
// - A quote must appear word for word in the record. Only spacing, line breaks,
//   curly vs straight quote marks and apostrophes, and en vs em dashes are ignored.
//   A hyphen added or removed is a difference.
// - A quote may be trimmed: one unbroken passage, or several passages joined with
//   an ellipsis ("…" or "..."), in the order the customer wrote them.
// - The name (and role, if any) must match the record exactly.
// - A deliberate change is allowed only when it's listed under `approved` in the
//   record, with a reason, so it shows up in the pull request.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const RECORD_PATH = 'content/quotes.yaml';

const WORD = /[\p{L}\p{N}'-]/u;
const ELLIPSIS = '…';

// ---------------------------------------------------------------------------
// Text normalisation

/** Normalises only what doesn't change a customer's words. */
export function normalise(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/–/g, '—')
    .replace(/\[\s*(?:…|\.\.\.)\s*\]/g, ELLIPSIS)
    .replace(/\.\.\./g, ELLIPSIS)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Quote marks wrapped around a whole testimonial are presentation, not content. */
function unwrap(text) {
  return text.replace(/^"\s*/, '').replace(/\s*"$/, '').trim();
}

const prepare = (text) => unwrap(normalise(text));
const sameText = (a, b) => normalise(a) === normalise(b);
const hasRole = (role) => role !== undefined && role !== null && normalise(role) !== '';

function atWordBoundary(text, start, end) {
  const before = start > 0 && WORD.test(text[start - 1]) && WORD.test(text[start]);
  const after = end < text.length && WORD.test(text[end]) && WORD.test(text[end - 1]);
  return !before && !after;
}

/** Leftmost occurrence of `span` in `text` at or after `from`, on word boundaries. */
function findSpan(text, span, from = 0) {
  let index = text.indexOf(span, from);
  while (index !== -1) {
    if (atWordBoundary(text, index, index + span.length)) return index;
    index = text.indexOf(span, index + 1);
  }
  return -1;
}

const spansOf = (quote) => quote.split(ELLIPSIS).map((s) => s.trim()).filter(Boolean);

/**
 * True if `pageQuote` is the recorded quote, one unbroken passage of it, or
 * passages of it joined with an ellipsis in their original order.
 */
export function quoteMatches(recordedQuote, pageQuote) {
  const recorded = prepare(recordedQuote);
  const spans = spansOf(prepare(pageQuote));
  if (spans.length === 0) return false;
  let position = 0;
  for (const span of spans) {
    const index = findSpan(recorded, span, position);
    if (index === -1) return false;
    position = index + span.length;
  }
  return true;
}

function outOfOrder(recordedQuote, pageQuote) {
  const recorded = prepare(recordedQuote);
  const spans = spansOf(prepare(pageQuote));
  return spans.length > 1 && spans.every((span) => findSpan(recorded, span) !== -1);
}

// ---------------------------------------------------------------------------
// Explaining a difference in plain words

const tokens = (text) => prepare(text).replaceAll(ELLIPSIS, ` ${ELLIPSIS} `).split(' ').filter(Boolean);

/** Longest common subsequence of two token lists, as matched index pairs. */
function align(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * cols + j] =
        a[i] === b[j] ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i++, j++]);
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

function similarity(recordedQuote, pageQuote) {
  const page = tokens(pageQuote).filter((t) => t !== ELLIPSIS);
  if (page.length === 0) return 0;
  return align(page, tokens(recordedQuote)).length / page.length;
}

function shorten(words, max = 12) {
  if (words.length <= max) return words.join(' ');
  return `${words.slice(0, 6).join(' ')} … ${words.slice(-4).join(' ')}`;
}

/** Lists what changed between a recorded quote and the page's version, in plain words. */
export function describeDifferences(recordedQuote, pageQuote) {
  const page = tokens(pageQuote);
  const record = tokens(recordedQuote);
  const pairs = align(page, record);
  const changes = [];
  const context = (recordIndex) => {
    const before = record.slice(Math.max(0, recordIndex - 4), recordIndex);
    return before.length ? ` after "${before.join(' ')}"` : ' at the start';
  };

  if (pairs.length === 0) return ['None of the wording matches.'];

  // Words on the page before the first match or after the last.
  const leading = page.slice(0, pairs[0][0]).filter((t) => t !== ELLIPSIS);
  if (leading.length) changes.push(`starts with "${shorten(leading)}", which the customer didn't write${context(pairs[0][1])}`);

  // Gaps between matched words, as half-open ranges on the page and in the record.
  const gaps = [];
  for (let k = 0; k < pairs.length - 1; k++) {
    const [p0, r0] = pairs[k];
    const [p1, r1] = pairs[k + 1];
    if (p1 === p0 + 1 && r1 === r0 + 1) continue;
    const gap = { page: [p0 + 1, p1], record: [r0 + 1, r1] };
    const previous = gaps[gaps.length - 1];
    // Read two changes a word or two apart as one change.
    if (previous && gap.record[0] - previous.record[1] <= 2 && gap.page[0] - previous.page[1] <= 2) {
      previous.page[1] = gap.page[1];
      previous.record[1] = gap.record[1];
    } else {
      gaps.push(gap);
    }
  }

  for (const gap of gaps) {
    const pageGap = page.slice(...gap.page);
    const recordGap = record.slice(...gap.record);
    const added = pageGap.filter((t) => t !== ELLIPSIS);
    const where = context(gap.record[0]);
    if (added.length === 0 && pageGap.length > 0) continue; // a gap marked with an ellipsis
    if (added.length === 0) {
      changes.push(`leaves out "${shorten(recordGap)}"${where} with no ellipsis (…) to show the gap`);
    } else if (recordGap.length === 0) {
      changes.push(`adds "${shorten(added)}"${where}`);
    } else {
      changes.push(`changes "${shorten(recordGap)}" to "${shorten(pageGap)}"${where}`);
    }
  }

  const last = pairs[pairs.length - 1];
  const trailing = page.slice(last[0] + 1).filter((t) => t !== ELLIPSIS);
  if (trailing.length) changes.push(`ends with "${shorten(trailing)}", which the customer didn't write${context(last[1] + 1)}`);

  if (changes.length === 0) {
    changes.push('differs in punctuation or spacing inside a word; compare the two closely');
  }
  return changes;
}

// ---------------------------------------------------------------------------
// The record

const ENTRY_KEYS = new Set(['name', 'role', 'source', 'quote', 'approved']);
const APPROVAL_KEYS = new Set(['change', 'to', 'name', 'role', 'reason']);

/** Reads and validates the record. Returns { entries, errors }. */
export function parseRecord(text, file = RECORD_PATH) {
  const errors = [];
  let data;
  try {
    data = parse(text);
  } catch (error) {
    return { entries: [], errors: [`${file} isn't valid YAML: ${error.message.split('\n')[0]}`] };
  }
  if (data === null || data === undefined) return { entries: [], errors };
  if (!Array.isArray(data)) {
    return { entries: [], errors: [`${file} must be a list of quotes, each starting with "- name:".`] };
  }

  const entries = [];
  data.forEach((entry, index) => {
    const at = `${file}, quote ${index + 1}${entry?.name ? ` (${entry.name})` : ''}`;
    if (!entry || typeof entry !== 'object') {
      errors.push(`${at}: each quote needs name, source, and quote.`);
      return;
    }
    const unknown = Object.keys(entry).filter((key) => !ENTRY_KEYS.has(key));
    if (unknown.length) errors.push(`${at}: unknown field "${unknown[0]}". Allowed: name, role, source, quote, approved.`);
    for (const key of ['name', 'source', 'quote']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) errors.push(`${at}: "${key}" is missing.`);
    }
    if (entry.role !== undefined && entry.role !== null && typeof entry.role !== 'string') {
      errors.push(`${at}: "role" must be text.`);
    }
    const approvals = entry.approved ?? [];
    if (!Array.isArray(approvals)) {
      errors.push(`${at}: "approved" must be a list.`);
    } else {
      approvals.forEach((approval, n) => {
        const where = `${at}, approved change ${n + 1}`;
        if (!approval || typeof approval !== 'object') return errors.push(`${where}: must have a reason and a change.`);
        const extra = Object.keys(approval).filter((key) => !APPROVAL_KEYS.has(key));
        if (extra.length) errors.push(`${where}: unknown field "${extra[0]}". Allowed: change, to, name, role, reason.`);
        if (typeof approval.reason !== 'string' || !approval.reason.trim()) {
          errors.push(`${where}: needs a "reason" saying why the change is OK and who agreed to it.`);
        }
        const changesText = approval.change !== undefined || approval.to !== undefined;
        if (!changesText && !('name' in approval) && !('role' in approval)) {
          errors.push(`${where}: needs "change" and "to", or a "name" or "role" to allow.`);
        }
        if (changesText) {
          if (typeof approval.change !== 'string' || typeof approval.to !== 'string') {
            errors.push(`${where}: "change" and "to" go together, and both must be text.`);
          } else if (typeof entry.quote === 'string' && !prepare(entry.quote).includes(normalise(approval.change))) {
            errors.push(`${where}: "${approval.change}" isn't in the recorded quote, so there's nothing to change.`);
          }
        }
      });
    }
    entries.push({ ...entry, approved: Array.isArray(approvals) ? approvals : [], index });
  });
  return { entries, errors };
}

/** The recorded version plus every combination of its approved changes. */
function versionsOf(entry) {
  const approvals = entry.approved.filter((a) => typeof a?.reason === 'string' && a.reason.trim());
  const subsets = [];
  if (approvals.length <= 6) {
    for (let mask = 0; mask < 1 << approvals.length; mask++) {
      subsets.push(approvals.filter((_, i) => mask & (1 << i)));
    }
  } else {
    subsets.push([], ...approvals.map((a) => [a]), approvals);
  }
  return subsets.map((applied) => {
    const version = { quote: prepare(entry.quote), name: entry.name, role: entry.role, approved: applied.length > 0 };
    for (const approval of applied) {
      if (typeof approval.change === 'string' && typeof approval.to === 'string') {
        version.quote = version.quote.replace(normalise(approval.change), normalise(approval.to));
      }
      if ('name' in approval) version.name = approval.name;
      if ('role' in approval) version.role = approval.role;
    }
    return version;
  });
}

const attributionMatches = (version, item) =>
  sameText(version.name, item.name) &&
  (hasRole(version.role) || hasRole(item.role) ? sameText(version.role, item.role) : true);

function credit(name, role) {
  return hasRole(role) ? `name "${name}", role "${role}"` : `name "${name}", no role`;
}

const looseName = (name) => normalise(name).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// ---------------------------------------------------------------------------
// The check

const FIX_QUOTE =
  'Quote customers word for word. To shorten a quote, cut whole passages and mark each gap with "…". ' +
  `If the change is deliberate and the client agreed, list it under "approved" for this quote in ${RECORD_PATH}, with a reason.`;
const FIX_CREDIT =
  'Credit customers exactly as they were published: don\'t add or drop full stops, fix spacing, or split a name from a place. ' +
  `If the client wants it changed, list the new name or role under "approved" for this quote in ${RECORD_PATH}, with a reason.`;

/**
 * Checks testimonials against the record.
 * pages: [{ file, sections }]; record: text of content/quotes.yaml, or null if missing.
 * Returns { errors, note, count }.
 */
export function checkTestimonials(pages, recordText) {
  const items = [];
  for (const page of pages) {
    (page.sections ?? []).forEach((section, s) => {
      if (section?.pattern !== 'testimonials') return;
      (section.items ?? []).forEach((item, n) => {
        const place = section.heading ? `in "${section.heading}"` : `in testimonials section ${s + 1}`;
        items.push({ ...item, file: page.file, place: `${place}, quote ${n + 1}` });
      });
    });
  }

  if (items.length === 0) return { errors: [], note: 'No testimonials on any page; nothing to check.', count: 0 };
  if (recordText === null || recordText === undefined) {
    return {
      errors: [
        `This site has ${items.length} testimonial(s) but no ${RECORD_PATH}. Create it and add every testimonial word for word, ` +
          'with the name exactly as published and where it came from (the old page\'s address, or the client\'s message and its date).',
      ],
      count: items.length,
    };
  }

  const { entries, errors } = parseRecord(recordText);
  const versions = entries.map((entry) => ({ entry, versions: versionsOf(entry) }));

  for (const item of items) {
    const who = `${item.file}: the testimonial from "${item.name ?? '(no name)'}" (${item.place})`;
    const pageQuote = item.quote ?? '';

    // Exact match, or an approved one.
    const passes = versions.some(({ versions }) =>
      versions.some((v) => quoteMatches(v.quote, pageQuote) && attributionMatches(v, item)),
    );
    if (passes) continue;

    // The words are right; the credit isn't.
    const wordsMatch = versions.filter(({ versions }) => versions.some((v) => quoteMatches(v.quote, pageQuote)));
    if (wordsMatch.length) {
      const best = wordsMatch.find(({ entry }) => looseName(entry.name).startsWith(looseName(item.name ?? ''))) ?? wordsMatch[0];
      errors.push(
        `${who} credits the customer differently from the record.\n` +
          `  On the page: ${credit(item.name, item.role)}\n` +
          `  In the record (${best.entry.source}): ${credit(best.entry.name, best.entry.role)}\n` +
          `  ${FIX_CREDIT}`,
      );
      continue;
    }

    // The closest recorded quote: prefer the same customer, then the most shared wording.
    let closest = null;
    for (const { entry, versions: vs } of versions) {
      for (const version of vs) {
        const sameCustomer = looseName(entry.name).startsWith(looseName(item.name ?? '')) && looseName(item.name ?? '') !== '';
        const score = similarity(version.quote, pageQuote) + (sameCustomer ? 0.25 : 0);
        const better =
          !closest ||
          score > closest.score ||
          (score === closest.score && attributionMatches(version, item) && !attributionMatches(closest.version, item));
        if (better) closest = { entry, version, score, sameCustomer, raw: score - (sameCustomer ? 0.25 : 0) };
      }
    }
    const threshold = closest?.sameCustomer ? 0.55 : 0.6;

    if (!closest || closest.score < threshold) {
      errors.push(
        `${who} isn't in ${RECORD_PATH}. ` +
          'If it\'s a real quote, add it there first, word for word, with the name exactly as published and where it came from ' +
          '(the old page\'s address, or the client\'s message and its date). Never write or reword a testimonial.',
      );
      continue;
    }

    const { entry, version } = closest;
    const lines = [`${who} doesn't match what the customer wrote.`];
    lines.push(`  Closest recorded quote: ${entry.name}${hasRole(entry.role) ? `, ${entry.role}` : ''} (${entry.source})`);
    if (outOfOrder(version.quote, pageQuote)) {
      lines.push('  - The passages joined by "…" are all in that quote, but in a different order. Keep them in the order the customer wrote them.');
    } else {
      for (const change of describeDifferences(version.quote, pageQuote)) lines.push(`  - The page ${change}.`);
    }
    if (!attributionMatches(version, item)) {
      lines.push(`  - The credit differs too. On the page: ${credit(item.name, item.role)}; in the record: ${credit(version.name, version.role)}.`);
    }
    lines.push(`  ${FIX_QUOTE}`);
    if (closest.raw < 0.8) {
      lines.push(`  If this is a different quote altogether, add it to ${RECORD_PATH} word for word, with where it came from.`);
    }
    errors.push(lines.join('\n'));
  }

  return { errors, count: items.length };
}

// ---------------------------------------------------------------------------
// Reading a site from disk

function markdownFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return name.endsWith('.md') ? [path] : [];
  });
}

/** Checks the site rooted at `root` (defaults to this site). */
export function checkQuotes(root = fileURLToPath(new URL('../', import.meta.url))) {
  const errors = [];
  const pages = [];
  for (const path of markdownFiles(join(root, 'content/pages'))) {
    const file = relative(root, path);
    const frontmatter = readFileSync(path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) continue;
    try {
      pages.push({ file, sections: parse(frontmatter[1])?.sections ?? [] });
    } catch (error) {
      errors.push(`${file}: couldn't read the frontmatter to check quotes: ${error.message.split('\n')[0]}`);
    }
  }
  const recordFile = join(root, RECORD_PATH);
  const record = existsSync(recordFile) ? readFileSync(recordFile, 'utf8') : null;
  const result = checkTestimonials(pages, record);
  return { ...result, errors: [...errors, ...result.errors] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { errors, note, count } = checkQuotes();
  for (const error of errors) console.error(`error: ${error}`);
  if (errors.length) {
    console.error(`\n✗ Quote check failed with ${errors.length} error(s).`);
    process.exit(1);
  }
  console.log(note ?? `✓ All ${count} testimonial(s) match ${RECORD_PATH}.`);
}
