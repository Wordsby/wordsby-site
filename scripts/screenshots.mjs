// Screenshots pages from the built site so you can look at your work, and audits
// their layout while it has the page open.
// Usage: npm run screenshots -- / /contact/ /classes/ [--fail-on-issues]
// Full-page images land in .screenshots/ at desktop (1280px) and mobile (390px)
// widths, alongside .screenshots/audit.json with every layout finding.
//
// Chrome is driven over the DevTools protocol rather than with --screenshot, because
// its headless window has a ~500px minimum width: plain --window-size=390 silently
// renders a desktop layout and crops it, which makes mobile screenshots lie.
//
// Two jobs, in this order, for every page at every width:
//   1. Freeze the page. Motion is zeroed, animations are parked on their end
//      frame, fonts and images are waited for, and layout has to hold still for
//      three frames. Without that, two runs of this script on an unchanged site
//      produce different images and "did my change do that?" is unanswerable.
//   2. Audit the frozen layout: text cut off by its container, text printed on
//      top of other text, and content wider than the viewport. These are the
//      three ways a page looks broken that a human notices instantly and a
//      Markdown diff never shows.
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VIEWPORTS = [
  { label: 'desktop', width: 1280, height: 900, mobile: false },
  { label: 'mobile', width: 390, height: 844, mobile: true },
];

// Geometry tolerances. A line box has to lose more than TOLERANCE_PX to count as
// clipped, and two line boxes have to share more than TOLERANCE_PX on both axes
// AND a fifth of the smaller box to count as colliding — line boxes include
// leading, so stacked lines touch by a pixel or two in normal, correct layouts.
const TOLERANCE_PX = 2;
const MATERIAL_OVERLAP_RATIO = 0.2;
const EXCERPT_CHARS = 80;

const RESOURCE_WAIT_MS = 5_000; // per font/image; every wait resolves on timeout
const STABLE_FRAMES = 3;
const STABILITY_BUDGET_MS = 10_000;
const EVALUATE_BUDGET_MS = 30_000; // backstop for a renderer that stops answering
const MAX_FINDINGS_PER_VIEW = 50; // one broken container can produce hundreds

// Motion is zeroed on `*` and both pseudo-elements with !important because author
// stylesheets routinely set these on `*` themselves. The caret and cursor rules
// are for byte-for-byte repeatability: a blinking caret is a difference between
// two captures of the same document.
const FROZEN_MOTION_CSS =
  '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;' +
  'transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important}' +
  '*{caret-color:transparent!important;cursor:none!important}';

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chrome = CHROME_PATHS.find((path) => existsSync(path));
if (!chrome) {
  console.error('No Chrome or Chromium found. Set CHROME_PATH to your browser, or open the pages with `npm run dev`.');
  process.exit(1);
}

const root = new URL('../', import.meta.url);
const dist = fileURLToPath(new URL('dist/', root));
if (!existsSync(dist)) {
  console.error('No dist/ folder. Run `npm run build` first.');
  process.exit(1);
}

// --- arguments --------------------------------------------------------------

const args = process.argv.slice(2);
const failOnIssues = args.includes('--fail-on-issues');
const allPages = args.includes('--all');
for (const flag of args.filter((arg) => arg.startsWith('--'))) {
  if (flag !== '--fail-on-issues' && flag !== '--all') console.error(`Ignoring unknown option ${flag}.`);
}
const paths = args.filter((arg) => !arg.startsWith('--')).map((path) => (path.startsWith('/') ? path : `/${path}`));

// --all audits every page in the sitemap, which is what CI wants.
if (allPages) {
  const sitemap = join(dist, 'sitemap.xml');
  if (!existsSync(sitemap)) {
    console.error('No dist/sitemap.xml, so --all has nothing to read. Run `npm run build` first.');
    process.exit(1);
  }
  for (const [, loc] of readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = new URL(loc).pathname;
    if (!paths.includes(path)) paths.push(path);
  }
}
if (!paths.length) paths.push('/');

const outDir = fileURLToPath(new URL('.screenshots/', root));
mkdirSync(outDir, { recursive: true });

// --- static server for dist/ ------------------------------------------------

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

