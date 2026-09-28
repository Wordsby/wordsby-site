import { parse } from 'yaml';
import { z } from 'astro/zod';

/** Parse a YAML config file and validate it, failing the build with a readable message. */
export function loadYaml<T extends z.ZodType>(raw: string, schema: T, file: string, override?: unknown): z.output<T> {
  const result = schema.safeParse(merge(parse(raw), override));
  if (!result.success) {
    throw new Error(`${file} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Deep-merge plain objects; anything else replaces wholesale. Used by design variants. */
function merge(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) out[key] = merge(base[key], value);
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
