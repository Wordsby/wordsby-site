import { z } from 'astro/zod';
import { base, image } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('feature-grid'),
  ...base(),
  heading: z.string().optional(),
  intro: z.string().optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  items: z
    .array(
      z.strictObject({
        title: z.string(),
        text: z.string(),
        image: image.optional(),
        link: z.strictObject({ label: z.string(), href: z.string() }).optional(),
      }),
    )
    .min(1),
});
