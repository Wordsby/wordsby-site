import raw from '../../content/settings.yaml?raw';
import { z } from 'astro/zod';
import { loadYaml } from './load-yaml';

const link = z.strictObject({
  label: z.string(),
  href: z.string(),
});

const settingsSchema = z.strictObject({
  /**
   * Which half of a site's life this repo is in.
   *
   * "build" is the design phase: sections can be bespoke files in src/sections/,
   * styling is unconstrained, and the checks report instead of failing. Nothing
   * is live, so there is nothing for the gates to protect.
   *
   * "care" is the maintained phase: pages are assembled from versioned patterns,
   * every value comes from a design token, and the checks block. The rules that
   * keep a live client site safe only make sense once there is one.
   */
  mode: z.enum(['build', 'care']).default('care'),
  site: z.strictObject({
    url: z.url(),
    language: z.string().default('en'),
    // Set false for a rehearsal, staging copy, or anything not meant to be found.
    // A duplicate of a client's real site competing with it in search is worse than useless.
    indexable: z.boolean().default(true),
  }),
  navigation: z.strictObject({
    header: z.array(link).default([]),
    cta: link.optional(),
    footer: z.array(link).default([]),
  }),
  forms: z
    .strictObject({
      endpoint: z.url(),
      site_id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens'),
      turnstile_site_key: z.string().optional(),
    })
    .optional(),
});

export const settings = loadYaml(raw, settingsSchema, 'content/settings.yaml');
