import { z } from 'astro/zod';
import { base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('testimonials'),
  ...base('muted'),
  heading: z.string().optional(),
  items: z
    .array(
      z.strictObject({
        quote: z.string(),
        name: z.string(),
        role: z.string().optional(),
      }),
    )
    .min(1),
});
