import { z } from 'astro/zod';
import { base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('faq'),
  ...base(),
  heading: z.string().default('Frequently asked questions'),
  items: z
    .array(
      z.strictObject({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .min(1),
});