const server = createServer((request, response) => {
  const path = decodeURI(new URL(request.url, 'http://localhost').pathname);
  const candidates = [join(dist, path), join(dist, path, 'index.html'), `${join(dist, path)}.html`];
  const file = candidates.find((c) => existsSync(c) && statSync(c).isFile());
  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));

// --- Chrome over the DevTools protocol --------------------------------------

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.lastId = 0;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const waiting = message.id && this.pending.get(message.id);
      if (waiting) {
        this.pending.delete(message.id);
        message.error ? waiting.reject(new Error(message.error.message)) : waiting.resolve(message.result);
      } else {
        for (const listener of this.listeners) listener(message);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.lastId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  waitFor(method) {
    return new Promise((resolve) => {
      const listener = (message) => {
        if (message.method === method) {
          this.listeners.delete(listener);
          resolve(message);
        }
      };
      this.listeners.add(listener);
    });
  }
}

// --- scripts that run inside the page ---------------------------------------
//
// Each of these is stringified and handed to Runtime.evaluate, so it runs in
// Chrome rather than here: it can't close over anything in this file, takes one
// JSON argument, and returns JSON.

// Zero out declarative motion, then park every running animation. A transition
// caught mid-flight renders a half-faded element, and `scroll-behavior:smooth`
// turns a programmatic scroll into an animation the capture races.
function freezeMotion(css) {
  try {
    const style = document.createElement('style');
    style.setAttribute('data-screenshot-freeze', '1');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  } catch {
    // A page that refuses the injection still gets captured; the animation
    // parking below and the blank-page guard are what decide if it's usable.
  }

  let finished = 0;
  let paused = 0;
  const animations = typeof document.getAnimations === 'function' ? document.getAnimations() : [];
  for (const animation of animations) {
    // finish() parks an animation on the end frame its author designed. It
    // throws for an infinite iteration count, and there, pausing wherever it
    // happens to be is the only frame on offer.
    try {
      animation.finish();
      finished += 1;
    } catch {
      try {
        animation.pause();
        paused += 1;
      } catch {
        // Already finished, or detached from a document.
      }
    }
  }

  // Screenshots start at the top. A page restored mid-scroll captures a
  // different frame than the same page loaded fresh.
  try {
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  } catch {
    window.scrollTo(0, 0);
  }
  document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  return { animations: animations.length, finished, paused };
}

// Wait for everything that changes how the page looks once it arrives: web
// fonts (which reflow every line of text), <img> elements, and images named by
// CSS url(). Every wait resolves on timeout and never rejects — a resource we
// gave up on is treated exactly like one that errored — and the stalled count
// is what tells "everything loaded" apart from "we stopped waiting".
function waitForRenderedContent(budgetMs) {
  let stalled = 0;
  const withDeadline = (promise) =>
    Promise.race([
      Promise.resolve(promise).catch(() => {}),
      new Promise((resolve) => {
        setTimeout(() => {
          stalled += 1;
          resolve();
        }, budgetMs);
      }),
    ]);

  const fonts = document.fonts ? withDeadline(document.fonts.ready) : Promise.resolve();

  const images = Promise.all(
    Array.from(document.images, (image) => {
      if (image.complete) return Promise.resolve();
      return withDeadline(
        new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        }),
      );
    }),
  );

  // CSS-referenced images never show up in document.images. Pointing a
  // throwaway Image at each URL shares the browser cache with the real
  // request, so this waits for the background to paint without fetching twice.
  const urls = new Set();
  const collect = (value) => {
    if (!value || value === 'none') return;
    for (const match of value.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
      if (match[2] && !/^data:/i.test(match[2])) urls.add(match[2]);
    }
  };
  for (const element of document.querySelectorAll('*')) {
    const style = getComputedStyle(element);
    collect(style.backgroundImage);
    collect(style.borderImageSource);
    collect(style.listStyleImage);
  }
  const backgrounds = Promise.all(
    Array.from(urls, (url) =>
      withDeadline(
        new Promise((resolve) => {
          const probe = new Image();
          probe.onload = resolve;
          probe.onerror = resolve;
          probe.src = url;
        }),
      ),
    ),
  );

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  return Promise.all([fonts, images, backgrounds])
    .then(nextFrame)
    .then(nextFrame)
    .then(() => ({ images: document.images.length, backgrounds: urls.size, stalled }));
}

