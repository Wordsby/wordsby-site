---
name: cta-banner
description: Bold, centered call-to-action band with a heading, short text, and one or two buttons. Use to close a page or break up a long one with a clear next step.
metadata:
  version: "1.0.0"
---

# CTA banner

## Fields

| Field | Required | Notes |
|---|---|---|
| `heading` | yes | The invitation, e.g. "Your first class is on us" |
| `actions` | yes | 1–2 buttons: `label`, `href`, `style` (`primary` or `secondary`) |
| `text` | no | One supporting sentence |
| `tone` | no | `primary` (default), `dark`, `muted`, `light` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: cta-banner
  heading: Your first class is on us
  text: New to Riverside? Try any beginner class free.
  actions:
    - label: Claim your free class
      href: /contact/
```

## Guidance

- Point to the primary call to action from `SITE.md` unless the page has a more specific one.
- One per page, usually last. Two in a row weakens both.

## Changelog

- 1.0.0: Initial version.
