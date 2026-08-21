import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { DocumentViewerController, PatientDocumentsController } from '@drguptavivek/emr-controller';
import type { DocumentPreviewManifest, DocumentPreviewPage, DocumentPreviewRepository, DocumentUploadQueueViewModel, DocumentViewerIntent, DocumentViewerViewModel, PatientDocumentsIntent, PatientDocumentsViewModel } from '@drguptavivek/emr-controller';
import { EmrDocumentUploadQueueComponent } from '../domain/emr-document-upload-queue.component';
import { EmrPatientDocumentsComponent } from '../domain/emr-patient-documents.component';
import { EmrDocumentViewerComponent } from '../domain/emr-document-viewer.component';

const uploadFixture: DocumentUploadQueueViewModel = { label: 'Add patient documents', acceptDescription: 'PDF, JPEG and PNG files are accepted by the host workflow.', multiple: true, candidates: [
  { id: 'doc-candidate-1', fileName: 'discharge-summary.pdf', sizeLabel: '224 KB', mediaTypeLabel: 'PDF', sourceToken: 'synthetic-source-1', status: 'complete', statusLabel: 'Ready for review', progress: 100 },
  { id: 'doc-candidate-2', fileName: 'fundus-photo.jpg', sizeLabel: '1.2 MB', mediaTypeLabel: 'JPEG', sourceToken: 'synthetic-source-2', status: 'processing', statusLabel: 'Processing', progress: 64 }
] };

const documentsFixture: PatientDocumentsViewModel = { instanceId: 'patient-documents-story', label: 'Patient documents', query: '', page: 1, pageSize: 20, total: 4, categoryOptions: [{ value: 'clinical', label: 'Clinical' }, { value: 'administrative', label: 'Administrative' }], folderOptions: [{ value: 'encounter-aug-2026', label: 'August 2026 encounter' }, { value: 'ophthalmology', label: 'Ophthalmology' }], documents: [
  { id: 'pd-1', title: 'Discharge summary', categoryId: 'clinical', categoryLabel: 'Clinical', folderId: 'encounter-aug-2026', folderLabel: 'August 2026 encounter', fileName: 'discharge-summary.pdf', mediaTypeLabel: 'PDF', sizeLabel: '224 KB', createdAt: '2026-08-19T09:00:00Z', createdAtLabel: '19 Aug 2026', authorLabel: 'Synthetic care team', canPreview: true, canDownload: true, canDelete: true, previewKind: 'pdf', tags: ['Encounter'] },
  { id: 'pd-2', title: 'Consent form', categoryId: 'administrative', categoryLabel: 'Administrative', folderId: 'encounter-aug-2026', folderLabel: 'August 2026 encounter', fileName: 'consent.pdf', mediaTypeLabel: 'PDF', sizeLabel: '92 KB', createdAt: '2026-08-18T09:00:00Z', createdAtLabel: '18 Aug 2026', canPreview: true, canDownload: true, previewKind: 'pdf' },
  { id: 'pd-3', title: 'External eye photograph', categoryId: 'clinical', categoryLabel: 'Clinical', folderId: 'ophthalmology', folderLabel: 'Ophthalmology', fileName: 'external-eye.jpg', mediaTypeLabel: 'JPEG', sizeLabel: '1.1 MB', createdAt: '2026-08-18T12:00:00Z', createdAtLabel: '18 Aug 2026', canPreview: true, canDownload: true, previewKind: 'image' },
  { id: 'pd-4', title: 'Referral letter', categoryId: 'clinical', categoryLabel: 'Clinical', folderId: 'ophthalmology', folderLabel: 'Ophthalmology', fileName: 'referral-letter.pdf', mediaTypeLabel: 'PDF', sizeLabel: '140 KB', createdAt: '2026-08-17T12:00:00Z', createdAtLabel: '17 Aug 2026', canPreview: false, canDownload: true, previewKind: 'pdf', status: { label: 'Preview restricted', tone: 'warning' } },
] };

