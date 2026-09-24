# Avoiding the machine-made look

Concrete, checkable differences between "a person who has shipped sites made this" and "default model output." Rules marked **[checked]** are enforced by `npm run check`; failing one is a defect. The rest need your judgment, which is exactly why they're the ones that slip.

## Visual tells

1. **Tailwind indigo as the accent** — `#6366f1`, `#4f46e5`, `#8b5cf6` and their neighbours. The textbook tell. **[checked]**
2. **A two-stop gradient across the hero** — purple to blue, blue to cyan. **[checked]**
3. **Emoji as icons** — ✨ 🚀 🎯 ⚡ inside headings, buttons, or list items. Use a real icon or nothing. **[checked]**
4. **The rounded card with a colored left border.** The canonical generated-dashboard tile. Drop the radius or the border. **[checked]**
5. **Beige and brass by default** for anything "premium" or "artisan". See `color.md`.
6. **Decorative blobs and wave dividers.** Meaningless geometry that dates instantly.
7. **Perfectly symmetric everything.** Some tension — an off-centre image, one section that breathes more — reads as designed.

## Copy tells

8. **Invented numbers** — "10× faster", "99.9% uptime", "trusted by thousands". Every figure on a client's site must come from the client. If you need a number you don't have, ask, or write the sentence without it. **[checked]**
9. **Filler text** — lorem ipsum, "Feature one", "Your headline here". An empty section is a design problem to solve, not a place to invent words. **[checked]**
10. **Performative craft phrases** — "Quietly trusted by", "Field notes", "Crafted with care", "From the bench". They sound like a brand voice and say nothing.
11. **Scroll prompts** — "Scroll", "↓ Scroll to explore". If they haven't scrolled yet, they're looking at your hero. They know how scrolling works.
12. **Section-number eyebrows** — `01 / SERVICES`, `002 · About`. Also decorative locale and time strips ("Springfield, 14:23").
13. **Fake product UI** built from styled divs — a pretend dashboard or terminal in the hero.
14. **Cute copy that says nothing.** Forced metaphors, mock-poetic taglines, wordplay that doesn't survive a second read. Boring and clear beats clever and vague.

## The standard skeleton

A page that goes hero → three features → testimonials → FAQ → call to action, with each section the same shape, is the generated template. It isn't wrong, but it's forgettable. Vary at least one section: a full-bleed quote instead of a testimonial grid, a comparison against the status quo instead of a feature list, a single strong photo instead of a three-column row.

## Where to put the character

Aim for roughly **80% proven patterns and 20% distinctive choice**. Spend the 20% on:

- **One bold move** — a type choice, one color decision, an unexpected proportion. One. Three is noise.
- **Voice in the microcopy.** "Tell us about your project" beats "Submit". The client's real phrasing beats both.
- **One detail only someone who knows this business would include** — the specific parking instruction, the actual thing customers always ask, the real photo of the real room.

The test: if someone outside the project sees a screenshot and can tell *which* business it belongs to, it has character. If it could be any business in that industry, it's a template with a logo on it.
