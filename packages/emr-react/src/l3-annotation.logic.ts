import type {
  AnnotationLayerRecord,
  AnnotationListItem,
  AnnotationListViewModel,
  AnnotationToolbarViewModel,
  ImageTemplateGroup,
  ImageTemplateOption,
  ImageTemplatePickerViewModel,
  ToolbarTool,
} from '@drguptavivek/emr-controller';

/** Reserved group id: "only my favourites", in `favouriteIds` order. */
export const FAVOURITES_GROUP_ID = 'favourites';

/** Pure helper matching `@drguptavivek/emr-controller`'s `filterImageTemplates`. */
export function filterImageTemplates(
  options: readonly ImageTemplateOption[],
  query: string,
  groupId?: string | null,
  groups: readonly ImageTemplateGroup[] = [],
  favouriteIds: readonly string[] = [],
): readonly ImageTemplateOption[] {
  const needle = query.trim().toLowerCase();
  const groupLabel = (id?: string) => groups.find(g => g.id === id)?.label ?? '';
  const matches = (o: ImageTemplateOption) =>
    !needle || [o.label, ...(o.badges ?? []), groupLabel(o.groupId)].some(text => text.toLowerCase().includes(needle));

  if (groupId === FAVOURITES_GROUP_ID) {
    return favouriteIds.flatMap(id => options.filter(o => o.id === id && matches(o)));
  }
  return options.filter(o => (!groupId || o.groupId === groupId) && matches(o));
}

/** Breakpoint below which repeatable group 12-column grids stack into a single column. */
export const REPEATABLE_STACK_BELOW = 720;

export function isRepeatableStacked(width: number): boolean {
  return width > 0 && width < REPEATABLE_STACK_BELOW;
}

export function repeatableFieldSpanPercent(span: number | undefined, stacked: boolean): `${number}%` {
  if (stacked) return '100%';
  const cols = Math.min(12, Math.max(1, span ?? 6));
  return `${(cols / 12) * 100}%` as `${number}%`;
}

export function repeatableControlId(groupId: string, itemId: string, fieldId: string, idPrefix = ''): string {
  const base = `${groupId}-${itemId}-${fieldId}`;
  return idPrefix ? `${idPrefix}-${base}` : base;
}

export function repeatableFocusFieldId(groupId: string, itemId: string, fieldId: string): string {
  return `${groupId}.${itemId}.${fieldId}`;
}

// ---------------------------------------------------------------------------
// Annotation toolbar helpers
// ---------------------------------------------------------------------------

/** Known heroicon and geometric `shape-*` tool icons mapped to crisp cross-platform glyphs. */
const TOOL_ICON_GLYPHS: Readonly<Record<string, string>> = {
  // Geometric shape-* glyphs
  'shape-line': '╱',
  'shape-arrow': '↗',
  'shape-curve': '∿',
  'shape-rect': '▭',
  'shape-ellipse': '◯',
  'shape-polygon': '⬠',
  'shape-freehand': '✎',
  'shape-text': 'T',
  'shape-eraser': '⌫',
  'shape-callout': '💬',
  'shape-suture': '╪',
  'shape-hatch': '▤',
  'shape-lattice': '⌗',
  // Heroicon names registered in EmrAnnotationToolbarComponent
  heroCursorArrowRays: '↖',
  heroArrowsPointingOut: '✥',
  heroHandRaised: '✋',
  heroBackspace: '⌫',
  heroPencil: '✎',
  heroPencilSquare: '✎',
  heroMinus: '╱',
  heroArrowLongRight: '→',
  heroArrowTrendingUp: '∿',
  heroSquare2Stack: '▭',
  heroStop: '▭',
  heroCircleStack: '◯',
  heroBars3BottomLeft: 'T',
};

export function isKnownToolIcon(icon: string): boolean {
  return Object.prototype.hasOwnProperty.call(TOOL_ICON_GLYPHS, icon);
}

/** Returns the glyph for a known icon, or the first character of `label` as a fallback. */
export function toolbarToolGlyph(tool: Pick<ToolbarTool, 'icon' | 'label'>): string {
  return TOOL_ICON_GLYPHS[tool.icon] ?? tool.label.slice(0, 1);
}

export function toolbarToolTitle(tool: Pick<ToolbarTool, 'label' | 'shortcutLabel'>): string {
  return tool.shortcutLabel ? `${tool.label} (${tool.shortcutLabel})` : tool.label;
}

