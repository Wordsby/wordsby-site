# Typography craft

The design direction picks the typefaces. These rules govern how type behaves at every size, on every site.

## Letter-spacing — the rule that separates craft from default

The most-skipped rule in machine-made design. No exceptions.

| Context | Letter-spacing | Our token |
|---|---|---|
| Body text | `0` | default |
| Small text (13px and under) | `0.01em` to `0.02em` | — |
| **ALL CAPS, at any size** | **`0.06em` to `0.1em`** **[checked]** | `--tracking-caps` |
| Headings from 32px | `-0.01em` to `-0.02em` | `--tracking-heading` |
| Display type from 48px | `-0.02em` to `-0.03em` | `--tracking-display` |

All-caps without positive tracking looks cramped and amateur. Display type without negative tracking looks loose and weak. These two are the most reliable tells that nobody looked at the page.

The `0.06em` floor isn't arbitrary: typographers have long converged on 5–10% of the em for uppercase (Bringhurst, *Elements of Typographic Style* §3.2.7). Below it the letterforms collide; above `0.1em` the word falls apart into letters.

## Scale

- Use a multiplicative scale (1.2 or 1.25 per step) and cap the page at **6–8 sizes total**.
- No more than **3 type sizes visible above the fold**.
- Body text is **16–18px**. Under 16px on a marketing page is a mistake, not a style.
- Never introduce a size outside the `--text-*` tokens. **[checked]**

## Line height

| Text | Line height |
|---|---|
| Display and h1 (32px+) | 1.0–1.2 |
| Body | 1.5–1.6 |
| Small text | 1.5 |

Tight leading is for short display lines only. Body text at 1.3 is exhausting to read.

## Line length

Body copy sits at **50–75 characters per line** (`--measure`, currently 68ch). Wider and the eye loses its place returning to the left edge; much narrower and the text feels choppy.

## Weight

Most well-made sites use exactly three weights:

- **Read** (400) for body copy
- **Emphasize** (500–550) for UI text, labels, navigation
- **Announce** (600) for headings and buttons

Weight 700+ is rarely needed. If you're reaching for bold to emphasize something already bold, the hierarchy is broken somewhere else.

## Pairing

- **Two typefaces maximum**: one display, one body. A single family used at several weights is also fine.
- To emphasize a word inside a heading, use *italic or bold of the same face*. Never drop a different family into the middle of a headline — mixed-family emphasis reads as amateur.
- Always keep a system fallback in the stack, and make sure the page still looks deliberate if the webfont never loads.

## Orphans and rag

- No single word alone on the last line of a heading. Fix it with `text-wrap: balance`, a narrower container, or shorter copy — never by hiding overflow.
- Never `text-align: justify` on the web. It creates rivers of white space.
- Headings get `text-wrap: balance`; long body paragraphs get `text-wrap: pretty` where supported.
