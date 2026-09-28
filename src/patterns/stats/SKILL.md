---
name: stats
description: Two to six numbers with labels — years in business, projects completed, response time, capacity. Use to make a claim concrete, never to decorate a page.
metadata:
  version: "1.0.0"
---

# Stats

A handful of numbers, set large. Used well it replaces a paragraph of adjectives with something checkable.

## Fields

| Field | Required | Notes |
|---|---|---|
| `items` | yes | Two to six. Each: `value`, `label`, optional `note` |
| `heading` | no | Section heading (h2) |
| `intro` | no | A sentence under the heading |
| `tone` | no | `muted` (default), `page`, `light`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: stats
  heading: Where we stand
  items:
    - value: "2004"
      label: Opened on Mill Street
    - value: 1,400+
      label: Students taught
      note: Since opening
    - value: 11
      label: Kilns, wheels and presses
```

## Guidance

- **Every number has to be a fact the client gave you.** Never estimate, round up, or infer one from something else on the site. An invented statistic is the kind of error that survives review because it looks confident, and it's the client who wears it.
- If a number needs a qualifier to be honest, put it in `note` rather than dropping it.
- `value` is a string, so keep the client's own formatting: `1,400+`, `<2 hrs`, `98%`, `2004`.
- Labels are nouns, not sentences, and short enough to sit on two lines.
- Three or four reads best. Two looks unfinished; six starts to look like a dashboard.
- **Skip the pattern entirely if the numbers are weak.** "12 team members" and "3 offices" tell nobody anything, and a page that leads with filler statistics reads as machine-made — see `craft/anti-ai-slop.md`.
- Dates as values (`2004`) work; so do ranges (`6–8 weeks`).

## Changelog

- 1.0.0: Initial version.
