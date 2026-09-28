import { z } from 'astro/zod';
import { base, image } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('logo-wall'),
  ...base('muted'),
  heading: z.string().optional(),
  note: z.string().optional(),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  logos: z
    .array(
      z.strictObject({
        image,
        href: z.string().optional(),
      }),
    )
    .min(2),
});
