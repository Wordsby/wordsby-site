---
name: create-pattern
description: Build a new section pattern when no installed pattern covers a request, following the rules that keep patterns reusable across every client site. Use only after confirming nothing in PATTERNS.md fits.
craft: [typography, color, layout, accessibility]
---

# Creating a new pattern

Only build one when nothing in `PATTERNS.md` fits. Combining existing patterns is almost always better than adding a new one.

A new pattern is a design-system change, so **post to the site's Basecamp project before you build** (rule 7 in `AGENTS.md`): what the client asked for, and why no installed pattern fits. Then build it on your branch; the agency reviews it in the pull request. Flag it for the shared library afterward.

## Anatomy

```
src/patterns/<name>/
├── SKILL.md        # what it's for, every field, an example, guidance
├── schema.ts       # the content schema (validated at build time)
└── <name>.astro    # the component (folder name and filename must match)
```

The folder name, the `name` in `SKILL.md`, and the `z.literal()` in the schema must all be the same. The build fails if they aren't. A pattern is picked up automatically once these files exist.

## The rules

1. **No hard-coded colors, fonts, or spacing.** Use tone variables (`--bg`, `--fg`, `--accent`, `--button-bg`, `--button-fg`) and scale tokens (`--space-*`, `--text-*`, `--radius`, `--font-*`). This is what lets one pattern look native on every brand.
2. **Render inside `Section`** (`../_shared/Section.astro`), and accept the shared `base()` fields (`id`, `tone`).
3. **Accessible and responsive.** Semantic HTML, keyboard support, a sensible heading level (`h2`, since the page owns the `h1`), and no fixed widths.
4. **Images need `alt`.** Use the shared `image` schema, which requires it.
5. **Content only, no client specifics.** No hard-coded client names, copy, or URLs. Examples in `SKILL.md` use placeholder content.
6. **Works without JavaScript**, or degrades gracefully if it can't.

## Schema

```ts
import { z } from 'astro/zod';
import { base, action, image } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('team-grid'),
  ...base('light'),
  heading: z.string().optional(),
  members: z.array(z.strictObject({
    name: z.string(),
    role: z.string(),
    photo: image.optional(),
  })).min(1),
});
```

Write error messages an agent can act on: `z.string().regex(/^[a-z-]+$/, 'Use lowercase letters and hyphens')`. The schema is the pattern's contract, and good messages here prevent bad content later.

## After building

1. `npm run patterns:index` to update `PATTERNS.md`.
2. `npm run check`.
3. `npm run screenshots -- /page-using-it/` and look at both widths. Try a different brand's colors in `brand.yaml` if you can, since that's where hard-coded styles show up.
4. In your summary, say you added a pattern and **flag it as a candidate for the shared library**, so the agency can generalize it for other clients.
