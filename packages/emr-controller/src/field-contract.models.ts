import type { ClinicalAssessmentStatus, ClinicalOption } from './models.js';
import type { ClinicalAssessmentStatusOption, ClinicalFieldValue } from './clinical-form.models.js';
import type { FieldValidationRule } from './field-generator.models.js';
import type { TerminologyBinding } from './terminology.models.js';
import type { EmrEnableWhen } from './validation.models.js';
import type { EmrValidationMessage } from './validation.models.js';

// ─────────────────────────────────────────────────────────────
// The field contract — see docs/field-contract.md ("The split").
// A field is three things kept apart: CONTRACT (meaning), PRESENTATION
// (display), and STATE (per-instance runtime).
// ─────────────────────────────────────────────────────────────

export type EmrValueType =
  | 'text'
  | 'multiline'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'time'
  | 'datetime'
  | 'partial-date'
  | 'select'
  | 'multiselect'
  | 'quantity'
  | 'coded'
  | 'scale'
  | 'attachment'
  | 'annotation'
  | 'custom';

export interface EmrCardinality {
  readonly min: number; // 0 = optional, >=1 = required
  readonly max: number | null; // null = unbounded (repeats)
}

export interface EmrUnitBinding {
  readonly system: string; // e.g. 'http://unitsofmeasure.org'
  readonly code: string; // e.g. 'kg', 'mm[Hg]'
}

// One valueType may be rendered several ways. The widget hint chooses; it never
// changes meaning. A 'coded' field is the same data whether shown as a dropdown,
// a radio list, or a search box.
export type EmrWidgetHint =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'chips'
  | 'likert'
  | 'search'
  | 'stepper';

export interface EmrPartialDate {
  readonly value: string;
  readonly precision: 'year' | 'month' | 'day';
}

export interface EmrCodedValue {
  readonly system: string;
  readonly code: string;
  readonly display: string;
  readonly version?: string;
}

// ─────────────────────────────────────────────────────────────
// 1. CONTRACT — what the data MEANS.
//    Stable, serializable, interoperable. Contains no display data.
//    This is the part that maps to FHIR Questionnaire.item.
// ─────────────────────────────────────────────────────────────
export interface EmrFieldContract {
  readonly linkId: string; // stable identity; FHIR Questionnaire.item.linkId
  readonly valueType: EmrValueType;
  readonly cardinality: EmrCardinality; // replaces `required` + `repeats`
  readonly terminology: readonly TerminologyBinding[];
  readonly validation: readonly FieldValidationRule[];
  readonly enableWhen?: readonly EmrEnableWhen[];
  readonly enableBehavior?: 'all' | 'any';
  readonly unit?: EmrUnitBinding; // UCUM system + code, NOT a display string
  readonly revision?: number;
  /** This field is never editable, regardless of runtime state. A definition-level
   *  constraint, distinct from `EmrFieldState` being read-only for one instance. */
  readonly readOnly?: boolean;
  /** Seed value for a new instance. Maps to FHIR `Questionnaire.item.initial`. */
  readonly defaultValue?: ClinicalFieldValue;
  /** Organisational metadata for library search and grouping. Carries no clinical meaning. */
  readonly tags?: readonly string[];
}

// ─────────────────────────────────────────────────────────────
// 2. PRESENTATION — how it LOOKS.
//    Freely swappable without changing what the data means.
// ─────────────────────────────────────────────────────────────
export interface EmrFieldPresentation {
  readonly label: string;
  readonly hint?: string;
  readonly instructions?: string;
  readonly placeholder?: string;
  readonly span?: 3 | 4 | 6 | 8 | 9 | 12;
  readonly rows?: number;
  readonly precision?: number; // display rounding only
  readonly widget?: EmrWidgetHint;
  readonly unitDisplay?: string; // 'kg' shown to a clinician
  readonly options?: readonly ClinicalOption[]; // display labels for coded answers
  readonly assessmentStatusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly customRendererKey?: string;
}

// ─────────────────────────────────────────────────────────────
// 3. STATE — per-instance runtime. Changes on every keystroke.
// ─────────────────────────────────────────────────────────────
export interface EmrFieldState {
  readonly value: ClinicalFieldValue;
  readonly status?: ClinicalAssessmentStatus; // not assessed / declined / unknown ...
  readonly enabled: boolean; // RESOLVED enableWhen — controller computes
  readonly touched?: boolean;
  readonly pending?: boolean; // async validation in flight
  readonly messages: readonly EmrValidationMessage[];
}

export interface EmrFieldDefinition {
  /** Version of the definition format itself, so stored definitions can be migrated. */
  readonly schemaVersion: '1.0';
  readonly contract: EmrFieldContract;
  readonly presentation: EmrFieldPresentation;
}
