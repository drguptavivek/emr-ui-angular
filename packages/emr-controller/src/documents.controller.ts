import { StateController } from './contracts.js';
import type {
  DocumentCandidate, DocumentUploadIntent, DocumentUploadQueueViewModel, PatientDocumentsControllerOptions,
  PatientDocumentsEffect, PatientDocumentsIntent, PatientDocumentsViewModel, PatientDocumentRecord,
  PatientDocumentSortField
} from './documents.models.js';

function sortDocuments(documents: readonly PatientDocumentRecord[], sort: NonNullable<PatientDocumentsViewModel['sort']>): PatientDocumentRecord[] {
  const sign = sort.direction === 'asc' ? 1 : -1;
  return [...documents].sort((left, right) => {
    let comparison: number;
    if (sort.field === 'createdAt') comparison = Date.parse(left.createdAt) - Date.parse(right.createdAt);
    else if (sort.field === 'category') comparison = left.categoryLabel.localeCompare(right.categoryLabel);
    else if (sort.field === 'folder') comparison = left.folderLabel.localeCompare(right.folderLabel);
    else comparison = left.title.localeCompare(right.title);
    return (Number.isNaN(comparison) ? left.id.localeCompare(right.id) : comparison) * sign;
  });
}

function initialPageState(initial: PatientDocumentsViewModel): PatientDocumentsViewModel {
  const sort = initial.sort ?? { field: 'createdAt', direction: 'desc' as const };
  const pageSize = Math.max(1, initial.pageSize);
  const total = initial.documents.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, initial.page), pageCount);
  const ordered = sortDocuments(initial.documents, sort);
  return { ...initial, sort, documents: ordered.slice((page - 1) * pageSize, page * pageSize), page, total };
}

export class DocumentUploadQueueController extends StateController<DocumentUploadQueueViewModel, DocumentUploadIntent> {
  private sequence = 0;
  constructor(initial: DocumentUploadQueueViewModel) { super({ ...initial, candidates: [...initial.candidates] }); }

  dispatch(intent: DocumentUploadIntent): void {
    if (intent.type === 'filesSelected') {
      if (this.getSnapshot().disabled) return;
      const taken = new Set(this.getSnapshot().candidates.map(candidate => candidate.id));
      const nextId = (): string => {
        let id = `candidate-${++this.sequence}`;
        while (taken.has(id)) id = `candidate-${++this.sequence}`;
        taken.add(id);
        return id;
      };
      const additions: DocumentCandidate[] = intent.files.map(file => ({
        id: nextId(),
        fileName: file.fileName,
        sizeLabel: `${Math.max(0, Math.round(file.size / 1024))} KB`,
        mediaTypeLabel: file.mediaType || 'Unknown type', sourceToken: file.sourceToken,
        status: 'ready', statusLabel: 'Ready'
      }));
      this.setState(state => ({ ...state, candidates: [...state.candidates, ...additions], error: undefined }));
      return;
    }
    if (intent.type === 'candidateRemoveRequested' || intent.type === 'candidateCancelRequested') {
      this.setState(state => ({ ...state, candidates: state.candidates.filter(candidate => candidate.id !== intent.candidateId) }));
      return;
    }
    if (intent.type === 'candidateRetryRequested') {
      this.setState(state => ({ ...state, candidates: state.candidates.map(candidate => candidate.id === intent.candidateId
        ? { ...candidate, status: 'ready', statusLabel: 'Ready', error: undefined } : candidate) }));
    }
  }
}

export class PatientDocumentsController extends StateController<PatientDocumentsViewModel, PatientDocumentsIntent> {
  private readonly canonicalDocuments: PatientDocumentRecord[];
  private readonly onEffect?: (effect: PatientDocumentsEffect) => void;

  constructor(initial: PatientDocumentsViewModel, options: PatientDocumentsControllerOptions = {}) {
    super(initialPageState({ ...initial, sort: initial.sort ?? { field: 'createdAt', direction: 'desc' } }));
    this.canonicalDocuments = [...initial.documents];
    this.onEffect = options.onEffect;
  }

