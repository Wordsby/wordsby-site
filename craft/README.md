# Craft rules

Universal design craft: rules a competent designer applies **regardless of the client**. They sit on top of the brand.

- `brand/brand.yaml` and `design/directions/` decide *which* colors, fonts, and proportions this site uses.
- These files decide *how to use them well* — all-caps always needs at least `0.06em` letter-spacing, whichever brand it is.

Keeping them separate means brand files stay free of craft boilerplate, and craft rules stay free of any one client's drift.

## Files

| File | Read it when |
|---|---|
| [typography.md](typography.md) | Any work that sets or restyles text (nearly everything) |
| [color.md](color.md) | Any work that touches color, tone, or contrast |
| [layout.md](layout.md) | Building or changing page structure and spacing |
| [anti-ai-slop.md](anti-ai-slop.md) | Writing copy or building marketing pages — the tells that make a site look machine-made |
| [accessibility.md](accessibility.md) | Any interactive or structural change |

Each skill in `skills/` lists the craft files it needs in its frontmatter:

```yaml
craft: [typography, color, anti-ai-slop]
```

Read those files before you start. Don't read all five for a one-line copy change.

## Enforced vs. guidance

Some rules are checked mechanically by `npm run check` (see `scripts/design-lint.mjs`). Those are marked **[checked]**. Failing one is a defect, not a matter of taste.

The rest are guidance: nobody will catch a violation automatically, which makes them the ones that need your judgment.

## Attribution

Adapted from the [OpenDesign](https://github.com/nexu-io/open-design) project's `craft/` references (Apache 2.0), which in turn adapt the MIT-licensed [refero_skill](https://github.com/referodesign/refero_skill) by Refero Design. Rewritten here for our token system and for content-driven brochure sites, and trimmed of material that doesn't apply (decks, motion-heavy UI, CJK typesetting).
