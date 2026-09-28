---
name: gallery
description: A set of photographs, with optional captions, as a grid, a feature-led set, or a scrolling strip. Use for work, projects, a space, events, before-and-after, or a portfolio.
metadata:
  version: "1.0.0"
---

# Gallery

Photographs doing the arguing. For trades, venues, studios, restaurants and anyone whose work is visible, this pattern sells better than any amount of copy.

## Fields

| Field | Required | Notes |
|---|---|---|
| `images` | yes | At least two. Each: `image` (`src`, `alt`), optional `caption` |
| `heading` | no | Section heading (h2) |
| `intro` | no | A sentence under the heading |
| `layout` | no | `grid` (default), `feature` (first image full width), `strip` (one scrolling row) |
| `columns` | no | `2`, `3` (default), or `4`. Ignored by `strip`. |
| `crop` | no | `landscape` (default, 3:2), `square`, `portrait`, or `none` to keep each image's own shape |
| `tone` | no | `page` (default), `light`, `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: gallery
  heading: Work from the autumn term
  layout: feature
  columns: 3
  crop: square
  images:
    - image:
        src: /images/gallery/raku-bowls.jpg
        alt: Six raku-fired bowls cooling on a steel bench
      caption: Raku firing, October
    - image:
        src: /images/gallery/press.jpg
        alt: A student inking a lino block at the press
```

## Guidance

- **Alt text describes the photograph, not the file.** Someone who can't see it should know what's in it: "Six raku-fired bowls cooling on a steel bench", never "gallery image 1".
- Captions are optional and should add something the photograph doesn't say — when, where, who, what it cost. A caption that restates the image is noise.
- **`crop: none` needs images that already agree with each other.** Mixed orientations at their natural size produce a ragged grid. Use it for a deliberate set, not a folder dump.
- `feature` wants a genuinely best image first. If they're all equal, use `grid`.
- `strip` suits a long set — twelve project photos — without giving them half the page. It scrolls horizontally, so don't put anything essential past the third image.
- Six to twelve for a grid. Beyond that, the page becomes the gallery and should probably be its own page.
- Compress before adding. A gallery is the single easiest way to ruin a site's performance.

## Changelog

- 1.0.0: Initial version.
