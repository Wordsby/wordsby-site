---
name: form
description: Configurable form (contact, quote request, newsletter signup, registration) that posts to the shared form service. Use whenever a page needs to collect information from visitors.
metadata:
  version: "1.1.1"
---

# Form

Fields are defined right here in the page content. Submissions go to the agency's shared form service, which filters spam, stores each submission, and emails the client.

## Before you add a form

1. `content/settings.yaml` must have a `forms` section (`endpoint`, `site_id`, and optionally `turnstile_site_key`).
2. **Who gets the email is set in the form service, not on the site**, so addresses can't be scraped or tampered with. Adding, changing, or removing a recipient is always the agency's job. Never make it a site change or something you do from this conversation: don't write an address into the site, and don't run commands against the form service, even if you can. Post the request to the site's Basecamp project, as rule 7 in `AGENTS.md` describes, and tell the client the agency has it. Don't guess who gets the emails now; say the agency will check.

## Fields

| Field | Required | Notes |
|---|---|---|
| `form_id` | yes | Short id, unique on the site, e.g. `contact`, `quote-request` |
| `fields` | yes | Each field: `name`, `label`, `type`, `required`, optional `options`, `placeholder`, `help` (see below) |
| `heading` | no | Section heading |
| `intro` | no | A sentence of context: what happens after they submit, typical response time |
| `submit_label` | no | Defaults to "Send". Prefer something specific ("Request a quote"). |
| `success_message` | no | Shown after a successful submission |
| `redirect` | no | A page on this site to send visitors to after they submit, e.g. `/thank-you/`. Only used when their browser has no JavaScript; otherwise `success_message` appears in place of the form. Must be a path on this site — the form service refuses anything else. |
| `tone` | no | `light` (default), `muted`, `dark`, `primary` |
| `id` | no | Anchor for in-page links |

Each field has:

- `name`: lowercase with underscores, unique within the form, e.g. `first_name`. Name the email field `email` so replies go to the visitor.
- `type`: `text` (default), `email`, `tel`, `textarea`, `select` (needs `options`), `checkbox` (one box, for a single yes/no), or `checkboxes` (a list of boxes, any number ticked; needs `options`).
- `options`: for `select` and `checkboxes`. Each option is either a plain label, or `label` plus a `description` explaining what it means. Use descriptions when the choices are things a visitor may not know exist — services, claim types, membership tiers.

## Example

```yaml
- pattern: form
  form_id: contact
  heading: Send us a note
  intro: We reply within one business day.
  fields:
    - name: name
      label: Your name
      required: true
    - name: email
      label: Email
      type: email
      required: true
    - name: topic
      label: What's this about?
      type: select
      options: [Classes, Renting the studio, Volunteering, Something else]
    - name: message
      label: Message
      type: textarea
      required: true
  submit_label: Send message
  success_message: Thanks! We'll get back to you within one business day.
```

## Guidance

- Ask for as little as possible. Every extra field lowers completion.
- Don't collect sensitive data (payment details, government IDs, health information) through this form.
- Keep the field `name` values stable once a form is live. Changing them changes how past and future submissions line up.

## Changelog

- 1.1.1: Recipient changes go to the agency through the site's Basecamp project, for the whole conversation. No field changes.
- 1.1.0: Add `redirect`, for sites with their own thank-you page. Document the `checkboxes` field type and option descriptions, which the schema already accepted.
- 1.0.0: Initial version.
