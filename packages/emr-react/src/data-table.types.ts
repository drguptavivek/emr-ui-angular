import type { EmrBadge } from '@drguptavivek/emr-controller';

export type EmrDataTableDensity = 'comfortable' | 'compact';
export type EmrDataTableSortDirection = 'asc' | 'desc';

export interface EmrDataTableColumn {
  id: string;
  label: string;
  align?: 'start' | 'end' | 'center';
  sortable?: boolean;
  /** CSS width, e.g. 160 (px) or '20%'. */
  width?: number | string;
}

export type EmrDataTableCell = string | { text: string; badge?: EmrBadge };

export interface EmrDataTableRow {
  id: string;
  /** Pre-resolved display strings keyed by column id. A missing key renders empty. */
  cells: Record<string, EmrDataTableCell>;
}

/** Every string is pre-resolved by the controller; the table never sorts, filters or fetches. */
export interface EmrDataTableModel {
  caption: string;
  columns: EmrDataTableColumn[];
  rows: EmrDataTableRow[];
  selectedIds: string[];
  sort?: { columnId: string; direction: EmrDataTableSortDirection };
  filters: { id: string; label: string; valueLabel: string }[];
  savedFilters: { id: string; label: string }[];
  bulkActions: { id: string; label: string }[];
  density: EmrDataTableDensity;
  /** 1-based. */
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  /** e.g. "Showing 1-10 of 42". */
  summaryLabel: string;
  status?: 'ready' | 'loading' | 'error';
  error?: string;
}

export type EmrDataTableIntent =
  | { type: 'sortChanged'; columnId: string; direction: EmrDataTableSortDirection }
  | { type: 'filterRemoved'; id: string }
  | { type: 'filterAddRequested' }
  | { type: 'savedFilterSelected'; id: string }
  | { type: 'saveFilterRequested' }
  | { type: 'exportRequested'; format: 'csv' }
  | { type: 'densityChanged'; density: EmrDataTableDensity }
  | { type: 'selectionChanged'; selectedIds: string[] }
  | { type: 'rowActivated'; id: string }
  | { type: 'bulkActionRequested'; id: string }
  | { type: 'pageChanged'; page: number }
  | { type: 'pageSizeChanged'; pageSize: number }
  | { type: 'retryRequested' };

export interface EmrDataTableLabels {
  selectAll: string;
  selectRow: string;
  filters: string;
  removeFilter: string;
  addFilter: string;
  savedFilters: string;
  saveFilter: string;
  exportCsv: string;
  density: string;
  comfortable: string;
  compact: string;
  bulkActions: string;
  selectedCount: string;
  sortedAscending: string;
  sortedDescending: string;
  sortBy: string;
  previous: string;
  next: string;
  rowsPerPage: string;
  pageOf: string;
  loading: string;
  emptyTitle: string;
  emptyMessage: string;
  errorTitle: string;
  retry: string;
  nativeUnavailable: string;
}

export interface EmrDataTableProps {
  model: EmrDataTableModel;
  onIntent: (intent: EmrDataTableIntent) => void;
  labels?: Partial<EmrDataTableLabels>;
}
