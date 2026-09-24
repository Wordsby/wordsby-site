# Layout craft

## Spacing

- All spacing comes from the `--space-*` scale. No arbitrary values. **[checked]**
- Space between sections should be several times the space inside them. When outer and inner spacing are similar, a page reads as one undifferentiated block.
- Density is a decision, and the design direction makes it: relaxed, standard, or compact. Compact means *tighter spacing*, never smaller type.

## The hero

- **It must fit in the first screen.** Heading at most two lines on desktop, supporting text at most 20 words, buttons visible without scrolling.
- **At most four elements**: eyebrow, heading, one paragraph, buttons. No trust badges, no pricing teaser, no feature list, no avatar row. The hero is one moment, not a summary of the page.
- A four-line heading is a font-size problem, not a copy-length problem.
- If you can't state the value in 20 words, the value isn't clear yet — ask the client rather than writing around it.

## Rhythm across the page

- **Don't repeat a section shape.** Once a layout family is used — image beside text, three-column grid, centered band — it shouldn't drive more than one other section. A page of eight sections needs at least four different shapes.
- **Never three image-beside-text sections in a row.** Two is the limit; the third reads as a template.
- **Alternate density.** One tight section followed by one that breathes reads as intentional. Uniform spacing reads as generated.
- **Eyebrows are rationed: at most one per three sections**, counting the hero. Most sections don't need one — the heading alone is enough.
- **Tones alternate, but not endlessly.** Two tones besides the default, per page, is plenty.

## Buttons and actions

- **One primary button per screen.** A long page may repeat the same call to action once at the end, but never two primary buttons in the same viewport for the same job.
- A secondary action beside the primary is fine, styled as secondary.
- Button labels start with a verb and say what happens: "Book a consultation" beats "Learn more".

## Images

- **Real images.** A page of text and colored boxes isn't minimalism, it's unfinished. Ask the client for photos.
- Never hotlink from a stock CDN. **[checked]** Images live in `public/`.
- Give every image an aspect ratio in CSS so the page doesn't jump as it loads.
- Text over an image: anchor it to one corner with even inset, keep it fully inside the frame, and don't cover faces. If no corner works, put the text beside the image instead.

## Structural integrity

These are requirements, not preferences. `npm run screenshots` audits the first three automatically.

- Elements never overlap accidentally.
- Text is never clipped by its container.
- The page never scrolls sideways at any width.
- Nothing depends on hover alone — touch users can't hover.
- Mobile is a re-layout, not a squeeze. Rebuild the hierarchy for a narrow screen instead of shrinking the desktop one.
