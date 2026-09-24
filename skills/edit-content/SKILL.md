---
name: edit-content
description: Make a routine content change to a live site — update wording, hours, prices, staff, or add a section to an existing page. Use for everyday client requests that don't need a new page or a new pattern.
craft: [typography, color, anti-ai-slop]
---

# Routine edits

Most requests are small. Speed matters, but so does not breaking anything. The whole job should take a few minutes.

## 1. Find the real target

```bash
grep -ril "the text they mentioned" content/ brand/
```

The client says "the hours on the contact page." Find where that fact actually lives. It may be in `content/pages/contact.md`, in `brand/brand.yaml` (contact details), or in `content/settings.yaml` (menus).

**If a fact appears in more than one place, that's a bug.** Fix it so it lives in one place, and mention it in your summary.

## 2. Make the smallest change that does the job

- Change the content, not the structure, unless they asked for a structural change.
- Match the surrounding voice (`brand/VOICE.md`). A new sentence shouldn't read like it came from somewhere else.
- Don't "improve" things they didn't ask about. Note them in your summary instead and let them decide.
- Adding a section? Read that pattern's `SKILL.md` first, and use only fields it lists.
- **Adding or changing a testimonial?** Find it in `content/quotes.yaml` and copy it from there. A quote the client has just sent goes into that file first, word for word, with where it came from (for example "Client email, 2026-09-16"). Never tidy a customer's words or credit; if the client asks for a change, record it under `approved` with their reason.

## 3. Check

```bash
npm run check
npm run screenshots -- /the-page-you-changed/
```

Look at the screenshots in `.screenshots/`, desktop and mobile.

## 4. Ship it

```bash
git checkout -b change/short-description
git add -A && git commit -m "Update studio hours on the contact page"
git push -u origin change/short-description
```

Open a pull request whose description is your plain-English summary.

## 5. Tell them what you did

Write it the way you'd say it out loud, with no file paths:

> Updated the studio hours on the Contact page: Tuesday–Friday is now 10 am–9 pm, and Saturday is 10 am–6 pm. Here's the preview: <link>. Say the word and I'll publish it.

If something blocked you, say exactly what you need. If you noticed something worth fixing but didn't touch it, mention it in one line at the end.

## Watch out for

- **Requests that are really design changes** ("make the buttons bigger," "change our blue"). Those belong to the agency. Draft nothing. Post it to the site's Basecamp project (rule 7 in `AGENTS.md`) and tell the client you have.
- **Facts you can't verify.** New prices, dates, or claims come from the client, never from you.
- **Deleting content.** If a request would remove a chunk of content, confirm first.
