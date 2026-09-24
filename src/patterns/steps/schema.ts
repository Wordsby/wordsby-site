import { z } from 'astro/zod';
import { base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('steps'),
  ...base(),
  heading: z.string().optional(),
  intro: z.string().optional(),
  items: z
    .array(
      z.strictObject({
        title: z.string(),
        text: z.string(),
      }),
    )
    .min(2, 'A process needs at least two steps')
    .max(5, 'Keep it to five steps or fewer; combine steps or split the process into two sections'),
});
