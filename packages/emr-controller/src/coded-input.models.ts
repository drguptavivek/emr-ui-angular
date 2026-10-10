import type { ClinicalAssessmentStatus } from './models.js';
import type { EmrCodedValue, EmrFieldDefinition } from './field-contract.models.js';
import type { EmrValidationMessage } from './validation.models.js';

/**
 * View model for EmrCodedInput: capture-side chip entry for one coded field.
 * The controller owns terminology lookup, paging, debouncing, edition/version,
 * synonym matching and validation (including binding strength). The UI renders
 * what is supplied and never filters `options`.
 */
export interface CodedInputViewModel {
  readonly definition: EmrFieldDefinition;
  /** One concept when `cardinality.max` is 1, otherwise a list. `null` = nothing chosen. */
  readonly value: EmrCodedValue | readonly EmrCodedValue[] | null;
  readonly status?: ClinicalAssessmentStatus;
  readonly query: string;
  /** Search results, already scoped and ranked by the controller. */
  readonly options: readonly EmrCodedValue[];
  readonly open: boolean;
  readonly loading: boolean;
  readonly messages: readonly EmrValidationMessage[];
  readonly readOnly?: boolean;
  readonly emptyMessage: string;
  /**
   * Code-system display names keyed by `EmrCodedValue.system` (for example
   * `http://snomed.info/sct` to `SNOMED CT`). Controller-supplied so the UI never
   * maps a system itself; an unmapped system is shown as its raw identifier.
   */
  readonly systemLabels?: Readonly<Record<string, string>>;
}

export type CodedInputIntent =
  | { readonly type: 'queryChangeRequested'; readonly query: string }
  | { readonly type: 'searchRequested'; readonly query: string; readonly valueSetCanonical?: string }
  | { readonly type: 'openRequested' }
  | { readonly type: 'closeRequested' }
  | { readonly type: 'conceptSelected'; readonly concept: EmrCodedValue }
  | { readonly type: 'conceptRemoveRequested'; readonly code: string; readonly system: string }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus };
