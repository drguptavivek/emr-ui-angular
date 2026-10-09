import { describe, expect, it } from 'vitest';
import { DocumentUploadQueueController, PatientDocumentsController } from './documents.controller';
import type { DocumentUploadQueueViewModel, PatientDocumentsViewModel } from './documents.models';

const queue: DocumentUploadQueueViewModel = { label: 'Upload', multiple: true, candidates: [] };
const documents: PatientDocumentsViewModel = { instanceId: 'documents-spec', label: 'Documents', query: '', documents: [
  { id: 'a', title: 'Discharge summary', categoryId: 'clinical', categoryLabel: 'Clinical', folderId: 'encounter', folderLabel: 'Encounter', fileName: 'summary.pdf', mediaTypeLabel: 'PDF', sizeLabel: '20 KB', createdAt: '2026-08-20T10:00:00Z', createdAtLabel: 'Today', canPreview: true, canDownload: true, canDelete: true },
  { id: 'b', title: 'Consent form', categoryId: 'administrative', categoryLabel: 'Administrative', folderId: 'consent', folderLabel: 'Consent', fileName: 'consent.pdf', mediaTypeLabel: 'PDF', sizeLabel: '10 KB', createdAt: '2026-08-19T10:00:00Z', createdAtLabel: 'Yesterday', canPreview: true, canDownload: true, canDelete: true }
], page: 1, pageSize: 20, total: 2 };

