import raw from '../../content/settings.yaml?raw';
import { z } from 'astro/zod';
import { loadYaml } from './load-yaml';

const link = z.strictObject({
  label: z.string(),
  href: z.string(),
});

const settingsSchema = z.strictObject({
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
