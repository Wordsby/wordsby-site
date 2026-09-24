import { z } from 'astro/zod';
import { loadYaml } from './load-yaml';

const font = z.strictObject({
  family: z.string(),
  source: z.enum(['google', 'system']).default('google'),
  weights: z.array(z.number().int()).default([400, 700]),
  fallback: z.enum(['sans-serif', 'serif', 'monospace']).default('sans-serif'),
});

const rem = z.string().regex(/^\d*\.?\d+rem$/, 'Use a rem value, e.g. "2.5rem"');
const em = z.string().regex(/^-?\d*\.?\d+em$/, 'Use an em value, e.g. "-0.02em"');

const directionSchema = z.strictObject({
  name: z.string(),
  // Where this direction came from, when it started as a study of an existing
  // design language. Provenance for us; never shown to a client.
  inspired_by: z.string().optional(),
  // The page's default background. Sections that don't name a tone follow it.
  canvas: z.enum(['light', 'dark']).default('light'),
  typography: z.strictObject({
    scale: z.number().min(1.05).max(1.6),
    display: z.strictObject({ min: rem, max: rem }),
    heading: font,
    body: font,
    tracking: z.strictObject({ display: em, heading: em, caps: em }),
    // Uppercase headings need positive tracking set above, never negative.
    heading_case: z.enum(['none', 'uppercase']).default('none'),
    // Weight of headings. Loaded automatically, so it needn't be listed in the font's weights.
    heading_weight: z.number().int().min(100).max(900).default(700),
    // Line height of the h1. Craft rules floor display type at 1.0: tighter clips descenders.
    leading_display: z.number().min(1).max(1.3).default(1.15),
    measure: z.string().regex(/^\d+ch$/, 'Use a character count, e.g. "66ch"'),
  }),
  space: z.strictObject({
    rhythm: z.enum(['generous', 'standard', 'compact']),
    gap: z.number().min(0.5).max(2).default(1),
  }),
  shape: z.strictObject({
    radius: z.enum(['sharp', 'soft', 'round', 'pill']),
    border_width: z.string().regex(/^\d+px$/, 'Use a pixel value, e.g. "1px"'),
    // press: a short solid shadow under the element, so it reads as pressable.
    elevation: z.enum(['none', 'soft', 'lift', 'hard', 'press']),
  }),
});

export type Direction = z.output<typeof directionSchema>;

const files = import.meta.glob<string>('/design/directions/*/direction.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export function loadDirection(slug: string): Direction {
  const key = `/design/directions/${slug}/direction.yaml`;
  const raw = files[key];
  if (!raw) {
    const available = Object.keys(files)
      .map((path) => path.split('/')[3])
      .join(', ');
    throw new Error(`brand/brand.yaml asks for the design direction "${slug}", which doesn't exist. Available: ${available}`);
  }
  return loadYaml(raw, directionSchema, key.slice(1));
}
