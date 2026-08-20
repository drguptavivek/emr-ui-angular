import { StateController } from './contracts.js';
import type {
  DocumentPreviewManifest,
  DocumentPreviewPage,
  DocumentPreviewRepository,
  DocumentViewerIntent,
  DocumentViewerViewModel,
} from './documents.models.js';

type FailedTarget =
  | { kind: 'manifest'; documentId: string; documentIndex: number }
  | { kind: 'page'; documentId: string; pageIndex: number };

const initialState = (initial: DocumentViewerViewModel): DocumentViewerViewModel => ({
  ...initial,
  open: false,
  currentDocument: undefined,
  page: undefined,
  documentIndex: 0,
  documentCount: 0,
  pageIndex: 0,
  loading: false,
  error: undefined,
  canPreviousDocument: false,
  canNextDocument: false,
  canPreviousPage: false,
  canNextPage: false,
});

/**
 * Coordinates authorized document manifests and raster pages without exposing
 * repository concerns to the UI. AbortSignal is advisory: the generation
 * token also protects state when an adapter ignores cancellation.
 */
export class DocumentViewerController extends StateController<DocumentViewerViewModel, DocumentViewerIntent> {
  private readonly repository: DocumentPreviewRepository;
  private carouselDocumentIds: string[] = [];
  private requestGeneration = 0;
  private requestAbort?: AbortController;
  private failedTarget?: FailedTarget;

  constructor(initial: DocumentViewerViewModel, repository: DocumentPreviewRepository) {
    super(initialState(initial));
    this.repository = repository;
  }

  dispatch(intent: DocumentViewerIntent): void {
    switch (intent.type) {
      case 'openRequested': this.open(intent.documentId, intent.carouselDocumentIds); return;
      case 'closeRequested': this.close(); return;
      case 'previousDocumentRequested': this.navigateDocument(-1); return;
      case 'nextDocumentRequested': this.navigateDocument(1); return;
      case 'previousPageRequested': this.navigatePage(-1); return;
      case 'nextPageRequested': this.navigatePage(1); return;
      case 'pageRequested': this.loadRequestedPage(intent.pageIndex); return;
      case 'retryRequested': this.retry(); return;
      case 'rasterLoadFailed': this.rasterLoadFailed(intent.assetId); return;
      default: this.assertNever(intent);
    }
  }

  override destroy(): void {
    this.close();
    super.destroy();
  }

  private open(documentId: string, requestedCarousel: readonly string[]): void {
    if (!documentId || this.isDestroyed()) return;
    this.abortRequest();
    const ids = [...new Set(requestedCarousel.filter(Boolean))];
    if (!ids.includes(documentId)) ids.unshift(documentId);
    this.carouselDocumentIds = ids;
    const documentIndex = Math.max(0, ids.indexOf(documentId));
    this.failedTarget = undefined;
    this.setState(state => ({
      ...state,
      open: true,
      currentDocument: undefined,
      page: undefined,
      error: undefined,
      loading: true,
      documentIndex,
      documentCount: ids.length,
      pageIndex: 0,
      canPreviousDocument: documentIndex > 0,
      canNextDocument: documentIndex < ids.length - 1,
      canPreviousPage: false,
      canNextPage: false,
    }));
    void this.loadManifest(documentId, documentIndex);
  }

  private close(): void {
    this.abortRequest();
    this.requestGeneration += 1;
    this.carouselDocumentIds = [];
    this.failedTarget = undefined;
    this.setState(state => ({
      ...state,
      open: false,
      currentDocument: undefined,
      page: undefined,
      error: undefined,
      loading: false,
      documentIndex: 0,
      documentCount: 0,
      pageIndex: 0,
      canPreviousDocument: false,
      canNextDocument: false,
      canPreviousPage: false,
      canNextPage: false,
    }));
  }

  private navigateDocument(direction: -1 | 1): void {
    const state = this.getSnapshot();
    if (!state.open || this.carouselDocumentIds.length === 0) return;
    const index = Math.min(Math.max(0, state.documentIndex + direction), this.carouselDocumentIds.length - 1);
    if (index === state.documentIndex) return;
    this.abortRequest();
    const documentId = this.carouselDocumentIds[index];
    this.failedTarget = undefined;
    this.setState(current => ({
      ...current,
      currentDocument: undefined,
      page: undefined,
      error: undefined,
      loading: true,
      documentIndex: index,
      pageIndex: 0,
      canPreviousDocument: index > 0,
      canNextDocument: index < this.carouselDocumentIds.length - 1,
      canPreviousPage: false,
      canNextPage: false,
    }));
    void this.loadManifest(documentId, index);
  }

  private navigatePage(direction: -1 | 1): void {
    const state = this.getSnapshot();
    if (!state.open || !state.currentDocument) return;
    this.loadRequestedPage(state.pageIndex + direction);
  }

  private loadRequestedPage(requestedPageIndex: number): void {
    const state = this.getSnapshot();
    const manifest = state.currentDocument;
    if (!state.open || !manifest || !Number.isFinite(requestedPageIndex)) return;
    const pageIndex = this.clampPageIndex(requestedPageIndex, manifest);
    if (pageIndex === state.pageIndex && state.page && !state.error) return;
    this.abortRequest();
    this.failedTarget = undefined;
    this.setState(current => ({ ...current, page: undefined, pageIndex, loading: true, error: undefined, canPreviousPage: pageIndex > 0, canNextPage: pageIndex < manifest.pageCount - 1 }));
    void this.loadPage(manifest.documentId, pageIndex);
  }