describe('Document controllers', () => {
  it('adds metadata-only candidates and supports removal', () => {
    const controller = new DocumentUploadQueueController(queue);
    controller.dispatch({ type: 'filesSelected', files: [{ fileName: 'scan.pdf', size: 2048, mediaType: 'application/pdf', sourceToken: 'source-1' }] });
    expect(controller.getSnapshot().candidates[0].sourceToken).toBe('source-1');
    controller.dispatch({ type: 'candidateRemoveRequested', candidateId: controller.getSnapshot().candidates[0].id });
    expect(controller.getSnapshot().candidates).toHaveLength(0);
  });

  it('never reuses a candidate id already present in the queue', () => {
    const controller = new DocumentUploadQueueController({ ...queue, candidates: [{ id: 'candidate-1', fileName: 'old.pdf', sizeLabel: '1 KB', mediaTypeLabel: 'PDF', sourceToken: 'source-0', status: 'ready', statusLabel: 'Ready' }] });
    controller.dispatch({ type: 'filesSelected', files: [{ fileName: 'scan.pdf', size: 2048, mediaType: 'application/pdf', sourceToken: 'source-1' }] });
    const ids = controller.getSnapshot().candidates.map(candidate => candidate.id);
    expect(new Set(ids).size).toBe(2);
    controller.dispatch({ type: 'candidateRemoveRequested', candidateId: ids[1] });
    expect(controller.getSnapshot().candidates.map(candidate => candidate.id)).toEqual(['candidate-1']);
  });

  it('filters, sorts and selects supplied patient documents', () => {
    const controller = new PatientDocumentsController(documents);
    controller.dispatch({ type: 'queryChanged', query: 'consent' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['b']);
    controller.dispatch({ type: 'documentSelected', documentId: 'b' });
    expect(controller.getSnapshot().selectedDocumentId).toBe('b');
    controller.dispatch({ type: 'deleteRequested', documentId: 'b' });
    expect(controller.getSnapshot().documents).toHaveLength(0);
  });

  it('sorts by the machine timestamp and retains deletion in the canonical dataset', () => {
    const controller = new PatientDocumentsController(documents);
    controller.dispatch({ type: 'sortChanged', field: 'createdAt', direction: 'asc' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['b', 'a']);
    controller.dispatch({ type: 'queryChanged', query: 'discharge' });
    controller.dispatch({ type: 'deleteRequested', documentId: 'a' });
    expect(controller.getSnapshot().documents).toEqual([]);
    controller.dispatch({ type: 'queryChanged', query: '' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['b']);
    expect(controller.getSnapshot().total).toBe(1);
  });

  it('paginates filtered and sorted records and clamps out-of-range pages', () => {
    const many: PatientDocumentsViewModel = {
      ...documents,
      pageSize: 2,
      total: 5,
      documents: Array.from({ length: 5 }, (_, index) => ({
        id: `doc-${index + 1}`,
        title: `Document ${index + 1}`,
        categoryId: 'clinical',
        categoryLabel: 'Clinical',
        folderId: 'encounter',
        folderLabel: 'Encounter',
        fileName: `document-${index + 1}.pdf`,
        mediaTypeLabel: 'PDF',
        sizeLabel: '1 KB',
        createdAt: `2026-08-${String(20 - index).padStart(2, '0')}T10:00:00Z`,
        createdAtLabel: `${20 - index} Aug 2026`,
        canDelete: true
      }))
    };
    const controller = new PatientDocumentsController(many);
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['doc-1', 'doc-2']);
    controller.dispatch({ type: 'pageChanged', page: 2 });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['doc-3', 'doc-4']);
    controller.dispatch({ type: 'pageChanged', page: 99 });
    expect(controller.getSnapshot().page).toBe(3);
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['doc-5']);
    controller.dispatch({ type: 'queryChanged', query: 'Document 1' });
    expect(controller.getSnapshot().page).toBe(1);
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['doc-1']);
  });

  it('sorts shuffled input before slicing the initial page', () => {
    const shuffled: PatientDocumentsViewModel = {
      ...documents,
      pageSize: 2,
      total: 5,
      documents: [2, 5, 1, 4, 3].map(day => ({
        id: `doc-${day}`,
        title: `Document ${day}`,
        categoryId: 'clinical', categoryLabel: 'Clinical', folderId: day % 2 ? 'encounter' : 'consent', folderLabel: day % 2 ? 'Encounter' : 'Consent',
        fileName: `document-${day}.pdf`,
        mediaTypeLabel: 'PDF',
        sizeLabel: '1 KB',
        createdAt: `2026-08-${String(day).padStart(2, '0')}T10:00:00Z`,
        createdAtLabel: `${day} Aug 2026`
      }))
    };
    const controller = new PatientDocumentsController(shuffled);
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['doc-5', 'doc-4']);
    controller.dispatch({ type: 'pageChanged', page: 2 });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['doc-3', 'doc-2']);
  });

  it('filters by folder, sorts folders, and reapplies folder filters from page one', () => {
    const controller = new PatientDocumentsController({ ...documents, pageSize: 1, total: 2 });
    controller.dispatch({ type: 'folderChanged', folder: 'encounter' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['a']);
    expect(controller.getSnapshot().page).toBe(1);
    controller.dispatch({ type: 'folderChanged', folder: 'all' });
    controller.dispatch({ type: 'sortChanged', field: 'folder', direction: 'asc' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['b']);
    controller.dispatch({ type: 'pageChanged', page: 2 });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['a']);
    controller.dispatch({ type: 'folderChanged', folder: 'consent' });
    expect(controller.getSnapshot().page).toBe(1);
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['b']);
  });

  it('includes folder names in free-text search', () => {
    const controller = new PatientDocumentsController(documents);
    controller.dispatch({ type: 'queryChanged', query: 'consent' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['b']);
  });

  it('filters categories by stable option value rather than display label', () => {
    const controller = new PatientDocumentsController(documents);
    controller.dispatch({ type: 'categoryChanged', category: 'administrative' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['b']);
  });

  it('does not delete a document without delete permission', () => {
    const controller = new PatientDocumentsController({ ...documents, documents: documents.documents.map(document => ({ ...document, canDelete: document.id === 'a' })) });
    controller.dispatch({ type: 'deleteRequested', documentId: 'b' });
    expect(controller.getSnapshot().documents.map(document => document.id)).toEqual(['a', 'b']);
    expect(controller.getSnapshot().error).toContain('permission');
  });

  it('exposes preview, download and retry intents as typed effects', () => {
    const effects: unknown[] = [];
    const controller = new PatientDocumentsController(documents, { onEffect: effect => effects.push(effect) });
    controller.dispatch({ type: 'previewRequested', documentId: 'a' });
    expect(controller.getSnapshot().selectedDocumentId).toBe('a');
    controller.dispatch({ type: 'downloadRequested', documentId: 'a' });
    controller.dispatch({ type: 'retryRequested' });
    expect(effects).toEqual([
      { type: 'previewRequested', documentId: 'a' },
      { type: 'downloadRequested', documentId: 'a' },
      { type: 'retryRequested' }
    ]);
    expect(controller.getSnapshot().lastEffect).toEqual({ type: 'retryRequested' });
  });

  it('reports capability failures instead of silently ignoring effects', () => {
    const controller = new PatientDocumentsController(documents);
    controller.dispatch({ type: 'downloadRequested', documentId: 'missing' });
    expect(controller.getSnapshot().error).toContain('no longer available');
    controller.dispatch({ type: 'previewRequested', documentId: 'a' });
    expect(controller.getSnapshot().lastEffect).toEqual({ type: 'previewRequested', documentId: 'a' });
  });

  it('rejects preview effects without preview permission', () => {
    const controller = new PatientDocumentsController({ ...documents, documents: documents.documents.map(document => ({ ...document, canPreview: document.id === 'a' })) });
    controller.dispatch({ type: 'previewRequested', documentId: 'b' });
    expect(controller.getSnapshot().error).toContain('not permitted');
    expect(controller.getSnapshot().lastEffect).toBeUndefined();
  });
});
