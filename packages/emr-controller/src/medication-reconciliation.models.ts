import type { EmrCodedValue } from './field-contract.models.js';
import type { EmrBadge, EmrOption } from './models.js';
import type { EmrNodePath } from './node-path.js';
import type { EmrValidationMessage } from './validation.models.js';

/**
 * One medicine as it appears on one list. `doseSummary` is controller-written and words-first,
 * for example "1 tablet twice daily (BD), after food": an abbreviation never appears without the words.
 */
export interface ReconMedication {
  readonly id: string;
  readonly nameLabel: string;
  readonly doseSummary: string;
  readonly code?: EmrCodedValue;
  /** Source badges such as "Patient reported" or "Ward order". Tones are supplied, never derived. */
  readonly badges?: readonly EmrBadge[];
  /** Shown after "Last taken", for example "yesterday, 8 pm". */
  readonly lastTakenLabel?: string;
}

/**
 * One aligned row. The controller pairs left and right; a missing side means the medicine is on only
 * one list. `path` addresses the row for both decision and reason intents.
 */
export interface ReconRow {
  readonly id: string;
  readonly path: EmrNodePath;
  readonly left?: ReconMedication;
  readonly right?: ReconMedication;
  /** The option `value` currently chosen. Absent means not yet decided. */
  readonly decision?: string;
  readonly decisionOptions: readonly EmrOption[];
  readonly reason?: string;
  readonly reasonRequired?: boolean;
  readonly messages?: readonly EmrValidationMessage[];
  readonly readOnly?: boolean;
}

export interface MedicationReconciliationViewModel {
  readonly id: string;
  readonly title: string;
  /** Column label for the left list, for example "Home list". */
  readonly leftLabel: string;
  /** Column label for the right list, for example "Current orders". */
  readonly rightLabel: string;
  readonly rows: readonly ReconRow[];
  /** Controller-supplied counts such as "12 continued". The component never counts. */
  readonly summary?: readonly EmrBadge[];
  readonly selectedRowId?: string;
  readonly emptyMessage: string;
  readonly canComplete: boolean;
  readonly readOnly?: boolean;
  readonly loading?: boolean;
  readonly error?: string;
}

export type MedicationReconciliationIntent =
  | { readonly type: 'decisionChangeRequested'; readonly path: EmrNodePath; readonly decision: string }
  | { readonly type: 'reasonChangeRequested'; readonly path: EmrNodePath; readonly reason: string }
  | { readonly type: 'rowSelected'; readonly rowId: string }
  | { readonly type: 'medicationDetailRequested'; readonly medicationId: string }
  | { readonly type: 'addMedicationRequested'; readonly side: 'left' | 'right' }
  | { readonly type: 'completeRequested' }
  | { readonly type: 'retryRequested' };
