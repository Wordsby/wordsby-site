import { z } from 'astro/zod';
import { base, image } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('team-grid'),
  ...base(),
  heading: z.string().optional(),
  intro: z.string().optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  shape: z.enum(['portrait', 'square', 'circle']).default('portrait'),
  people: z
    .array(
      z.strictObject({
        name: z.string(),
        role: z.string().optional(),
        bio: z.string().optional(),
        photo: image.optional(),
        link: z.strictObject({ label: z.string(), href: z.string() }).optional(),
      }),
    )
    .min(1),
});
