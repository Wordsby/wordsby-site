import { parse } from 'yaml';
import { z } from 'astro/zod';

/** Parse a YAML config file and validate it, failing the build with a readable message. */
export function loadYaml<T extends z.ZodType>(raw: string, schema: T, file: string): z.output<T> {
  const result = schema.safeParse(parse(raw));
  if (!result.success) {
    throw new Error(`${file} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
