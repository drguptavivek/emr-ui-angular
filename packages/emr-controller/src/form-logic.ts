import type { ClinicalFieldState, ClinicalFieldValue } from './clinical-form.models.js';
import type { EmrCondition, EmrExpr } from './condition.models.js';
import { evalCondition, evalExpr } from './condition.evaluate.js';

/**
 * The one emptiness rule: engine (required, constraints, clearing) and renderers (hidden-with-value stays
 * visible) must agree on what "no value" means.
 */
export function isEmptyValue(v: ClinicalFieldValue | undefined): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  return typeof v === 'object' && 'value' in v && 'unit' in v && (v as { value: unknown }).value === null;
}

/** Logic for one rendered field. Order of `EmrFormLogic.fields` is document order. */
export interface EmrFieldLogic {
  relevant?: EmrCondition;
  required?: boolean;
  requiredCondition?: EmrCondition;
  constraint?: { condition: EmrCondition; message?: string };
  /** Stage of a multi-sitting form; at a stage only its own fields' required rules apply. */
  stage?: number;
  /** Display-only (e.g. an ODK note): never required, never part of the data. */
  display?: boolean;
}

/** A value that is not rendered: calculated, or supplied by the app (prefill) when `calculation` is absent. */
export interface EmrComputedLogic {
  id: string;
  relevant?: EmrCondition;
  calculation?: EmrExpr;
}

export interface EmrFormLogic {
  fields: Readonly<Record<string, EmrFieldLogic>>;
  computed: readonly EmrComputedLogic[];
}

export interface EmrLogicContext {
  /** Current stage of a staged form (1-based); undefined = one sitting (all stages). */
  stage?: number;
  /** Data managers may edit earlier stages. */
  canEditEarlierStages?: boolean;
  /** Show "required" errors (after a submit attempt), not while typing. */
  showRequiredErrors?: boolean;
  requiredMessage?: string;
  constraintMessage?: string;
}

export interface EmrResolvedLogic {
  /** Input values after calculations and clearing of non-relevant fields. */
  values: Record<string, ClinicalFieldValue>;
  /** Engine-written state per field: value, hidden, required, readOnly, error. Merge into the view model. */
  fields: Record<string, ClinicalFieldState>;
  /** Errors to show now (required only after a submit attempt). */
  errors: Record<string, string>;
  /** Every error that blocks submit, shown or not. */
  blockingErrors: Record<string, string>;
  canSubmit: boolean;
  /**
   * Set if relevance did not settle within the pass budget. Values are only ever cleared, so today this cannot
   * happen; it guards future features (e.g. defaults that set values). Never ignore it.
   */
  settleError?: string;
}

/**
 * ODK-style resolution: calculations in document order (a non-relevant calculation is cleared), then
 * relevance to a fixed point (a non-relevant field is hidden AND its value cleared; clearing can make
 * others non-relevant), then per-field state. Constraints judge only non-empty values; required is static
 * or a requiredCondition. Staged forms: earlier stages read-only (unless canEditEarlierStages), later
 * stages hidden, required only for the current stage.
 */
export function resolveLogic(logic: EmrFormLogic, input: Readonly<Record<string, ClinicalFieldValue>>, ctx: EmrLogicContext = {}): EmrResolvedLogic {
  const values: Record<string, ClinicalFieldValue> = { ...input };
  const order = Object.keys(logic.fields);
  const read = () => values as Readonly<Record<string, unknown>>;

  for (const c of logic.computed) {
    if (!c.calculation) continue; // app-supplied (prefill): arrives in `input`
    const relevant = !c.relevant || evalCondition(c.relevant, read());
    values[c.id] = relevant ? (evalExpr(c.calculation, read()) as ClinicalFieldValue) : null;
  }

  const hidden = new Set<string>();
  let settled = false;
  for (let pass = 0; pass <= order.length + 1; pass++) {
    let changed = false;
    for (const id of order) {
      const f = logic.fields[id]!;
      const isHidden = !!f.relevant && !evalCondition(f.relevant, read());
      if (isHidden !== hidden.has(id)) { if (isHidden) hidden.add(id); else hidden.delete(id); changed = true; }
      if (isHidden && !isEmptyValue(values[id])) { values[id] = null; changed = true; }
    }
    if (!changed) { settled = true; break; }
  }

  const fields: Record<string, ClinicalFieldState> = {};
  const errors: Record<string, string> = {};
  const blockingErrors: Record<string, string> = {};
  for (const id of order) {
    const f = logic.fields[id]!;
    const laterStage = ctx.stage !== undefined && f.stage !== undefined && f.stage > ctx.stage;
    const earlierStage = ctx.stage !== undefined && f.stage !== undefined && f.stage < ctx.stage;
    const isHidden = hidden.has(id) || laterStage;
    const required = !isHidden && !f.display && !earlierStage
      && (f.requiredCondition ? evalCondition(f.requiredCondition, read()) : !!f.required);
    const value = values[id] ?? null;
    let error: string | undefined;
    let isRequiredError = false;
    if (!isHidden && !isEmptyValue(value) && f.constraint && !evalCondition(f.constraint.condition, read())) {
      error = f.constraint.message || ctx.constraintMessage || 'Value is not allowed';
    } else if (required && isEmptyValue(value)) {
      error = ctx.requiredMessage || 'Required';
      isRequiredError = true;
    }
    if (error) {
      blockingErrors[id] = error;
      if (!isRequiredError || ctx.showRequiredErrors) errors[id] = error;
    }
    fields[id] = {
      value,
      ...(isHidden ? { hidden: true } : {}),
      required,
      ...(earlierStage && !ctx.canEditEarlierStages ? { readOnly: true } : {}),
      ...(errors[id] ? { error: errors[id] } : {}),
    };
  }

  const settleError = settled ? undefined : 'Relevance did not settle: fields hide and show each other. Check the definition.';
  return { values, fields, errors, blockingErrors, canSubmit: settled && Object.keys(blockingErrors).length === 0, ...(settleError ? { settleError } : {}) };
}