export function hasToolbarPen(model: Pick<AnnotationToolbarViewModel, 'colours' | 'widths'>): boolean {
  return model.colours.length > 0 || model.widths.length > 0;
}

export function toolbarPenLabel(
  model: Pick<AnnotationToolbarViewModel, 'colours' | 'selectedColourId' | 'widths' | 'selectedWidthId'>,
  fallback = 'Pen colour and width',
  prefix = 'Pen',
): string {
  const colour = model.colours.find(c => c.id === model.selectedColourId)?.label;
  const width = model.widths.find(w => w.id === model.selectedWidthId)?.label;
  const parts = [colour, width].filter((p): p is string => !!p);
  return parts.length ? `${prefix}: ${parts.join(', ')}` : fallback;
}

/** Ordered list of enabled button keys in the toolbar for roving tabindex navigation. */
export function toolbarEnabledKeys(model: AnnotationToolbarViewModel): string[] {
  const off = !!model.readOnly;
  return [
    ...model.tools.filter(t => !off && !t.disabled).map(t => `t:${t.id}`),
    ...(!off && hasToolbarPen(model) ? ['pen'] : []),
    ...(!off && model.canUndo ? ['undo'] : []),
    ...(!off && model.canRedo ? ['redo'] : []),
    ...(model.zoomLocked ? [] : ['zoomOut', 'zoomReset', 'zoomIn', 'zoomFit']),
    ...(!off && model.canSave ? ['save'] : []),
  ];
}

export function toolbarActiveTabStop(
  model: AnnotationToolbarViewModel,
  focusedKey?: string | null,
): string | undefined {
  const keys = toolbarEnabledKeys(model);
  if (focusedKey && keys.includes(focusedKey)) return focusedKey;
  const selectedKey = model.selectedToolId ? `t:${model.selectedToolId}` : '';
  return keys.includes(selectedKey) ? selectedKey : keys[0];
}

export function toolbarRovingNextKey(
  key: string,
  currentKey: string,
  enabledKeys: readonly string[],
): string | null {
  if (enabledKeys.length === 0) return null;
  const i = enabledKeys.indexOf(currentKey);
  if (i < 0) return null;
  if (key === 'Home') return enabledKeys[0];
  if (key === 'End') return enabledKeys[enabledKeys.length - 1];
  if (key === 'ArrowRight' || key === 'ArrowDown') return enabledKeys[(i + 1) % enabledKeys.length];
  if (key === 'ArrowLeft' || key === 'ArrowUp') return enabledKeys[(i - 1 + enabledKeys.length) % enabledKeys.length];
  return null;
}

// ---------------------------------------------------------------------------
// Annotation list helpers
// ---------------------------------------------------------------------------

const LAYER_TOOL_GLYPH_ID: Record<AnnotationLayerRecord['tool'], string> = {
  text: 'shape-text',
  line: 'shape-line',
  arrow: 'shape-arrow',
  callout: 'shape-callout',
  curve: 'shape-curve',
  circle: 'shape-ellipse',
  polygon: 'shape-polygon',
  freeform: 'shape-freehand',
};

const LAYER_TOOL_NAME: Record<AnnotationLayerRecord['tool'], string> = {
  text: 'Text',
  line: 'Line',
  arrow: 'Arrow',
  callout: 'Callout',
  curve: 'Curve',
  circle: 'Circle',
  polygon: 'Polygon',
  freeform: 'Freehand',
};

export function annotationLayerGlyphId(tool: AnnotationLayerRecord['tool']): string {
  return LAYER_TOOL_GLYPH_ID[tool];
}

export function annotationLayerGlyph(tool: AnnotationLayerRecord['tool']): string {
  return TOOL_ICON_GLYPHS[LAYER_TOOL_GLYPH_ID[tool]] ?? '✎';
}

export function annotationLayerToolName(tool: AnnotationLayerRecord['tool']): string {
  return LAYER_TOOL_NAME[tool];
}

/** Primary text for an annotation row: class label when present, else the layer's own label. */
export function annotationPrimaryLabel(item: AnnotationListItem): string {
  return item.classLabel || item.layer.label;
}

/** Secondary text shown after `·` only when the layer's own label adds information beyond `classLabel`. */
export function annotationSecondaryLabel(item: AnnotationListItem): string {
  return item.classLabel && item.layer.label && item.layer.label !== item.classLabel ? item.layer.label : '';
}

export function annotationFullSummary(item: AnnotationListItem): string {
  return [annotationPrimaryLabel(item), annotationSecondaryLabel(item), item.description]
    .filter(Boolean)
    .join(' · ');
}

