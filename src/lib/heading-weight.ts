import type { Brand } from './brand';
import type { Direction } from './direction';

/**
 * How heavy headings are.
 *
 * The brand's own number wins, because a client's typeface is identity and
 * the weight is part of it. Failing that, the direction's weight — but only
 * if the heading font actually ships it. A font asked for a weight it does
 * not have gets synthesised by the browser: Libre Caslon Text at 600 renders
 * as its 700, which is how Wordsby's own headings came out bold against a
 * brand sheet that sets them regular. So it snaps to the nearest weight the
 * font really has.
 */
export function headingWeight(brand: Brand, direction: Direction): number {
  const asked = brand.typography?.heading_weight;
  if (asked) return asked;

  const wanted = direction.typography.heading_weight;
  const available = brand.typography?.heading.weights;
  if (!available || available.length === 0 || available.includes(wanted)) return wanted;

  return available.reduce((closest, weight) =>
    Math.abs(weight - wanted) < Math.abs(closest - wanted) ? weight : closest,
  );
}