  private retry(): void {
    const target = this.failedTarget;
    if (!target || !this.getSnapshot().open) return;
    if (target.kind === 'manifest') {
      this.abortRequest();
      this.setState(state => ({ ...state, loading: true, error: undefined, page: undefined, currentDocument: undefined, documentIndex: target.documentIndex, pageIndex: 0 }));
      void this.loadManifest(target.documentId, target.documentIndex);
      return;
    }
    const manifest = this.getSnapshot().currentDocument;
    if (!manifest) return;
    this.abortRequest();
    const pageIndex = this.clampPageIndex(target.pageIndex, manifest);
    this.setState(state => ({ ...state, loading: true, error: undefined, page: undefined, pageIndex }));
    void this.loadPage(target.documentId, pageIndex);
  }

  private async loadManifest(documentId: string, documentIndex: number): Promise<void> {
    const generation = this.beginRequest();
    try {
      const manifest = await this.repository.authorizeAndLoadManifest(documentId, this.signal());
      if (!this.isCurrent(generation) || !this.getSnapshot().open) return;
      if (!this.isValidManifest(manifest, documentId)) throw new Error('Invalid document preview manifest');
      const pageIndex = 0;
      this.failedTarget = undefined;
      this.setState(state => ({ ...state, currentDocument: manifest, page: undefined, pageIndex, loading: true, error: undefined, documentIndex, canPreviousDocument: documentIndex > 0, canNextDocument: documentIndex < this.carouselDocumentIds.length - 1, canPreviousPage: false, canNextPage: manifest.pageCount > 1 }));
      await this.loadPage(manifest.documentId, pageIndex, generation);
    } catch (error) {
      if (!this.isCurrent(generation) || this.isAbortError(error)) return;
      this.failedTarget = { kind: 'manifest', documentId, documentIndex };
      this.setState(state => ({ ...state, loading: false, currentDocument: undefined, page: undefined, error: 'Unable to authorize or load this document preview.', canPreviousPage: false, canNextPage: false }));
    }
  }

  private async loadPage(documentId: string, pageIndex: number, parentGeneration?: number): Promise<void> {
    const generation = parentGeneration ?? this.beginRequest();
    try {
      const page = await this.repository.loadRasterPage(documentId, pageIndex, this.signal());
      if (!this.isCurrent(generation) || !this.getSnapshot().open) return;
      const manifest = this.getSnapshot().currentDocument;
      if (!manifest || manifest.documentId !== documentId) return;
      if (!this.isValidPage(page, documentId, pageIndex)) throw new Error('Invalid document preview page');
      const safePageIndex = page.pageIndex;
      this.failedTarget = undefined;
      this.setState(state => ({ ...state, page: { ...page, pageIndex: safePageIndex }, pageIndex: safePageIndex, loading: false, error: undefined, canPreviousPage: safePageIndex > 0, canNextPage: safePageIndex < manifest.pageCount - 1 }));
    } catch (error) {
      if (!this.isCurrent(generation) || this.isAbortError(error)) return;
      this.failedTarget = { kind: 'page', documentId, pageIndex };
      this.setState(state => ({ ...state, loading: false, page: undefined, error: 'Unable to load this document page.' }));
    }
  }

  private rasterLoadFailed(assetId: string): void {
    const state = this.getSnapshot();
    if (!state.open || !state.page || state.page.assetId !== assetId) return;
    this.failedTarget = { kind: 'page', documentId: state.page.documentId, pageIndex: state.page.pageIndex };
    this.setState(current => ({ ...current, page: undefined, loading: false, error: 'The document preview image could not be displayed.' }));
  }

  private beginRequest(): number {
    this.abortRequest();
    this.requestGeneration += 1;
    this.requestAbort = new AbortController();
    return this.requestGeneration;
  }

  private abortRequest(): void {
    this.requestAbort?.abort();
    this.requestAbort = undefined;
  }

  private signal(): AbortSignal {
    if (!this.requestAbort) this.requestAbort = new AbortController();
    return this.requestAbort.signal;
  }

  private isCurrent(generation: number): boolean { return generation === this.requestGeneration && !this.isDestroyed(); }
  private isAbortError(error: unknown): boolean { return typeof error === 'object' && error !== null && 'name' in error && (error as { name?: unknown }).name === 'AbortError'; }
  private isValidManifest(manifest: DocumentPreviewManifest, requestedDocumentId: string): boolean {
    return typeof manifest === 'object'
      && manifest !== null
      && manifest.documentId === requestedDocumentId
      && (manifest.kind === 'image' || manifest.kind === 'pdf')
      && Number.isInteger(manifest.pageCount)
      && manifest.pageCount > 0;
  }
  private isValidPage(page: DocumentPreviewPage, documentId: string, pageIndex: number): boolean {
    return typeof page === 'object'
      && page !== null
      && page.documentId === documentId
      && page.pageIndex === pageIndex
      && typeof page.assetId === 'string' && Boolean(page.assetId.trim())
      && typeof page.rasterUrl === 'string' && Boolean(page.rasterUrl.trim())
      && typeof page.altText === 'string' && Boolean(page.altText.trim());
  }
  private clampPageIndex(pageIndex: number, manifest: DocumentPreviewManifest): number { return Math.min(Math.max(0, Math.trunc(pageIndex)), Math.max(0, manifest.pageCount - 1)); }
  private assertNever(value: never): never { throw new Error(`Unhandled DocumentViewerIntent: ${JSON.stringify(value)}`); }

  protected override onDestroy(): void { this.abortRequest(); this.requestGeneration += 1; this.carouselDocumentIds = []; this.failedTarget = undefined; }
}
