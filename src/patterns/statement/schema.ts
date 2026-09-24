import { z } from 'astro/zod';
import { base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('statement'),
  ...base(),
  statement: z.string().max(120, 'Keep the statement to one or two short sentences; put the detail in `text`'),
  heading: z.string().optional(),
  text: z.array(z.string()).max(3, 'Three paragraphs at most; the statement is the point of this section').default([]),
});
