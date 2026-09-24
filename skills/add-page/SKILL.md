---
name: add-page
description: Add a new page to an existing site, choosing patterns, writing copy in the brand voice, and wiring up navigation and the sitemap. Use when a client asks for a page that doesn't exist yet.
craft: [layout, typography, anti-ai-slop]
---

# Adding a page

## 1. Get clear on the job

Before building, know: what the page is for, who it's for, what the visitor should do next, and where it lives in the menu. Ask if any of that is unclear — a page with no purpose is wasted work.

Check `SITE.md` to see whether this overlaps an existing page. Sometimes the right answer is a section on a page they already have.

## 2. Pick the URL

- Lowercase, hyphenated, descriptive: `content/pages/studio-rental.md` → `/studio-rental/`.
- Nested pages: `content/pages/classes/pottery.md` → `/classes/pottery/`.
- Once a page is live, **don't change its URL** without asking. Existing links break.

## 3. Build it

Choose patterns from `PATTERNS.md` and read each one's `SKILL.md`. A reliable shape:

```yaml
---
title: Studio rental
description: Rent the Riverside clay studio for workshops, parties, and private sessions.
sections:
  - pattern: hero
    heading: ...
  - pattern: feature-grid
    heading: What's included
    items: [...]
  - pattern: faq
    items: [...]
  - pattern: cta-banner
    heading: ...
    actions: [...]
---
```

Write in the client's voice (`brand/VOICE.md`), using only facts you have.

## 4. Connect it

A new page nobody can reach is a bug. Update:

- `content/settings.yaml` — add it to the header or footer menu if it belongs there. Ask if you're not sure.
- `SITE.md` — add a row to the sitemap with its purpose and patterns.
- Related pages — link to it where it makes sense (a "Classes" page should link to a new class detail page).

## 5. Check and ship

```bash
npm run check
```

Review it in the browser, then branch, commit, push, and open a pull request (see `skills/edit-content/SKILL.md` for the git steps).

Tell the client what the page says, where it now appears in the menu, and what you still need from them.