export function annotationListTabStopId(
  model: Pick<AnnotationListViewModel, 'items' | 'selectedLayerId'>,
  focusedId?: string | null,
): string | undefined {
  const ids = model.items.map(i => i.layer.id);
  if (focusedId && ids.includes(focusedId)) return focusedId;
  if (model.selectedLayerId && ids.includes(model.selectedLayerId)) return model.selectedLayerId;
  return ids[0];
}

// ---------------------------------------------------------------------------
// Image template picker helpers
// ---------------------------------------------------------------------------

export interface PartitionedImageTemplates {
  readonly favs: readonly ImageTemplateOption[];
  readonly rest: readonly ImageTemplateOption[];
  readonly flat: readonly ImageTemplateOption[];
}

/**
 * Splits `model.options` into pinned favourites (preserving `model.favouriteIds` order)
 * followed by the remaining non-favourite options.
 */
export function partitionImageTemplates(
  model: Pick<ImageTemplatePickerViewModel, 'options' | 'favouriteIds'>,
): PartitionedImageTemplates {
  const byId = new Map(model.options.map(o => [o.id, o]));
  const favs = (model.favouriteIds ?? []).flatMap(id => {
    const option = byId.get(id);
    return option ? [option] : [];
  });
  const favSet = new Set(favs.map(o => o.id));
  const rest = model.options.filter(o => !favSet.has(o.id));
  return { favs, rest, flat: [...favs, ...rest] };
}

export function canEditTemplateFavourites(
  model: Pick<ImageTemplatePickerViewModel, 'canEditFavourites' | 'readOnly'>,
): boolean {
  return !!model.canEditFavourites && !model.readOnly;
}

export function showFavouritesFilterChip(
  model: Pick<ImageTemplatePickerViewModel, 'favouriteIds' | 'canEditFavourites' | 'readOnly'>,
): boolean {
  return !!(model.favouriteIds && model.favouriteIds.length > 0) || canEditTemplateFavourites(model);
}

export function showFavouritePinHint(
  model: Pick<ImageTemplatePickerViewModel, 'favouriteIds' | 'canEditFavourites' | 'readOnly'>,
): boolean {
  return canEditTemplateFavourites(model) && !(model.favouriteIds && model.favouriteIds.length > 0);
}

export function isTemplateFavourite(
  model: Pick<ImageTemplatePickerViewModel, 'favouriteIds'>,
  templateId: string,
): boolean {
  return !!model.favouriteIds?.includes(templateId);
}

export function templateTileLabel(option: Pick<ImageTemplateOption, 'label' | 'badges'>): string {
  return option.badges?.length ? `${option.label}, ${option.badges.join(', ')}` : option.label;
}

export function templateTabStopId(
  flat: readonly Pick<ImageTemplateOption, 'id'>[],
  selectedId?: string,
  focusedId?: string | null,
): string | undefined {
  const has = (id?: string | null) => (id && flat.some(o => o.id === id) ? id : undefined);
  return has(focusedId) ?? has(selectedId) ?? flat[0]?.id;
}

/** Grid keyboard navigation across the Favourites section (`favCount`) and the All templates section. */
export function templateGridNextIndex(
  key: string,
  currentIndex: number,
  totalCount: number,
  favCount: number,
  columns: number,
): number | null {
  if (totalCount <= 0 || currentIndex < 0 || currentIndex >= totalCount) return null;
  const cols = Math.max(1, columns);
  switch (key) {
    case 'ArrowRight':
      return Math.min(currentIndex + 1, totalCount - 1);
    case 'ArrowLeft':
      return Math.max(currentIndex - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return totalCount - 1;
    case 'ArrowDown':
      if (currentIndex < favCount) {
        if (currentIndex + cols < favCount) return currentIndex + cols;
        return favCount < totalCount ? favCount + Math.min(currentIndex % cols, totalCount - favCount - 1) : currentIndex;
      }
      return currentIndex + cols < totalCount ? currentIndex + cols : currentIndex;
    case 'ArrowUp':
      if (currentIndex >= favCount && currentIndex - cols < favCount) {
        return favCount > 0
          ? Math.min(Math.floor((favCount - 1) / cols) * cols + ((currentIndex - favCount) % cols), favCount - 1)
          : currentIndex;
      }
      return currentIndex - cols >= 0 ? currentIndex - cols : currentIndex;
    default:
      return null;
  }
}
