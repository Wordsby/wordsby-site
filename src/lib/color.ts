// WCAG 2 contrast helpers. Colors are 6-digit hex strings like "#1F4E79".

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** The candidate with the highest contrast against the background. */
export function mostReadable(background: string, candidates: string[]): string {
  return candidates.reduce((best, c) => (contrast(background, c) > contrast(background, best) ? c : best));
}

/** The first candidate that meets the contrast target, or the most readable one if none do. */
export function firstReadable(background: string, candidates: string[], target = 4.5): string {
  return candidates.find((c) => contrast(background, c) >= target) ?? mostReadable(background, candidates);
}

/** Mix two colors; amount is the share of `b` (0–1). */
export function mix(a: string, b: string, amount: number): string {
  const [ca, cb] = [rgb(a), rgb(b)];
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * amount));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
