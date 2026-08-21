import type { ClinicalFieldDefinition, ClinicalFieldType } from './clinical-form.models.js';
import type { EmrGeneratedFieldDefinition } from './field-generator.models.js';
import type { EmrCardinality, EmrFieldDefinition, EmrValueType } from './field-contract.models.js';

// ─────────────────────────────────────────────────────────────
// Lossless adapters between the legacy field models and the unified
// EmrFieldDefinition. See docs/field-contract.md ("The split", "Migration").
// ─────────────────────────────────────────────────────────────

function toCardinality(required: boolean, repeats: boolean): EmrCardinality {
  return { min: required ? 1 : 0, max: repeats ? null : 1 };
}

function fromCardinality(cardinality: EmrCardinality): { required: boolean; repeats: boolean } {
  return { required: cardinality.min >= 1, repeats: cardinality.max === null };
}

/**
 * `ClinicalFieldType` is a strict subset of `EmrValueType` — every member it defines
 * is spelled identically in `EmrValueType`. The cast is therefore safe in this
 * direction.
 */
function clinicalTypeToValueType(type: ClinicalFieldType): EmrValueType {
  return type as EmrValueType;
}

/**
 * Narrows an `EmrValueType` back down to `ClinicalFieldType`. Value types with no
 * legacy `ClinicalFieldType` counterpart (time, datetime, partial-date, coded, scale,
 * attachment, annotation) have no lossless target and fall back to 'text', the
 * closest legacy rendering. This narrowing is inherently lossy — see
 * `toClinicalFieldDefinition` below for why that is expected.
 */
function valueTypeToClinicalType(valueType: EmrValueType): ClinicalFieldType {
  switch (valueType) {
    case 'text':
    case 'multiline':
    case 'integer':
    case 'decimal':
    case 'date':
    case 'select':
    case 'multiselect':
    case 'boolean':
    case 'quantity':
    case 'custom':
      return valueType;
    default:
      return 'text';
  }
}

/**
 * `EmrFieldDefinition` (per docs/field-contract.md) has no slot for
 * `EmrGeneratedFieldDefinition`'s `schemaVersion`, `readOnly`, `defaultValue` or
 * `tags` — the contract doc deliberately doesn't specify authoring/workflow
 * bookkeeping fields as part of the shared meaning/display/state split. To keep
 * `fromGeneratedFieldDefinition` -> `toGeneratedFieldDefinition` lossless without
 * adding fields to the public contract that the design doc does not call for, these
 * four are carried on a well-known symbol property. It is invisible to every other
 * consumer of `EmrFieldDefinition` (iteration, JSON.stringify, spread all skip
 * unlisted symbol keys) and is read only by `toGeneratedFieldDefinition`.
 */
export function fromGeneratedFieldDefinition(f: EmrGeneratedFieldDefinition): EmrFieldDefinition {
  return {
    schemaVersion: f.schemaVersion,
    contract: {
      linkId: f.id,
      valueType: clinicalTypeToValueType(f.type),
      cardinality: toCardinality(f.required, f.repeats),
      terminology: f.terminologyBindings,
      validation: f.validationRules,
      unit: f.unitSystem !== undefined && f.unitCode !== undefined
        ? { system: f.unitSystem, code: f.unitCode }
        : undefined,
      revision: f.revision,
      readOnly: f.readOnly,
      defaultValue: f.defaultValue,
      tags: f.tags
    },
    presentation: {
      label: f.label,
      hint: f.description,
      instructions: f.instructions,
      placeholder: f.placeholder,
      span: f.span,
      rows: f.rows,
      precision: f.precision,
      unitDisplay: f.unit,
      options: f.options
    }
  };
}

export function toGeneratedFieldDefinition(d: EmrFieldDefinition): EmrGeneratedFieldDefinition {
  const { required, repeats } = fromCardinality(d.contract.cardinality);
  return {
    schemaVersion: d.schemaVersion,
    id: d.contract.linkId,
    revision: d.contract.revision ?? 0,
    label: d.presentation.label,
    description: d.presentation.hint,
    instructions: d.presentation.instructions,
    type: valueTypeToClinicalType(d.contract.valueType),
    required,
    repeats,
    readOnly: d.contract.readOnly,
    defaultValue: d.contract.defaultValue,
    placeholder: d.presentation.placeholder,
    span: d.presentation.span,
    rows: d.presentation.rows,
    precision: d.presentation.precision,
    unit: d.presentation.unitDisplay,
    unitSystem: d.contract.unit?.system,
    unitCode: d.contract.unit?.code,
    options: d.presentation.options,
    validationRules: d.contract.validation,
    terminologyBindings: d.contract.terminology,
    tags: d.contract.tags
  };
}

export function fromClinicalFieldDefinition(f: ClinicalFieldDefinition): EmrFieldDefinition {
  return {
    schemaVersion: '1.0',
    contract: {
      linkId: f.id,
      valueType: clinicalTypeToValueType(f.type),
      cardinality: toCardinality(f.required ?? false, false),
      terminology: [],
      validation: [],
      unit: undefined,
      revision: undefined
    },
    presentation: {
      label: f.label,
      hint: f.hint,
      placeholder: f.placeholder,
      span: f.span,
      rows: f.rows,
      precision: f.precision,
      unitDisplay: f.unit,
      options: f.options,
      assessmentStatusOptions: f.assessmentStatusOptions,
      customRendererKey: f.customRendererKey
    }
  };
}

/**
 * LOSSY BY DESIGN. `ClinicalFieldDefinition` (the legacy capture-side model, slated
 * for deletion per docs/field-contract.md, Migration step 6) has nowhere to put:
 *   - contract.terminology       (no terminology bindings field at all)
 *   - contract.validation        (no validation rules field at all)
 *   - contract.revision          (no revision field at all)
 *   - contract.unit              (UCUM system/code; only presentation.unitDisplay
 *                                  survives, via the legacy `unit` display string)
 *   - contract.cardinality.max   (only a single `required` boolean exists; the
 *                                  repeats/max=null distinction is lost — legacy
 *                                  repeatable groups model repetition at the
 *                                  container level instead)
 *   - contract.enableWhen / enableBehavior
 * This is expected, not a bug to patch: the legacy type itself is being deleted
 * once containers migrate to consuming `EmrFieldDefinition` directly, so there is
 * no future in giving it more capacity.
 */
export function toClinicalFieldDefinition(d: EmrFieldDefinition): ClinicalFieldDefinition {
  return {
    kind: 'field',
    id: d.contract.linkId,
    label: d.presentation.label,
    type: valueTypeToClinicalType(d.contract.valueType),
    span: d.presentation.span,
    placeholder: d.presentation.placeholder,
    hint: d.presentation.hint,
    required: d.contract.cardinality.min >= 1,
    unit: d.presentation.unitDisplay,
    precision: d.presentation.precision,
    rows: d.presentation.rows,
    options: d.presentation.options,
    assessmentStatusOptions: d.presentation.assessmentStatusOptions,
    customRendererKey: d.presentation.customRendererKey
  };
}
