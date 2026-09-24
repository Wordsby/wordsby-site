---
name: statement
description: One large italic statement beside an optional heading and a few short paragraphs. Use to land a single idea, like the problem a client solves, before explaining it.
metadata:
  version: "1.0.0"
---

# Statement

A large italic line set in the heading typeface, with an optional heading (h2) and up to three short paragraphs beside it. On phones the statement comes first and the detail follows.

## Fields

| Field | Required | Notes |
|---|---|---|
| `statement` | yes | The one idea to take away, shown large and italic. 120 characters at most. |
| `heading` | no | Section heading (h2), shown beside the statement |
| `text` | no | Up to three short paragraphs |
| `tone` | no | `page` (default), `light`, `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: statement
  statement: The best time to start was last spring. The next best is now.
  heading: Why start now
  text:
    - Most of the work happens before the season starts.
    - We'll walk you through what to do first.
```

## Guidance

- Keep the statement measured. It's shown very large, so an overstatement is shown very large too.
- Use it once per page. Two statements compete.
- The statement isn't a heading. If the section needs a title for navigation, set `heading`.

## Changelog

- 1.0.0: Initial version. Built for Wordsby, from the "Why Wordsby" section of their design prototype. Candidate for the shared library.
