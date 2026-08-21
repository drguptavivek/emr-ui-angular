export type EmrTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface EmrBadge {
  label: string;
  tone: EmrTone;
  assistiveText?: string;
}

export type ClinicalAssessmentStatus =
  | 'recorded'
  | 'not-assessed'
  | 'unable-to-assess'
  | 'not-applicable'
  | 'declined'
  | 'unknown';

export interface ClinicalAssessmentPresentation {
  value: ClinicalAssessmentStatus;
  label: string;
  tone: EmrTone;
}

export interface EmrOption<Value extends string = string> {
  value: Value;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  badge?: EmrBadge;
  disabled?: boolean;
  children?: readonly NavItem[];
}

/**
 * What role an identifier plays in the patient identity block.
 *
 * `national-health-id` is deliberately generic: it is ABHA in India, the NHS number in
 * England, and so on. The jurisdiction-specific name belongs in `label`, supplied by the
 * controller — the component must never hardcode a national scheme.
 */
export type PatientIdentifierKind = 'mrn' | 'national-health-id' | 'other';

export interface PatientIdentifier {
  label: string;
  value: string;
  /** Defaults to `'other'` when absent, so existing identifier lists keep working. */
  kind?: PatientIdentifierKind;
  /** Issuing authority URI, mirroring FHIR `Identifier.system`. Never displayed. */
  system?: string;
}

export interface PatientAlert {
  id: string;
  label: string;
  tone: EmrTone;
  detail?: string;
}

export type CareSetting = 'opd' | 'ipd' | 'emergency' | 'other';

export interface PatientBannerViewModel {
  patientId: string;
  displayName: string;
  identifiers: readonly PatientIdentifier[];
  ageLabel: string;
  sexLabel: string;
  careSetting: CareSetting;
  careSettingLabel: string;
  locationLabel: string;
  encounterLabel?: string;
  criticality?: EmrBadge;
  vip?: EmrBadge;
  allergies: readonly PatientAlert[];
  /** Explicitly supplied allergy status; an empty allergy list has no semantic meaning by itself. */
  allergyStatus?: EmrBadge;
  chronicDiseases: readonly PatientAlert[];
  /** Explicitly supplied chronic-disease status; an empty list has no semantic meaning by itself. */
  chronicDiseaseStatus?: EmrBadge;
  alerts: readonly PatientAlert[];
  expanded: boolean;
}

export interface PatientListRow {
  patientId: string;
  displayName: string;
  primaryIdentifier: string;
  /**
   * @deprecated Hardcodes India's ABHA scheme. Use `nationalHealthIds`, which carries the
   * scheme name in `label` so other jurisdictions bind their own national identifier.
   * Retained so existing controllers keep compiling; removed once the UI has migrated.
   */
  abha?: { value: string; label?: string };
  /** National health identifiers — ABHA in India, NHS number in England, and so on. */
  nationalHealthIds?: readonly PatientIdentifier[];
  ageLabel: string;
  sexLabel: string;
  careSettingLabel: string;
  locationLabel: string;
  queueLabel?: string;
  status?: EmrBadge;
  alerts?: readonly PatientAlert[];
}

export interface PatientListViewModel {
  query: string;
  rows: readonly PatientListRow[];
  selectedPatientId?: string;
  loading: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
}

export type PatientListIntent =
  | { type: 'queryChanged'; query: string }
  | { type: 'searchRequested' }
  | { type: 'patientSelected'; patientId: string }
  | { type: 'pageChanged'; page: number }
  | { type: 'sortChanged'; field: string; direction: 'asc' | 'desc' }
  | { type: 'retryRequested' };

export interface TimelineKindDefinition {
  id: string;
  label: string;
  icon?: string;
  tone: EmrTone;
}

export interface TimelineEvent {
  id: string;
  occurredAt: string;
  dateLabel: string;
  title: string;
  summary?: string;
  kindId: string;
  encounterId?: string;
  meta?: Readonly<Record<string, string>>;
}

export interface ClinicalOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ClinicalColumn {
  id: string;
  label: string;
  shortLabel?: string;
}

export interface ClinicalColumnGroup {
  id: string;
  label: string;
  columnIds: readonly string[];
}

export type ClinicalCellType =
  | 'text'
  | 'integer'
  | 'decimal'
  | 'select'
  | 'boolean'
  | 'date'
  | 'quantity'
  | 'custom';

export interface ClinicalRow {
  id: string;
  label: string;
  type: ClinicalCellType;
  applicableColumnIds?: readonly string[];
  unit?: string;
  precision?: number;
  options?: readonly ClinicalOption[];
  assessmentStatusOptions?: readonly ClinicalAssessmentPresentation[];
  customRendererKey?: string;
  helpText?: string;
}

export interface ClinicalMatrixSchema {
  id: string;
  label: string;
  columnGroups?: readonly ClinicalColumnGroup[];
  columns: readonly ClinicalColumn[];
  rows: readonly ClinicalRow[];
}

export type ClinicalCellValue = string | number | boolean | null;

export interface ClinicalQuantityValue {
  value: number | null;
  unit: string;
}

export interface ClinicalCellState {
  value: ClinicalCellValue | ClinicalQuantityValue;
  assessmentStatus?: ClinicalAssessmentPresentation;
  readOnly?: boolean;
  disabled?: boolean;
  warning?: string;
  error?: string;
}

export interface ClinicalMatrixRowValue {
  cells: Readonly<Record<string, ClinicalCellState>>;
  remark: string;
  remarkError?: string;
  remarkReadOnly?: boolean;
  remarkDisabled?: boolean;
}

