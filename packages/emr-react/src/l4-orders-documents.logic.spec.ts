import { describe, expect, it } from 'vitest';
import type { DocumentCandidate, FavouriteEntry, HierarchyNode, SelectedOrder } from '@drguptavivek/emr-controller';
import {
  clampViewerZoom,
  documentPaginationState,
  flattenVisibleHierarchyNodes,
  formatDocumentSortValue,
  isExistingFavourite,
  isOrderNodeSelected,
  orderBooleanDetail,
  orderErrorFor,
  orderStringDetail,
  parseDocumentSortValue,
  resolveDocumentRowAction,
  stepViewerRotation,
  stepViewerZoom,
  uploadQueueAnnouncement,
  viewerPageIndices,
  viewerZoomPercent,
  withoutEditorOrder,
} from './l4-orders-documents.logic';

const sampleOrder: SelectedOrder = {
  id: 'order-cbc',
  catalogueId: 'lab-cbc',
  label: 'Complete blood count',
  code: 'CBC',
  kind: 'laboratory',
  details: { urgency: 'routine', fasting: true, notes: 'Baseline check' },
  errors: { notes: 'Clinical note required' },
};

describe('l4-orders-documents.logic', () => {
  describe('order detail accessors', () => {
    it('extracts string, boolean, and error fields from a SelectedOrder', () => {
      expect(orderStringDetail(sampleOrder, 'urgency')).toBe('routine');
      expect(orderStringDetail(sampleOrder, 'fasting')).toBeNull();
      expect(orderStringDetail(sampleOrder, 'missing')).toBeNull();
      expect(orderBooleanDetail(sampleOrder, 'fasting')).toBe(true);
      expect(orderBooleanDetail(sampleOrder, 'urgency')).toBe(false);
      expect(orderBooleanDetail(sampleOrder, 'missing')).toBe(false);
      expect(orderErrorFor(sampleOrder, 'notes')).toBe('Clinical note required');
      expect(orderErrorFor(sampleOrder, 'urgency')).toBeUndefined();
    });
  });

  describe('hierarchy order helpers', () => {
    const roots: readonly HierarchyNode[] = [
      {
        id: 'lab-haem',
        label: 'Haematology',
        kind: 'group',
        selectable: false,
        expanded: true,
        children: [
          { id: 'lab-cbc', label: 'Complete blood count', code: 'CBC', kind: 'item', selectable: true },
          { id: 'lab-esr', label: 'ESR', code: 'ESR', kind: 'item', selectable: true },
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
        ],
      },
    ];

    it('detects whether a catalogue node is already selected', () => {
      expect(isOrderNodeSelected([sampleOrder], 'lab-cbc')).toBe(true);
      expect(isOrderNodeSelected([sampleOrder], 'lab-esr')).toBe(false);
    });

    it('flattens only expanded hierarchy branches with depth', () => {
      const flat = flattenVisibleHierarchyNodes(roots);
      expect(flat.map(entry => ({ id: entry.node.id, depth: entry.depth }))).toEqual([
        { id: 'lab-haem', depth: 0 },
        { id: 'lab-cbc', depth: 1 },
        { id: 'lab-esr', depth: 1 },
        { id: 'lab-chem', depth: 0 },
      ]);
    });
  });

  describe('favourites helpers', () => {
    const items: readonly FavouriteEntry[] = [
      {
        id: 'fav-1',
        name: 'Diabetes follow-up',
        kind: 'combination',
        updatedAt: '2026-08-19',
        orderTemplates: [sampleOrder],
      },
    ];

    it('checks whether an editor item is an existing saved favourite', () => {
      expect(isExistingFavourite(items, 'fav-1')).toBe(true);
      expect(isExistingFavourite(items, 'fav-new')).toBe(false);
      expect(isExistingFavourite(items, undefined)).toBe(false);
    });

    it('removes an order template by id without mutating input', () => {
      const second: SelectedOrder = { ...sampleOrder, id: 'order-esr', catalogueId: 'lab-esr', label: 'ESR' };
      const next = withoutEditorOrder([sampleOrder, second], 'order-cbc');
      expect(next).toEqual([second]);
    });
  });

  describe('document upload queue helpers', () => {
    it('announces the latest candidate status or empty string when empty', () => {
      expect(uploadQueueAnnouncement([])).toBe('');
      const candidates: readonly DocumentCandidate[] = [
        {
          id: 'c1',
          fileName: 'discharge-summary.pdf',
          sizeLabel: '224 KB',
          mediaTypeLabel: 'PDF',
          sourceToken: 'tok-1',
          status: 'complete',
          statusLabel: 'Ready for review',
        },
        {
          id: 'c2',
          fileName: 'fundus-photo.jpg',
          sizeLabel: '1.2 MB',
          mediaTypeLabel: 'JPEG',
          sourceToken: 'tok-2',
          status: 'processing',
          statusLabel: 'Processing',
        },
      ];
      expect(uploadQueueAnnouncement(candidates)).toBe('fundus-photo.jpg: Processing');
    });
  });

  describe('patient documents helpers', () => {
    it('formats and parses sort values', () => {
      expect(formatDocumentSortValue(undefined)).toBe('createdAt:desc');
      expect(formatDocumentSortValue({ field: 'title', direction: 'asc' })).toBe('title:asc');
      expect(parseDocumentSortValue('folder:asc')).toEqual({ field: 'folder', direction: 'asc' });
      expect(parseDocumentSortValue('createdAt:desc')).toEqual({ field: 'createdAt', direction: 'desc' });
      expect(parseDocumentSortValue('unknown:asc')).toBeNull();
      expect(parseDocumentSortValue(null)).toBeNull();
    });

    it('computes pagination availability', () => {
      expect(documentPaginationState(1, 20, 4)).toEqual({ canPrevious: false, canNext: false });
      expect(documentPaginationState(1, 2, 4)).toEqual({ canPrevious: false, canNext: true });
      expect(documentPaginationState(2, 2, 4)).toEqual({ canPrevious: true, canNext: false });
    });

    it('routes row click to previewRequested when previewable, else documentSelected', () => {
      expect(resolveDocumentRowAction({ id: 'pd-1', canPreview: true })).toEqual({
        type: 'previewRequested',
        documentId: 'pd-1',
      });
      expect(resolveDocumentRowAction({ id: 'pd-4', canPreview: false })).toEqual({
        type: 'documentSelected',
        documentId: 'pd-4',
      });
    });
  });

  describe('document viewer helpers', () => {
    it('clamps and steps zoom and percentage', () => {
      expect(clampViewerZoom(0.1)).toBe(0.5);
      expect(clampViewerZoom(5)).toBe(4);
      expect(stepViewerZoom(1, 0.25)).toBe(1.25);
      expect(stepViewerZoom(0.5, -0.25)).toBe(0.5);
      expect(viewerZoomPercent(1.25)).toBe(125);
    });

    it('normalizes rotation steps into [0, 360)', () => {
      expect(stepViewerRotation(0, 90)).toBe(90);
      expect(stepViewerRotation(0, -90)).toBe(270);
      expect(stepViewerRotation(270, 90)).toBe(0);
    });

    it('builds zero-based page indices', () => {
      expect(viewerPageIndices(3)).toEqual([0, 1, 2]);
      expect(viewerPageIndices(0)).toEqual([]);
      expect(viewerPageIndices(undefined)).toEqual([]);
    });
  });
});
