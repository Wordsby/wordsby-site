# Patterns

The library patterns installed in this site. Each one lives in `src/patterns/<name>/`, with a `SKILL.md` explaining its fields. **Read a pattern's SKILL.md before using it.**

<!-- patterns:start -->
| Pattern | Version | Use it for |
|---|---|---|
| [content](src/patterns/content/SKILL.md) | 1.0.0 | Places the page's Markdown body text (everything below the frontmatter). Use for long-form copy like an About story, policies, or details that don't fit a structured pattern. |
| [cta-banner](src/patterns/cta-banner/SKILL.md) | 1.0.0 | Bold, centered call-to-action band with a heading, short text, and one or two buttons. Use to close a page or break up a long one with a clear next step. |
| [faq](src/patterns/faq/SKILL.md) | 1.0.0 | Expandable list of questions and answers, with FAQ structured data for search engines. Use for common questions about services, pricing, visiting, or policies. |
| [feature-grid](src/patterns/feature-grid/SKILL.md) | 1.0.0 | Grid of 2–4 columns of short items (title, text, optional image and link). Use for services, programs, benefits, or "ways to get involved". |
| [form](src/patterns/form/SKILL.md) | 1.1.1 | Configurable form (contact, quote request, newsletter signup, registration) that posts to the shared form service. Use whenever a page needs to collect information from visitors. |
| [hero](src/patterns/hero/SKILL.md) | 1.0.0 | Opening section with the page's main heading (h1), supporting text, up to two buttons, and an optional image. Use at most once per page, as the first section. |
| [steps](src/patterns/steps/SKILL.md) | 1.0.0 | Numbered, ordered steps joined by a line, showing a process from start to finish. Use for "how it works", "what happens next", or onboarding sequences where order matters. |
| [testimonials](src/patterns/testimonials/SKILL.md) | 1.0.0 | Quotes from real customers, students, members, or partners, each with a name and optional role. Use for social proof near a call to action. |
| [value-gap](src/patterns/value-gap/SKILL.md) | 1.0.0 | Explainer with a large statement, short paragraphs, and an unlabeled two-bar diagram showing something worth less than it should be, with the difference called out. Use to explain a shortfall or loss in plain terms before selling the fix. |
<!-- patterns:end -->

The table above is generated from each pattern's `SKILL.md` by `npm run patterns:index`. Don't edit it by hand.

## Local customizations

_None yet._ If you change a library pattern for this site only, note what you changed and why here, so a later upgrade of that pattern can keep your change.
