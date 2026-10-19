import type {
  ConsentCaptureIntent,
  ConsentCaptureViewModel,
  ConsentCategoryView,
  ConsentDecision,
  ConsentMethod,
  ConsentPurposeView,
  ConsentReceiptViewModel,
  ConsentReviewIntent,
  ConsentReviewPurposeView,
  ConsentReviewViewModel,
} from './consent.models.js';
import type {
  IdentifierCheckIntent,
  IdentifierCheckViewModel,
  IdentifierEntryIntent,
  IdentifierFindingKind,
  IdentifierFindingView,
  LinkCardsIntent,
  LinkCardsViewModel,
  LinkCardView,
  PatientIdentityIntent,
  PatientIdentityViewModel,
} from './identity.models.js';
import type {
  ClinicalListItem,
  EmrBadge,
  EmrTone,
  FavouritesIntent,
  FavouritesViewModel,
  HierarchyOrderIntent,
  HierarchyOrderViewModel,
  LeftNavIntent,
  NavItem,
  OrderDetailsIntent,
  RightFlyoutIntent,
  SelectedOrder,
} from './models.js';
import type { EmrNodePath } from './node-path.js';
import type {
  AccessLogIntent,
  AccessLogViewModel,
  PrivacyCentreIntent,
  PrivacyCentreViewModel,
  RightsRequestsIntent,
  RightsRequestsViewModel,
  SharingGrantsIntent,
  SharingGrantsViewModel,
} from './privacy.models.js';
import type {
  ContactAttemptIntent,
  ContactAttemptSummaryIntent,
  ContactAttemptSummaryView,
  ContactAttemptViewModel,
  DraftRecordListIntent,
  DraftRecordListViewModel,
  MergeCompareIntent,
  MergeCompareViewModel,
  MergeRowView,
} from './workflow.models.js';

// ---------------------------------------------------------------------------
// 1. Charts (Bar, Funnel, Donut)
// ---------------------------------------------------------------------------

export interface EmrChartCategory {
  id: string;
  label: string;
}

export type EmrBarDatum = EmrChartCategory;

export interface EmrBarSeries {
  id: string;
  label: string;
  /** Keyed by category id. `null` (or a missing key) means "no data", never a zero bar. Values must be >= 0. */
  values: Record<string, number | null>;
  /** Pre-formatted by the app (units, rounding); falls back to String(value). */
  valueLabels?: Record<string, string>;
}

export interface EmrBarChartModel {
  title: string;
  description?: string;
  categories: EmrChartCategory[];
  series: EmrBarSeries[];
  orientation?: 'vertical' | 'horizontal';
  /** Label for the value axis (vertical or horizontal). */
  yAxisLabel?: string;
  /** Lower bound for the scale top, e.g. 100 for percentages; data above it still wins. */
  maxValue?: number;
}

export interface EmrDonutSlice {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
}

export interface EmrDonutChartModel {
  title: string;
  description?: string;
  slices: EmrDonutSlice[];
  totalLabel?: string;
}

export interface EmrFunnelStep {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  /** Supplied by the app (e.g. "78% of referred"); the component never computes rates. */
  conversionLabel?: string;
}

export type EmrFunnelStage = EmrFunnelStep;

export interface EmrFunnelChartModel {
  title: string;
  description?: string;
  steps: EmrFunnelStep[];
}

export type EmrChartIntent =
  | { type: 'categorySelected'; categoryId: string; seriesId?: string }
  | { type: 'stepSelected'; stepId: string };

// ---------------------------------------------------------------------------
// 2. Consent Receipt, Capture & Review aliases
// ---------------------------------------------------------------------------

/** Printable, read-only consent summary. Every string is pre-resolved by the app; the component decides nothing. */
export type EmrConsentReceiptModel = ConsentReceiptViewModel;
export type EmrConsentReceiptParty = ConsentReceiptViewModel['identifiers'][number];
export type EmrConsentReceiptScope = ConsentReceiptViewModel['categories'][number];

export type EmrConsentMethod = ConsentMethod;
export type EmrConsentDecision = ConsentDecision;
export type EmrConsentPurpose = ConsentPurposeView;
export type EmrConsentCategory = ConsentCategoryView;
export type EmrConsentCaptureModel = ConsentCaptureViewModel;
export type EmrConsentIntent = ConsentCaptureIntent;

export type EmrConsentReviewPurpose = ConsentReviewPurposeView;
export type EmrConsentReviewSection = ConsentReviewViewModel['categories'][number];
export type EmrConsentReviewModel = ConsentReviewViewModel;
export type EmrConsentReviewIntent = ConsentReviewIntent;