const rasterUrl = (label: string): string => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#f8fafc"/><rect x="80" y="80" width="1040" height="640" rx="18" fill="#fff" stroke="#cbd5e1" stroke-width="4"/><text x="120" y="190" fill="#334155" font-family="system-ui,sans-serif" font-size="38" font-weight="700">${label}</text><text x="120" y="250" fill="#64748b" font-family="system-ui,sans-serif" font-size="24">Synthetic document preview · controller-supplied raster</text><path d="M120 330h900M120 400h760M120 470h860M120 540h620" stroke="#cbd5e1" stroke-width="18" stroke-linecap="round"/></svg>`)}`;
const previewManifest = (documentId: string, kind: 'image' | 'pdf', pageCount = kind === 'pdf' ? 3 : 1): DocumentPreviewManifest => ({ documentId, title: documentId === 'pd-3' ? 'External eye photograph' : 'Discharge summary', fileName: documentId === 'pd-3' ? 'external-eye.jpg' : 'discharge-summary.pdf', categoryLabel: 'Clinical', folderLabel: documentId === 'pd-3' ? 'Ophthalmology' : 'August 2026 encounter', createdAtLabel: '19 Aug 2026', kind, pageCount });
const previewPage = (documentId: string, pageIndex: number, kind: 'image' | 'pdf'): DocumentPreviewPage => ({ assetId: `${documentId}-asset-${pageIndex}`, documentId, pageIndex, pageLabel: kind === 'pdf' ? `Page ${pageIndex + 1}` : 'Image', rasterUrl: rasterUrl(`${documentId === 'pd-3' ? 'External eye photograph' : 'Discharge summary'}${kind === 'pdf' ? ` · page ${pageIndex + 1}` : ''}`), altText: `Synthetic preview of ${documentId}, ${kind === 'pdf' ? `page ${pageIndex + 1}` : 'image'}` });

class StoryPreviewPort implements DocumentPreviewRepository {
  authorizeAndLoadManifest(documentId: string): Promise<DocumentPreviewManifest> { if (documentId === 'restricted') return Promise.reject(new Error('Preview authorization denied')); const kind = documentId === 'pd-3' ? 'image' : 'pdf'; return Promise.resolve(previewManifest(documentId, kind)); }
  loadRasterPage(documentId: string, pageIndex: number): Promise<DocumentPreviewPage> { const kind = documentId === 'pd-3' ? 'image' : 'pdf'; return Promise.resolve(previewPage(documentId, pageIndex, kind)); }
}

const viewerInitial: DocumentViewerViewModel = { instanceId: 'story-document-viewer', open: false, documentIndex: 0, documentCount: 0, pageIndex: 0, loading: false, canPreviousDocument: false, canNextDocument: false, canPreviousPage: false, canNextPage: false };

@Component({ selector: 'emr-document-journey-story', standalone: true, imports: [EmrPatientDocumentsComponent, EmrDocumentViewerComponent], changeDetection: ChangeDetectionStrategy.Default, template: `<div class="emr-story-surface emr-document-journey"><emr-patient-documents [model]="documentsState" (intent)="documentIntent($event)" (previewTrigger)="previewTrigger = $event" /><emr-document-viewer [model]="viewerState" [returnFocusTo]="previewTrigger" (intent)="viewerIntent($event)" /></div>` })
class EmrDocumentJourneyStoryComponent implements OnDestroy {
  readonly viewerController = new DocumentViewerController(viewerInitial, new StoryPreviewPort());
  readonly documentsController: PatientDocumentsController;
  documentsState: PatientDocumentsViewModel = documentsFixture;
  viewerState: DocumentViewerViewModel = viewerInitial;
  previewTrigger?: HTMLElement;
  constructor() {
    this.viewerController.subscribe(state => { this.viewerState = state as DocumentViewerViewModel; });
    this.documentsController = new PatientDocumentsController(documentsFixture, { onEffect: effect => { if (effect.type === 'previewRequested') { const carouselDocumentIds = documentsFixture.documents.filter(document => document.canPreview).map(document => document.id); this.viewerController.dispatch({ type: 'openRequested', documentId: effect.documentId, carouselDocumentIds }); } } });
    this.documentsController.subscribe(state => { this.documentsState = state as PatientDocumentsViewModel; });
  }
  documentIntent(intent: PatientDocumentsIntent): void { this.documentsController.dispatch(intent); }
  viewerIntent(intent: DocumentViewerIntent): void { this.viewerController.dispatch(intent); }
  ngOnDestroy(): void { this.viewerController.destroy(); this.documentsController.destroy(); }
}

