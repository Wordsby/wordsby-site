import { z } from 'astro/zod';
import { base, image } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('gallery'),
  ...base(),
  heading: z.string().optional(),
  intro: z.string().optional(),
  layout: z.enum(['grid', 'feature', 'strip']).default('grid'),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  crop: z.enum(['square', 'landscape', 'portrait', 'none']).default('landscape'),
  images: z
    .array(
      z.strictObject({
        image,
        caption: z.string().optional(),
      }),
    )
    .min(2),
});
