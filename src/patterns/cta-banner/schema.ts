import { z } from 'astro/zod';
import { action, base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('cta-banner'),
  ...base('primary'),
  heading: z.string(),
  text: z.string().optional(),
  actions: z.array(action).min(1).max(2),
});
