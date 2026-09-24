// Design lint: the mechanically checkable rules from craft/.
//
// Deliberately greppy rather than a full parser — cheap, deterministic, easy to
// extend. Every finding carries a snippet so it can be verified by eye, and a fix
// so it can be acted on without going back to the docs.
//
// Run via `npm run check`, or on its own with `npm run lint:design`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_FONT_PX = 16;
const CAPS_TRACKING_MIN_EM = 0.06;
const VAR_DEPTH = 4;

// Colors that read as "a machine picked this" (Tailwind indigo/violet family).
const AI_DEFAULT_HEXES = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#818cf8', '#8b5cf6', '#7c3aed', '#a855f7'];

// Origins we knowingly depend on.
const ALLOWED_ORIGINS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'challenges.cloudflare.com'];

const STOCK_IMAGE_HOSTS = ['unsplash.com', 'placehold.co', 'placekitten.com', 'via.placeholder.com', 'picsum.photos', 'loremflickr.com'];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const FILLER_COPY = [
  /lorem ipsum/i,
  /\bfeature (one|two|three)\b/i,
  /\bplaceholder text\b/i,
  /\bsample content\b/i,
  /\byour (headline|text) here\b/i,
  /\bcompany name here\b/i,
];

const INVENTED_METRICS = [
  /\b\d+(?:\.\d+)?\s*(?:×|x)\s+(?:faster|better|more|higher)\b/i,
  /\b9[0-9](?:\.\d+)?%\s*(?:uptime|guaranteed|satisfaction)\b/i,
  /\btrusted by (?:thousands|millions|hundreds)\b/i,
  /\b#1\s+(?:rated|choice|provider)\b/i,
];

/** Token-defining selectors. Values inside these are declarations, not usage. */
const TOKEN_SELECTOR = /^(?::root|html|\[data-theme[^\]]*\]|\.tone-[a-z-]+)$/;

// --- tiny CSS reader ---------------------------------------------------------

/** Flatten CSS into { selector, body } rules, descending through at-rules. */
function readRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  let selectorStart = 0;

  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (char === '{') {
      if (depth === 0) {
        selectorStart = start;
        start = i + 1;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        const selector = css.slice(selectorStart, start - 1).trim();
        const body = css.slice(start, i);
        if (selector.startsWith('@')) {
          rules.push(...readRules(body)); // at-rule: keep the inner rules
        } else {
          rules.push({ selector, body });
        }
        start = i + 1;
      }
    }
  }
  return rules;
}

function readDeclarations(body) {
  return body
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colon = part.indexOf(':');
      if (colon === -1) return null;
      return { prop: part.slice(0, colon).trim().toLowerCase(), value: part.slice(colon + 1).trim() };
    })
    .filter(Boolean);
}

/** Last declaration wins, as in the cascade. */
function lastDecl(decls, prop) {
  return [...decls].reverse().find((d) => d.prop === prop);
}

function isTokenSelector(selector) {
  return selector.split(',').every((part) => TOKEN_SELECTOR.test(part.trim()));
}

function tokenMap(css) {
  const tokens = new Map();
  for (const rule of readRules(css)) {
    if (!isTokenSelector(rule.selector)) continue;
    for (const { prop, value } of readDeclarations(rule.body)) {
      if (prop.startsWith('--')) tokens.set(prop, value);
    }
  }
  return tokens;
}

function resolveVars(value, tokens, depth = 0) {
  if (depth >= VAR_DEPTH || !value.includes('var(')) return value;
  const resolved = value.replace(/var\(\s*(--[\w-]+)\s*(?:,([^)]*))?\)/g, (_, name, fallback) =>
    tokens.get(name) ?? (fallback ? fallback.trim() : ''),
  );
  return resolveVars(resolved, tokens, depth + 1);
}

/** CSS with token-defining blocks removed, so declarations don't look like usage. */
function withoutTokenBlocks(css) {
  let output = '';
  for (const rule of readRules(css)) {
    if (isTokenSelector(rule.selector)) continue;
    output += `${rule.selector}{${rule.body}}\n`;
  }
  return output;
}

// --- findings ----------------------------------------------------------------

function finding(severity, id, file, message, fix, snippet) {
  return { severity, id, file, message, fix, snippet: snippet?.replace(/\s+/g, ' ').trim().slice(0, 120) };
}

