---
name: logo-wall
description: A row of client, partner, press, accreditation, or supplier logos. Use for social proof near the top of a home page, or on an about or partners page.
metadata:
  version: "1.0.0"
---

# Logo wall

Borrowed credibility. A short row of marks people already recognize does more for trust than a paragraph claiming the same thing.

## Fields

| Field | Required | Notes |
|---|---|---|
| `logos` | yes | At least two. Each: `image` (`src`, `alt`), optional `href` |
| `heading` | no | A short line above, set small and uppercase — "Trusted by", "As seen in" |
| `note` | no | A line underneath, e.g. an accreditation number or a qualifier |
| `size` | no | `small`, `medium` (default), `large` — the rendered logo height |
| `tone` | no | `muted` (default), `page`, `light`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

## Example

```yaml
- pattern: logo-wall
  heading: Trusted by
  size: medium
  logos:
    - image:
        src: /images/logos/city-arts-council.svg
        alt: City Arts Council
    - image:
        src: /images/logos/riverside-schools.svg
        alt: Riverside Public Schools
      href: https://example.org
```

## Guidance

- **Only use marks you have permission to use.** A client logo on a site is an implied endorsement; confirm before adding one. If the client can't confirm, leave it out and pass it on.
- Alt text is the organization's name, nothing else. `alt: "Riverside Public Schools"`, not "Riverside Public Schools logo".
- SVG wherever possible. A logo wall is where bitmap logos look worst.
- Logos arrive at wildly different aspect ratios. The pattern sets a uniform height, which makes wide wordmarks look large and square badges look small — trim the whitespace in each file rather than fighting it here.
- Between four and eight. Two looks thin; a dozen looks like a directory.
- Don't grey them out to "make them consistent". It reads as decoration and hurts contrast.

## Changelog

- 1.0.0: Initial version.
