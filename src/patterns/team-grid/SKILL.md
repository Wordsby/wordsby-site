---
name: team-grid
description: Grid of people with photo, name, role, and an optional short bio. Use for a team, staff, board, faculty, practitioners, or speakers page.
metadata:
  version: "1.0.0"
---

# Team grid

The people behind the organization. For service businesses this is often the second most visited page on the site, so it's worth real photographs and real sentences.

## Fields

| Field | Required | Notes |
|---|---|---|
| `people` | yes | Each: `name`, optional `role`, `bio`, `photo` (`src`, `alt`), `link` (`label`, `href`) |
| `heading` | no | Section heading (h2). If omitted, names become h2s. |
| `intro` | no | A sentence under the heading |
| `columns` | no | `2`, `3` (default), or `4` |
| `shape` | no | `portrait` (default, 4:5), `square`, or `circle` |
| `tone` | no | `page` (default), `light`, `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: team-grid
  heading: Who you'll work with
  columns: 3
  shape: portrait
  people:
    - name: Ana Okafor
      role: Founder and lead instructor
      bio: Twenty years at the wheel, and eight teaching beginners to throw.
      photo:
        src: /images/team/ana.jpg
        alt: Ana Okafor at a potter's wheel, shaping a bowl
    - name: Dev Raman
      role: Printmaking
      photo:
        src: /images/team/dev.jpg
        alt: Dev Raman pulling a print from a press
```

## Guidance

- **Either everyone has a photo or nobody does.** A grid with three portraits and one grey placeholder reads as an oversight.
- Crop photographs consistently — same distance, same eye line. Mismatched crops are the fastest way to make a real team look stock.
- Alt text describes the person and what they're doing, not "headshot of Ana Okafor".
- Keep bios to one or two sentences and make them parallel. If one person needs four paragraphs, they need their own page.
- `circle` suits small, informal teams; `portrait` suits professional services. `square` is the safe default when photographs came from different sources.
- Roles are title case, not sentence case, and short enough not to wrap.

## Changelog

- 1.0.0: Initial version.
