import { describe, expect, it } from 'vitest';
import { DocumentViewerController } from './document-viewer.controller';
import type { DocumentPreviewManifest, DocumentPreviewPage, DocumentPreviewRepository, DocumentViewerViewModel } from './documents.models';

const manifest = (documentId: string, pageCount = 2): DocumentPreviewManifest => ({ documentId, title: `Document ${documentId}`, fileName: `${documentId}.pdf`, categoryLabel: 'Reports', folderLabel: 'Encounter', createdAtLabel: '20 Aug 2026', kind: 'pdf', pageCount });
const page = (documentId: string, pageIndex: number, assetId = `${documentId}-page-${pageIndex}`): DocumentPreviewPage => ({ assetId, documentId, pageIndex, pageLabel: `Page ${pageIndex + 1}`, rasterUrl: `https://authorized.invalid/${assetId}.png`, altText: `Page ${pageIndex + 1}` });
const initial: DocumentViewerViewModel = { instanceId: 'viewer-1', open: false, documentIndex: 0, documentCount: 0, pageIndex: 0, loading: false, canPreviousDocument: false, canNextDocument: false, canPreviousPage: false, canNextPage: false };

type Deferred<T> = { promise: Promise<T>; resolve(value: T): void; reject(error: unknown): void };
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
async function settle(): Promise<void> { await Promise.resolve(); await Promise.resolve(); }

class FakeRepository implements DocumentPreviewRepository {
  readonly manifests = new Map<string, Deferred<DocumentPreviewManifest>>();
  readonly pages = new Map<string, Deferred<DocumentPreviewPage>>();
  readonly manifestSignals: AbortSignal[] = [];
  readonly pageSignals: AbortSignal[] = [];
  authorizeAndLoadManifest(documentId: string, signal: AbortSignal): Promise<DocumentPreviewManifest> {
    this.manifestSignals.push(signal);
    const request = deferred<DocumentPreviewManifest>();
    this.manifests.set(documentId, request);
    return request.promise;
  }
  loadRasterPage(documentId: string, pageIndex: number, signal: AbortSignal): Promise<DocumentPreviewPage> {
    this.pageSignals.push(signal);
    const request = deferred<DocumentPreviewPage>();
    this.pages.set(`${documentId}:${pageIndex}`, request);
    return request.promise;
  }
}

