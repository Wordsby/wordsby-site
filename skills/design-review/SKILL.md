---
name: design-review
description: Score a built page across five design dimensions with evidence, then produce Keep / Fix / Quick-win lists. Use before handing a new site or a significant redesign to the client, or when someone asks what's wrong with a page.
craft: [typography, color, layout, anti-ai-slop, accessibility]
---

# Design review

`npm run check` proves a page is *correct*. This decides whether it's any *good*.

## Run it as a separate pass

**Don't review work you produced in the same turn.** You will defend it. Either review a page someone else built, or start a fresh session, look at the screenshots first, and read the code second.

## 1. Look before you read

```bash
npm run check                                   # must pass before reviewing
npm run screenshots -- / /about/ /contact/      # every page you're reviewing
```

Open every image in `.screenshots/`, desktop and mobile. Form an impression before you read a line of code — that's the impression a visitor gets. Then read the CSS and content to explain it.

Also read: `brand/STYLEGUIDE.md`, `brand/VOICE.md`, the site's design direction in `design/directions/<name>/DESIGN.md`, and `SITE.md` for what the page is *for*.

## 2. Score five dimensions, 0–10

Each is independent. A page can be 9 on Direction and 4 on Hierarchy — say so. Don't average away an interesting failure.

Bands: **0–4** broken · **5–6** functional · **7–8** strong · **9–10** exceptional.

### 1. Direction consistency
Does the page commit to its design direction in every decision — spacing, shape, type, tone sequence — or is it three styles in a coat?
*Evidence:* Are shapes consistent (all sharp or all soft, not both)? Does the eyebrow and label vocabulary stay in one register? Is the accent applied by one rule throughout?
**0–4** styles fighting · **5–6** one direction, half the elements drift · **7–8** coherent with occasional drift · **9–10** every element argues the same case.

### 2. Hierarchy
Can a stranger tell what to read first, second, third, without being told?
*Evidence:* Is the biggest thing the most important thing? Is there a clear primary/secondary/tertiary tier, or does everything shout equally? Does the eye land on the call to action?
**0–4** everything shouts · **5–6** works in the hero, breaks below · **7–8** clear tiers, occasional collision · **9–10** the eye moves with no friction.

### 3. Craft
The 90/10: alignment, tracking at large sizes, image framing, consistent spacing, edge cases.
*Evidence:* Do column tops align? Is spacing between sections consistent, and clearly larger than spacing within them? Any orphaned word on a heading's last line? All-caps tracked? Display type tracked in? Mobile at 390px as considered as desktop?
**0–4** visible tape and string · **5–6** mostly clean, one or two ragged spots · **7–8** polished, an expert finds two or three misses · **9–10** nothing to pick at.

### 4. Usefulness
Does the page do its job for the visitor and the client? Check it against the goals and calls to action in `SITE.md`.
*Evidence:* Is the primary action obvious within the first screen? Is the copy specific — real prices, hours, places, names — or generic? Are the questions a real customer would ask actually answered? Is the phone number tappable on mobile?
**0–4** looks fine, doesn't do the job · **5–6** core path works, edges broken · **7–8** solid through normal use · **9–10** anticipates what the visitor needs next.

### 5. Distinctiveness
Could this be any business in this industry, or is it recognizably *this* one?
*Evidence:* One memorable move that isn't required? Real photographs of real people and places? Copy that sounds like the client rather than like a website? Or is it the standard skeleton with a logo dropped in?
**0–4** generic template · **5–6** competent, forgettable · **7–8** one memorable moment · **9–10** unmistakably this business.

## 3. Scoring discipline

- **Cite evidence for every score.** "Scored 5: the Services heading and the three card titles are all 24px semibold, so nothing leads" beats "hierarchy feels off". A number without evidence is rejected.
- **Don't average up.** The score is the worst sustained band, not the mean of good and bad pages.
- **Don't inflate.** A 7 means strong, not acceptable. If every score is 7+, you aren't reviewing.
- **Distinctiveness is allowed to be low** for a conservative client. Don't punish appropriate restraint — but say plainly when a page is forgettable.
- Anything the design lint already caught is a defect, not a review finding. Fix it and move on.

## 4. Produce the lists

Aggregate the evidence into three lists:

- **Keep** (3–5 items): what's working that a future change must not break. Name the element.
- **Fix** (3–6 items): ordered by visual cost saved per minute spent. One sentence each.
- **Quick wins** (3–5 items): five to fifteen minutes each, disproportionate payoff.

## 5. Report

Write the review to `.reviews/<yyyy-mm-dd>-<page-or-site>.md`: the five scores with their evidence paragraphs (30–80 words each), then the three lists. Then tell the person in plain language: the one-line verdict, the weakest dimension, and the top three fixes.

Never report a mean above 8 without saying explicitly why the page deserves it.
