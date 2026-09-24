import raw from '../../brand/brand.yaml?raw';
import { z } from 'astro/zod';
import { loadYaml } from './load-yaml';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color, e.g. "#1F4E79"');

const font = z.strictObject({
  family: z.string(),
  source: z.enum(['google', 'system']).default('google'),
  weights: z.array(z.number().int()).default([400, 700]),
  fallback: z.enum(['sans-serif', 'serif', 'monospace']).default('sans-serif'),
});

const brandSchema = z.strictObject({
  name: z.string(),
  tagline: z.string().optional(),
  design: z
    .strictObject({
      // Which design direction this site is built in. See design/README.md.
      direction: z.string().regex(/^[a-z0-9-]+$/),
    })
    .default({ direction: 'modern-utility' }),
  logo: z.strictObject({
    primary: z.string(),
    on_dark: z.string().optional(),
    // Browser tab icon. Falls back to public/favicon.svg when absent.
    icon: z.string().optional(),
    // Header height. Wide wordmarks work at the default; square badges need more.
    height: z
      .string()
      .regex(/^\d*\.?\d+rem$/, 'Use a rem value, e.g. "4rem"')
      .optional(),
  }),
  colors: z.strictObject({
    primary: hex,
    secondary: hex,
    neutral_dark: hex,
    neutral_light: hex,
  }),
  // Optional: most small businesses have no brand typeface. When it's absent the
  // design direction supplies a deliberate pairing instead.
  typography: z
    .strictObject({
      heading: font,
      body: font,
      /**
       * How heavy headings are, when the client's own type says so.
       *
       * The direction sets a weight that suits its typeface. A brand with its
       * own typeface often disagrees — Libre Caslon Text ships 400 and 700,
       * so a direction asking for 600 gets browser-synthesised bold, which is
       * not what the brand sheet shows. Set this and the brand wins.
       *
       * Left out, the direction's weight is used, snapped to a weight the
       * brand's heading font actually has.
       */
      heading_weight: z.number().int().min(100).max(900).optional(),
    })
    .optional(),
  contact: z
    .strictObject({
      email: z.email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .default({}),
  social: z.record(z.string(), z.url()).default({}),
});

export type Brand = z.output<typeof brandSchema>;

export const brand: Brand = loadYaml(raw, brandSchema, 'brand/brand.yaml');

const assetUrls = import.meta.glob<string>('/brand/assets/*', { eager: true, query: '?url', import: 'default' });

/** Resolve a path from brand.yaml (e.g. "brand/assets/logo.svg") to a built asset URL. */
export function brandAsset(path: string): string {
  const url = assetUrls['/' + path.replace(/^\//, '')];
  if (!url) {
    const available = Object.keys(assetUrls).map((key) => key.slice(1)).join(', ') || 'none';
    throw new Error(`brand/brand.yaml references "${path}", but that file doesn't exist. Files in brand/assets: ${available}`);
  }
  return url;
}
