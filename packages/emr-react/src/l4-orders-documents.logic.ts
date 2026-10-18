/** Pure helpers for L4 Orders, Favourites & Documents components (no React, no DOM, no runtime controller imports). */
import type {
  DocumentCandidate,
  FavouriteEntry,
  HierarchyNode,
  PatientDocumentRecord,
  PatientDocumentSortField,
  PatientDocumentsViewModel,
  SelectedOrder,
} from '@drguptavivek/emr-controller';

export const MIN_VIEWER_ZOOM = 0.5;
export const MAX_VIEWER_ZOOM = 4;
export const VIEWER_ZOOM_STEP = 0.25;

/** Reads a string detail field from a selected order, or null when absent/non-string. */
export function orderStringDetail(order: SelectedOrder, field: string): string | null {
  const value = order.details?.[field];
  return typeof value === 'string' ? value : null;
}

/** Reads a boolean detail field from a selected order (`true` only when strictly true). */
export function orderBooleanDetail(order: SelectedOrder, field: string): boolean {
  return order.details?.[field] === true;
}

/** Reads a validation error string for a field on a selected order, or undefined when empty. */
export function orderErrorFor(order: SelectedOrder, field: string): string | undefined {
  const err = order.errors?.[field];
  return err ? err : undefined;
}

/** Checks whether a catalogue node id is already present in the selected orders list. */
export function isOrderNodeSelected(selected: readonly SelectedOrder[], catalogueId: string): boolean {
  return selected.some(order => order.catalogueId === catalogueId);
}

export interface FlattenedHierarchyNode {
  readonly node: HierarchyNode;
  readonly depth: number;
}

/** Flattens visible tree nodes in pre-order traversal, descending only into expanded groups. */
export function flattenVisibleHierarchyNodes(
  roots: readonly HierarchyNode[],
  depth = 0,
): readonly FlattenedHierarchyNode[] {
  const result: FlattenedHierarchyNode[] = [];
  for (const node of roots) {
    result.push({ node, depth });
    if (node.expanded && node.children?.length) {
      result.push(...flattenVisibleHierarchyNodes(node.children, depth + 1));
    }
  }
  return result;
}

/** True when the active editor entry matches an existing saved favourite item. */
export function isExistingFavourite(items: readonly FavouriteEntry[], editorId: string | undefined): boolean {
  return Boolean(editorId && items.some(item => item.id === editorId));
}

/** Returns a new template array with the given order id removed. */
export function withoutEditorOrder(orders: readonly SelectedOrder[], orderId: string): readonly SelectedOrder[] {
  return orders.filter(order => order.id !== orderId);
}

/** Live-region announcement for the latest candidate in the document upload queue. */
export function uploadQueueAnnouncement(candidates: readonly DocumentCandidate[]): string {
  const latest = candidates[candidates.length - 1];
  return latest ? `${latest.fileName}: ${latest.statusLabel}` : '';
}

/** Formats the active sort state into a `<field>:<direction>` select value. */
export function formatDocumentSortValue(sort: PatientDocumentsViewModel['sort']): string {
  return `${sort?.field ?? 'createdAt'}:${sort?.direction ?? 'desc'}`;
}

/** Parses a `<field>:<direction>` select value into a typed sort payload, or null if invalid. */
export function parseDocumentSortValue(
  raw: string | null | undefined,
): { field: PatientDocumentSortField; direction: 'asc' | 'desc' } | null {
  if (!raw) return null;
  const [field, direction] = raw.split(':');
  if (field === 'createdAt' || field === 'title' || field === 'category' || field === 'folder') {
    return {
      field,
      direction: direction === 'asc' ? 'asc' : 'desc',
    };
  }
  return null;
}

/** Computes pagination button availability (1-based page). */
export function documentPaginationState(
  page: number,
  pageSize: number,
  total: number,
): { canPrevious: boolean; canNext: boolean } {
  return {
    canPrevious: page > 1,
    canNext: pageSize > 0 && page * pageSize < total,
  };
}

/** Resolves whether clicking a document row/title requests preview (when permitted) or selection. */
export function resolveDocumentRowAction(
  doc: Pick<PatientDocumentRecord, 'id' | 'canPreview'>,
): { type: 'previewRequested'; documentId: string } | { type: 'documentSelected'; documentId: string } {
  return doc.canPreview
    ? { type: 'previewRequested', documentId: doc.id }
    : { type: 'documentSelected', documentId: doc.id };
}

/** Clamps viewer zoom between 0.5x (50%) and 4x (400%). */
export function clampViewerZoom(zoom: number): number {
  return Math.min(MAX_VIEWER_ZOOM, Math.max(MIN_VIEWER_ZOOM, zoom));
}

/** Steps viewer zoom by `delta` (default ±0.25) within [0.5, 4]. */
export function stepViewerZoom(zoom: number, delta = VIEWER_ZOOM_STEP): number {
  return clampViewerZoom(zoom + delta);
}

/** Rotates viewer angle by `deltaDegrees`, normalized to [0, 360). */
export function stepViewerRotation(rotation: number, deltaDegrees: number): number {
  return ((rotation + deltaDegrees) % 360 + 360) % 360;
}

/** Converts zoom multiplier to integer percentage. */
export function viewerZoomPercent(zoom: number): number {
  return Math.round(zoom * 100);
}

/** Builds zero-based page index array for a document page count. */
export function viewerPageIndices(pageCount: number | undefined): readonly number[] {
  const count = Math.max(0, Math.trunc(pageCount ?? 0));
  return Array.from({ length: count }, (_, index) => index);
}
