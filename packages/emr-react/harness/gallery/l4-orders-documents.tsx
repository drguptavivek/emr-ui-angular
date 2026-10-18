'use client';

import { useState } from 'react';
import { View } from 'react-native';
import {
  EmrDocumentUploadQueue,
  EmrDocumentViewer,
  EmrFavouritesPanel,
  EmrHierarchyOrderPicker,
  EmrOrderDetails,
  EmrPatientDocuments,
  EmrRightFlyout,
  type DocumentPreviewManifest,
  type DocumentPreviewPage,
  type DocumentUploadIntent,
  type DocumentUploadQueueViewModel,
  type DocumentViewerIntent,
  type DocumentViewerViewModel,
  type FavouriteEntry,
  type FavouritesIntent,
  type FavouritesViewModel,
  type HierarchyNode,
  type HierarchyOrderIntent,
  type HierarchyOrderViewModel,
  type OrderDetailsIntent,
  type PatientDocumentsIntent,
  type PatientDocumentsViewModel,
  type SelectedOrder,
} from '../../src/l4-orders-documents';
import { EmrButton } from '../../src/primitives';
import type { GallerySection } from './types';

// ---- Synthetic fixtures ported from orders-favourites.stories.ts & patient-documents.stories.ts ----

const labNodes: readonly HierarchyNode[] = [
  {
    id: 'lab-haem',
    label: 'Haematology',
    kind: 'group',
    selectable: false,
    expanded: true,
    children: [
      { id: 'lab-cbc', label: 'Complete blood count', code: 'CBC', kind: 'item', selectable: true },
      { id: 'lab-esr', label: 'Erythrocyte sedimentation rate', code: 'ESR', kind: 'item', selectable: true },
    ],
  },
  {
    id: 'lab-chem',
    label: 'Clinical chemistry',
    kind: 'group',
    selectable: true,
    expanded: false,
    children: [
      { id: 'lab-hba1c', label: 'Glycated haemoglobin', code: 'HBA1C', kind: 'item', selectable: true },
      { id: 'lab-creatinine', label: 'Serum creatinine', code: 'CREAT', kind: 'item', selectable: true },
    ],
  },
];

const initialLabOrderState: HierarchyOrderViewModel = {
  title: 'Order laboratory tests',
  query: '',
  roots: labNodes,
  loading: false,
  selected: [
    {
      id: 'order-cbc',
      catalogueId: 'lab-cbc',
      label: 'Complete blood count',
      code: 'CBC',
      kind: 'laboratory',
      details: { urgency: 'routine', fasting: false, notes: 'Baseline before review' },
    },
  ],
};

const initialRadiologyOrder: SelectedOrder = {
  id: 'order-mri',
  catalogueId: 'rad-mri-brain',
  label: 'MRI brain with screening sequences',
  code: 'MRI-BRAIN',
  kind: 'radiology',
  details: {
    urgency: 'urgent',
    bodySite: 'Brain',
    laterality: 'not-applicable',
    contrast: true,
    clinicalIndication: 'Left-sided weakness',
  },
};

const initialFavourites: readonly FavouriteEntry[] = [
  {
    id: 'fav-1',
    name: 'Diabetes follow-up',
    kind: 'combination',
    summary: 'HbA1c, renal profile and eye review',
    updatedAt: '2026-08-19',
    orderTemplates: [
      { id: 'template-hba1c', catalogueId: 'lab-hba1c', label: 'Glycated haemoglobin', code: 'HBA1C', kind: 'laboratory' },
      { id: 'template-creat', catalogueId: 'lab-creatinine', label: 'Serum creatinine', code: 'CREAT', kind: 'laboratory' },
    ],
  },
  {
    id: 'fav-2',
    name: 'Glaucoma review',
    kind: 'medication',
    summary: 'Latanoprost and adherence counselling',
    updatedAt: '2026-08-17',
    orderTemplates: [
      { id: 'template-latanoprost', catalogueId: 'med-latanoprost', label: 'Latanoprost 0.005%', kind: 'medication' },
    ],
  },
];

const initialFavouritesState: FavouritesViewModel = {
  open: true,
  mode: 'list',
  activeKind: 'combination',
  query: '',
  items: initialFavourites,
  loading: false,
};

