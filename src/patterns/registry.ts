// Discovers every pattern in src/patterns/<name>/ automatically.
// A pattern folder needs schema.ts (exporting `schema`) and <name>.astro.
// Folders starting with "_" hold shared helpers and aren't patterns.
//
// It also discovers the bespoke sections in src/sections/, which exist only in
// build mode. A pattern is a contract: a versioned schema, a SKILL.md, and no
// client specifics, so it can be reused on every site. A bespoke section is the
// opposite on purpose — one file, this site only, whatever markup and CSS the
// design needs. Designing against a fixed set of patterns caps what a page can
// look like, and that cap costs most while the design is still being found.
import { z } from 'astro/zod';
import { mode } from '../lib/mode';

type PatternSchema = z.ZodObject<{ pattern: z.ZodLiteral<string> } & z.ZodRawShape>;

const schemaModules = import.meta.glob<{ schema: PatternSchema }>('./*/schema.ts', { eager: true });
const componentModules = import.meta.glob<{ default: any }>('./*/*.astro', { eager: true });

const folderOf = (path: string) => path.split('/')[1];

const patterns = Object.entries(schemaModules)
  .filter(([path]) => !folderOf(path).startsWith('_'))
  .map(([path, mod]) => {
    const name = folderOf(path);
    const literal = mod.schema.shape.pattern?.value;
    if (literal !== name) {
      throw new Error(`src/patterns/${name}/schema.ts must declare pattern: z.literal('${name}') (found '${literal}')`);
    }
    const component = componentModules[`./${name}/${name}.astro`]?.default;
    if (!component) {
      throw new Error(`src/patterns/${name}/ is missing its component, ${name}.astro`);
    }
    return { name, schema: mod.schema, component };
  });

export const patternSchema = z.discriminatedUnion(
  'pattern',
  patterns.map((p) => p.schema) as [PatternSchema, ...PatternSchema[]],
);

export type Section = z.output<typeof patternSchema>;

export const components: Record<string, any> = Object.fromEntries(patterns.map((p) => [p.name, p.component]));

// --- bespoke sections (build mode only) -------------------------------------

// Every page comes from one route, so Astro collects the styles of everything this
// module can reach onto all of them: while a site is in build mode, each bespoke
// section's CSS ships on every page, used or not. That's a real cost, and the reason
// `npm run check` nags about sections no page references. Graduating removes it —
// care mode has no bespoke sections left.
const sectionModules = import.meta.glob<{ default: any }>('../sections/*.astro', { eager: true });

export const sections: Record<string, any> = Object.fromEntries(
  Object.entries(sectionModules).map(([path, mod]) => [path.split('/').pop()!.replace(/\.astro$/, ''), mod.default]),
);

export const sectionNames = Object.keys(sections).sort();

/**
 * A bespoke section reference: `- section: <name>` plus whatever fields that
 * section's component reads. Deliberately unvalidated — the point is to try a
 * design without first writing a schema for it.
 */
const bespokeSchema = z
  .object({ section: z.string() })
  .passthrough()
  .superRefine((value, ctx) => {
    const available = sectionNames.join(', ') || 'none yet';
    if (mode === 'care') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `This site is in care mode, where pages are built from patterns in PATTERNS.md, ` +
          `so "- section: ${value.section}" can't be used. Either use a pattern, or read ` +
          `skills/harvest/SKILL.md to turn the bespoke section into one.`,
      });
      return;
    }
    if (!sections[value.section]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `No bespoke section named "${value.section}". Create src/sections/${value.section}.astro, or use one of: ${available}.`,
      });
    }
  });

/** Either a pattern reference or, in build mode, a bespoke section reference. */
export const sectionSchema = z
  .any()
  .superRefine((value, ctx) => {
    const schema = isBespoke(value) ? bespokeSchema : patternSchema;
    const result = schema.safeParse(value);
    if (!result.success) for (const issue of result.error.issues) ctx.addIssue(issue);
  })
  .transform((value) => (isBespoke(value) ? bespokeSchema.parse(value) : patternSchema.parse(value)));

function isBespoke(value: unknown): value is { section: string } {
  return Boolean(value) && typeof value === 'object' && 'section' in (value as object);
}
