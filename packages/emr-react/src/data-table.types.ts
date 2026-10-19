import type {
  EmrDataTableAlign,
  EmrDataTableCell,
  EmrDataTableColumn,
  EmrDataTableDensity,
  EmrDataTableIntent,
  EmrDataTableModel,
  EmrDataTablePagination,
  EmrDataTableRow,
  EmrDataTableSort,
  EmrDataTableSortDirection,
} from '@drguptavivek/emr-controller';

export type {
  EmrDataTableAlign,
  EmrDataTableCell,
  EmrDataTableColumn,
  EmrDataTableDensity,
  EmrDataTableIntent,
  EmrDataTableModel,
  EmrDataTablePagination,
  EmrDataTableRow,
  EmrDataTableSort,
  EmrDataTableSortDirection,
};

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