const meta: Meta = { title: 'EMR / Documents', decorators: [moduleMetadata({ imports: [EmrDocumentUploadQueueComponent, EmrPatientDocumentsComponent, EmrDocumentViewerComponent, EmrDocumentJourneyStoryComponent] })], parameters: { docs: { description: { component: 'Controlled document intake, searchable patient document library and authorized raster viewer. Stories use synthetic records; preview requests emit controller intents and never embed native PDFs.' } } } };
export default meta;
type Story = StoryObj;

export const UploadQueue: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-document-upload-queue [model]="state" /></div>`, props: { state: uploadFixture } }) };
export const PatientDocuments: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-patient-documents [model]="state" /></div>`, props: { state: documentsFixture } }) };
export const IntegratedClickToOpenJourney: Story = { render: () => ({ template: `<emr-document-journey-story />` }) };
export const ImageViewer: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-document-viewer [model]="view" /></div>`, props: { view: { ...viewerInitial, open: true, currentDocument: previewManifest('pd-3', 'image'), documentIndex: 0, documentCount: 1, page: previewPage('pd-3', 0, 'image') } } }) };
export const PdfRasterCarousel: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-document-viewer [model]="view" /></div>`, props: { view: { ...viewerInitial, open: true, currentDocument: previewManifest('pd-1', 'pdf', 3), documentIndex: 0, documentCount: 2, pageIndex: 1, page: previewPage('pd-1', 1, 'pdf'), canNextDocument: true, canPreviousPage: true, canNextPage: true } } }) };
export const Loading: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-document-viewer [model]="view" /></div>`, props: { view: { ...viewerInitial, open: true, currentDocument: previewManifest('pd-1', 'pdf', 3), documentCount: 2, loading: true, canNextDocument: true, canNextPage: true } } }) };
export const ErrorState: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-document-viewer [model]="view" /></div>`, props: { view: { ...viewerInitial, open: true, currentDocument: previewManifest('pd-1', 'pdf', 3), documentCount: 2, error: 'Unable to load this document page.', canNextDocument: true, canNextPage: true } } }) };
export const UnauthorizedPreview: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-document-viewer [model]="view" /></div>`, props: { view: { ...viewerInitial, open: true, documentCount: 1, error: 'Unable to authorize or load this document preview.' } } }) };
export const NonPreviewableDocument: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-patient-documents [model]="state" /></div>`, props: { state: { ...documentsFixture, documents: [documentsFixture.documents[3]], total: 1 } } }) };
export const Empty: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-patient-documents [model]="state" /></div>`, props: { state: { ...documentsFixture, documents: [], total: 0 } } }) };
export const DocumentsLoading: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-patient-documents [model]="state" /></div>`, props: { state: { ...documentsFixture, documents: [], loading: true } } }) };
export const DocumentsError: Story = { render: () => ({ template: `<div class="emr-story-surface"><emr-patient-documents [model]="state" /></div>`, props: { state: { ...documentsFixture, documents: [], error: 'The document service is unavailable.' } } }) };
export const MobileDocumentsAndViewer: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } }, render: () => ({ template: `<emr-document-journey-story />` }) };
