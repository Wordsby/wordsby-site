import { z } from 'astro/zod';
import { base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('content'),
  ...base(),
  width: z.enum(['narrow', 'wide']).default('narrow'),
});