// ---------------------------------------------------------------------------
// 3. Data Table
// ---------------------------------------------------------------------------

export type EmrDataTableDensity = 'comfortable' | 'compact';
export type EmrDataTableAlign = 'start' | 'end' | 'center';
export type EmrDataTableSortDirection = 'asc' | 'desc';

export interface EmrDataTableSort {
  columnId: string;
  direction: EmrDataTableSortDirection;
}

export interface EmrDataTableColumn {
  id: string;
  label: string;
  align?: EmrDataTableAlign;
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

export interface EmrDataTablePagination {
  /** 1-based. */
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
}

/** Every string is pre-resolved by the controller; the table never sorts, filters or fetches. */
export interface EmrDataTableModel extends EmrDataTablePagination {
  caption: string;
  columns: EmrDataTableColumn[];
  rows: EmrDataTableRow[];
  selectedIds: string[];
  sort?: EmrDataTableSort;
  filters: { id: string; label: string; valueLabel: string }[];
  savedFilters: { id: string; label: string }[];
  bulkActions: { id: string; label: string }[];
  density: EmrDataTableDensity;
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

// ---------------------------------------------------------------------------
// 4. Upload Queue
// ---------------------------------------------------------------------------

export type EmrUploadStatus = EmrBadge;

export interface EmrUploadQueueItem {
  id: string;
  name: string;
  /** Pre-formatted, e.g. "1.2 MB". */
  sizeLabel: string;
  status: EmrBadge;
  /** 0–100, supplied by the controller. Omit when not uploading. */
  progress?: number;
  error?: string;
}

export interface EmrUploadQueueModel {
  label: string;
  /** Comma-separated MIME types / extensions for the input's `accept`. */
  accept?: string;
  /** Human-readable form of `accept`, e.g. "PDF or JPEG, up to 10 MB". */
  acceptDescription?: string;
  multiple?: boolean;
  items: readonly EmrUploadQueueItem[];
  /** Publish is available only when the controller says so. */
  canPublish: boolean;
}

export interface EmrPickedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export type EmrUploadQueueIntent =
  | { type: 'filesPicked'; files: EmrPickedFile[] }
  | { type: 'removeRequested'; id: string }
  | { type: 'retryRequested'; id: string }
  | { type: 'publishRequested' };

// ---------------------------------------------------------------------------
// 5. Stat Tile & L1 Display / Interactive
// ---------------------------------------------------------------------------

/**
 * One count or KPI. Every string is controller-supplied and already formatted: the tile never
 * counts, rounds, compares or picks a tone. A tone, when wanted, arrives as a labelled badge.
 */
export interface EmrStatTileModel {
  key: string;
  label: string;
  value: string;
  sub?: string;
  status?: EmrBadge;
  /** Spoken instead of "label value sub", e.g. "12 patients seen today, opens the list". */
  accessibilityLabel?: string;
}

export type EmrStatTileIntent = { type: 'statSelected'; key: string };

export interface EmrStatusCellAttribution {
  nameLabel: string;
  roleLabel?: string;
  timeLabel?: string;
}

export interface EmrStatusCellAction {
  label: string;
  icon?: string;
}

/** Angular's `actionClicked` and `selected` outputs, folded into one callback. */
export type EmrStatusCellIntent = 'action' | 'selected';

export interface EmrStage {
  readonly id: string;
  readonly label: string;
  readonly status?: EmrBadge;
  readonly description?: string;
}

// ---------------------------------------------------------------------------
// 6. L3 Clinical List
// ---------------------------------------------------------------------------

/** View model for a clinical list. An empty list has no clinical meaning; the controller supplies `emptyMessage`. */
export interface EmrClinicalListModel {
  items: readonly ClinicalListItem[];
  allowAdd?: boolean;
  emptyMessage?: string;
}

// ---------------------------------------------------------------------------
// 7. Identity, Cards, Merge, Contact & Drafts aliases
// ---------------------------------------------------------------------------

export type EmrBarcodeScanIntent = IdentifierEntryIntent;
export type EmrPatientIdentity = PatientIdentityViewModel;
export type EmrPatientIdentityIntent = PatientIdentityIntent;
export type EmrIdentifierFindingKind = IdentifierFindingKind;
export type EmrIdentifierFinding = IdentifierFindingView;
export type EmrIdentifierCheckModel = IdentifierCheckViewModel;
export type EmrIdentifierCheckIntent = IdentifierCheckIntent;

export type EmrLinkCardRow = LinkCardView;
export type EmrLinkCardsModel = LinkCardsViewModel;
export type EmrLinkCardsIntent = LinkCardsIntent;

export type EmrMergeRow = MergeRowView;
export type EmrMergeCompareModel = MergeCompareViewModel;
export type EmrMergeIntent = MergeCompareIntent;

export type EmrContactAttemptModel = ContactAttemptViewModel;
export type EmrContactAttemptIntent = ContactAttemptIntent;
export type EmrContactAttemptSummaryModel = ContactAttemptSummaryView;
export type EmrContactAttemptSummaryIntent = ContactAttemptSummaryIntent;

export type EmrDraftRecordListModel = DraftRecordListViewModel;
export type EmrDraftRecordListIntent = DraftRecordListIntent;

// ---------------------------------------------------------------------------
// 8. Desk (Arrival Linker, Spectacle Delivery, Booked Not Delivered)
// ---------------------------------------------------------------------------

export interface EmrOpenReferral {
  id: string;
  date: string;
  centreName: string;
  purpose: string;
  flags: string[];
  daysSinceAdviceLabel: string;
  overdueBadge?: EmrBadge;
  /** Multi-visit referrals, pre-formatted by the app: "2 visits", "Next visit 26-10-2026". */
  visitCountLabel?: string;
  nextDueLabel?: string;
}

export interface EmrArrivalLinkerModel {
  patient: EmrPatientIdentity;
  openReferrals: EmrOpenReferral[];
  purposeOptions: { id: string; label: string }[];
  selectedPurpose?: string;
  selectedReferralIds: string[];
  noReferral: boolean;
  /**
   * Controlled like BarcodeScanField: the app keeps `value` (from typing or a scan) and supplies the
   * domain normaliser's normalisedValue / error / warning.
   */
  uhid?: {
    existing?: { label: string; display: string };
    value?: string;
    normalisedValue?: string;
    error?: string;
    warning?: string;
    required: false;
  };
  canSubmit: boolean;
}

/** `uhidChanged` and `scanRequested` extend the frozen contract: the UHID step is controlled by the app. */
export type EmrArrivalLinkerIntent =
  | { type: 'purposeSelected'; id: string }
  | { type: 'referralToggled'; id: string }
  | { type: 'noReferralToggled' }
  | { type: 'uhidChanged'; raw: string }
  | { type: 'uhidProvided'; raw: string }
  | { type: 'uhidSkipped' }
  | { type: 'scanRequested' }
  | { type: 'submitRequested' }
  | { type: 'cancelled' };

export interface EmrSpectacleBooking {
  id: string;
  bookedDate: string;
  type: string;
  paidBadge: EmrBadge;
  rxSummary: string;
  daysOpenLabel: string;
  statusBadge: EmrBadge;
}

export interface EmrSpectacleDeliveryModel {
  patient: EmrPatientIdentity;
  bookings: EmrSpectacleBooking[];
  /** Not in the contract (it has no ticked state): mirrors ArrivalLinker's selectedReferralIds. */
  selectedBookingIds: string[];
  deliveryDate: string;
  canSubmit: boolean;
}

export type EmrSpectacleDeliveryIntent =
  | { type: 'bookingToggled'; id: string }
  | { type: 'deliveryDateChanged'; iso: string | null }
  | { type: 'submitRequested' }
  | { type: 'cancelled' };

export interface EmrBookedRow {
  bookingId: string;
  patientName: string;
  primaryIdentifier: string;
  phone?: string;
  centreName: string;
  bookedDate: string;
  daysOpenLabel: string;
  overdueBadge?: EmrBadge;
  type: string;
  paidBadge: EmrBadge;
}

export interface EmrBookedFilters {
  centreId?: string;
  bookedFrom?: string;
  bookedTo?: string;
}

export interface EmrBookedNotDeliveredModel {
  rows: EmrBookedRow[];
  filters: {
    centreOptions: { id: string; label: string }[];
    selectedCentreId?: string;
    bookedFrom?: string;
    bookedTo?: string;
  };
  page: number;
  pageCount: number;
  pagingSummaryLabel: string;
  /** Not in the contract: optional list state. `message` is the error text. */
  state?: 'loading' | 'empty' | 'error';
  message?: string;
}

export type EmrBookedNotDeliveredIntent =
  | { type: 'rowSelected'; bookingId: string }
  | { type: 'filterChanged'; centreId?: string; bookedFrom?: string; bookedTo?: string }
  | { type: 'pageChanged'; page: number }
  | { type: 'callRequested'; phone: string }
  | { type: 'retryRequested' };

// ---------------------------------------------------------------------------
// 9. History & Cataract Episode
// ---------------------------------------------------------------------------

/** Pre-resolved cataract episode (frozen contract item 7). */
export interface EmrCataractEpisode {
  id: string;
  eye?: string;
  status: 'admitted' | 'operated' | 'not_operated';
  statusBadge: EmrBadge;
  admissionDate?: string;
  sxDate?: string;
  stages: { stages: EmrStage[]; activeId?: string };
  followups: { label: string; due: string; done?: boolean; statusBadge: EmrBadge }[];
  /** Controller-decided actions; the card never infers them from `status`. */
  canCompleteSurgery?: boolean;
  canAddFollowup?: boolean;
}

export type EmrCataractEpisodeIntent =
  | { type: 'completeSurgeryRequested'; id: string }
  | { type: 'addFollowupRequested'; id: string }
  | { type: 'openRequested'; id: string };

export interface EmrRxEyeValues {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
}

export interface EmrPatientSnapshot {
  patient: EmrPatientIdentity;
  summary: {
    lastSpectacleRx?: { date: string; re: EmrRxEyeValues; le: EmrRxEyeValues; type?: string; statusBadge: EmrBadge };
    lastGlaucomaScreen?: { date: string; iopRe?: string; iopLe?: string; cdrRe?: string; cdrLe?: string; decision?: string };
    lastDrScreen?: { date: string; gradeRe?: string; gradeLe?: string; maculopathyRe?: string; maculopathyLe?: string; decision?: string };
    openReferrals: {
      id: string;
      date: string;
      centreName: string;
      purpose: string;
      flags: string[];
      statusBadge: EmrBadge;
      /** Multi-visit referrals, pre-formatted by the app: "2 visits", "Next visit 26-10-2026". */
      visitCountLabel?: string;
      nextDueLabel?: string;
    }[];
    openBookings: { id: string; date: string; type: string; paidBadge: EmrBadge; daysOpenLabel: string; overdueBadge?: EmrBadge }[];
    openEpisodes: EmrCataractEpisode[];
  };
  /** Newest first. */
  visits: { id: string; date: string; centreName: string; teamName: string; pvaRe?: string; pvaLe?: string; diagnosis?: string; advice?: string }[];
}

export interface EmrPatientHistoryModel extends EmrPatientSnapshot {
  loading?: boolean;
}

export type EmrPatientHistoryIntent =
  | { type: 'visitSelected'; id: string }
  | { type: 'referralSelected'; id: string }
  | { type: 'bookingSelected'; id: string }
  | { type: 'episodeSelected'; id: string };

// ---------------------------------------------------------------------------
// 10. Mobile Shell (PinPad, LoginForm, BottomTabBar, SyncPill, Toast)
// ---------------------------------------------------------------------------

export interface EmrPinPadModel {
  mode: 'set' | 'confirm' | 'unlock' | 'change';
  title: string;
  prompt?: string;
  /** Count only: the digits themselves never reach this component. */
  digitsEntered: number;
  length: number;
  error?: string;
  lockoutMessage?: string;
  locked?: boolean;
  /**
   * App-decided biometric unlock ("Use fingerprint / face"). The button shows only while `available`; it
   * emits `biometricRequested` and the app runs the OS prompt, reporting failure via `error` / `lockoutMessage`.
   */
  biometric?: { label: string; available: boolean };
}

export type EmrPinPadIntent =
  | { type: 'digitPressed'; digit: string }
  | { type: 'deleted' }
  | { type: 'submitted' }
  | { type: 'forgotRequested' }
  | { type: 'biometricRequested' };

export interface EmrLoginFormModel {
  title?: string;
  username: string;
  error?: string;
  busy?: boolean;
  usernameLabel: string;
  passwordLabel: string;
}

export type EmrLoginFormIntent =
  | { type: 'usernameChanged'; value: string }
  | { type: 'submitRequested'; username: string; password: string };

export interface EmrBottomTabItem {
  id: string;
  label: string;
  badge?: EmrBadge;
}

export type EmrBottomTabBarIntent =
  | { type: 'tabSelected'; id: string }
  | { type: 'scanRequested' };

export type EmrSyncState = EmrTone;

export interface EmrSyncPillModel {
  label: string;
  tone: EmrTone;
  detail?: string;
}

export type EmrSyncPillIntent = { type: 'syncDetailsRequested' };

export interface EmrToastModel {
  id: string;
  message: string;
  tone: EmrTone;
  actionLabel?: string;
}

export type EmrToastIntent =
  | { type: 'dismissed'; id: string }
  | { type: 'actionPressed'; id: string };

// ---------------------------------------------------------------------------
// 11. Orders & Documents aliases
// ---------------------------------------------------------------------------

export type OrderItemDetailViewModel = SelectedOrder;
export type OrderDetailFieldChanged = OrderDetailsIntent;
export type HierarchyOrderPickerViewModel = HierarchyOrderViewModel;
export type HierarchyOrderPickerIntent = HierarchyOrderIntent;
export type FavouritesPanelViewModel = FavouritesViewModel;
export type FavouritesPanelIntent = FavouritesIntent;

export interface OrderDetailChange {
  orderId: string;
  field: string;
  value: string | boolean | null;
}

// ---------------------------------------------------------------------------
// 12. Privacy aliases
// ---------------------------------------------------------------------------

export type EmrPrivacyCentreModel = PrivacyCentreViewModel;
export type EmrPrivacyCentreIntent = PrivacyCentreIntent;
export type EmrSharingGrantsModel = SharingGrantsViewModel;
export type EmrSharingGrantsIntent = SharingGrantsIntent;
export type EmrAccessLogModel = AccessLogViewModel;
export type EmrAccessLogIntent = AccessLogIntent;
export type EmrRightsRequestsModel = RightsRequestsViewModel;
export type EmrRightsRequestsIntent = RightsRequestsIntent;

// ---------------------------------------------------------------------------
// 13. Record Diff
// ---------------------------------------------------------------------------

export type EmrRecordChangeKind = 'added' | 'removed' | 'changed';

export interface EmrRecordChange {
  id: string;
  path: EmrNodePath;
  label: string;
  before?: string;
  after?: string;
  kind: EmrRecordChangeKind;
}

export interface EmrRecordDiffSection {
  id: string;
  label: string;
  changes: readonly EmrRecordChange[];
}

export interface EmrRecordDiffModel {
  title?: string;
  sections: readonly EmrRecordDiffSection[];
  summaryLabel?: string;
  /** Controller-supplied badge per kind (tone + glyph/word label). Missing kinds fall back to neutral. */
  kindBadges?: Partial<Record<EmrRecordChangeKind, EmrBadge>>;
}

export type EmrRecordDiffIntent = { type: 'changeSelected'; id: string };

// ---------------------------------------------------------------------------
// 14. Shell Sheet & Web Shell
// ---------------------------------------------------------------------------

export type EmrSheetIntent = RightFlyoutIntent;

/** The nav never collapses to a rail (the shell hides it instead), so that controller intent is not emitted. */
export type EmrLeftNavIntent = Exclude<LeftNavIntent, { type: 'collapseToggleRequested' }>;

export interface EmrSearchResult {
  id: string;
  label: string;
  sub?: string;
  badge?: EmrBadge;
}

export interface EmrSearchGroup {
  id: string;
  label: string;
  results: readonly EmrSearchResult[];
}

export interface EmrTopBarModel<TSlot = unknown> {
  /** Product title; `titleSlot` replaces it (logo, facility switcher). */
  title?: string;
  titleSlot?: TSlot;
  /** Visible name on the user-menu trigger. */
  userLabel?: string;
  /** Show the hamburger that opens the nav (the shell sets this below the wide breakpoint). */
  showNavToggle?: boolean;
  search: { query: string; open: boolean; loading?: boolean; groups: readonly EmrSearchGroup[] };
}

export type EmrTopBarIntent =
  | { type: 'queryChanged'; query: string }
  | { type: 'searchOpenRequested' }
  | { type: 'searchCloseRequested' }
  | { type: 'resultSelected'; groupId: string; id: string }
  | { type: 'menuRequested' }
  | { type: 'navToggleRequested' };

export interface EmrAppShellModel<TSlot = unknown> {
  topBar: EmrTopBarModel<TSlot>;
  nav: { title?: string; items: readonly NavItem[]; activeId?: string; expandedIds: readonly string[] };
  /** Whether the nav drawer is open below the wide breakpoint; ignored above it. */
  navOpen: boolean;
}

/** Everything the shell can ask for. Sheet close and the hamburger both mean "toggle the drawer". */
export type EmrAppShellIntent = EmrTopBarIntent | EmrLeftNavIntent;