function checkCss(css, file, findings, tokens) {
  const usage = withoutTokenBlocks(css);

  for (const hex of AI_DEFAULT_HEXES) {
    const match = new RegExp(`${hex}\\b`, 'i').exec(usage);
    if (match) {
      findings.push(
        finding('P0', 'ai-default-indigo', file, `Uses ${hex}, the default indigo that marks a page as machine-made.`, 'Use the brand accent: var(--accent) or var(--button-bg).', match[0]),
      );
    }
  }

  for (const match of usage.matchAll(/linear-gradient\(([^;]*)\)/gi)) {
    const stops = match[1].toLowerCase();
    const hasViolet = /#(?:6366f1|8b5cf6|7c3aed|a855f7|4f46e5)|purple|violet|indigo/.test(stops);
    const hasBlueCyan = /blue|#[0-9a-f]*(?:3b82f6|2563eb)/.test(stops) && /cyan|teal|#[0-9a-f]*(?:06b6d4|22d3ee)/.test(stops);
    if (hasViolet || hasBlueCyan) {
      findings.push(
        finding('P0', 'default-gradient', file, 'Purple or blue-to-cyan gradient — one of the most recognizable generated-design tells.', 'Use a flat tone (tone-primary or tone-dark) and let the type carry the section.', match[0]),
      );
    }
  }

  const hexes = [...usage.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0]);
  if (hexes.length > 0) {
    findings.push(
      finding('P1', 'hardcoded-color', file, `${hexes.length} hard-coded color${hexes.length === 1 ? '' : 's'} outside the token blocks (${[...new Set(hexes)].slice(0, 4).join(', ')}). Colors must come from brand.yaml so contrast stays guaranteed.`, 'Use --fg, --bg, --accent, --button-bg, --button-fg, or --border.', hexes.slice(0, 4).join(' ')),
    );
  }

  for (const rule of readRules(usage)) {
    const decls = readDeclarations(rule.body);

    const transform = lastDecl(decls, 'text-transform');
    if (transform && /uppercase/i.test(transform.value)) {
      const spacing = lastDecl(decls, 'letter-spacing');
      const resolved = spacing ? resolveVars(spacing.value, tokens) : null;
      if (!trackingIsAdequate(resolved, decls, tokens)) {
        findings.push(
          finding('P1', 'caps-no-tracking', file, `"${rule.selector}" is uppercase with less than 0.06em letter-spacing. All-caps without tracking looks cramped.`, 'Add letter-spacing: var(--tracking-caps).', `${rule.selector} { ${transform.prop}: ${transform.value} }`),
        );
      }
    }

    const fontSize = lastDecl(decls, 'font-size');
    if (fontSize && /^-?\d*\.?\d+(px|rem|em)$/.test(fontSize.value.trim())) {
      findings.push(
        finding('P2', 'raw-font-size', file, `"${rule.selector}" sets a literal font-size (${fontSize.value}) instead of a scale token.`, 'Use one of the --text-* tokens.', `${rule.selector} { font-size: ${fontSize.value} }`),
      );
    }

    const family = lastDecl(decls, 'font-family');
    if (family && !family.value.includes('var(') && !/inherit|initial/i.test(family.value)) {
      findings.push(
        finding('P1', 'raw-font-family', file, `"${rule.selector}" names a typeface directly. Fonts come from brand.yaml.`, 'Use var(--font-heading) or var(--font-body).', `${rule.selector} { font-family: ${family.value} }`),
      );
    }

    const borderLeft = lastDecl(decls, 'border-left');
    const radius = lastDecl(decls, 'border-radius');
    if (borderLeft && /\d+(px|rem|em).*solid/i.test(borderLeft.value) && radius && !/^0/.test(resolveVars(radius.value, tokens))) {
      findings.push(
        finding('P0', 'left-accent-card', file, `"${rule.selector}" is a rounded card with a colored left border — the canonical generated-dashboard tile.`, 'Drop either the radius or the left border.', `${rule.selector} { border-left: ${borderLeft.value} }`),
      );
    }
  }
}

function trackingIsAdequate(resolvedSpacing, decls, tokens) {
  if (!resolvedSpacing) return false;
  const match = /^(-?\d*\.?\d+)\s*(em|rem|px)$/.exec(resolvedSpacing.trim());
  if (!match) return false;
  const [, rawValue, unit] = match;
  const value = Number.parseFloat(rawValue);
  if (unit === 'em') return value >= CAPS_TRACKING_MIN_EM;

  const trackingPx = unit === 'rem' ? value * ROOT_FONT_PX : value;
  const fontSize = lastDecl(decls, 'font-size');
  const resolvedSize = fontSize ? resolveVars(fontSize.value, tokens) : null;
  const sizeMatch = resolvedSize ? /^(-?\d*\.?\d+)(px|rem)$/.exec(resolvedSize.trim()) : null;
  if (sizeMatch) {
    const sizePx = Number.parseFloat(sizeMatch[1]) * (sizeMatch[2] === 'rem' ? ROOT_FONT_PX : 1);
    return sizePx > 0 && trackingPx >= sizePx * CAPS_TRACKING_MIN_EM;
  }
  return trackingPx >= 1; // no font-size in this rule: assume roughly body size
}

