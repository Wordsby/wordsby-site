import type { Brand } from './brand';
import { firstReadable, mix, mostReadable } from './color';
import type { Direction } from './direction';
import { headingWeight } from './heading-weight';

const WHITE = '#FFFFFF';
const ROOT_PX = 16;
const BASE_TEXT_REM = 1.0625; // 17px

// Viewport range the fluid sizes interpolate across.
const NARROW_PX = 390;
const WIDE_PX = 1280;

const RADIUS = { sharp: '0', soft: '0.5rem', round: '1rem', pill: '1.75rem' } as const;
const ELEVATION = {
  none: 'none',
  soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 10px 28px rgb(0 0 0 / 0.07)',
  lift: '0 18px 44px rgb(0 0 0 / 0.16)',
  // Solid offset, no blur. The color is filled in per tone below: a var() inside a
  // custom property resolves where it's *declared*, so referencing --fg from :root
  // (where no tone is set) would silently produce nothing.
  hard: null,
  press: null,
} as const;
// Section padding: [narrow screen, wide screen] in rem.
const RHYTHM = { generous: [4, 6.5], standard: [3, 4.75], compact: [2.25, 3.25] } as const;

type Tone = { bg: string; fg: string; accent: string; buttonBg: string; buttonFg: string };
type Font = NonNullable<Brand['typography']>['heading'];

/**
 * Turn the design direction and the client's brand into CSS custom properties.
 *
 * The direction sets the system — proportions, rhythm, shape. The brand overrides
 * identity — colors, and fonts when the client has them. Every color pairing is
 * chosen here with contrast checked, so patterns never pick colors themselves:
 * they use --bg, --fg, --accent, --button-bg, --button-fg and stay readable with
 * any palette.
 */
export function tokensCss(brand: Brand, direction: Direction): string {
  const { primary, secondary, neutral_dark: dark, neutral_light: light } = brand.colors;
  const onDark = direction.canvas === 'dark';
  // "Muted" is a small step away from the page, in whichever direction the page runs.
  const muted = onDark ? mix(dark, light, 0.08) : mix(light, dark, 0.06);
  const onPrimary = mostReadable(primary, [WHITE, light, dark]);

  const lightTone = (bg: string): Tone => ({
    bg,
    fg: dark,
    accent: firstReadable(bg, [primary, secondary, dark]),
    buttonBg: primary,
    buttonFg: onPrimary,
  });
  const darkAccent = firstReadable(dark, [secondary, primary, light]);
  const darkTone = (bg: string): Tone => ({
    bg,
    fg: light,
    accent: firstReadable(bg, [secondary, primary, light]),
    buttonBg: darkAccent,
    buttonFg: mostReadable(darkAccent, [WHITE, light, dark]),
  });

  const tones: Record<string, Tone> = {
    light: lightTone(light),
    muted: onDark ? darkTone(muted) : lightTone(muted),
    dark: darkTone(dark),
    primary: { bg: primary, fg: onPrimary, accent: onPrimary, buttonBg: onPrimary, buttonFg: primary },
  };
  // Patterns default to "page", so a dark direction doesn't need every section overridden.
  tones.page = onDark ? tones.dark : tones.light;

  const { typography, space, shape } = direction;
  const step = (n: number) => `${round(BASE_TEXT_REM * typography.scale ** n)}rem`;
  const [narrowSpace, wideSpace] = RHYTHM[space.rhythm];

  const root = {
    '--color-primary': primary,
    '--color-secondary': secondary,
    '--color-dark': dark,
    '--color-light': light,

    '--font-heading': fontStack(headingFont(brand, direction)),
    '--font-body': fontStack(bodyFont(brand, direction)),

    '--text-sm': step(-1),
    '--text-base': step(0),
    '--text-lg': step(1),
    '--text-xl': step(2),
    '--text-2xl': step(3),
    '--text-3xl': fluid(parseRem(typography.display.min), parseRem(typography.display.max)),

    '--tracking-display': typography.tracking.display,
    '--tracking-heading': typography.tracking.heading,
    '--tracking-caps': typography.tracking.caps,
    '--measure': typography.measure,
    '--heading-case': typography.heading_case,
    '--heading-weight': String(headingWeight(brand, direction)),
    '--leading-display': String(typography.leading_display),

    '--section-space': fluid(narrowSpace, wideSpace),
    '--gap': `${round(2.5 * space.gap)}rem`,

    '--radius': RADIUS[shape.radius],
    '--border-width': shape.border_width,
    ...(ELEVATION[shape.elevation] ? { '--shadow': ELEVATION[shape.elevation] as string } : {}),
  };

  const toneRules = Object.entries(tones).map(([name, t]) => {
    // Solid shadows take the tone's own foreground color, so they hold on any background.
    const shadow =
      shape.elevation === 'hard'
        ? `;--shadow:6px 6px 0 ${t.fg}`
        : shape.elevation === 'press'
          ? `;--shadow:0 4px 0 color-mix(in srgb, ${t.fg} 22%, transparent)`
          : '';
    return `.tone-${name}{--bg:${t.bg};--fg:${t.fg};--accent:${t.accent};--button-bg:${t.buttonBg};--button-fg:${t.buttonFg}${shadow}}`;
  });

  return [`:root{${declarations(root)}}`, ...toneRules].join('\n');
}

export function googleFontsUrl(brand: Brand, direction: Direction): string | undefined {
  const heading = headingFont(brand, direction);
  // The weight headings actually use is always loaded, whatever the font
  // lists — and it is the resolved one, or a font would be fetched without
  // the weight the page then asks for and the browser would synthesise it.
  const fonts = [
    { ...heading, weights: [...heading.weights, headingWeight(brand, direction)] },
    bodyFont(brand, direction),
  ].filter((f) => f.source === 'google');
  // Merge weights when heading and body share a family, rather than letting one replace the other.
  const byFamily = new Map<string, Font>();
  for (const font of fonts) {
    const seen = byFamily.get(font.family);
    byFamily.set(font.family, seen ? { ...seen, weights: [...seen.weights, ...font.weights] } : font);
  }
  const families = [...byFamily.values()].map((f) => {
    const weights = [...new Set(f.weights)].sort((a, b) => a - b).join(';');
    return `family=${f.family.replace(/ /g, '+')}:wght@${weights}`;
  });
  return families.length ? `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap` : undefined;
}

function headingFont(brand: Brand, direction: Direction): Font {
  return brand.typography?.heading ?? direction.typography.heading;
}

function bodyFont(brand: Brand, direction: Direction): Font {
  return brand.typography?.body ?? direction.typography.body;
}

function fontStack(font: Font): string {
  const fallback = font.fallback === 'sans-serif' ? 'system-ui, sans-serif' : font.fallback;
  return `"${font.family}", ${fallback}`;
}

/** A size that grows with the viewport between NARROW_PX and WIDE_PX, clamped at both ends. */
function fluid(minRem: number, maxRem: number): string {
  const slope = ((maxRem - minRem) * ROOT_PX) / (WIDE_PX - NARROW_PX);
  const interceptRem = round(minRem - (slope * NARROW_PX) / ROOT_PX);
  return `clamp(${round(minRem)}rem, ${interceptRem}rem + ${round(slope * 100)}vw, ${round(maxRem)}rem)`;
}

function parseRem(value: string): number {
  return Number.parseFloat(value);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function declarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}