const initialUploadQueue: DocumentUploadQueueViewModel = {
  label: 'Add patient documents',
  acceptDescription: 'PDF, JPEG and PNG files are accepted by the host workflow.',
  multiple: true,
  candidates: [
    {
      id: 'doc-candidate-1',
      fileName: 'discharge-summary.pdf',
      sizeLabel: '224 KB',
      mediaTypeLabel: 'PDF',
      sourceToken: 'synthetic-source-1',
      status: 'complete',
      statusLabel: 'Ready for review',
      progress: 100,
    },
    {
      id: 'doc-candidate-2',
      fileName: 'fundus-photo.jpg',
      sizeLabel: '1.2 MB',
      mediaTypeLabel: 'JPEG',
      sourceToken: 'synthetic-source-2',
      status: 'processing',
      statusLabel: 'Processing',
      progress: 64,
    },
    {
      id: 'doc-candidate-3',
      fileName: 'corrupted-scan.pdf',
      sizeLabel: '88 KB',
      mediaTypeLabel: 'PDF',
      sourceToken: 'synthetic-source-3',
      status: 'error',
      statusLabel: 'Failed',
      error: 'Checksum verification failed.',
    },
  ],
};

const initialDocuments: PatientDocumentsViewModel = {
  instanceId: 'patient-documents-gallery',
  label: 'Patient documents',
  query: '',
  page: 1,
  pageSize: 20,
  total: 4,
  categoryOptions: [
    { value: 'clinical', label: 'Clinical' },
    { value: 'administrative', label: 'Administrative' },
  ],
  folderOptions: [
    { value: 'encounter-aug-2026', label: 'August 2026 encounter' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
  ],
  documents: [
    {
      id: 'pd-1',
      title: 'Discharge summary',
      categoryId: 'clinical',
      categoryLabel: 'Clinical',
      folderId: 'encounter-aug-2026',
      folderLabel: 'August 2026 encounter',
      fileName: 'discharge-summary.pdf',
      mediaTypeLabel: 'PDF',
      sizeLabel: '224 KB',
      createdAt: '2026-08-19T09:00:00Z',
      createdAtLabel: '19 Aug 2026',
      authorLabel: 'Synthetic care team',
      canPreview: true,
      canDownload: true,
      canDelete: true,
      previewKind: 'pdf',
      tags: ['Encounter'],
    },
    {
      id: 'pd-2',
      title: 'Consent form',
      categoryId: 'administrative',
      categoryLabel: 'Administrative',
      folderId: 'encounter-aug-2026',
      folderLabel: 'August 2026 encounter',
      fileName: 'consent.pdf',
      mediaTypeLabel: 'PDF',
      sizeLabel: '92 KB',
      createdAt: '2026-08-18T09:00:00Z',
      createdAtLabel: '18 Aug 2026',
      canPreview: true,
      canDownload: true,
      previewKind: 'pdf',
    },
    {
      id: 'pd-3',
      title: 'External eye photograph',
      categoryId: 'clinical',
      categoryLabel: 'Clinical',
      folderId: 'ophthalmology',
      folderLabel: 'Ophthalmology',
      fileName: 'external-eye.jpg',
      mediaTypeLabel: 'JPEG',
      sizeLabel: '1.1 MB',
      createdAt: '2026-08-18T12:00:00Z',
      createdAtLabel: '18 Aug 2026',
      canPreview: true,
      canDownload: true,
      previewKind: 'image',
    },
    {
      id: 'pd-4',
      title: 'Referral letter',
      categoryId: 'clinical',
      categoryLabel: 'Clinical',
      folderId: 'ophthalmology',
      folderLabel: 'Ophthalmology',
      fileName: 'referral-letter.pdf',
      mediaTypeLabel: 'PDF',
      sizeLabel: '140 KB',
      createdAt: '2026-08-17T12:00:00Z',
      createdAtLabel: '17 Aug 2026',
      canPreview: false,
      canDownload: true,
      previewKind: 'pdf',
      status: { label: 'Preview restricted', tone: 'warning' },
    },
  ],
};

const rasterUrl = (label: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#f8fafc"/><rect x="80" y="80" width="1040" height="640" rx="18" fill="#fff" stroke="#cbd5e1" stroke-width="4"/><text x="120" y="190" fill="#334155" font-family="system-ui,sans-serif" font-size="38" font-weight="700">${label}</text><text x="120" y="250" fill="#64748b" font-family="system-ui,sans-serif" font-size="24">Synthetic document preview · controller-supplied raster</text><path d="M120 330h900M120 400h760M120 470h860M120 540h620" stroke="#cbd5e1" stroke-width="18" stroke-linecap="round"/></svg>`,
  )}`;

const previewManifest = (documentId: string, kind: 'image' | 'pdf', pageCount = kind === 'pdf' ? 3 : 1): DocumentPreviewManifest => ({
  documentId,
  title: documentId === 'pd-3' ? 'External eye photograph' : 'Discharge summary',
  fileName: documentId === 'pd-3' ? 'external-eye.jpg' : 'discharge-summary.pdf',
  categoryLabel: 'Clinical',
  folderLabel: documentId === 'pd-3' ? 'Ophthalmology' : 'August 2026 encounter',
  createdAtLabel: '19 Aug 2026',
  kind,
  pageCount,
});

const previewPage = (documentId: string, pageIndex: number, kind: 'image' | 'pdf'): DocumentPreviewPage => ({
  assetId: `${documentId}-asset-${pageIndex}`,
  documentId,
  pageIndex,
  pageLabel: kind === 'pdf' ? `Page ${pageIndex + 1}` : 'Image',
  rasterUrl: rasterUrl(
    `${documentId === 'pd-3' ? 'External eye photograph' : 'Discharge summary'}${kind === 'pdf' ? ` · page ${pageIndex + 1}` : ''}`,
  ),
  altText: `Synthetic preview of ${documentId}, ${kind === 'pdf' ? `page ${pageIndex + 1}` : 'image'}`,
});

function toggleNode(nodes: readonly HierarchyNode[], nodeId: string, expanded: boolean): readonly HierarchyNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) return { ...node, expanded };
    if (node.children) return { ...node, children: toggleNode(node.children, nodeId, expanded) };
    return node;
  });
}

function findNode(nodes: readonly HierarchyNode[], nodeId: string): HierarchyNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children) {
      const found = findNode(node.children, nodeId);
      if (found) return found;
    }
  }
  return undefined;
}

// ---- Interactive demo wrappers ----

function OrderDetailsDemo() {
  const [order, setOrder] = useState<SelectedOrder>(initialRadiologyOrder);
  const onIntent = (intent: OrderDetailsIntent) => {
    if (intent.type === 'detailChangeRequested') {
      setOrder(current => ({
        ...current,
        details: { ...current.details, [intent.field]: intent.value },
      }));
    }
  };
  return <EmrOrderDetails model={order} onIntent={onIntent} />;
}

function HierarchyOrderPickerDemo() {
  const [state, setState] = useState<HierarchyOrderViewModel>(initialLabOrderState);
  const onIntent = (intent: HierarchyOrderIntent) => {
    switch (intent.type) {
      case 'queryChanged':
        setState(s => ({ ...s, query: intent.query }));
        break;
      case 'nodeExpansionRequested':
        setState(s => ({ ...s, roots: toggleNode(s.roots, intent.nodeId, intent.expanded) }));
        break;
      case 'itemAddRequested': {
        const node = findNode(state.roots, intent.nodeId);
        if (node && !state.selected.some(o => o.catalogueId === node.id)) {
          setState(s => ({
            ...s,
            selected: [
              ...s.selected,
              {
                id: `order-${node.id}`,
                catalogueId: node.id,
                label: node.label,
                code: node.code,
                kind: 'laboratory',
                details: { urgency: 'routine', fasting: false, notes: '' },
              },
            ],
          }));
        }
        break;
      }
      case 'groupPreviewRequested': {
        const group = findNode(state.roots, intent.nodeId);
        if (group && group.children) {
          const items = group.children.map(c => ({ catalogueId: c.id, label: c.label, code: c.code }));
          const duplicateIds = items.filter(i => state.selected.some(o => o.catalogueId === i.catalogueId)).map(i => i.catalogueId);
          setState(s => ({
            ...s,
            preview: { groupId: group.id, groupLabel: group.label, items, duplicateIds },
          }));
        }
        break;
      }
      case 'groupPreviewDismissed':
        setState(s => ({ ...s, preview: undefined }));
        break;
      case 'groupAddConfirmed':
        setState(s => {
          if (!s.preview) return s;
          const existing = new Set(s.selected.map(o => o.catalogueId));
          const added: SelectedOrder[] = s.preview.items
            .filter(i => !existing.has(i.catalogueId))
            .map(i => ({
              id: `order-${i.catalogueId}`,
              catalogueId: i.catalogueId,
              label: i.label,
              code: i.code,
              kind: 'laboratory',
              details: { urgency: 'routine', fasting: false, notes: '' },
            }));
          return { ...s, selected: [...s.selected, ...added], preview: undefined };
        });
        break;
      case 'orderRemoveRequested':
        setState(s => ({ ...s, selected: s.selected.filter(o => o.id !== intent.orderId) }));
        break;
      case 'orderDetailChanged':
        setState(s => ({
          ...s,
          selected: s.selected.map(o =>
            o.id === intent.orderId ? { ...o, details: { ...o.details, [intent.field]: intent.value } } : o,
          ),
        }));
        break;
    }
  };
  return <EmrHierarchyOrderPicker model={state} onIntent={onIntent} />;
}

function FavouritesPanelDemo() {
  const [state, setState] = useState<FavouritesViewModel>(initialFavouritesState);
  const onIntent = (intent: FavouritesIntent) => {
    switch (intent.type) {
      case 'tabChanged':
        setState(s => ({ ...s, activeKind: intent.kind, mode: 'list' }));
        break;
      case 'queryChanged':
        setState(s => ({ ...s, query: intent.query }));
        break;
      case 'createRequested':
        setState(s => ({
          ...s,
          mode: 'editor',
          editor: {
            id: `fav-${s.items.length + 1}`,
            name: '',
            kind: intent.kind,
            orderTemplates: [],
            updatedAt: '2026-08-19',
          },
        }));
        break;
      case 'editRequested': {
        const found = state.items.find(i => i.id === intent.id);
        if (found) setState(s => ({ ...s, mode: 'editor', editor: { ...found } }));
        break;
      }
      case 'editorNameChanged':
        setState(s => (s.editor ? { ...s, editor: { ...s.editor, name: intent.name }, error: undefined } : s));
        break;
      case 'editorOrdersChanged':
        setState(s => (s.editor ? { ...s, editor: { ...s.editor, orderTemplates: intent.orders } } : s));
        break;
      case 'saveRequested':
        setState(s => {
          if (!s.editor || !s.editor.name.trim()) return { ...s, error: 'A favourite name is required.' };
          const exists = s.items.some(i => i.id === s.editor!.id);
          const nextItems = exists
            ? s.items.map(i => (i.id === s.editor!.id ? s.editor! : i))
            : [...s.items, s.editor];
          return { ...s, items: nextItems, mode: 'list', editor: undefined, error: undefined };
        });
        break;
      case 'deleteRequested':
        setState(s => ({ ...s, items: s.items.filter(i => i.id !== intent.id) }));
        break;
      case 'moveRequested':
        setState(s => {
          const idx = s.items.findIndex(i => i.id === intent.id);
          const target = intent.direction === 'up' ? idx - 1 : idx + 1;
          if (idx < 0 || target < 0 || target >= s.items.length) return s;
          const copy = [...s.items];
          const [moved] = copy.splice(idx, 1);
          copy.splice(target, 0, moved);
          return { ...s, items: copy };
        });
        break;
      case 'applyRequested':
        setState(s => ({
          ...s,
          mode: 'apply-result',
          applyIssues: [
            {
              catalogueId: 'lab-hba1c',
              label: 'Glycated haemoglobin',
              reason: 'unavailable',
              detail: 'No current catalogue match',
            },
          ],
        }));
        break;
      case 'backRequested':
        setState(s => ({ ...s, mode: 'list', editor: undefined, applyIssues: undefined, error: undefined }));
        break;
    }
  };
  return <EmrFavouritesPanel model={state} onIntent={onIntent} />;
}

function RightFlyoutDemo() {
  const [open, setOpen] = useState(false);
  const [favState, setFavState] = useState<FavouritesViewModel>(initialFavouritesState);
  return (
    <View style={{ alignItems: 'flex-start', gap: 8 }}>
      <EmrButton label="Open favourites flyout" onPress={() => setOpen(true)} />
      <EmrRightFlyout
        open={open}
        title="My favourites"
        onIntent={intent => {
          if (intent.type === 'closeRequested') setOpen(false);
        }}
      >
        <EmrFavouritesPanel
          model={favState}
          onIntent={intent => {
            if (intent.type === 'tabChanged') setFavState(s => ({ ...s, activeKind: intent.kind }));
            else if (intent.type === 'queryChanged') setFavState(s => ({ ...s, query: intent.query }));
          }}
        />
      </EmrRightFlyout>
    </View>
  );
}

function DocumentUploadQueueDemo() {
  const [state, setState] = useState<DocumentUploadQueueViewModel>(initialUploadQueue);
  const onIntent = (intent: DocumentUploadIntent) => {
    if (intent.type === 'filesSelected') {
      const additions = intent.files.map((f, idx) => ({
        id: `picked-${state.candidates.length + idx + 1}`,
        fileName: f.fileName,
        sizeLabel: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        mediaTypeLabel: f.mediaType || 'PDF',
        sourceToken: f.sourceToken,
        status: 'ready' as const,
        statusLabel: 'Ready',
      }));
      setState(s => ({ ...s, candidates: [...s.candidates, ...additions] }));
    } else if (intent.type === 'candidateRemoveRequested' || intent.type === 'candidateCancelRequested') {
      setState(s => ({ ...s, candidates: s.candidates.filter(c => c.id !== intent.candidateId) }));
    } else if (intent.type === 'candidateRetryRequested') {
      setState(s => ({
        ...s,
        candidates: s.candidates.map(c =>
          c.id === intent.candidateId ? { ...c, status: 'ready', statusLabel: 'Ready', error: undefined } : c,
        ),
      }));
    }
  };
  return <EmrDocumentUploadQueue model={state} onIntent={onIntent} />;
}

function PatientDocumentsAndViewerDemo() {
  const [docsState, setDocsState] = useState<PatientDocumentsViewModel>(initialDocuments);
  const [viewerState, setViewerState] = useState<DocumentViewerViewModel>({
    instanceId: 'gallery-doc-viewer',
    open: false,
    documentIndex: 0,
    documentCount: 2,
    pageIndex: 0,
    loading: false,
    canPreviousDocument: false,
    canNextDocument: true,
    canPreviousPage: false,
    canNextPage: true,
  });

  const openDocument = (docId: string, pageIndex = 0) => {
    const kind = docId === 'pd-3' ? 'image' : 'pdf';
    const manifest = previewManifest(docId, kind, kind === 'pdf' ? 3 : 1);
    const docIdx = docId === 'pd-3' ? 1 : 0;
    setViewerState({
      instanceId: 'gallery-doc-viewer',
      open: true,
      currentDocument: manifest,
      documentIndex: docIdx,
      documentCount: 2,
      pageIndex,
      page: previewPage(docId, pageIndex, kind),
      loading: false,
      canPreviousDocument: docIdx > 0,
      canNextDocument: docIdx < 1,
      canPreviousPage: pageIndex > 0,
      canNextPage: pageIndex < manifest.pageCount - 1,
    });
  };

  const onDocsIntent = (intent: PatientDocumentsIntent) => {
    switch (intent.type) {
      case 'queryChanged':
        setDocsState(s => ({ ...s, query: intent.query }));
        break;
      case 'categoryChanged':
        setDocsState(s => ({ ...s, category: intent.category }));
        break;
      case 'folderChanged':
        setDocsState(s => ({ ...s, folder: intent.folder }));
        break;
      case 'sortChanged':
        setDocsState(s => ({ ...s, sort: { field: intent.field, direction: intent.direction } }));
        break;
      case 'documentSelected':
        setDocsState(s => ({ ...s, selectedDocumentId: intent.documentId }));
        break;
      case 'previewRequested':
        setDocsState(s => ({ ...s, selectedDocumentId: intent.documentId }));
        openDocument(intent.documentId, 0);
        break;
      case 'deleteRequested':
        setDocsState(s => {
          const next = s.documents.filter(d => d.id !== intent.documentId);
          return { ...s, documents: next, total: next.length };
        });
        break;
    }
  };

  const onViewerIntent = (intent: DocumentViewerIntent) => {
    if (intent.type === 'closeRequested') {
      setViewerState(s => ({ ...s, open: false }));
    } else if (intent.type === 'previousDocumentRequested') {
      openDocument('pd-1', 0);
    } else if (intent.type === 'nextDocumentRequested') {
      openDocument('pd-3', 0);
    } else if (intent.type === 'previousPageRequested') {
      const docId = viewerState.currentDocument?.documentId ?? 'pd-1';
      openDocument(docId, Math.max(0, viewerState.pageIndex - 1));
    } else if (intent.type === 'nextPageRequested') {
      const docId = viewerState.currentDocument?.documentId ?? 'pd-1';
      openDocument(docId, viewerState.pageIndex + 1);
    } else if (intent.type === 'pageRequested') {
      const docId = viewerState.currentDocument?.documentId ?? 'pd-1';
      openDocument(docId, intent.pageIndex);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <EmrPatientDocuments model={docsState} onIntent={onDocsIntent} />
      <EmrDocumentViewer model={viewerState} onIntent={onViewerIntent} />
    </View>
  );
}

function DocumentViewerInlineDemo() {
  const [viewerState, setViewerState] = useState<DocumentViewerViewModel>({
    instanceId: 'gallery-inline-viewer',
    open: true,
    currentDocument: previewManifest('pd-1', 'pdf', 3),
    documentIndex: 0,
    documentCount: 2,
    pageIndex: 0,
    page: previewPage('pd-1', 0, 'pdf'),
    loading: false,
    canPreviousDocument: false,
    canNextDocument: true,
    canPreviousPage: false,
    canNextPage: true,
  });

  const updatePage = (docId: string, pageIndex: number) => {
    const kind = docId === 'pd-3' ? 'image' : 'pdf';
    const manifest = previewManifest(docId, kind, kind === 'pdf' ? 3 : 1);
    const docIdx = docId === 'pd-3' ? 1 : 0;
    setViewerState({
      instanceId: 'gallery-inline-viewer',
      open: true,
      currentDocument: manifest,
      documentIndex: docIdx,
      documentCount: 2,
      pageIndex,
      page: previewPage(docId, pageIndex, kind),
      loading: false,
      canPreviousDocument: docIdx > 0,
      canNextDocument: docIdx < 1,
      canPreviousPage: pageIndex > 0,
      canNextPage: pageIndex < manifest.pageCount - 1,
    });
  };

  return (
    <View style={{ gap: 8 }}>
      {!viewerState.open ? (
        <View style={{ alignItems: 'flex-start' }}>
          <EmrButton label="Reopen document viewer" onPress={() => updatePage('pd-1', 0)} />
        </View>
      ) : null}
      <EmrDocumentViewer
        inline
        model={viewerState}
        onIntent={intent => {
          if (intent.type === 'closeRequested') setViewerState(s => ({ ...s, open: false }));
          else if (intent.type === 'previousDocumentRequested') updatePage('pd-1', 0);
          else if (intent.type === 'nextDocumentRequested') updatePage('pd-3', 0);
          else if (intent.type === 'previousPageRequested')
            updatePage(viewerState.currentDocument?.documentId ?? 'pd-1', Math.max(0, viewerState.pageIndex - 1));
          else if (intent.type === 'nextPageRequested')
            updatePage(viewerState.currentDocument?.documentId ?? 'pd-1', viewerState.pageIndex + 1);
          else if (intent.type === 'pageRequested')
            updatePage(viewerState.currentDocument?.documentId ?? 'pd-1', intent.pageIndex);
        }}
      />
    </View>
  );
}

export const gallery: GallerySection[] = [
  {
    id: 'order-details',
    title: 'EmrOrderDetails — radiology order details',
    render: () => <OrderDetailsDemo />,
  },
  {
    id: 'hierarchy-order-picker',
    title: 'EmrHierarchyOrderPicker — laboratory catalogue & selected orders',
    render: () => <HierarchyOrderPickerDemo />,
  },
  {
    id: 'favourites-panel',
    title: 'EmrFavouritesPanel — list, editor & apply result',
    render: () => <FavouritesPanelDemo />,
  },
  {
    id: 'right-flyout-favourites',
    title: 'EmrRightFlyout — favourites panel in slide-over flyout',
    render: () => <RightFlyoutDemo />,
  },
  {
    id: 'document-upload-queue',
    title: 'EmrDocumentUploadQueue — document intake candidates',
    render: () => <DocumentUploadQueueDemo />,
  },
  {
    id: 'patient-documents',
    title: 'EmrPatientDocuments — searchable library & preview modal',
    render: () => <PatientDocumentsAndViewerDemo />,
  },
  {
    id: 'document-viewer',
    title: 'EmrDocumentViewer — PDF raster carousel with zoom & rotate',
    render: () => <DocumentViewerInlineDemo />,
  },
];
