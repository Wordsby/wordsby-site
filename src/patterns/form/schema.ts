import { z } from 'astro/zod';
import { base } from '../_shared/schema';

// An option can be a plain label, or a label plus a line explaining what it means.
// The explanation matters when the choices are things a visitor may not know exist.
const option = z.union([
  z.string(),
  z.strictObject({ label: z.string(), description: z.string().optional() }),
]);

const field = z
  .strictObject({
    name: z.string().regex(/^[a-z][a-z0-9_]*$/, 'Use lowercase letters, numbers, and underscores, e.g. "first_name"'),
    label: z.string(),
    type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'checkboxes']).default('text'),
    required: z.boolean().default(false),
    options: z.array(option).optional(),
    placeholder: z.string().optional(),
    help: z.string().optional(),
  })
  .refine((f) => !['select', 'checkboxes'].includes(f.type) || (f.options && f.options.length > 0), {
    message: 'Select and checkboxes fields need a list of options',
    path: ['options'],
  });

export const schema = z
  .strictObject({
    pattern: z.literal('form'),
    ...base(),
    form_id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens, e.g. "contact"'),
    heading: z.string().optional(),
    intro: z.string().optional(),
    fields: z.array(field).min(1).max(30),
    submit_label: z.string().default('Send'),
    success_message: z.string().default("Thanks! We'll be in touch soon."),
    // Only a path on this site. The form service refuses anything else, so a shared
    // service can't be turned into a redirector for someone else's links.
    redirect: z
      .string()
      .regex(/^\/(?!\/)[^\s\\]*$/, 'Use a path on this site, e.g. "/thank-you/"')
      .optional(),
  })
  .refine((form) => new Set(form.fields.map((f) => f.name)).size === form.fields.length, {
    message: 'Each field needs a unique name',
    path: ['fields'],
  });
