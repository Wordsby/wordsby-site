---
name: import-site
description: Rebuild an existing website in this system — pull its content, images, and brand with the ingest script, then re-express it using the design library. Use when a client is migrating from WordPress, Squarespace, Wix, or any existing site.
craft: [typography, color, layout, anti-ai-slop, accessibility]
---

# Importing an existing site

You are not copying a website. You are moving its **content** here and rebuilding it properly. The old design is evidence of what the client wanted, not a specification.

## 1. Pull it down

```bash
npm run ingest -- https://theirsite.com
```

The script tries the WordPress REST API first and falls back to crawling. Force one with `--source wp` or `--source crawl`.

Everything lands in `.ingest/` (git-ignored):

| File | What it holds |
|---|---|
| `inventory.json` | Every page: URL, title, description, headings, images, forms, word count |
| `pages/*.md` | Each page's content as Markdown |
| `media/` | Downloaded images |
| `brand.md` | A guess at the logo, colors, and fonts — **confirm all of it** |

**The crawl source is lower fidelity.** It has to guess where content ends and the theme begins, so it picks up stray navigation and widget text. Read what it produced before trusting it. A site rendered entirely by JavaScript may come back nearly empty; if so, say so rather than importing a shell.

## 2. Read before deciding

Go through `inventory.json` and every page. Build a picture of:

- **What each page is for**, and whether it earns its place. Old sites accumulate pages nobody visits.
- **What the real content is.** Most old pages carry maybe half their words in substance; the rest is filler written to fill a template.
- **What's missing.** Note thin pages, absent photography, and questions the site never answers.
- **Every fact worth keeping**: phone numbers, addresses, hours, prices, certifications, names, service areas. These are the things you must never lose or alter.

Tell the client what you found before you build. "You have five pages; two of them say the same thing" is useful to hear early.

## 3. Re-express, don't replicate

Pick a design direction from `design/README.md` based on the audience and what the business sells — not on what the old site looked like. Read its `DESIGN.md`, including **Avoid for**.

Then map content to patterns:

- A wall of text becomes a `hero` plus a `feature-grid` plus an `faq`.
- A page of questions answered in paragraphs becomes an `faq` — which also gets structured data for search.
- A long "services" list becomes a `feature-grid` with parallel items.
- A "contact us" page with an embedded form becomes `content` plus our `form` pattern.

**Rewrite for the page you're building**, keeping every fact. Old copy was written for a different layout, usually in a house style nobody chose. Tighten it, cut repetition, lead with the reader's benefit — and change no facts. If you're unsure whether something is a fact or a flourish, keep it and flag it.

**Testimonials are the exception: never rewrite them.** Before you place any, copy every testimonial from `.ingest/pages/` into `content/quotes.yaml`, because `.ingest/` isn't committed and the check can only compare against the record:

- **The quote word for word**, typos, odd capitals and missing words included. Keep every paragraph of a quote that runs to several (use `|` and blank lines); a naive copy drops or splits them. Leave out only the quote marks around the whole thing.
- **The credit exactly as published.** "Josh B" stays "Josh B", and "G.Smith, Brentwood, TN." stays one `name`. Drop only a leading dash ("- Josh B").
- **`source`:** the old page's address (`source_url` at the top of the ingested page).
- Record them all, even ones you don't plan to use yet.

Then place them on pages, trimming only as `src/patterns/testimonials/SKILL.md` allows. If something in a quote looks wrong, leave it and ask the client; if they agree to a fix, record it under `approved` with their reason.

## 4. Keep the URLs

Search rankings live on URLs.

- **Reuse the existing slug** for every page you keep. `/fees-services/` stays `/fees-services/`, even if you'd have named it differently. Renaming a ranking page to something tidier costs the client traffic.
- When a URL genuinely must change, or two old pages merge into one, add a redirect to `public/_redirects`:

```
# old path            new path            status
/services-and-fees/   /fees-services/     301
/old-blog/*           /                   301
```

301 means permanent, which is what a migration wants. `npm run check` validates the file's format.

- Carry over each page's `description` where it's good, and write one where it isn't.

## 5. Images and brand

- Move the images worth keeping from `.ingest/media/` into `public/images/`, and give each one real alt text. Old sites are full of images with no alt text or filenames as alt text.
- **A site with no usable photography is a finding, not a detail.** Say so plainly and ask for photos. Never fill the gap with stock. It also rules out the `photo-led` direction.
- Treat `brand.md` as a starting point. It ranks colors by how often the site's **own page CSS** paints with them, and marks the ones that came with the theme — but a page builder can still make a stock color look deliberate. Confirm the palette with the client before writing `brand/brand.yaml`.

### When there's no vector logo

Common with small businesses: the original file is long gone and nobody remembers who made it. The web needs a clean logo more than it needs a vector one, so work down this list:

1. **Ask once.** They may have it from whoever designed it, or on an old invoice or sign artwork. Worth one email.
2. **Recreate it.** Fastest for simple marks — a designer redraws it in a vector editor. This is usually the right answer and gives the client an asset they should have had.
3. **Send it to a dedicated vectorization service**, and have a person check the result. Vector Magic and similar paid services are what to use; Image Trace in Illustrator or Inkscape can work on very simple marks.

   > **Never vectorize a logo yourself.** Don't hand-write SVG to approximate it, don't trace it with an image model, don't "redraw it as close as you can". The output looks wrong in ways that are obvious to the client and invisible in a diff, and it's their identity, not a placeholder. Your job here is to flag the problem and route it — not to produce artwork.
4. **Ship a good raster.** Perfectly acceptable if it's clean: a transparent PNG at two to three times its displayed size, plus a version that works on dark backgrounds. Note it in the handover as something to fix later.

Whatever you end up with, the site needs a header version and, for any dark tone, an `on_dark` version. Record both in `brand.yaml`.

## 6. Forms

`inventory.json` lists every form found and its fields. Rebuild them with our `form` pattern, keeping the same fields unless some are pointless.

Where submissions go is configured in the form service, **never in site content**. Post which address the old form used to the site's Basecamp project (rule 7 in `AGENTS.md`).

## 7. Check it against the original

```bash
npm run check
npm run screenshots -- --all
```

Then compare against the live original, page by page:

- Is every fact still present and correct? Phone numbers and prices especially.
- Does every old URL still resolve, directly or by redirect?
- Is anything missing that the client will notice?
- Does ours look better? If not, say so — that's the point of the exercise.

Run `skills/design-review/SKILL.md` as a separate pass before showing the client.

## 8. Hand over

Tell them, in plain language:

1. What moved across, page by page.
2. What you cut or merged, and why.
3. What you need from them: photos, confirmed brand colors, the vector logo, answers to gaps.
4. Anything you deliberately changed beyond the design — usually copy that was repetitive or unclear.
5. The preview link.