  dispatch(intent: PatientDocumentsIntent): void {
    switch (intent.type) {
      case 'queryChanged': this.filter({ query: intent.query }); return;
      case 'categoryChanged': this.filter({ category: intent.category }); return;
      case 'folderChanged': this.filter({ folder: intent.folder }); return;
      case 'sortChanged': this.sort(intent.field, intent.direction); return;
      case 'pageChanged':
        this.setState(state => {
          const visible = this.paginated(state, intent.page);
          return { ...state, documents: visible.documents, page: visible.page, total: visible.total };
        }); return;
      case 'documentSelected':
        if (this.getSnapshot().documents.some(document => document.id === intent.documentId)) {
          this.setState(state => ({ ...state, selectedDocumentId: intent.documentId, error: undefined }));
        }
        return;
      case 'deleteRequested': this.delete(intent.documentId); return;
      case 'previewRequested': this.requestEffect({ type: 'previewRequested', documentId: intent.documentId }, intent.documentId); return;
      case 'downloadRequested': this.requestEffect({ type: 'downloadRequested', documentId: intent.documentId }, intent.documentId); return;
      case 'retryRequested': this.requestEffect({ type: 'retryRequested' }); return;
      default: this.assertNever(intent);
    }
  }

  private filter(changes: { query?: string; category?: string; folder?: string }): void {
    this.setState(state => {
      const query = changes.query ?? state.query;
      const category = changes.category ?? state.category;
      const folder = changes.folder ?? state.folder;
      const visible = this.paginated({ ...state, query, category, folder }, 1);
      return { ...state, query, category, folder, documents: visible.documents, page: visible.page, total: visible.total };
    });
  }

  private sort(field: PatientDocumentSortField, direction: 'asc' | 'desc'): void {
    this.setState(state => {
      const sort = { field, direction };
      const visible = this.paginated({ ...state, sort }, state.page);
      return { ...state, documents: visible.documents, page: visible.page, total: visible.total, sort };
    });
  }

  private sorted(documents: readonly PatientDocumentRecord[], sort = this.getSnapshot().sort): PatientDocumentRecord[] {
    if (!sort) return [...documents];
    return sortDocuments(documents, sort);
  }

  private delete(documentId: string): void {
    const index = this.canonicalDocuments.findIndex(document => document.id === documentId);
    if (index < 0) {
      this.setState(state => ({ ...state, error: 'Document is no longer available.' }));
      return;
    }
    if (!this.canonicalDocuments[index].canDelete) {
      this.setState(state => ({ ...state, error: 'You do not have permission to delete this document.' }));
      return;
    }
    this.canonicalDocuments.splice(index, 1);
    this.setState(state => {
      const visible = this.paginated(state, state.page);
      return { ...state, documents: visible.documents, page: visible.page, total: visible.total, selectedDocumentId: state.selectedDocumentId === documentId ? undefined : state.selectedDocumentId, error: undefined };
    });
  }

  private filtered(state: Readonly<PatientDocumentsViewModel>, query = state.query, category = state.category, folder = state.folder): PatientDocumentRecord[] {
    const normalized = query.trim().toLowerCase();
    return this.canonicalDocuments.filter(document => {
      const matchesQuery = !normalized || [document.title, document.fileName, document.categoryLabel, document.folderLabel, document.authorLabel ?? ''].join(' ').toLowerCase().includes(normalized);
      const matchesCategory = !category || category === 'all' || document.categoryId === category || document.categoryLabel === category;
      const matchesFolder = !folder || folder === 'all' || document.folderId === folder || document.folderLabel === folder;
      return matchesQuery && matchesCategory && matchesFolder;
    });
  }

  private paginated(state: Readonly<PatientDocumentsViewModel>, requestedPage: number): { documents: PatientDocumentRecord[]; page: number; total: number } {
    const all = this.sorted(this.filtered(state), state.sort);
    const pageSize = Math.max(1, state.pageSize);
    const pageCount = Math.max(1, Math.ceil(all.length / pageSize));
    const page = Math.min(Math.max(1, requestedPage), pageCount);
    return { documents: all.slice((page - 1) * pageSize, page * pageSize), page, total: all.length };
  }

  private requestEffect(effect: PatientDocumentsEffect, documentId?: string): void {
    if (documentId) {
      const document = this.canonicalDocuments.find(item => item.id === documentId);
      const allowed = effect.type === 'previewRequested' ? document?.canPreview : document?.canDownload;
      if (!document || !allowed) {
        this.setState(state => ({ ...state, error: !document ? 'Document is no longer available.' : 'This document action is not permitted.' }));
        return;
      }
    }
    this.setState(state => ({
      ...state,
      lastEffect: effect,
      selectedDocumentId: effect.type === 'previewRequested' ? effect.documentId : state.selectedDocumentId,
      error: undefined,
    }));
    this.onEffect?.(effect);
  }

  private assertNever(value: never): never {
    throw new Error(`Unhandled PatientDocumentsIntent: ${JSON.stringify(value)}`);
  }
}
