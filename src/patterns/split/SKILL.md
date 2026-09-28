---
name: split
description: One photograph beside one block of text, with optional bullet points and buttons. The workhorse for "here is a thing, here is what it is" — a service, a space, a story, a step. Alternate the image side down a page.
metadata:
  version: "1.0.0"
---

# Split

Image on one side, words on the other. It's the most useful shape on a content site, because it gives a photograph room to do work while keeping the text at a readable measure.

## Fields

| Field | Required | Notes |
|---|---|---|
| `heading` | yes | Section heading (h2) |
| `image` | yes | `src`, `alt` |
| `eyebrow` | no | A short label above the heading, set small and uppercase |
| `text` | no | A paragraph |
| `points` | no | A list of short lines, rendered as ruled rows |
| `media` | no | `right` (default) or `left` — which side the image sits on |
| `ratio` | no | `even` (default), `text` (wider text column), `image` (wider image) |
| `crop` | no | `landscape` (default, 3:2), `square`, `portrait`, `tall`, `none` |
| `actions` | no | Buttons: `label`, `href`, `style` (`primary` or `secondary`) |
| `tone` | no | `page` (default), `light`, `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: split
  eyebrow: Open studio
  heading: The room is yours on Thursdays
  text: >-
    Members get the wheels, the kilns and the press from six until close, with a
    technician on hand for the firings.
  points:
    - Eight wheels and two slab rollers
    - Bisque and glaze firings twice a week
    - No booking needed before 7 pm
  image:
    src: /images/open-studio.jpg
    alt: Two potters working at wheels in a bright studio
  media: left
  actions:
    - label: See membership
      href: /membership/
```

## Guidance

- **Alternate `media` down a page.** Three splits in a row with the image on the right reads as a template; alternating reads as a layout. Don't alternate more than three or four times before changing pattern — the zig-zag becomes its own kind of monotony.
- On mobile the image always comes first, whichever side it's on at desktop. That's deliberate: a photograph is a better opening than a heading on a small screen.
- `ratio: text` when there's a lot to say and the photograph is supporting. `ratio: image` when the photograph *is* the argument.
- `points` is for genuinely short lines — five or six words. Anything longer belongs in `text`, or in a `feature-grid`.
- Use `crop: tall` or `portrait` for a person or a standing object, `landscape` for a room or a scene. `none` keeps the image's own proportions and is the right answer for a screenshot or a diagram.
- The photograph has to earn its half of the screen. A stock image of a handshake next to real copy makes the copy look fake too — see `craft/anti-ai-slop.md`.

## Changelog

- 1.0.0: Initial version.
