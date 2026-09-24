# Color craft

`brand/brand.yaml` supplies the palette and the build computes accessible pairings from it (see `src/lib/tokens.ts`). These rules govern how much of it to use, and where.

## The four layers

A coherent page has all four, in roughly these proportions. Plan them before writing any CSS.

| Layer | Share of the page | Where it comes from |
|---|---|---|
| **Neutrals** | 70–90% | `--bg`, `--fg`, `--border` |
| **Accent** | 5–10% | `--accent`, `--button-bg` |
| **Semantic** | 0–5% | success/warning/error states |
| **Effects** | under 1% | gradients, glows — rarely justified |

## Accent discipline

Accent overuse is the single biggest readability failure in machine-made pages.

- **At most two visible uses of the accent per screen.** A typical pair: one eyebrow or chip, and one primary button.
- Links count as accent. If a screen already has a primary button, links can be foreground with an underline.
- Hover and focus rings count too. Budget accordingly.
- **One accent for the whole site.** A warm-grey page does not suddenly get a blue button in the fifth section.

## Contrast is a gate, not a goal

| Pair | Minimum |
|---|---|
| Body text on its background | **4.5:1** |
| Large text (18px+, or 14px bold), icons | **3:1** |
| Interactive components against their surroundings | **3:1** |

Our tone system computes these pairings and picks readable combinations automatically. That's why patterns must use `--fg`, `--bg`, `--accent`, `--button-bg`, and `--button-fg` rather than reaching for a brand color directly. **[checked]**

Text contrast must never *drop* on hover or focus. Shift the background, the border, or the position instead. Disabled is the only state allowed to reduce contrast.

## Never hard-code a color

No hex values in patterns, components, or content. **[checked]** Colors live in `brand.yaml` and flow through tokens. A hard-coded hex breaks theming, breaks the contrast guarantees, and will be wrong the moment the client rebrands.

## Avoid these defaults

- **Tailwind indigo** (`#6366f1` and its neighbours) as an accent. It is the single most recognizable "a machine chose this" signal. **[checked]**
- **Two-stop gradients on a hero** — purple to blue, blue to cyan. A flat surface with confident type beats it every time. **[checked]**
- **Beige-and-brass everywhere.** Warm cream background, clay or ochre accent, espresso text is the default palette for anything described as premium, artisan, or heritage. It's become invisible. If a client's brand genuinely is that, fine — but never arrive there by default.
- **Pure black and pure white.** Both vibrate on screen. Use a near-black and an off-white, which is what `neutral_dark` and `neutral_light` are for.
