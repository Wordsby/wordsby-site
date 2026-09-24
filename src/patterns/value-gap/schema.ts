import { z } from 'astro/zod';
import { base } from '../_shared/schema';

export const schema = z.strictObject({
  pattern: z.literal('value-gap'),
  ...base(),
  heading: z.string().optional(),
  statement: z.string().max(120, 'Keep the statement to one short sentence or two; put the detail in `text`'),
  text: z.array(z.string()).max(4, 'Four paragraphs at most; this is an explainer, not an article').default([]),
  bars: z.strictObject({
    full: z.string(),
    reduced: z.string(),
    gap: z.string(),
    note: z.string().optional(),
    share: z
      .number()
      .int()
      .min(40, 'Use 40–90: below 40 the reduced bar is too short to read as the same thing')
      .max(90, 'Use 40–90: above 90 the gap is too narrow to see')
      .default(70),
    summary: z.string().min(1, 'Describe what the diagram shows for people using screen readers'),
  }),
});
