import { z } from 'astro/zod';
import { action, base, image } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('split'),
  ...base(),
  heading: z.string(),
  eyebrow: z.string().optional(),
  text: z.string().optional(),
  points: z.array(z.string()).optional(),
  image,
  // Which side the image sits on at desktop width. Stacks image-first on mobile.
  media: z.enum(['left', 'right']).default('right'),
  ratio: z.enum(['even', 'text', 'image']).default('even'),
  crop: z.enum(['landscape', 'square', 'portrait', 'tall', 'none']).default('landscape'),
  actions: z.array(action).default([]),
});
