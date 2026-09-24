import { z } from 'astro/zod';
import { action, base, image } from '../_shared/schema';

export const schema = z
  .strictObject({
    pattern: z.literal('hero'),
    ...base(),
    variant: z.enum(['centered', 'split']).default('centered'),
    eyebrow: z.string().optional(),
    heading: z.string(),
    text: z.string().optional(),
    actions: z.array(action).max(2).default([]),
    image: image.optional(),
  })
  .refine((hero) => hero.variant !== 'split' || hero.image, {
    message: 'The split variant needs an image',
    path: ['image'],
  });
