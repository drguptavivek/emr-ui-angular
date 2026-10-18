import type { ClinicalFormSchema } from './clinical-form.models.js';

/**
 * Feature level of the form engine and renderers in this build. Bump it, and add a row to
 * ENGINE_LEVELS, whenever block kinds, field types or condition operators are added, so a
 * definition stamped with `minEngine` is never opened by a build that cannot render it.
 *
 *   1  sections, field and repeatable blocks, all ClinicalFieldType values
 *   2  matrix blocks
 */
export const EMR_ENGINE_VERSION = 2;

/** Minimum engine level a schema needs: the highest level of any feature it uses. */
export function requiredEngineFor(schema: ClinicalFormSchema): number {
  let level = 1;
  for (const section of schema.sections) {
    for (const block of section.blocks) {
      if (block.kind === 'matrix') level = Math.max(level, 2);
    }
  }
  return level;
}
