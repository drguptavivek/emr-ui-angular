import type { AnnotationLayerRecord } from './annotation.models.js';

/** One numbered row. Order, numbering, lock state and visibility are all supplied; the list holds none of them. */
export interface AnnotationListItem {
  readonly layer: AnnotationLayerRecord;
  readonly number: number;
  /** Controller-resolved classification text (for example a lesion class), not an id. */
  readonly classLabel?: string;
  readonly locked?: boolean;
  /** Shown on a second line and as the row tooltip. */
  readonly description?: string;
}

export interface AnnotationListViewModel {
  readonly items: readonly AnnotationListItem[];
  readonly selectedLayerId?: string;
  readonly emptyMessage: string;
  /** A plain legend: number, swatch, annotation and tool icon only. Every row action is hidden; selecting stays available. */
  readonly readOnly?: boolean;
  /** Shows the lock button. Default false: lock means nothing until marks can be moved. */
  readonly canLock?: boolean;
}

/** `layerRenameRequested` is part of the contract for the controller; this list has no rename control yet. */
export type AnnotationListIntent =
  | { readonly type: 'layerSelected'; readonly layerId: string }
  | { readonly type: 'layerVisibilityToggleRequested'; readonly layerId: string }
  | { readonly type: 'layerLockToggleRequested'; readonly layerId: string }
  | { readonly type: 'layerMoveRequested'; readonly layerId: string; readonly direction: 'up' | 'down' }
  | { readonly type: 'layerRemoveRequested'; readonly layerId: string }
  | { readonly type: 'layerRenameRequested'; readonly layerId: string; readonly label: string };