export type ClinicalMatrixValues = Readonly<
  Record<string, ClinicalMatrixRowValue>
>;

export type ClinicalMatrixIntent =
  | {
      type: 'cellEditRequested';
      rowId: string;
      columnId: string;
      value: ClinicalCellValue | ClinicalQuantityValue;
    }
  | { type: 'remarkEditRequested'; rowId: string; remark: string }
  | {
      type: 'cellAssessmentStatusEditRequested';
      rowId: string;
      columnId: string;
      status: ClinicalAssessmentStatus;
    }
  | { type: 'cellFocused'; rowId: string; columnId: string }
  | {
      type: 'customCellIntent';
      rowId: string;
      columnId: string;
      action: string;
      payload?: unknown;
    };

export interface ClinicalListItem {
  id: string;
  title: string;
  subtitle?: string;
  detail?: string;
  badges?: readonly EmrBadge[];
  readOnly?: boolean;
}

export interface HierarchyNode {
  id: string;
  label: string;
  code?: string;
  kind: 'group' | 'item';
  selectable: boolean;
  expanded?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children?: readonly HierarchyNode[];
}

export interface SelectedOrder {
  id: string;
  catalogueId: string;
  label: string;
  code?: string;
  kind: 'laboratory' | 'radiology' | 'medication';
  details?: Readonly<Record<string, string | boolean | null>>;
  errors?: Readonly<Record<string, string>>;
}

export interface GroupAddPreview {
  groupId: string;
  groupLabel: string;
  items: readonly Pick<SelectedOrder, 'catalogueId' | 'label' | 'code'>[];
  duplicateIds: readonly string[];
}

export interface HierarchyOrderViewModel {
  title: string;
  query: string;
  roots: readonly HierarchyNode[];
  selected: readonly SelectedOrder[];
  preview?: GroupAddPreview;
  loading: boolean;
  error?: string;
}

export type HierarchyOrderIntent =
  | { type: 'queryChanged'; query: string }
  | { type: 'searchRequested' }
  | { type: 'nodeExpansionRequested'; nodeId: string; expanded: boolean }
  | { type: 'itemAddRequested'; nodeId: string }
  | { type: 'groupPreviewRequested'; nodeId: string }
  | { type: 'groupAddConfirmed'; groupId: string }
  | { type: 'groupPreviewDismissed' }
  | { type: 'orderRemoveRequested'; orderId: string }
  | {
      type: 'orderDetailChanged';
      orderId: string;
      field: string;
      value: string | boolean | null;
    }
  | { type: 'retryRequested' };

export type FavouriteKind =
  | 'medication'
  | 'laboratory'
  | 'radiology'
  | 'combination';

export interface FavouriteEntry {
  id: string;
  name: string;
  kind: FavouriteKind;
  summary?: string;
  orderTemplates: readonly SelectedOrder[];
  updatedAt: string;
}

export interface FavouriteApplyIssue {
  catalogueId: string;
  label: string;
  reason: 'unavailable' | 'conflict';
  detail?: string;
}

export interface FavouritesViewModel {
  open: boolean;
  mode: 'list' | 'editor' | 'apply-result';
  activeKind: FavouriteKind;
  query: string;
  items: readonly FavouriteEntry[];
  selectedId?: string;
  editor?: FavouriteEntry;
  applyIssues?: readonly FavouriteApplyIssue[];
  loading: boolean;
  error?: string;
}

export type FavouritesIntent =
  | { type: 'opened' }
  | { type: 'closed' }
  | { type: 'tabChanged'; kind: FavouriteKind }
  | { type: 'queryChanged'; query: string }
  | { type: 'createRequested'; kind: FavouriteKind }
  | { type: 'editRequested'; id: string }
  | { type: 'editorNameChanged'; name: string }
  | { type: 'editorOrdersChanged'; orders: readonly SelectedOrder[] }
  | { type: 'saveRequested' }
  | { type: 'deleteRequested'; id: string }
  | { type: 'moveRequested'; id: string; direction: 'up' | 'down' }
  | { type: 'applyRequested'; id: string }
  | { type: 'backRequested' }
  | { type: 'retryRequested' };

// ---------------------------------------------------------------------------
// Intent unions for components that previously emitted ad-hoc named outputs.
// Every controlled component above the primitive layer emits exactly one
// `intent`; adding an interaction adds a union member, not a new @Output.
// See docs/api-conventions.md section 2.1.
// ---------------------------------------------------------------------------

/** Replaces the UI-declared `ClinicalListAction`. */
export type ClinicalListIntent =
  | { type: 'addRequested' }
  | { type: 'selected'; id: string }
  | { type: 'editRequested'; id: string }
  | { type: 'removeRequested'; id: string };

/** Replaces the UI-declared `OrderDetailChange` plus a separate remove output. */
export type OrderDetailsIntent =
  | { type: 'detailChangeRequested'; orderId: string; field: string; value: string | boolean | null }
  | { type: 'removeRequested'; orderId: string };

export type TimelineIntent =
  | { type: 'eventSelected'; eventId: string };

export type PatientBannerIntent =
  | { type: 'expandedChangeRequested'; expanded: boolean };

export type LeftNavIntent =
  | { type: 'collapseToggleRequested'; collapsed: boolean }
  | { type: 'itemSelected'; itemId: string }
  | { type: 'itemExpansionRequested'; itemId: string; expanded: boolean };

export type RightFlyoutIntent =
  | { type: 'closeRequested' }
  | { type: 'backRequested' };

export type SectionCardIntent =
  | { type: 'toggleRequested'; sectionId: string };
