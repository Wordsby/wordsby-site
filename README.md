# Client site

A static site built from Markdown. Content lives in `content/`, brand facts in `brand/brand.yaml`, and reusable sections in `src/patterns/`.

**Working on this site with an AI agent? Read `AGENTS.md` first.**

## Commands

```bash
npm install
npm run dev       # local dev server
npm run check     # build + check links, alt text, headings, quotes, pattern index
npm test          # tests for the check scripts
npm run build     # production build into dist/
npm run preview   # serve the built site

npm run ingest -- https://old-site.com   # pull an existing site into .ingest/ (see skills/import-site)
npm run lint:design                  # the craft rules that can be checked mechanically
npm run screenshots -- / /contact/   # full-page images in .screenshots/, desktop and mobile
npm run screenshots -- --all         # every page, plus a layout audit in .screenshots/audit.json
```

Screenshots need Chrome or Chromium (set `CHROME_PATH` if it's somewhere unusual). They're deterministic: motion is frozen, fonts and images are waited for, and layout has to hold still before the capture, so two runs of an unchanged site produce identical images.

The layout audit reports text clipped by its container, text printed over other text, and content wider than the viewport. Add `--fail-on-issues` to make it exit non-zero, which is how CI runs it.

## How a site is designed

`brand/brand.yaml` holds the client's colors and logo and names a **design direction** (`design/directions/`), which sets proportions, rhythm, and shape. `craft/` holds the universal rules that apply whichever direction is used. See `design/README.md` and the platform repo's Design Library doc.

## Deploying

Deploys run from GitHub Actions, not from a dashboard: `.github/workflows/site.yml` builds, checks, audits the layout, then publishes. Pushing to `main` deploys production; every other branch gets its own preview URL, posted as a comment on the pull request.

Nothing in this repo connects it to Cloudflare, and it holds no credentials. Wordsby deploys it: its GitHub App sees each push and pull request, and a workflow Wordsby runs builds the site and deploys it with a token this repo never holds ([decided 2026-09-23](https://github.com/Wordsby/wordsby/blob/main/docs/open-questions.md)). The Worker's name comes from the site's record in the platform, not from `wrangler.jsonc`, so two agencies' `acme` sites can't overwrite each other.

What that means day to day: a pull request gets **two** checks — `site`, from the workflow here, which builds the site and runs the link, alt-text, heading, redirect, quote and design checks plus the layout audit; and `deploy`, from the Wordsby app, which posts the preview URL as a comment. Merging to `main` publishes.

**Agent tools.** A site recorded in Wordsby carries a `.mcp.json` pointing at its own tools — reading the site's record, building previews, and passing a request to the agency. `new-site` writes it; for a site that predates it, `npm run platform -- mcp-config <slug>` does. Each person authorizes once in a browser, so the file holds no credential.

Branch protection requires **both** checks, so a change cannot reach the live site without having been built, checked and previewed.

**`main` is not technically protected on private repositories without a paid GitHub plan** (GitHub Pro for a personal account; a paid organization plan otherwise). Until a site has that, the only thing stopping a direct push to `main` is the rule in `AGENTS.md` — so treat it as a hard rule. When the plan allows it: **Settings → Branches → Add rule → Require a pull request before merging**.

Set the production URL in `content/settings.yaml` (`site.url`) so canonical links and the sitemap are right, and set `site.indexable: false` for any staging or rehearsal copy.

## Forms

Forms post to the shared form service. Set `forms.endpoint` and `forms.site_id` in `content/settings.yaml`, and register the site in the form service so submissions reach the right inbox. Recipients are configured there, never here.
