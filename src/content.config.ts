import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sectionSchema } from './patterns/registry';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/pages' }),
  schema: z.strictObject({
    title: z.string(),
    description: z.string().max(160, 'Keep descriptions under 160 characters so search results show all of it'),
    sections: z.array(sectionSchema).default([]),
    draft: z.boolean().default(false),
    // A page shows its title above the sections unless it opens with a hero or a
    // bespoke section. Set it explicitly when a bespoke section renders its own h1.
    show_title: z.boolean().optional(),
  }),
});

export const collections = { pages };
