import { z } from 'astro/zod';
import { base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('stats'),
  ...base('muted'),
  heading: z.string().optional(),
  intro: z.string().optional(),
  items: z
    .array(
      z.strictObject({
        value: z.string(),
        label: z.string(),
        note: z.string().optional(),
      }),
    )
    .min(2)
    .max(6),
});
