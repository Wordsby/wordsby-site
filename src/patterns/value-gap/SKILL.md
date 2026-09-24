---
name: value-gap
description: Explainer with a large statement, short paragraphs, and an unlabeled two-bar diagram showing something worth less than it should be, with the difference called out. Use to explain a shortfall or loss in plain terms before selling the fix.
metadata:
  version: "1.0.0"
---

# Value gap

A heading, one large statement, and a few short paragraphs beside a simple diagram: a full bar, a shorter bar, and the missing part outlined and labeled. On phones the diagram sits between the statement and the paragraphs.

The bars carry no numbers. They show the idea of a gap, not a result, so nobody reads them as a typical outcome.

## Fields

| Field | Required | Notes |
|---|---|---|
| `statement` | yes | The one idea to take away, shown large. 120 characters at most. |
| `bars` | yes | `full` and `reduced`: labels for the two bars. `gap`: label for the missing part. `note`: optional line under the gap label. `share`: how much of the full bar the shorter one fills, 40–90 (default 70). `summary`: what the diagram shows, for screen readers. |
| `heading` | no | Section heading (h2) |
| `text` | no | Up to four short paragraphs |
| `tone` | no | `page` (default), `light`, `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: value-gap
  heading: Why your coverage falls short
  statement: The policy pays what the house was insured for, not what it costs to rebuild.
  text:
    - Building costs have risen since the policy was written.
    - The difference is called underinsurance.
  bars:
    full: Cost to rebuild
    reduced: What the policy pays
    gap: Underinsurance
    note: The part you pay yourself
    summary: Two bars. The policy payout is shorter than the cost to rebuild; the missing part is underinsurance.
```

## Guidance

- Don't put figures in the labels unless they come from the client, and never imply a typical result.
- Keep the statement measured. It is shown large, so an overstatement is shown large too.
- Use it once per page, near the top, before the services it leads into.

## Changelog

- 1.0.0: Initial version. Built on the Collision Safety Consultants of Tennessee pilot, where the client asked for the home page to explain diminished value before selling the service, then for it to be "more visually appealing". The guidance on keeping the statement measured came from that request: its first large statement was an overstatement. Promoted unchanged.
