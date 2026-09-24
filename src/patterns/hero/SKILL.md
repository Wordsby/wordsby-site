---
name: hero
description: Opening section with the page's main heading (h1), supporting text, up to two buttons, and an optional image. Use at most once per page, as the first section.
metadata:
  version: "1.0.0"
---

# Hero

The first thing visitors see. Its heading becomes the page's `<h1>`. Pages that don't start with a hero get an automatic title band instead.

## Fields

| Field | Required | Notes |
|---|---|---|
| `heading` | yes | The page's main message. Aim for 3–8 words. |
| `variant` | no | `centered` (default) or `split` (text beside an image; `image` required) |
| `eyebrow` | no | Short label above the heading, e.g. a location or category |
| `text` | no | One or two sentences expanding on the heading |
| `actions` | no | Up to 2 buttons: `label`, `href`, `style` (`primary` or `secondary`) |
| `image` | for `split` | `src` (path under `public/`) and `alt` (required description) |
| `tone` | no | `light` (default), `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: hero
  variant: split
  eyebrow: Community arts center · Springfield
  heading: Art for every neighbor
  text: Classes, open studios, and exhibitions for all ages and budgets.
  actions:
    - label: Browse classes
      href: /classes/
    - label: Visit us
      href: /contact/
      style: secondary
  image:
    src: /images/studio.jpg
    alt: Two students laughing at a pottery wheel
```

## Guidance

- Lead with what the visitor gets, not what the organization is.
- The first action should be the page's primary call to action (see `SITE.md`).
- Use `split` when there's a strong, relevant photo. Otherwise `centered` keeps focus on the message.

## Changelog

- 1.0.0: Initial version.
