---
name: feature-grid
description: Grid of 2–4 columns of short items (title, text, optional image and link). Use for services, programs, benefits, or "ways to get involved".
metadata:
  version: "1.0.0"
---

# Feature grid

A scannable set of parallel items. Columns collapse on smaller screens.

## Fields

| Field | Required | Notes |
|---|---|---|
| `items` | yes | Each: `title`, `text`, optional `image` (`src`, `alt`), optional `link` (`label`, `href`) |
| `heading` | no | Section heading (h2). If omitted, item titles become h2s. |
| `intro` | no | A sentence under the heading |
| `columns` | no | `2`, `3` (default), or `4` |
| `tone` | no | `light` (default), `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: feature-grid
  heading: Make something this week
  columns: 3
  items:
    - title: Classes
      text: Six-week courses in pottery, painting, and printmaking for every level.
      link:
        label: See the schedule
        href: /classes/
    - title: Open studio
      text: Drop in to use our wheels, kilns, and presses on your own schedule.
    - title: Exhibitions
      text: Monthly shows featuring local artists and student work.
```

## Guidance

- Keep items parallel: similar length and the same kind of thing.
- Match `columns` to the item count (3 items → 3 columns, 4 or 8 → 4, 2 or 4 longer items → 2).
- Either every item gets an image or none do.

## Changelog

- 1.0.0: Initial version.