describe('DocumentViewerController', () => {
  it('opens a document, loads its manifest and first page, and clamps page navigation', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'one', carouselDocumentIds: ['one', 'two'] });
    expect(controller.getSnapshot()).toMatchObject({ open: true, documentCount: 2, documentIndex: 0, loading: true });
    repository.manifests.get('one')!.resolve(manifest('one', 3));
    await settle();
    expect(repository.pages.has('one:0')).toBe(true);
    repository.pages.get('one:0')!.resolve(page('one', 0));
    await settle();
    expect(controller.getSnapshot()).toMatchObject({ currentDocument: manifest('one', 3), page: page('one', 0), loading: false, canNextPage: true, canPreviousDocument: false, canNextDocument: true });
    controller.dispatch({ type: 'pageRequested', pageIndex: 99 });
    repository.pages.get('one:2')!.resolve(page('one', 2));
    await settle();
    expect(controller.getSnapshot().pageIndex).toBe(2);
    controller.dispatch({ type: 'previousPageRequested' });
    repository.pages.get('one:1')!.resolve(page('one', 1));
    await settle();
    expect(controller.getSnapshot().pageIndex).toBe(1);
  });

  it('clamps carousel navigation and owns the carousel ids', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'two', carouselDocumentIds: ['one', 'two', 'two'] });
    expect(controller.getSnapshot()).toMatchObject({ documentCount: 2, documentIndex: 1 });
    repository.manifests.get('two')!.resolve(manifest('two', 1));
    await settle();
    repository.pages.get('two:0')!.resolve(page('two', 0));
    await settle();
    controller.dispatch({ type: 'nextDocumentRequested' });
    expect(controller.getSnapshot().documentIndex).toBe(1);
    controller.dispatch({ type: 'previousDocumentRequested' });
    expect(controller.getSnapshot()).toMatchObject({ documentIndex: 0, currentDocument: undefined, loading: true });
    repository.manifests.get('one')!.resolve(manifest('one', 1));
    await settle();
    repository.pages.get('one:0')!.resolve(page('one', 0));
    await settle();
    expect(controller.getSnapshot().currentDocument?.documentId).toBe('one');
  });

  it('ignores stale manifest and page responses when a repository ignores AbortSignal', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'old', carouselDocumentIds: ['old'] });
    const oldManifestRequest = repository.manifests.get('old')!;
    controller.dispatch({ type: 'openRequested', documentId: 'new', carouselDocumentIds: ['new'] });
    expect(repository.manifestSignals[0].aborted).toBe(true);
    oldManifestRequest.resolve(manifest('old'));
    await settle();
    expect(controller.getSnapshot().currentDocument).toBeUndefined();
    repository.manifests.get('new')!.resolve(manifest('new', 2));
    await settle();
    const oldPage = repository.pages.get('new:0')!;
    controller.dispatch({ type: 'nextPageRequested' });
    expect(repository.pageSignals[0].aborted).toBe(true);
    oldPage.resolve(page('new', 0));
    await settle();
    expect(controller.getSnapshot().page).toBeUndefined();
    repository.pages.get('new:1')!.resolve(page('new', 1));
    await settle();
    expect(controller.getSnapshot().page?.pageIndex).toBe(1);
  });

  it('reports authorization and page failures without exposing a raster URL and retries the failed target', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'restricted', carouselDocumentIds: ['restricted'] });
    repository.manifests.get('restricted')!.reject(new Error('403 https://private.invalid/raster')); await settle();
    expect(controller.getSnapshot()).toMatchObject({ loading: false, error: 'Unable to authorize or load this document preview.' });
    expect(controller.getSnapshot().error).not.toContain('private.invalid');
    controller.dispatch({ type: 'retryRequested' });
    repository.manifests.get('restricted')!.resolve(manifest('restricted', 1)); await settle();
    repository.pages.get('restricted:0')!.reject(new Error('raster https://private.invalid/page')); await settle();
    expect(controller.getSnapshot().error).toBe('Unable to load this document page.');
    expect(controller.getSnapshot().page).toBeUndefined();
    controller.dispatch({ type: 'retryRequested' });
    repository.pages.get('restricted:0')!.resolve(page('restricted', 0)); await settle();
    expect(controller.getSnapshot().page?.rasterUrl).toContain('authorized.invalid');
  });

  it('turns a browser raster failure into a retryable controller error', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'scan', carouselDocumentIds: ['scan'] });
    repository.manifests.get('scan')!.resolve(manifest('scan', 1)); await settle();
    repository.pages.get('scan:0')!.resolve(page('scan', 0)); await settle();
    controller.dispatch({ type: 'rasterLoadFailed', assetId: 'wrong-asset' });
    expect(controller.getSnapshot().page).toBeDefined();
    controller.dispatch({ type: 'rasterLoadFailed', assetId: 'scan-page-0' });
    expect(controller.getSnapshot()).toMatchObject({ page: undefined, loading: false, error: 'The document preview image could not be displayed.' });
    controller.dispatch({ type: 'retryRequested' });
    repository.pages.get('scan:0')!.resolve(page('scan', 0)); await settle();
    expect(controller.getSnapshot().page?.assetId).toBe('scan-page-0');
  });

  it('rejects mismatched manifests and raster pages from an adapter', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'expected', carouselDocumentIds: ['expected'] });
    repository.manifests.get('expected')!.resolve(manifest('different', 1));
    await settle();
    expect(controller.getSnapshot()).toMatchObject({ currentDocument: undefined, page: undefined, error: 'Unable to authorize or load this document preview.' });

    controller.dispatch({ type: 'retryRequested' });
    repository.manifests.get('expected')!.resolve(manifest('expected', 1));
    await settle();
    repository.pages.get('expected:0')!.resolve(page('different', 0));
    await settle();
    expect(controller.getSnapshot()).toMatchObject({ page: undefined, error: 'Unable to load this document page.' });
  });

  it('converts malformed adapter payloads into safe controller errors', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'unsafe', carouselDocumentIds: ['unsafe'] });
    repository.manifests.get('unsafe')!.resolve(null as unknown as DocumentPreviewManifest);
    await settle();
    expect(controller.getSnapshot().error).toBe('Unable to authorize or load this document preview.');

    controller.dispatch({ type: 'retryRequested' });
    repository.manifests.get('unsafe')!.resolve(manifest('unsafe', 1));
    await settle();
    repository.pages.get('unsafe:0')!.resolve({ ...page('unsafe', 0), rasterUrl: null } as unknown as DocumentPreviewPage);
    await settle();
    expect(controller.getSnapshot().error).toBe('Unable to load this document page.');
  });

  it('aborts requests and clears sensitive document, page, error and carousel state on close', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'private', carouselDocumentIds: ['private', 'other'] });
    const request = repository.manifests.get('private')!;
    controller.dispatch({ type: 'closeRequested' });
    expect(repository.manifestSignals[0].aborted).toBe(true);
    request.resolve(manifest('private'));
    await settle();
    expect(controller.getSnapshot()).toMatchObject({ open: false, currentDocument: undefined, page: undefined, error: undefined, loading: false, documentIndex: 0, documentCount: 0, pageIndex: 0, canNextDocument: false });
    controller.dispatch({ type: 'nextDocumentRequested' });
    expect(controller.getSnapshot().documentCount).toBe(0);
  });

  it('clears sensitive preview state before destruction', async () => {
    const repository = new FakeRepository();
    const controller = new DocumentViewerController(initial, repository);
    controller.dispatch({ type: 'openRequested', documentId: 'private', carouselDocumentIds: ['private'] });
    repository.manifests.get('private')!.resolve(manifest('private', 1)); await settle();
    repository.pages.get('private:0')!.resolve(page('private', 0)); await settle();
    controller.destroy();
    expect(controller.getSnapshot()).toMatchObject({ open: false, currentDocument: undefined, page: undefined, documentCount: 0 });
  });
});
