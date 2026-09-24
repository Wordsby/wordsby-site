---
name: faq
description: Expandable list of questions and answers, with FAQ structured data for search engines. Use for common questions about services, pricing, visiting, or policies.
metadata:
  version: "1.0.0"
---

# FAQ

Each question expands to show its answer. It works without JavaScript and emits `FAQPage` structured data automatically.

## Fields

| Field | Required | Notes |
|---|---|---|
| `items` | yes | Each: `question`, `answer` (plain text; separate paragraphs with a blank line) |
| `heading` | no | Defaults to "Frequently asked questions" |
| `tone` | no | `light` (default), `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: faq
  items:
    - question: Do I need any experience?
      answer: Not at all. Every beginner class assumes you're starting from scratch.
    - question: What should I wear?
      answer: |
        Clothes you don't mind getting messy.

        Aprons are provided in the studio.
```

## Guidance

- Write questions the way visitors would ask them.
- Answers should be complete on their own. Search engines may show them out of context.
- Use one FAQ section per page, so the structured data stays valid.

## Changelog

- 1.0.0: Initial version.