// Sample the geometry of the page once per frame and wait for it to repeat.
// Fonts swapping, images reserving space, and scripts measuring the viewport
// all move things after the load event; a capture taken during that lands
// somewhere between two layouts. Gives up rather than throws: a page that never
// settles is a finding, not a crash.
function waitForStableLayout(options) {
  const { frames, budgetMs, maxElements } = options;
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let previous = null;
    let identical = 0;
    let samples = 0;
    let timer = null;

    const signature = () => {
      const html = document.documentElement;
      const parts = [html.clientWidth, html.clientHeight, html.scrollWidth, html.scrollHeight, window.scrollX, window.scrollY];
      let counted = 0;
      for (const element of document.querySelectorAll('body *')) {
        if (counted >= maxElements) break;
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        counted += 1;
        parts.push(
          `${element.tagName}:${Math.round(rect.x)}:${Math.round(rect.y)}:${Math.round(rect.width)}:${Math.round(rect.height)}`,
        );
      }
      return parts.join('|');
    };

    const done = (stable) => {
      clearTimeout(timer);
      resolve({ stable, samples, elapsedMs: Date.now() - startedAt });
    };

    const sample = () => {
      samples += 1;
      const current = signature();
      identical = current === previous ? identical + 1 : 1;
      previous = current;
      if (identical >= frames) {
        done(true);
        return;
      }
      requestAnimationFrame(sample);
    };

    timer = setTimeout(() => done(false), budgetMs);
    requestAnimationFrame(sample);
  });
}

