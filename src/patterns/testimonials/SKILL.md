---
name: testimonials
description: Quotes from real customers, students, members, or partners, each with a name and optional role. Use for social proof near a call to action.
metadata:
  version: "1.0.0"
---

# Testimonials

## Fields

| Field | Required | Notes |
|---|---|---|
| `items` | yes | Each: `quote`, `name`, optional `role` (e.g. "Student since 2021") |
| `heading` | no | Section heading |
| `tone` | no | `muted` (default), `light`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: testimonials
  heading: From our neighbors
  items:
    - quote: I hadn't painted since high school. Now Thursday nights are my favorite part of the week.
      name: Dana R.
      role: Painting student
    - quote: My kids come home covered in clay and grinning.
      name: Marcus T.
      role: Parent
```

## Guidance

- **Only use real quotes supplied by the client.** Never invent testimonials. If the client has none yet, leave this pattern out and suggest collecting some.
- **Every quote comes from `content/quotes.yaml`**, the record of what each customer wrote and how they were credited. Add a new quote there first, word for word, with where it came from. `npm run check` fails if a quote or its credit on a page doesn't match the record.
- **Quote word for word, typos and all.** Don't fix hyphens, spelling, or grammar. Copy `name` and `role` exactly as published: don't add a missing full stop, and don't split "G.Smith, Brentwood, TN." into a name and a role. If the client wants a change, record it under `approved` in `content/quotes.yaml` with the reason.
- 2–3 quotes is the sweet spot. Trim long quotes to the most vivid sentence or two (with the client's OK). A trim is one unbroken passage, or passages joined with "…" in the order the customer wrote them. Never join sentences from different places without the "…".

## Changelog

- 1.0.0: Initial version.
