/**
 * Generic gallery picker for choosing a background image (anatomy outlines, uploaded photos…).
 * No clinical meaning: the controller owns the catalogue, the filtering, the favourites and the selection.
 */

export interface ImageTemplateOption {
  readonly id: string;
  readonly label: string;
  readonly imageUrl: string;
  readonly width: number;
  readonly height: number;
  readonly altText?: string;
  readonly groupId?: string;
  /** Short display chips, for example `OD`, `Right`, `Anterior`. */
  readonly badges?: readonly string[];
}

export interface ImageTemplateGroup {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
}

/** Reserved group id: "only my favourites", in `favouriteIds` order. */
export const FAVOURITES_GROUP_ID = 'favourites';

export interface ImageTemplatePickerViewModel {
  readonly title: string;
  /** Already filtered by the controller (see `filterImageTemplates`). */
  readonly options: readonly ImageTemplateOption[];
  readonly groups: readonly ImageTemplateGroup[];
  /** `undefined` = All; `'favourites'` = favourites only. */
  readonly selectedGroupId?: string;
  readonly query: string;
  readonly selectedId?: string;
  /** For example "12 of 105 outlines". */
  readonly totalLabel?: string;
  readonly emptyMessage: string;
  readonly readOnly?: boolean;
  /** Per user or specialty; order matters. Favourites present in `options` render first, in this order. */
  readonly favouriteIds?: readonly string[];
  readonly canEditFavourites?: boolean;
}

export type ImageTemplatePickerIntent =
  | { readonly type: 'queryChangeRequested'; readonly query: string }
  | { readonly type: 'groupSelected'; readonly groupId: string | null }
  | { readonly type: 'templateSelected'; readonly templateId: string }
  | { readonly type: 'favouriteToggleRequested'; readonly templateId: string; readonly favourite: boolean }
  | { readonly type: 'closeRequested' };

/**
 * Pure helper so hosts do not reimplement filtering. The query matches case-insensitively on label,
 * badges and group label. `groupId` narrows to one group; the reserved `'favourites'` id keeps only
 * `favouriteIds`, in that order.
 */
export function filterImageTemplates(
  options: readonly ImageTemplateOption[],
  query: string,
  groupId?: string | null,
  groups: readonly ImageTemplateGroup[] = [],
  favouriteIds: readonly string[] = [],
): readonly ImageTemplateOption[] {
  const needle = query.trim().toLowerCase();
  const groupLabel = (id?: string) => groups.find((g) => g.id === id)?.label ?? '';
  const matches = (o: ImageTemplateOption) =>
    !needle || [o.label, ...(o.badges ?? []), groupLabel(o.groupId)].some((text) => text.toLowerCase().includes(needle));

  if (groupId === FAVOURITES_GROUP_ID) {
    return favouriteIds.flatMap((id) => options.filter((o) => o.id === id && matches(o)));
  }
  return options.filter((o) => (!groupId || o.groupId === groupId) && matches(o));
}
