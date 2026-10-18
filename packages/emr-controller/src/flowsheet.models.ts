import type { ClinicalAssessmentStatus, ClinicalColumnGroup, EmrBadge } from './models.js';
import type { EmrNodePath } from './node-path.js';

/** A time column (an observation time, a shift, a day). Every label is controller-supplied. */
export interface FlowsheetColumn {
  readonly id: string;
  readonly label: string;
  readonly sublabel?: string;
  /** The column for "now"; the component marks it with text as well as styling. */
  readonly current?: boolean;
}

export interface FlowsheetRow {
  readonly id: string;
  readonly label: string;
  readonly unitLabel?: string;
  /** Reference range as words, e.g. '3.5 to 5.1'. Shown in its own column; the component never judges against it. */
  readonly referenceLabel?: string;
  readonly groupId?: string;
  readonly path?: EmrNodePath;
}

/**
 * One cell. `valueLabel` is the already-formatted value. When it is null the cell shows the
 * wording for `status` (the five no-value states); a null value with no status reads "Not supplied".
 */
export interface FlowsheetCell {
  readonly valueLabel: string | null;
  readonly status?: ClinicalAssessmentStatus;
  /** Controller verdict (for example High / Low / Given / Held). The component never derives it. */
  readonly flag?: EmrBadge;
  readonly note?: string;
  /** Whether the cell can be selected for editing. The controller decides. */
  readonly editable?: boolean;
}

export type FlowsheetCellMap = Readonly<Record<string, Readonly<Record<string, FlowsheetCell>>>>;

export interface FlowsheetViewModel {
  readonly id: string;
  readonly title: string;
  readonly groups?: readonly { readonly id: string; readonly label: string }[];
  readonly rows: readonly FlowsheetRow[];
  readonly columns: readonly FlowsheetColumn[];
  /** Header blocks over runs of columns (e.g. Ventilator, Haemodynamics). Same shape as the matrix. */
  readonly columnGroups?: readonly ClinicalColumnGroup[];
  /** rowId -> columnId -> cell. A missing cell renders "Not supplied". */
  readonly cells: FlowsheetCellMap;
  /** Totals and balances. The controller computes them; the component only lays them out. */
  readonly footerRows?: readonly FlowsheetRow[];
  readonly footerCells?: FlowsheetCellMap;
  readonly selectedCell?: { readonly rowId: string; readonly columnId: string };
  readonly emptyMessage: string;
  readonly loading?: boolean;
  readonly error?: string;
  /** No selection, no add-column, no row or column buttons. */
  readonly readOnly?: boolean;
}

export type FlowsheetIntent =
  | { readonly type: 'cellSelected'; readonly rowId: string; readonly columnId: string }
  | { readonly type: 'columnSelected'; readonly columnId: string }
  | { readonly type: 'columnAddRequested' }
  | { readonly type: 'rowSelected'; readonly rowId: string }
  | { readonly type: 'retryRequested' };

export type ObservationFlowsheetViewModel = FlowsheetViewModel;
export type ObservationFlowsheetIntent = FlowsheetIntent;
