# AGENTS.md

This repo is one client website. It's plain Markdown content plus an Astro build, and it deploys as static files. There's no CMS: you are how this site gets edited.

Read this file first. Then read `SITE.md` (what this site is for) and `brand/` (how it should look and sound).

## Map

| Path | What it is |
|---|---|
| `SITE.md` | The site spec: the organization, audiences, goals, calls to action, sitemap |
| `brand/brand.yaml` | Structured brand facts: colors, logo, contact details, and which design direction this site uses. **Source of all colors and fonts.** |
| `brand/STYLEGUIDE.md` | Visual direction in prose: imagery, layout, do's and don'ts |
| `brand/VOICE.md` | How this client sounds: tone, vocabulary, words to avoid |
| `design/directions/` | The design systems a site can be built in. This site uses the one named in `brand.yaml`. |
| `craft/` | Universal design rules that apply to every client. Skills list the ones they need. |
| `content/pages/*.md` | The pages. Frontmatter lists the sections; the Markdown body is long-form text. |
| `content/settings.yaml` | Production URL, menus, form service connection |
| `content/quotes.yaml` | Every customer quote the site may use, word for word, with its credit and source. Testimonials must match it. |
| `PATTERNS.md` | Index of installed patterns and their versions |
| `src/patterns/<name>/` | Each pattern: `SKILL.md` (how to use it), schema, component |
| `src/` (everything else) | Layout, header, footer, base styles. Agency territory. |
| `skills/` | Procedures for common jobs. Read the matching one before you start. |

## How a page works

A page is a Markdown file. Its frontmatter lists `sections`, each naming a pattern and its content:

```yaml
---
title: Classes
description: Pottery, painting, and printmaking classes in Springfield.
sections:
  - pattern: hero
    heading: Classes for every level
  - pattern: faq
    items:
      - question: Do I need experience?
        answer: Not at all.
---
```

- Use patterns from `PATTERNS.md`. **Read the pattern's `SKILL.md` before using it** — it lists every field.
- Only the patterns listed exist. If none fits, read `skills/create-pattern/SKILL.md`.
- Body text under the frontmatter needs a `- pattern: content` section to place it (unless the page has no sections at all).
- Each page needs a `title` and a `description` (under 160 characters).

## Rules

1. **Never hard-code colors, fonts, sizes, or spacing.** Use the tone variables (`--bg`, `--fg`, `--accent`, `--button-bg`, `--button-fg`) and the scale tokens (`--space-*`, `--text-*`, `--tracking-*`, `--gap`, `--section-space`, `--radius`, `--border-width`, `--shadow`, `--measure`, `--font-*`). They're generated from the design direction and `brand.yaml`, with color contrast checked. Hard-coding breaks that, and `npm run check` will catch you.
2. **Read the craft rules before design work.** Each skill's frontmatter lists which `craft/` files it needs. They're short, and they're the difference between a page that works and a page that looks made by a person.
3. **One fact, one place.** Colors live in `brand.yaml`, menus in `settings.yaml`, page content in `content/pages/`. Don't repeat a fact somewhere else.
4. **Write in the client's voice.** Read `brand/VOICE.md` first. Don't invent facts, statistics, testimonials, or credentials. If you need a fact you don't have, ask.
5. **Every image needs meaningful `alt` text.**
6. **Keep the specs current.** Adding or removing a page means updating the sitemap in `SITE.md`, and `content/settings.yaml` if it belongs in a menu.
7. **Some work belongs to the agency. Pass it on; don't do it yourself.** The agency owns `brand/`, `src/layouts/`, `src/components/`, `src/styles/`, and the inner workings of existing patterns. It also owns everything outside this repo: the form service, where form emails go, hosting, domains, and accounts. Content and page structure are yours to change, and so is a new pattern built by following `skills/create-pattern/SKILL.md`. When a request needs a change in the agency's territory:
   - **Don't make the change, and don't find a way around the rule.** Don't edit those files, don't run commands against shared services, and don't give the client steps to do it or ask anyone to log in. Being able to do it doesn't make it your job, even if you'd do it well.
   - **Use the `ask_the_agency` tool** if this site has Wordsby's tools (`.mcp.json`). It records the request against the site, and the agency reads it there. Say what was asked and what you would do.
   - **Otherwise, post it to the site's Basecamp project**, linked under "Agency" in `SITE.md`. Notify only the people listed there, and never @mention the client. Say what the client asked for, what you couldn't check, and anything to confirm with the client. Leave out steps, commands, and system names: the agency knows its systems, and the client can read the project.
   - **Tell the client in plain words** that the agency has it and what happens next. Give a reason that matters to them, not your instructions. In anything the client sees, including updates while you work, link only the post, and name no file paths or tools. If part of the request is content, do that part yourself.
   - **Never say how something is set up now unless you've seen it**, not in the post and not to the client. That includes advice that depends on it, like which inbox to keep checking. Pass on what the client believes as their belief, and tell them the agency will confirm, including what to do in the meantime.
   - **If you can't reach either,** say so, and write the message out in your reply, addressed to the agency. Doing the job yourself is not the fallback.
   - **This lasts for the whole conversation.** Once something belongs to the agency, it stays that way after the client answers your question, says yes, or asks you to just do it.

## Definition of done

Before you hand anything back:

```bash
npm run check                          # builds, then checks links, alt text, headings, quotes, design lint
npm run screenshots -- / /contact/     # full-page images of the pages you touched, desktop and mobile
```

Then:

- **Look at the screenshots.** They land in `.screenshots/`. Check them against `brand/STYLEGUIDE.md`: does it look like this brand, is the call to action clear, does anything overflow or crowd on mobile?
- Re-read the request and confirm you did all of it.
- Summarize what changed in plain English, the way you'd explain it to the client. No file paths or jargon.

## If a change doesn't show up

Astro caches parsed content in `node_modules/.astro`. If you change a **schema** (a pattern's fields or defaults) and the build still renders the old values, clear it and rebuild:

```bash
rm -rf node_modules/.astro && npm run check
```

## Git

- **Never commit to `main`.** Create a branch: `change/<short-description>`. This is a hard rule, not a preference. If the agency's GitHub plan allows branch protection, GitHub refuses pushes to `main`. If it doesn't, nothing enforces the rule, and a direct push to `main` publishes to the live site with no preview and no approval.
- Commit with a clear message, push, and open a pull request. Its description is the plain-English summary.
- A preview URL is built for the branch. The client reviews the preview, and the agency merges to publish.

## Skills

Read the matching skill before starting one of these jobs:

| Job | Skill |
|---|---|
| Setting up a brand-new site: interview the client, capture the specs | `skills/onboard-client/SKILL.md` |
| Rebuilding a client's existing website here | `skills/import-site/SKILL.md` |
| Building the site for the first time from those specs | `skills/build-site/SKILL.md` |
| Routine edits: change wording, hours, prices, add a team member | `skills/edit-content/SKILL.md` |
| Adding a new page | `skills/add-page/SKILL.md` |
| A request no existing pattern covers | `skills/create-pattern/SKILL.md` |
| Judging whether a page is any good before the client sees it | `skills/design-review/SKILL.md` |
