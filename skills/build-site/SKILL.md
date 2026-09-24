---
name: build-site
description: Build the first version of a site from completed specs (SITE.md, brand/, settings.yaml), replacing all example content. Use after onboarding, when the specs are approved and the site still contains the starter's example content.
craft: [typography, color, layout, anti-ai-slop, accessibility]
---

# Building the first version

You have approved specs. Now turn them into a site the client can react to. Aim for something real and complete, not a skeleton with placeholders.

## 1. Read before writing

Read in this order: `SITE.md`, `brand/VOICE.md`, `brand/STYLEGUIDE.md`, `brand/brand.yaml`, the design direction named there (`design/directions/<name>/DESIGN.md`), then `PATTERNS.md`. Then read the `SKILL.md` of each pattern you plan to use, and the craft files listed in this skill's frontmatter.

If `SITE.md` still has `TODO:` items that block a page, ask about those first.

## 2. State the design read

Before building anything, say in one sentence how you're reading the job:

> *Reading this as: a community arts centre for first-time adult students, warm and unintimidating, built in Quiet Editorial — serif headings, generous space, one accent.*

It takes ten seconds and it's the cheapest moment for the client to redirect you. If the brief is genuinely ambiguous, ask **one** question — not a list.

## 3. Plan each page

Work from the sitemap in `SITE.md`. For each page, decide the sections before writing any copy:

- **Every page:** a clear purpose, one primary call to action, and a `description` under 160 characters.
- **Home:** `hero` → what you offer and for whom → proof (`testimonials`, only if real and recorded in `content/quotes.yaml`) → `cta-banner`.
- **Service or product pages:** `hero` → `feature-grid` of what's included → `faq` for objections → `cta-banner`.
- **About:** `content` for the story → `cta-banner`.
- **Contact:** `content` with address, hours, and phone → `form`.

Vary the tones between sections so the page has rhythm, following `STYLEGUIDE.md`.

## 4. Write the copy

- Write in the client's voice. Re-read `VOICE.md` before you start, not after.
- Use only facts from the specs, the client's existing site, or what they told you. **Never invent** statistics, history, testimonials, staff, prices, or credentials.
- Lead with the reader's benefit. Keep paragraphs to three or four lines.
- If you need a fact you don't have, leave `TODO: need X from client` in place and collect these for your summary. Never fill the gap with something plausible.

## 5. Replace everything from the example site

The starter ships with example content for a fictional organization, Riverside Community Arts. None of it may survive.

```bash
grep -ril "riverside\|example.org\|555-0100" content/ brand/ SITE.md
```

Delete example pages that don't apply, replace the example quotes in `content/quotes.yaml` with the client's (or empty it), replace the logo files in `brand/assets/`, and replace `public/favicon.svg` with the client's mark.

## 6. Check your work

```bash
npm run check
npm run screenshots -- / /about/ /classes/ /contact/   # every page you built
```

Look at each image in `.screenshots/`, desktop and mobile, against `STYLEGUIDE.md`:

- Does it look like this brand, or like a generic template?
- Is the primary call to action obvious on every page?
- Any awkward line breaks, empty sections, or stretched images?

## 7. Hand it over

Open a pull request, then tell the client in plain English:

1. What you built, page by page, in one line each.
2. The choices you made that they might want to change.
3. Everything you still need from them (the `TODO:` list), as specific requests.
4. The preview link, and an invitation: "Tell me what to change."

Update `SITE.md` if the sitemap changed while you built.
