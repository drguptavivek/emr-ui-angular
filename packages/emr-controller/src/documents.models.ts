import type { EmrBadge, EmrOption } from './models.js';

export interface DocumentCandidate {
  id: string;
  fileName: string;
  sizeLabel: string;
  mediaTypeLabel: string;
  sourceToken: string;
  progress?: number;
  status: 'ready' | 'processing' | 'complete' | 'error' | 'cancelled';
  statusLabel: string;
  error?: string;
}

export interface SelectedDocumentSource {
  fileName: string;
  size: number;
  mediaType: string;
  sourceToken: string;
}

export interface DocumentUploadQueueViewModel {
  label: string;
  acceptDescription?: string;
  candidates: readonly DocumentCandidate[];
  disabled?: boolean;
  multiple?: boolean;
  error?: string;
}

export interface PatientDocumentRecord {
  id: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  folderId: string;
  folderLabel: string;
  fileName: string;
  mediaTypeLabel: string;
  sizeLabel: string;
  /** ISO-8601 timestamp used for deterministic chronological sorting. */
  createdAt: string;
  createdAtLabel: string;
  authorLabel?: string;
  status?: EmrBadge;
  tags?: readonly string[];
  canPreview?: boolean;
  canDownload?: boolean;
  canDelete?: boolean;
  previewKind?: 'image' | 'pdf';
}

export type PatientDocumentSortField = 'createdAt' | 'title' | 'category' | 'folder';

export type PatientDocumentsEffect =
  | { type: 'previewRequested'; documentId: string }
  | { type: 'downloadRequested'; documentId: string }
  | { type: 'retryRequested' };

export interface PatientDocumentsControllerOptions {
  onEffect?: (effect: PatientDocumentsEffect) => void;
}

export interface PatientDocumentsViewModel {
  /** Stable, controller-supplied DOM identity for pages with multiple libraries. */
  instanceId: string;
  label: string;
  query: string;
  category?: string;
  categoryOptions?: readonly EmrOption[];
  folder?: string;
  folderOptions?: readonly EmrOption[];
  documents: readonly PatientDocumentRecord[];
  selectedDocumentId?: string;
  loading?: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
  sort?: { field: PatientDocumentSortField; direction: 'asc' | 'desc' };
  lastEffect?: PatientDocumentsEffect;
}

export type DocumentUploadIntent =
  | { type: 'filesSelected'; files: readonly SelectedDocumentSource[] }
  | { type: 'candidateRetryRequested'; candidateId: string }
  | { type: 'candidateCancelRequested'; candidateId: string }
  | { type: 'candidateRemoveRequested'; candidateId: string };

export type PatientDocumentsIntent =
  | { type: 'queryChanged'; query: string }
  | { type: 'categoryChanged'; category: string }
  | { type: 'folderChanged'; folder: string }
  | { type: 'sortChanged'; field: PatientDocumentSortField; direction: 'asc' | 'desc' }
  | { type: 'pageChanged'; page: number }
  | { type: 'documentSelected'; documentId: string }
  | { type: 'previewRequested'; documentId: string }
  | { type: 'downloadRequested'; documentId: string }
  | { type: 'deleteRequested'; documentId: string }
  | { type: 'retryRequested' };

export interface DocumentPreviewManifest {
  documentId: string;
  title: string;
  fileName: string;
  categoryLabel: string;
  folderLabel: string;
  createdAtLabel: string;
  kind: 'image' | 'pdf';
  /** Images have one page; PDFs expose the controller-authorized raster page count. */
  pageCount: number;
}

export interface DocumentPreviewPage {
  assetId: string;
  documentId: string;
  /** Zero-based page index. */
  pageIndex: number;
  pageLabel: string;
  /** Controller/adapter-authorized image source. The UI never receives a raw PDF. */
  rasterUrl: string;
  altText: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
}

export interface DocumentViewerViewModel {
  instanceId: string;
  open: boolean;
  currentDocument?: DocumentPreviewManifest;
  documentIndex: number;
  documentCount: number;
  pageIndex: number;
  page?: DocumentPreviewPage;
  loading: boolean;
  error?: string;
  canPreviousDocument: boolean;
  canNextDocument: boolean;
  canPreviousPage: boolean;
  canNextPage: boolean;
}

export type DocumentViewerIntent =
  | { type: 'openRequested'; documentId: string; carouselDocumentIds: readonly string[] }
  | { type: 'closeRequested' }
  | { type: 'previousDocumentRequested' }
  | { type: 'nextDocumentRequested' }
  | { type: 'previousPageRequested' }
  | { type: 'nextPageRequested' }
  | { type: 'pageRequested'; pageIndex: number }
  | { type: 'retryRequested' }
  | { type: 'rasterLoadFailed'; assetId: string };

export interface DocumentPreviewRepository {
  authorizeAndLoadManifest(documentId: string, signal: AbortSignal): Promise<DocumentPreviewManifest>;
  loadRasterPage(documentId: string, pageIndex: number, signal: AbortSignal): Promise<DocumentPreviewPage>;
}
