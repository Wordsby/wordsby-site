# Bespoke sections

One-off sections for this site only. This folder exists in **build mode**, while the
design is still being found.

A pattern in `src/patterns/` is a contract: a versioned schema, a `SKILL.md`, no client
specifics, and every value from a design token, so it can be dropped onto any site. That
contract is what makes a pattern safe to edit a year later — and it's also a ceiling on
what a page can look like, because you can only assemble what somebody already generalised.

A bespoke section is the opposite, deliberately:

- **One file.** `src/sections/<name>.astro`. No schema, no `SKILL.md`, no folder.
- **No validation.** Whatever you put in the page's frontmatter arrives as props.
- **No rules about styling.** Hard-code a colour, a size, a grid, a gradient. Use the
  design tokens where they help and ignore them where they don't.
- **This site only.** Client names, real copy, a specific photograph — all fine.

## Using one

```astro
---
// src/sections/split-intro.astro
const { heading, body, image, alt } = Astro.props;
---
<section class="split">
  <div><h2>{heading}</h2><p>{body}</p><slot /></div>
  <img src={image} alt={alt} />
</section>
<style>
  .split { display: grid; gap: 3rem; grid-template-columns: 1fr 1fr; padding: 6rem 2rem; }
  @media (max-width: 800px) { .split { grid-template-columns: 1fr; padding: 3rem 1.5rem; } }
</style>
```

```yaml
# content/pages/about.md
sections:
  - section: split-intro
    heading: Twenty years in one room
    body: We have taught here since 2004.
    image: /studio.jpg
    alt: The main studio, mid-class
```

The page's Markdown body is passed to every section as the default slot, so a bespoke
section can place it with `<slot />`.

If a section renders its own `<h1>`, set `show_title: false` on the page so it doesn't
get a second one.

## One cost worth knowing

Every page is built from a single Astro route, so while a site is in build mode each
bespoke section's CSS ships on **every** page, whether that page uses it or not.
`npm run check` names the sections no page references so you can delete the ones you've
moved on from. Graduating to care mode removes the cost entirely — by then there are no
bespoke sections left.

It's a design-phase tax, and a small one. Don't let it stop you trying things.

## Afterwards

When the design settles, the sections worth keeping become patterns. `npm run
harvest-report` says what each one needs, and `skills/harvest/SKILL.md` is the procedure.
A section used on one page and unlikely to come back is fine to leave exactly as it is —
until the site graduates to care mode, which is where everything on a page has to be a
pattern. `npm run graduate` won't let you leave one behind.