function checkHtml(html, file, findings) {
  if (!/^﻿?\s*(?:<!--(?:[^-]|-(?!->))*-->\s*)*<!doctype\s+html/i.test(html)) {
    findings.push(finding('P0', 'missing-doctype', file, 'Page has no doctype, so browsers fall back to quirks mode.', 'Every page renders through BaseLayout, which emits one. Check the layout.'));
  }
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    findings.push(finding('P0', 'missing-viewport', file, 'No viewport meta tag: the page will render at desktop width on phones.', 'Check BaseLayout.'));
  }

  // Only resources the browser actually fetches — a canonical or preconnect link isn't one.
  const fetched = [
    ...html.matchAll(/<script[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi),
    ...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi),
    ...html.matchAll(/<link[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi),
  ];
  for (const [tag, url] of fetched) {
    const host = safeHost(url);
    if (host && !ALLOWED_ORIGINS.includes(host)) {
      findings.push(
        finding('P1', 'external-resource', file, `Loads a resource from ${host}. Third-party requests slow the page and leak visitor data.`, 'Host the file in public/, or add the origin to ALLOWED_ORIGINS if it is deliberate.', tag),
      );
    }
  }

  for (const [tag, src] of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const host = safeHost(src);
    if (host && STOCK_IMAGE_HOSTS.some((stock) => host.endsWith(stock))) {
      findings.push(
        finding('P0', 'hotlinked-image', file, `Image hotlinked from ${host}. It can vanish, and it isn't licensed for this client.`, "Save the image in public/images/ — or ask the client for a real photo.", tag),
      );
    }
  }

  const text = textContent(html);

  for (const pattern of FILLER_COPY) {
    const match = pattern.exec(text);
    if (match) {
      findings.push(
        finding('P0', 'filler-copy', file, `Placeholder text left in the page: "${match[0]}".`, 'Write the real copy, or remove the section and tell the client what you need.', match[0]),
      );
    }
  }

  for (const pattern of INVENTED_METRICS) {
    const match = pattern.exec(text);
    if (match) {
      findings.push(
        finding('P1', 'unverified-metric', file, `Claim that reads as invented: "${match[0]}". Every number on a client site must come from the client.`, 'Confirm the figure with the client, or rewrite the sentence without it.', match[0]),
      );
    }
  }

  for (const [tag, inner] of html.matchAll(/<(?:h[1-6]|button|li)[^>]*>([\s\S]{0,200}?)<\/(?:h[1-6]|button|li)>/gi)) {
    if (EMOJI.test(inner)) {
      findings.push(finding('P0', 'emoji-icon', file, 'Emoji used as an icon in a heading, button, or list item.', 'Use an SVG icon, or nothing.', tag));
    }
  }
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function textContent(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ');
}

// --- entry point -------------------------------------------------------------

function filesUnder(dir, extensions) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path, extensions);
    return extensions.some((ext) => name.endsWith(ext)) ? [path] : [];
  });
}

/** Lint the built site. Returns findings sorted P0 first. */
export function lintSite(distDir) {
  const findings = [];
  const htmlFiles = filesUnder(distDir, ['.html']).map((path) => ({ path, html: readFileSync(path, 'utf8') }));
  const cssFiles = filesUnder(distDir, ['.css']).map((path) => ({ path, css: readFileSync(path, 'utf8') }));

  // Tokens are global at runtime: a rule in a pattern's stylesheet resolves against
  // the :root block the layout inlines. Build one map from every source before checking.
  const styleBlocks = htmlFiles.flatMap(({ path, html }) =>
    [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(([, css]) => ({ path, css })),
  );
  const tokens = new Map();
  for (const { css } of [...cssFiles, ...styleBlocks]) {
    for (const [name, value] of tokenMap(css)) tokens.set(name, value);
  }

  for (const { path, html } of htmlFiles) {
    checkHtml(html, '/' + relative(distDir, path), findings);
  }
  for (const { path, css } of [...styleBlocks, ...cssFiles]) {
    checkCss(css, '/' + relative(distDir, path), findings, tokens);
  }

  // One finding per rule per file is enough to act on.
  const seen = new Set();
  const order = { P0: 0, P1: 1, P2: 2 };
  return findings
    .filter((f) => {
      const key = `${f.id}:${f.file}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Print findings the way an agent can act on them. */
export function reportFindings(findings) {
  for (const f of findings) {
    console.log(`${f.severity} ${f.id} — ${f.file}`);
    console.log(`   ${f.message}`);
    if (f.fix) console.log(`   Fix: ${f.fix}`);
    if (f.snippet) console.log(`   Found: ${f.snippet}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url));
  if (!existsSync(dist)) {
    console.error('No dist/ folder. Run `npm run build` first.');
    process.exit(1);
  }
  const findings = lintSite(dist);
  reportFindings(findings);
  const p0 = findings.filter((f) => f.severity === 'P0').length;
  console.log(
    findings.length === 0
      ? '\n✓ Design lint passed.'
      : `\n${p0 > 0 ? '✗' : '✓'} Design lint: ${p0} must-fix, ${findings.length - p0} to review.`,
  );
  process.exit(p0 > 0 ? 1 : 0);
}
