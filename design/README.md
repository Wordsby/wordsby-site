# Design directions

A **direction** is the design system a site is built in: type scale, spacing rhythm, shape language, and the judgment calls that go with them. The client's **brand** (`brand/brand.yaml`) supplies identity — colors, logo, and fonts if they have them. The direction supplies everything else.

```
direction  →  proportions, rhythm, shape, typographic behavior, posture
brand      →  colors, logo, fonts (overrides the direction's suggestions)
craft/     →  universal rules both must obey
```

Two sites in the same direction with different brands look related but not identical. Two sites in different directions look like different studios made them. That's the point: an agency shipping twenty sites can't ship twenty siblings.

## Choosing one

Set it in `brand/brand.yaml`:

```yaml
design:
  direction: quiet-editorial
```

Each direction's `DESIGN.md` opens with what it suits and, more usefully, **what it doesn't**. Read those before choosing. During onboarding, propose two and let the client react to previews — people choose better from examples than from adjectives.

**Don't reuse the direction and palette family of the client you shipped last.** That's how an agency's portfolio converges.

## What's here

| Direction | Canvas | Feel | Suits |
|---|---|---|---|
| [quiet-editorial](directions/quiet-editorial/DESIGN.md) | Light | Serif, spacious, print-like | Nonprofits, arts, law, consultancies, anyone selling trust |
| [modern-utility](directions/modern-utility/DESIGN.md) | Light | Tight, high-contrast, sans | Trades, B2B services, logistics, anyone selling competence |
| [warm-craft](directions/warm-craft/DESIGN.md) | Light | Rounded, generous, human | Local services, food, wellness, family businesses |
| [after-dark](directions/after-dark/DESIGN.md) | **Dark** | Near-black, hairline borders, compressed type | Studios, photographers, music and nightlife, visual work |
| [hard-edge](directions/hard-edge/DESIGN.md) | Light | Heavy display, square corners, solid offset shadows | Creative agencies, bars, record shops, gyms, festivals |
| [broadsheet](directions/broadsheet/DESIGN.md) | Light | Condensed headlines, dense grid, one hot accent | Venues, publications, membership bodies, anyone with listings |
| [photo-led](directions/photo-led/DESIGN.md) | Light | Restrained type, imagery dominant | Restaurants, hotels, real estate, salons — with real photos |
| [mono-bold](directions/mono-bold/DESIGN.md) | Light | Near-monochrome, oversized type, pill buttons | Gyms, sports, barbers, streetwear, coaches |
| [black-tie](directions/black-tie/DESIGN.md) | **Dark** | High-contrast display serif, formal, very spacious | Fine dining, cocktail bars, jewellers, boutique hotels |
| [showroom](directions/showroom/DESIGN.md) | Light | Very large clean display type, imagery carries the drama | Architects, custom builders, showrooms, cosmetic practices |
| [blueprint](directions/blueprint/DESIGN.md) | Light | Strict grid, zero radius, light-weight display | Engineering, manufacturing, labs, technical consultancies |
| [playful-block](directions/playful-block/DESIGN.md) | Light | Rounded, thick borders, pressable shadows | Tutoring, kids' activities, pet care, family entertainment |
| [plain-text](directions/plain-text/DESIGN.md) | Light | Monospace throughout, compact, unadorned | Studios, workshops, coffee roasters, independent makers |
| [billboard](directions/billboard/DESIGN.md) | Light | Giant display type, extreme tracking, few words | Creative studios, photographers, events, launches |
| [expedition](directions/expedition/DESIGN.md) | Light | Uppercase headings with open tracking, technical | Construction, security, drone and survey, outdoor outfitters |
| [soft-serif](directions/soft-serif/DESIGN.md) | Light | Contemporary serif, restrained, content-first | Therapists, clinics, foundations, research organisations |
| [high-voltage](directions/high-voltage/DESIGN.md) | **Dark** | Electric accent, extremely heavy display, dense | Gyms, auto performance, tattoo studios, esports |
| [open-door](directions/open-door/DESIGN.md) | Light | Massive heavy headlines, extra-round shapes | Credit unions, insurance agents, tax preparers, community services |

## Studying existing design languages

Several directions started as a study of a known design language, recorded in `direction.yaml` as `inspired_by`. That's provenance for us, and it stays internal.

What we take is **characteristics** — proportions, rhythm, shape, type behavior, posture — never a brand's palette, typeface, or assets. Combined with a client's own colors and content, the result is a starting point to branch from, not a copy of anyone's site. Two rules:

- **Never name a client-facing direction after a brand**, and never describe a client's site as "built like X".
- **Never carry over a brand's actual colors or licensed fonts.** Colors always come from the client's `brand.yaml`; the font pairing is our choice.

The catalog in [OpenDesign](https://github.com/nexu-io/open-design) (Apache 2.0) is a good place to study more.

## Adding one

Create `directions/<slug>/` with `direction.yaml` (the values the build consumes) and `DESIGN.md` (the prose the agent reads). Keep them consistent — the yaml is the source of truth for anything numeric, and `DESIGN.md` should never repeat a value, only explain how to use it.

A direction must work with **any** brand palette. Never write a color into a direction; the tone system computes those from `brand.yaml` with contrast checked.
