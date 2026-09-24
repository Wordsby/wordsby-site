---
name: onboard-client
description: Interview a new client and capture everything needed to build their site — brand facts, voice, audiences, goals, and sitemap — into SITE.md, brand/brand.yaml, brand/VOICE.md, brand/STYLEGUIDE.md, and content/settings.yaml. Use at the start of a brand-new site, before building anything.
craft: [color, typography]
---

# Onboarding a new client

Your job is to end up with specs good enough that someone could build the right site from them without talking to the client again. You get there by asking, not guessing.

## Before you ask anything

1. **If they have an existing site, read it first.** Fetch the homepage and main pages. Pull out what the organization does, services, locations, hours, staff, testimonials, colors, and logo. Every fact you find is a question you don't have to ask.
2. Then confirm rather than interrogate: "Your current site says you've been in business since 2004 and you serve the whole Chicago metro. Still right?"

## Ask in small batches

Ask **three to five questions at a time**, in plain language, and never ask for something you can already see. Between batches, reflect back what you heard.

**Batch 1: the business**
- What does the organization do, in your own words?
- Who are your customers, and what do they usually need from you?
- What do you want the website to do for you? What counts as a win?
- Is there anything the site must not do or say?

**Batch 2: getting people to act**
- When someone visits, what's the one thing you most want them to do?
- What normally makes someone choose you over the alternative?
- What questions do people ask you over and over?
- Do you have testimonials or reviews we can use? (Only use real ones they provide. Record each in `content/quotes.yaml` word for word, credited exactly as they give it, with where it came from.)

**Batch 3: the pages**
- Propose a sitemap based on what you've heard, and ask them to correct it.
- For each page, confirm its purpose in one sentence.

**Batch 4: voice and look**
- Do you have a logo, brand colors, and fonts? (These usually arrive from the brand intake screens. If not, ask for files and hex codes. Fonts are optional — the design direction supplies a pairing when the client has none.)
- Any websites you like the look of? What do you like about them?
- How should you sound: formal or casual? Any words you love or hate?

## Choose a design direction

The direction decides the site's proportions, rhythm, and shape language — everything except the client's own colors and logo. Read `design/README.md`, then each candidate's `DESIGN.md`, paying attention to its **Avoid for** section.

1. Narrow to **two** directions that fit the audience and what the client is selling.
2. Show them, don't describe them. Build the same page in both if you can, or point at the previews. People choose far better from examples than from adjectives.
3. Record the choice in `brand/brand.yaml` under `design.direction`.
4. **Don't pick the direction the last client got.** Check the recent sites in the agency's GitHub organization. An agency whose sites all look alike has a portfolio problem, not a design system.

Say the choice out loud in one sentence so it's cheap to correct: *"Reading this as a community arts centre selling trust and warmth to first-timers, so I'd build it in Quiet Editorial — serif, spacious, print-like."*

**Batch 5: the practical facts**
- Contact details: address, phone, email, hours.
- Social profiles.
- Domain name, and who currently hosts the site.
- Where should form submissions be emailed? (Recipients are set in the form service by the agency, not on the site.)

## Write the specs

Write these files as you go, and tell the client when each is done:

| File | What goes in it |
|---|---|
| `brand/brand.yaml` | Exact values: colors (6-digit hex), fonts, logo paths, tagline, contact info, social links |
| `brand/VOICE.md` | How they sound, words to use and avoid, a sample sentence in their voice |
| `brand/STYLEGUIDE.md` | Visual direction: imagery style, color use, layout preferences |
| `SITE.md` | Organization, audiences, goals in order, primary calls to action, sitemap, content notes, out of scope. Ask the agency, not the client, for the "Agency" section: the Basecamp project link and who to notify. |
| `content/settings.yaml` | Production URL, menus, form service settings |

Save logo files to `brand/assets/` and reference them from `brand.yaml`.

## Rules

- **Never invent facts.** No made-up history, statistics, testimonials, staff, or credentials. If you need something and don't have it, ask. If they don't know yet, write `TODO:` in the spec and tell them what's outstanding.
- **Exact values go in `brand.yaml`, judgment goes in the prose files.** Never put a hex code in `STYLEGUIDE.md`.
- Keep the client's own phrasing when it's good. They often describe themselves better than you will.

## Finish

1. Summarize the specs back in plain language, section by section.
2. List anything still missing (`TODO:` items) and what you need from them.
3. Confirm: "Ready for me to build a first version from this?"
4. When they say yes, follow `skills/build-site/SKILL.md`.
