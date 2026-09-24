// Building blocks shared by pattern schemas.
import { z } from 'astro/zod';

// "page" follows the design direction's canvas, so a dark direction doesn't need
// every pattern's default overridden.
export const toneEnum = z.enum(['page', 'light', 'muted', 'dark', 'primary']);
export type Tone = z.output<typeof toneEnum>;

/** Fields every pattern accepts: an optional anchor id and a background tone. */
export function base(defaultTone: Tone = 'page') {
  return {
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens')
      .optional(),
    tone: toneEnum.default(defaultTone),
  };
}

export const action = z.strictObject({
  label: z.string(),
  href: z.string(),
  style: z.enum(['primary', 'secondary']).default('primary'),
});

export const image = z.strictObject({
  src: z.string().startsWith('/', 'Use a path under public/, e.g. "/images/team.jpg"'),
  alt: z.string().min(1, 'Describe the image for people using screen readers'),
});