// Walk the frozen page and report the three ways a layout looks broken.
// Returns plain data; the caller stamps on the page and viewport.
function auditLayout(options) {
  const { tolerancePx, materialRatio, excerptChars, maxFindings } = options;
  const html = document.documentElement;
  const viewportWidth = html.clientWidth;
  const CLIPPING = new Set(['hidden', 'clip', 'auto', 'scroll']);
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE']);

  const findings = [];
  let suppressed = 0;
  const addFinding = (finding) => {
    if (findings.length >= maxFindings) {
      suppressed += 1;
      return;
    }
    findings.push(finding);
  };

  const round = (value) => Math.round(value * 100) / 100;
  const rectOf = (domRect) => ({
    x: round(domRect.left),
    y: round(domRect.top),
    width: round(domRect.width),
    height: round(domRect.height),
  });
  const area = (rect) => rect.width * rect.height;
  const intersect = (first, second) => {
    const left = Math.max(first.x, second.x);
    const top = Math.max(first.y, second.y);
    const right = Math.min(first.x + first.width, second.x + second.width);
    const bottom = Math.min(first.y + first.height, second.y + second.height);
    if (right <= left || bottom <= top) return null;
    return { x: round(left), y: round(top), width: round(right - left), height: round(bottom - top) };
  };
  const excerpt = (text) => {
    const flat = (text ?? '').replace(/\s+/g, ' ').trim();
    return flat.length > excerptChars ? `${flat.slice(0, excerptChars)}…` : flat;
  };

  // A CSS-ish path, enough to find the element in the source by eye.
  const selectorFor = (element) => {
    const parts = [];
    for (let cursor = element; cursor && cursor.nodeType === 1; cursor = cursor.parentElement) {
      if (cursor.id) {
        parts.unshift(`#${cursor.id}`);
        break;
      }
      let part = cursor.tagName.toLowerCase();
      const className = typeof cursor.className === 'string' ? cursor.className.trim().split(/\s+/)[0] : '';
      if (className) part += `.${className}`;
      const twins = cursor.parentElement
        ? Array.from(cursor.parentElement.children).filter((child) => child.tagName === cursor.tagName)
        : [];
      if (twins.length > 1) part += `:nth-of-type(${twins.indexOf(cursor) + 1})`;
      parts.unshift(part);
      if (cursor.tagName === 'BODY') break;
    }
    return parts.length > 6 ? `… > ${parts.slice(-6).join(' > ')}` : parts.join(' > ');
  };

  // Text nobody can see can't be clipped and can't collide. Walks to the root
  // accumulating opacity, and also skips the two standard screen-reader-only
  // recipes, which are deliberately clipped text and would otherwise be the
  // loudest false positive on any accessible site.
  const hiddenReason = (element) => {
    let opacity = 1;
    let insideSummary = false;
    for (let cursor = element; cursor && cursor.nodeType === 1; cursor = cursor.parentElement) {
      const style = getComputedStyle(cursor);
      if (style.display === 'none') return 'display:none';
      if (style.visibility === 'hidden' || style.visibility === 'collapse') return `visibility:${style.visibility}`;
      if (cursor.getAttribute('aria-hidden') === 'true') return 'aria-hidden';
      if (style.contentVisibility === 'hidden') return 'content-visibility:hidden';
      // The answer in a collapsed <details> is not painted but IS laid out, so
      // Ctrl-F can still find it. Chrome hides it through the ::details-content
      // pseudo-element, which is not in this ancestor chain, so nothing above
      // catches it — and every collapsed answer on the page has line boxes
      // stacked at the same coordinates, which reads as a pile of colliding text.
      if (cursor.tagName === 'SUMMARY') insideSummary = true;
      if (cursor.tagName === 'DETAILS' && !cursor.open && !insideSummary) return 'collapsed <details>';
      const own = Number.parseFloat(style.opacity);
      opacity *= Number.isFinite(own) ? own : 1;
      if (opacity <= 0.01) return 'opacity';
      if (style.clip === 'rect(0px, 0px, 0px, 0px)') return 'clip:rect(0 0 0 0)';
      const clips = CLIPPING.has(style.overflowX) || CLIPPING.has(style.overflowY);
      if (clips && (cursor.clientWidth <= 2 || cursor.clientHeight <= 2)) return 'screen-reader-only box';
    }
    return null;
  };

  // The box an ancestor confines its content to, or null if it confines nothing.
  const clipBoundary = (element, current) => {
    const style = getComputedStyle(element);
    const clipsX = CLIPPING.has(style.overflowX);
    const clipsY = CLIPPING.has(style.overflowY);
    const isRoot = element === html;
    if (!clipsX && !clipsY && !isRoot) return null;

    const rect = rectOf(element.getBoundingClientRect());
    const box = { ...rect };
    if (isRoot) {
      // The document element is always consulted, because text painted outside
      // it is text nobody can reach. Where it isn't explicitly clipping, its
      // box is the whole scrollable area rather than the viewport: the capture
      // is full-page, so below-the-fold text is not clipped, and text past the
      // right edge belongs to the horizontal-overflow check, not this one.
      if (!clipsX) {
        box.x = 0;
        box.width = Math.max(html.clientWidth, html.scrollWidth);
      }
      if (!clipsY) box.height = Math.max(rect.height, html.scrollHeight);
    }
    return {
      x: clipsX || isRoot ? box.x : current.x,
      y: clipsY || isRoot ? box.y : current.y,
      width: clipsX || isRoot ? box.width : current.width,
      height: clipsY || isRoot ? box.height : current.height,
    };
  };

  // Intersect a line box with every clipping ancestor, remembering which one
  // took the bite. The visible rect is also what the collision pass compares:
  // the part of a line that survives clipping is the part a reader sees.
  const visibleRectFor = (rect, owner) => {
    let visible = rect;
    let clippedBy = null;
    for (let cursor = owner; cursor; cursor = cursor.parentElement) {
      const boundary = clipBoundary(cursor, visible);
      if (boundary) {
        const next = intersect(visible, boundary);
        if (next == null || next.width < visible.width - tolerancePx || next.height < visible.height - tolerancePx) {
          clippedBy = cursor;
        }
        if (next == null) return { rect: null, clippedBy };
        visible = next;
      }
      if (cursor === html) break;
    }
    return { rect: visible, clippedBy };
  };

  // One pass over the elements, reused by the overflow and blank-page checks.
  const visibleElements = [];
  for (const element of document.querySelectorAll('body *')) {
    if (SKIP_TAGS.has(element.tagName)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (hiddenReason(element)) continue;
    visibleElements.push({ element, rect });
  }

  // --- clipped text, and the line boxes the collision pass needs -------------

  const candidates = [];
  let textNodes = 0;
  let readableChars = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const owner = node.parentElement;
    if (!owner || SKIP_TAGS.has(owner.tagName)) continue;
    const raw = node.textContent ?? '';
    if (!raw.trim()) continue;
    if (hiddenReason(owner)) continue;
    textNodes += 1;

    // Range rects are per LINE, which is the unit that gets clipped or overlaps.
    // An element rect would smear a wrapped paragraph into one block and miss both.
    const range = document.createRange();
    range.selectNodeContents(node);
    const lines = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    const readable = /[\p{L}\p{N}]/u.test(raw);
    if (readable) readableChars += raw.trim().length;

    for (const [lineIndex, domRect] of lines.entries()) {
      const rect = rectOf(domRect);
      // Entirely above or left of the document origin: the off-screen parking
      // spot for skip links and other focus-reveals. Not a layout bug.
      if (rect.y + rect.height <= 0 || rect.x + rect.width <= 0) continue;

      const clipped = visibleRectFor(rect, owner);
      const lost =
        clipped.rect == null ||
        clipped.rect.width < rect.width - tolerancePx ||
        clipped.rect.height < rect.height - tolerancePx;
      if (clipped.clippedBy && lost) {
        addFinding({
          type: 'clipped-text',
          selector: selectorFor(owner),
          excerpt: excerpt(raw),
          geometry: {
            line: rect,
            lineIndex,
            visible: clipped.rect,
            clippedBy: selectorFor(clipped.clippedBy),
            lostWidth: round(rect.width - (clipped.rect?.width ?? 0)),
            lostHeight: round(rect.height - (clipped.rect?.height ?? 0)),
          },
        });
      }
      if (clipped.rect) {
        candidates.push({ owner, selector: selectorFor(owner), excerpt: excerpt(raw), readable, rect: clipped.rect, lineIndex });
      }
    }
  }

  // --- text collision -------------------------------------------------------

  // Sorted by top edge so the inner loop can stop early: once a box starts
  // below the first one ends, nothing further down overlaps it either.
  candidates.sort((first, second) => first.rect.y - second.rect.y);
  let collisions = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    const first = candidates[i];
    if (!first.readable) continue; // punctuation-only nodes are decoration
    for (let j = i + 1; j < candidates.length; j += 1) {
      const second = candidates[j];
      if (second.rect.y >= first.rect.y + first.rect.height) break;
      if (!second.readable) continue;
      // Text nodes sharing one flow owner (the two sides of a <br>, say) are one
      // typographic unit; their Range boxes can overlap under a tight
      // line-height even though the glyphs don't.
      if (first.owner === second.owner) continue;

      const overlap = intersect(first.rect, second.rect);
      if (!overlap) continue;
      const smaller = Math.min(area(first.rect), area(second.rect));
      if (overlap.width <= tolerancePx || overlap.height <= tolerancePx) continue;
      if (!(smaller > 0) || area(overlap) / smaller < materialRatio) continue;

      collisions += 1;
      addFinding({
        type: 'text-collision',
        selector: first.selector,
        excerpt: excerpt(`${first.excerpt} ⟂ ${second.excerpt}`),
        geometry: {
          first: { selector: first.selector, lineIndex: first.lineIndex, rect: first.rect },
          second: { selector: second.selector, lineIndex: second.lineIndex, rect: second.rect },
          overlap,
          coverage: round(area(overlap) / smaller),
        },
      });
    }
  }

  // --- horizontal overflow --------------------------------------------------

  const overflowPx = round(html.scrollWidth - viewportWidth);
  if (overflowPx > tolerancePx) {
    const offenders = visibleElements
      .filter(({ rect }) => rect.right > viewportWidth + tolerancePx)
      .map(({ element, rect }) => ({
        selector: selectorFor(element),
        right: round(rect.right),
        width: round(rect.width),
        excerpt: excerpt(element.textContent),
      }))
      .sort((first, second) => second.right - first.right)
      // An element that overflows drags its children out with it, so only the
      // few that reach furthest are worth naming.
      .slice(0, 5);
    addFinding({
      type: 'horizontal-overflow',
      selector: offenders[0]?.selector ?? 'html',
      excerpt: offenders[0]?.excerpt ?? '',
      geometry: { viewportWidth, scrollWidth: html.scrollWidth, overflowPx, offenders },
    });
  }

  // --- blank-frame guard ----------------------------------------------------

  // Chromium can hand back an unpainted frame, and a build can ship an empty
  // page. Decoding the PNG here would mean a dependency, so ask the page
  // instead: a real page has text and boxes in it.
  if (readableChars < 40 || visibleElements.length < 5) {
    addFinding({
      type: 'blank-page',
      selector: 'body',
      excerpt: excerpt(document.body.textContent),
      geometry: { readableChars, visibleElements: visibleElements.length, lineBoxes: candidates.length },
    });
  }

  return {
    findings,
    stats: {
      textNodes,
      lineBoxes: candidates.length,
      readableChars,
      visibleElements: visibleElements.length,
      collisions,
      suppressed,
    },
  };
}

