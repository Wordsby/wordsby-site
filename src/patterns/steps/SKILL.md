---
name: steps
description: Numbered, ordered steps joined by a line, showing a process from start to finish. Use for "how it works", "what happens next", or onboarding sequences where order matters.
metadata:
  version: "1.0.0"
---

# Steps

An ordered list of 2–5 steps. Each gets a large number, and a line connects one step to the next: across the page on wide screens, down the left side on phones. Screen readers hear it as a numbered list with "Step 1:", "Step 2:" and so on.

## Fields

| Field | Required | Notes |
|---|---|---|
| `items` | yes | 2–5 steps. Each: `title`, `text`. Don't number the titles; the pattern does that. |
| `heading` | no | Section heading (h2). If omitted, step titles become h2s. |
| `intro` | no | A sentence under the heading |
| `tone` | no | `page` (default), `light`, `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: steps
  heading: How signing up works
  items:
    - title: Pick a class
      text: Browse the schedule and choose a session that suits you.
    - title: Reserve your spot
      text: Pay online or at the front desk.
    - title: Show up
      text: Everything you need is provided on the day.
```

## Guidance

- Only use it when order genuinely matters. Parallel items that could come in any order belong in `feature-grid`.
- Keep titles short (two to five words) so they line up across the row on wide screens.
- Keep step text similar in length.
- More than five steps is a sign to combine some, or to split the process in two.

## Changelog

- 1.0.0: Initial version. Built on the Collision Safety Consultants of Tennessee pilot, where a client asked for "how it works, step by step" and a `feature-grid` read as a list of services. Promoted unchanged.
