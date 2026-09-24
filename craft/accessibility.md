# Accessibility baseline

The floor for every site we ship, not an enhancement. Aim at WCAG 2.2 AA. Several of these are checked mechanically; the rest are on you.

## Structure

- **Exactly one `<h1>` per page.** **[checked]** Heading levels descend without skipping — an `h3` never follows an `h1` directly.
- Landmarks in place: one `<header>`, one `<main>`, one `<footer>`, and `<nav>` with a label when there's more than one.
- A skip link to the main content, visible on focus.
- Lists are lists, buttons are `<button>`, links are `<a>`. A clickable `<div>` is invisible to a screen reader and a keyboard.

## Text alternatives

- **Every image needs an `alt`.** **[checked]** Describe what matters in context, not what a caption would say. Purely decorative images take `alt=""`.
- Icon-only buttons need an accessible name.
- Link text works out of context: "Read our pricing", never "click here".

## Contrast

Body text at 4.5:1, large text and icons at 3:1, interactive components at 3:1 against their surroundings. The tone system computes these; don't work around it with hard-coded colors.

## Keyboard and focus

- Everything interactive is reachable and operable by keyboard, in the order it appears.
- **Focus is always visible.** Never remove an outline without replacing it with something at least as clear.
- Nothing traps focus. Anything that opens can be closed with Escape.
- No behaviour depends on hover.

## Touch and motion

- Tap targets at least 44×44px, with space between them.
- Respect `prefers-reduced-motion`: reduce or remove movement, don't ignore it.
- Nothing flashes more than three times a second.

## Forms

- Every field has a real `<label>`, not a placeholder pretending to be one.
- Errors are described in text next to the field, not by color alone, and say how to fix the problem.
- Required fields are marked in text, not only with a red asterisk.
- Related inputs are grouped in a `<fieldset>` with a `<legend>`.

## Content

- The page has a `lang` attribute.
- Page titles are unique and describe the page.
- Don't convey meaning with color alone — pair it with text or a shape.