// --- browser session --------------------------------------------------------

const profile = mkdtempSync(join(tmpdir(), 'site-screenshots-'));
const browser = spawn(chrome, [
  '--headless',
  '--disable-gpu',
  '--no-first-run',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  'about:blank',
]);

const cleanup = () => {
  browser.kill();
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // Chrome may still be releasing its profile directory; the OS cleans up /tmp anyway.
  }
};
process.on('exit', cleanup);

const endpoint = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Chrome did not start.')), 30_000);
  let buffered = '';
  browser.stderr.on('data', (chunk) => {
    buffered += chunk;
    const match = buffered.match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) {
      clearTimeout(timer);
      resolve(match[1]);
    }
  });
});

const socket = new WebSocket(endpoint);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
const cdp = new Cdp(socket);

const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
await cdp.send('Page.enable', {}, sessionId);

// The CSS freeze only reaches declarative animation. A hand-rolled
// requestAnimationFrame loop reads the media query instead, and a well-behaved
// one stops when it says `reduce`.
await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);

// Runs a script from the section above in the page and hands back its value.
// The outer deadline is a backstop for a renderer that never answers at all:
// like the in-page waits, it resolves with a fallback rather than rejecting, so
// one wedged page still produces a report for the others.
async function evaluate(fn, argument = null, fallback) {
  const expression = `(${fn.toString()})(${JSON.stringify(argument)})`;
  const call = cdp
    .send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId)
    .then(({ result, exceptionDetails }) => {
      if (exceptionDetails) {
        throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text ?? 'script failed');
      }
      return result.value;
    });
  if (fallback === undefined) return call;
  let timer;
  try {
    return await Promise.race([
      call,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback), EVALUATE_BUDGET_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// --- capture and audit ------------------------------------------------------

const report = { generatedAt: new Date().toISOString(), pages: [], findings: [] };
const notes = [];

for (const path of paths) {
  const name = path.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';
  const pageReport = { path, name, views: [] };

  for (const view of VIEWPORTS) {
    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      { width: view.width, height: view.height, deviceScaleFactor: 1, mobile: view.mobile },
      sessionId,
    );
    const loaded = cdp.waitFor('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: `http://localhost:${port}${path}` }, sessionId);
    await loaded;

    const freeze = await evaluate(freezeMotion, FROZEN_MOTION_CSS, { animations: 0, finished: 0, paused: 0 });
    const readiness = await evaluate(waitForRenderedContent, RESOURCE_WAIT_MS, { images: 0, backgrounds: 0, stalled: 0 });
    const stability = await evaluate(
      waitForStableLayout,
      { frames: STABLE_FRAMES, budgetMs: STABILITY_BUDGET_MS, maxElements: 600 },
      { stable: false, samples: 0, elapsedMs: STABILITY_BUDGET_MS },
    );
    const audit = await evaluate(
      auditLayout,
      {
        tolerancePx: TOLERANCE_PX,
        materialRatio: MATERIAL_OVERLAP_RATIO,
        excerptChars: EXCERPT_CHARS,
        maxFindings: MAX_FINDINGS_PER_VIEW,
      },
      { findings: [], stats: null },
    );

    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
    const file = `${outDir}${name}-${view.label}.png`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(file);

    // Instability is reported, not thrown: the screenshot is still worth having,
    // it just isn't guaranteed to be the same one next time.
    const findings = audit.findings.map((finding) => ({ ...finding, page: path, viewport: view.label }));
    if (!stability.stable) {
      findings.push({
        type: 'layout-unstable',
        page: path,
        viewport: view.label,
        selector: 'html',
        excerpt: '',
        geometry: { samples: stability.samples, elapsedMs: stability.elapsedMs, requiredFrames: STABLE_FRAMES },
      });
    }
    if (readiness.stalled) notes.push(`${path} ${view.label}: gave up waiting on ${readiness.stalled} resource(s)`);
    if (audit.stats?.suppressed) notes.push(`${path} ${view.label}: ${audit.stats.suppressed} further finding(s) not listed`);

    pageReport.views.push({
      viewport: view.label,
      width: view.width,
      height: view.height,
      screenshot: file,
      freeze,
      readiness,
      stability,
      stats: audit.stats,
      findings,
    });
    report.findings.push(...findings);
  }

  report.pages.push(pageReport);
}

socket.close();
server.closeAllConnections();
server.close();
cleanup();

// --- output -----------------------------------------------------------------

const byType = {};
for (const finding of report.findings) byType[finding.type] = (byType[finding.type] ?? 0) + 1;
report.summary = {
  pages: paths,
  viewports: VIEWPORTS.map((view) => `${view.label} ${view.width}`),
  findingCount: report.findings.length,
  byType,
  stalledResources: report.pages.flatMap((page) => page.views).reduce((total, view) => total + view.readiness.stalled, 0),
  unstableViews: report.pages
    .flatMap((page) => page.views.map((view) => ({ page: page.path, viewport: view.viewport, stable: view.stability.stable })))
    .filter((view) => !view.stable)
    .map((view) => `${view.page} ${view.viewport}`),
  passed: report.findings.length === 0,
  tolerancePx: TOLERANCE_PX,
  materialOverlapRatio: MATERIAL_OVERLAP_RATIO,
};

const auditFile = `${outDir}audit.json`;
writeFileSync(auditFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(auditFile);

// One line per finding, grouped by page.
function describe(finding) {
  const geometry = finding.geometry ?? {};
  if (finding.type === 'clipped-text') {
    return `clipped by ${geometry.clippedBy} (loses ${geometry.lostWidth}×${geometry.lostHeight}px)`;
  }
  if (finding.type === 'text-collision') {
    return `overlaps ${geometry.second?.selector} by ${geometry.overlap?.width}×${geometry.overlap?.height}px (${Math.round(
      (geometry.coverage ?? 0) * 100,
    )}% of the smaller line)`;
  }
  if (finding.type === 'horizontal-overflow') {
    return `page is ${geometry.overflowPx}px wider than the ${geometry.viewportWidth}px viewport (content ${geometry.scrollWidth}px)`;
  }
  if (finding.type === 'blank-page') {
    return `only ${geometry.readableChars} characters and ${geometry.visibleElements} visible elements rendered`;
  }
  if (finding.type === 'layout-unstable') {
    return `geometry still moving after ${geometry.elapsedMs}ms (${geometry.samples} samples, needed ${geometry.requiredFrames} identical)`;
  }
  return JSON.stringify(geometry);
}

console.log(`\nLayout audit: ${paths.length} page(s) × ${VIEWPORTS.length} viewports, ${report.findings.length} finding(s)`);
for (const page of report.pages) {
  const pageFindings = page.views.flatMap((view) => view.findings);
  if (!pageFindings.length) {
    console.log(`  ${page.path} — clean`);
    continue;
  }
  console.log(`  ${page.path}`);
  for (const finding of pageFindings) {
    console.log(`    [${finding.type}] ${finding.viewport}: ${finding.selector}`);
    console.log(`      ${describe(finding)}`);
    if (finding.excerpt) console.log(`      “${finding.excerpt}”`);
  }
}
for (const note of notes) console.log(`  note: ${note}`);

if (failOnIssues && report.findings.length) {
  console.error(`\n${report.findings.length} layout finding(s); failing because --fail-on-issues was passed.`);
  process.exit(1);
}
