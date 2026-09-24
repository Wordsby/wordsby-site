---
name: content
description: Places the page's Markdown body text (everything below the frontmatter). Use for long-form copy like an About story, policies, or details that don't fit a structured pattern.
metadata:
  version: "1.0.0"
---

# Content

Renders the Markdown body of the page file at this point in the page.

## Rules

- A page with **no** `sections` shows its body automatically. No `content` section is needed.
- A page with sections **and** body text must include exactly one `- pattern: content` where the text should appear. Otherwise the build fails, so text is never silently lost.
- Use `##` and `###` headings inside the body. The page already has its `h1`.

## Fields

| Field | Required | Notes |
|---|---|---|
| `width` | no | `narrow` (default, best for reading) or `wide` |
| `tone` | no | `light` (default), `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```markdown
---
title: About
description: How Riverside Community Arts started and who we serve.
sections:
  - pattern: content
  - pattern: cta-banner
    heading: Come make something
    actions:
      - label: Browse classes
        href: /classes/
---

## Our story

Riverside started in 1998 in a borrowed garage…
```

## Changelog

- 1.0.0: Initial version.
