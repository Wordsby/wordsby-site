// Discovers every pattern in src/patterns/<name>/ automatically.
// A pattern folder needs schema.ts (exporting `schema`) and <name>.astro.
// Folders starting with "_" hold shared helpers and aren't patterns.
import { z } from 'astro/zod';

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

export const sectionSchema = z.discriminatedUnion(
  'pattern',
  patterns.map((p) => p.schema) as [PatternSchema, ...PatternSchema[]],
);

export type Section = z.output<typeof sectionSchema>;

export const components: Record<string, any> = Object.fromEntries(patterns.map((p) => [p.name, p.component]));
