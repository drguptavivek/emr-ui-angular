import type {
  AnnotationCalloutRecord,
  AnnotationCircleRecord,
  AnnotationFillPattern,
  AnnotationLayerRecord,
  AnnotationLineRecord,
  AnnotationListViewModel,
  AnnotationPathRecord,
  AnnotationPoint,
  AnnotationStrokeStyle,
  AnnotationSymbolPreset,
  AnnotationTextRecord,
  AnnotationTool,
  AnnotationToolbarViewModel,
  EmrAnnotationLabel,
  EmrAnnotationSelectedTool,
  EmrClinicalAnnotationCanvasState,
  EmrClinicalImageTemplate,
} from '@drguptavivek/emr-controller';

export interface EmrDrawingDraft {
  readonly tool: AnnotationTool;
  readonly points: readonly AnnotationPoint[];
}

/**
 * Numbered label in a gutter beside the image, joined to its mark by a leader.
 * Every coordinate (`lx`, `ly`, `sx`, `ax`, `ay`) is a percentage (0–100) of the figure box (gutters included).
 */
export interface EmrMarker {
  readonly id: string;
  readonly number: number;
  readonly lx: number;
  readonly ly: number;
  readonly sx: number;
  readonly ax: number;
  readonly ay: number;
}

/** Positioned rotated bar segment for rendering vector strokes with React Native `View` primitives. */
export interface ViewSegment {
  readonly key: string;
  readonly cx: number;
  readonly cy: number;
  readonly length: number;
  readonly angleRad: number;
  readonly thickness: number;
  readonly color: string;
  readonly dashed?: boolean;
}

export const CANVAS_GUTTER = 0.07;
export const MIN_STROKE_PX = 2;
export const MAX_HISTORY = 40;
export const FALLBACK_SURFACE = 1000;
export const CANVAS_ZOOM_STEPS = [50, 75, 100, 150, 200, 300] as const;

export const AVAILABLE_CANVAS_TOOLS: readonly EmrAnnotationSelectedTool[] = [
  'pan',
  'text',
  'line',
  'arrow',
  'callout',
  'curve',
  'circle',
  'polygon',
  'freeform',
];

export const CANVAS_TOOL_LABELS: Record<EmrAnnotationSelectedTool, string> = {
  pan: 'Pan',
  text: 'Text',
  line: 'Line',
  arrow: 'Arrow',
  callout: 'Callout',
  curve: 'Curve',
  circle: 'Circle',
  polygon: 'Polygon',
  freeform: 'Freehand',
};

export const CANVAS_TOOL_GLYPHS: Record<EmrAnnotationSelectedTool, string> = {
  pan: 'heroHandRaised',
  text: 'shape-text',
  line: 'shape-line',
  arrow: 'shape-arrow',
  callout: 'shape-callout',
  curve: 'shape-curve',
  circle: 'shape-ellipse',
  polygon: 'shape-polygon',
  freeform: 'shape-freehand',
};

export const TWO_POINT_TOOLS = new Set<AnnotationTool>(['line', 'arrow', 'callout', 'curve']);
export const FILLABLE_TOOLS = new Set<AnnotationTool>(['polygon', 'circle', 'freeform']);
export const UNTRACKED_REASONS = new Set(['layout-changed', 'marker-numbers-toggled']);

const HEAD_FRACTION = 0.03;
const TICK_SPEC = {
  sutured: { step: 0.018, half: 0.011 },
  stapled: { step: 0.032, half: 0.012 },
} as const;

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function clampBrushWidth(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 2;
  return Math.max(1, Math.min(12, Math.round(value)));
}

export function pointDistance(first: AnnotationPoint, second: AnnotationPoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function nextZoomStep(currentZoom: number, direction: 'in' | 'out'): number {
  if (direction === 'in') {
    return CANVAS_ZOOM_STEPS.find(step => step > currentZoom) ?? currentZoom;
  }
  return [...CANVAS_ZOOM_STEPS].reverse().find(step => step < currentZoom) ?? currentZoom;
}

export function cloneAnnotationLayer(layer: AnnotationLayerRecord): AnnotationLayerRecord {
  switch (layer.tool) {
    case 'text':
      return {
        ...layer,
        classIds: [...(layer.classIds ?? [])],
        point: { ...layer.point },
        text: layer.text,
        fontSize: layer.fontSize,
      };
    case 'line':
    case 'arrow':
    case 'callout':
      return {
        ...layer,
        classIds: [...(layer.classIds ?? [])],
        points: [{ ...layer.points[0] }, { ...layer.points[1] }],
      };
    case 'circle':
      return {
        ...layer,
        classIds: [...(layer.classIds ?? [])],
        center: { ...layer.center },
      };
    case 'curve':
    case 'polygon':
    case 'freeform':
      return {
        ...layer,
        classIds: [...(layer.classIds ?? [])],
        points: layer.points.map(point => ({ ...point })),
      };
  }
}

export function cloneCanvasState(raw: EmrClinicalAnnotationCanvasState): EmrClinicalAnnotationCanvasState {
  return {
    instanceId: raw.instanceId,
    title: raw.title,
    description: raw.description,
    imageTemplates: raw.imageTemplates?.map(template => ({ ...template })) ?? [],
    availableLabels: raw.availableLabels?.map(label => ({ ...label })) ?? [],
    selectedImageId: raw.selectedImageId,
    selectedLabelId: raw.selectedLabelId,
    selectedTool: raw.selectedTool,
    brushColor: raw.brushColor,
    brushWidth: raw.brushWidth,
    layers: raw.layers?.map(layer => cloneAnnotationLayer(layer)) ?? [],
    selectedLayerId: raw.selectedLayerId,
    textContent: raw.textContent,
    showLayerPanel: raw.showLayerPanel,
    readOnly: raw.readOnly,
    photoUploadHint: raw.photoUploadHint,
    photoAccept: raw.photoAccept,
    layout: raw.layout,
    showMarkerNumbers: raw.showMarkerNumbers,
    colourOptions: raw.colourOptions?.map(option => ({ ...option })),
    widthOptions: raw.widthOptions?.map(option => ({ ...option })),
    symbolPresets: raw.symbolPresets?.map(preset => ({ ...preset })),
    selectedSymbolId: raw.selectedSymbolId,
    brushStrokeStyle: raw.brushStrokeStyle,
    brushFillPattern: raw.brushFillPattern,
  };
}

export function normalizeCanvasState(raw: EmrClinicalAnnotationCanvasState): EmrClinicalAnnotationCanvasState {
  const imageTemplates = raw.imageTemplates ?? [];
  const availableLabels = raw.availableLabels ?? [];
  const availableLabelIds = availableLabels.map(l => l.id);
  const selectedImageId =
    raw.selectedImageId && imageTemplates.some(image => image.id === raw.selectedImageId)
      ? raw.selectedImageId
      : imageTemplates[0]?.id;
  const selectedLabelId =
    raw.selectedLabelId && availableLabels.some(label => label.id === raw.selectedLabelId)
      ? raw.selectedLabelId
      : availableLabels[0]?.id;
  const selectedSymbolId =
    raw.selectedSymbolId && raw.symbolPresets?.some(preset => preset.id === raw.selectedSymbolId)
      ? raw.selectedSymbolId
      : undefined;

  return {
    instanceId: raw.instanceId,
    title: raw.title ?? 'Clinical annotation card',
    description: raw.description,
    imageTemplates: imageTemplates.map(template => ({ ...template })),
    availableLabels: availableLabels.map(label => ({ ...label })),
    selectedImageId,
    selectedLabelId,
    selectedTool: raw.selectedTool ?? 'line',
    brushColor: raw.brushColor,
    brushWidth: clampBrushWidth(raw.brushWidth),
    layers: (raw.layers ?? []).map(layer => ({
      ...cloneAnnotationLayer(layer),
      classIds: (layer.classIds ?? []).filter(id => availableLabelIds.includes(id)),
    })),
    selectedLayerId: raw.selectedLayerId ?? undefined,
    textContent: raw.textContent ?? '',
    showLayerPanel: raw.showLayerPanel ?? true,
    readOnly: raw.readOnly,
    photoUploadHint: raw.photoUploadHint,
    photoAccept: raw.photoAccept,
    layout: raw.layout ?? 'compact',
    showMarkerNumbers: raw.showMarkerNumbers ?? true,
    colourOptions: raw.colourOptions?.map(option => ({ ...option })),
    widthOptions: raw.widthOptions?.map(option => ({ ...option })),
    symbolPresets: raw.symbolPresets?.map(preset => ({ ...preset })),
    selectedSymbolId,
    brushStrokeStyle: raw.brushStrokeStyle,
    brushFillPattern: raw.brushFillPattern,
  };
}

export function selectedCanvasImage(
  state: Pick<EmrClinicalAnnotationCanvasState, 'imageTemplates' | 'selectedImageId'>,
): EmrClinicalImageTemplate | undefined {
  return state.imageTemplates.find(image => image.id === state.selectedImageId);
}

export function canvasSurfaceSize(
  state: Pick<EmrClinicalAnnotationCanvasState, 'imageTemplates' | 'selectedImageId'>,
): { width: number; height: number; aspectRatio: number } {
  const image = selectedCanvasImage(state);
  const width = image?.width || FALLBACK_SURFACE;
  const height = image?.height || FALLBACK_SURFACE;
  return { width, height, aspectRatio: width / height };
}

export function findAnnotationLabel(
  state: Pick<EmrClinicalAnnotationCanvasState, 'availableLabels'>,
  labelId: string | undefined,
): EmrAnnotationLabel | undefined {
  if (!labelId) return undefined;
  return state.availableLabels.find(candidate => candidate.id === labelId);
}

export function defaultLayerLabel(state: EmrClinicalAnnotationCanvasState): string {
  const cls = findAnnotationLabel(state, state.selectedLabelId)?.label;
  const symbol = state.symbolPresets?.find(preset => preset.id === state.selectedSymbolId)?.label;
  return cls || symbol || 'Annotation';
}

export function nextLayerClassIds(state: EmrClinicalAnnotationCanvasState): string[] {
  return state.selectedLabelId && findAnnotationLabel(state, state.selectedLabelId)
    ? [state.selectedLabelId]
    : [];
}

export function layerAppearance(
  state: Pick<EmrClinicalAnnotationCanvasState, 'brushStrokeStyle' | 'brushFillPattern'>,
  tool: AnnotationTool,
): { strokeStyle?: AnnotationStrokeStyle; fillPattern?: AnnotationFillPattern } {
  const { brushStrokeStyle, brushFillPattern } = state;
  return {
    ...(brushStrokeStyle && tool !== 'text' ? { strokeStyle: brushStrokeStyle } : {}),
    ...(brushFillPattern && FILLABLE_TOOLS.has(tool) ? { fillPattern: brushFillPattern } : {}),
  };
}

export function nextUniqueLayerId(
  layers: readonly AnnotationLayerRecord[],
  counter = 0,
): { id: string; nextCounter: number } {
  const taken = new Set(layers.map(layer => layer.id));
  let nextCounter = counter + 1;
  let id = `annot-${nextCounter}`;
  while (taken.has(id)) {
    nextCounter += 1;
    id = `annot-${nextCounter}`;
  }
  return { id, nextCounter };
}

export function activateToolInState(
  state: EmrClinicalAnnotationCanvasState,
  tool: EmrAnnotationSelectedTool,
): EmrClinicalAnnotationCanvasState {
  const next = cloneCanvasState(state);
  if (tool !== next.selectedTool) {
    next.selectedSymbolId = undefined;
    next.brushStrokeStyle = undefined;
    next.brushFillPattern = undefined;
  }
  next.selectedTool = tool;
  return normalizeCanvasState(next);
}

export function applySymbolPresetToState(
  state: EmrClinicalAnnotationCanvasState,
  symbolId: string | null,
): EmrClinicalAnnotationCanvasState {
  const preset: AnnotationSymbolPreset | undefined = symbolId
    ? state.symbolPresets?.find(candidate => candidate.id === symbolId)
    : undefined;
  const next = cloneCanvasState(state);
  next.selectedSymbolId = preset?.id;
  next.brushStrokeStyle = preset?.strokeStyle;
  next.brushFillPattern = preset?.fillPattern;
  if (preset) {
    next.selectedTool = preset.tool;
    if (preset.colour) next.brushColor = preset.colour;
    if (preset.width) next.brushWidth = preset.width;
    if (preset.classId && findAnnotationLabel(state, preset.classId)) {
      next.selectedLabelId = preset.classId;
    }
  }
  return normalizeCanvasState(next);
}

export function toggleLayerVisibilityInState(
  state: EmrClinicalAnnotationCanvasState,
  layerId: string,
): EmrClinicalAnnotationCanvasState {
  const next = cloneCanvasState(state);
  const layer = next.layers.find(candidate => candidate.id === layerId);
  if (layer) layer.visible = !layer.visible;
  return normalizeCanvasState(next);
}

export function moveLayerInState(
  state: EmrClinicalAnnotationCanvasState,
  layerId: string,
  direction: -1 | 1,
): EmrClinicalAnnotationCanvasState {
  const next = cloneCanvasState(state);
  const sourceIndex = next.layers.findIndex(candidate => candidate.id === layerId);
  if (sourceIndex < 0) return next;
  const targetIndex = sourceIndex + direction;
  if (targetIndex < 0 || targetIndex >= next.layers.length) return next;
  const selected = next.layers[sourceIndex];
  const without = [...next.layers.slice(0, sourceIndex), ...next.layers.slice(sourceIndex + 1)];
  next.layers = [...without.slice(0, targetIndex), selected, ...without.slice(targetIndex)];
  return normalizeCanvasState(next);
}

export function removeLayerFromState(
  state: EmrClinicalAnnotationCanvasState,
  layerId: string,
): EmrClinicalAnnotationCanvasState {
  const next = cloneCanvasState(state);
  next.layers = next.layers.filter(candidate => candidate.id !== layerId);
  if (next.selectedLayerId === layerId) {
    next.selectedLayerId = undefined;
  }
  return normalizeCanvasState(next);
}

export function createLayerFromText(
  state: EmrClinicalAnnotationCanvasState,
  point: AnnotationPoint,
  layerId: string,
): AnnotationTextRecord {
  const draftText = (state.textContent ?? '').trim();
  const text = draftText.length ? draftText : 'Text';
  return {
    id: layerId,
    tool: 'text',
    label: text,
    color: state.brushColor,
    strokeWidth: state.brushWidth ?? 2,
    visible: true,
    classIds: nextLayerClassIds(state),
    point,
    text,
    fontSize: 24,
  };
}

export function createPolygonLayer(
  state: EmrClinicalAnnotationCanvasState,
  points: readonly AnnotationPoint[],
  layerId: string,
): AnnotationPathRecord | null {
  if (points.length < 3) return null;
  return {
    id: layerId,
    tool: 'polygon',
    label: defaultLayerLabel(state),
    color: state.brushColor,
    strokeWidth: state.brushWidth ?? 2,
    visible: true,
    classIds: nextLayerClassIds(state),
    ...layerAppearance(state, 'polygon'),
    points: [...points],
  };
}

export function createLayerFromDraft(
  state: EmrClinicalAnnotationCanvasState,
  draft: EmrDrawingDraft,
  endPoint: AnnotationPoint,
  layerId: string,
  surfaceWidth = FALLBACK_SURFACE,
): AnnotationLayerRecord | null {
  const brushColor = state.brushColor;
  const brushWidth = state.brushWidth ?? 2;
  const classIds = nextLayerClassIds(state);

  if (draft.tool === 'line' || draft.tool === 'arrow' || draft.tool === 'callout') {
    const start = draft.points[0];
    if (!start || (draft.tool !== 'line' && pointDistance(start, endPoint) < 0.005)) {
      return null;
    }
    const common = {
      id: layerId,
      color: brushColor,
      strokeWidth: brushWidth,
      visible: true,
      classIds,
      ...layerAppearance(state, draft.tool),
    };
    const points: [AnnotationPoint, AnnotationPoint] = [start, endPoint];
    if (draft.tool === 'callout') {
      const text = (state.textContent ?? '').trim() || 'Text';
      const callout: AnnotationCalloutRecord = {
        ...common,
        tool: 'callout',
        label: text,
        points,
        text,
        fontSize: Math.round(surfaceWidth * 0.03),
      };
      return callout;
    }
    const line: AnnotationLineRecord = {
      ...common,
      tool: draft.tool,
      label: defaultLayerLabel(state),
      points,
    };
    return line;
  }

  if (draft.tool === 'curve') {
    const start = draft.points[0] ?? endPoint;
    const points = [start, ...draft.points.slice(1), endPoint];
    const curve: AnnotationPathRecord = {
      id: layerId,
      tool: 'curve',
      label: defaultLayerLabel(state),
      color: brushColor,
      strokeWidth: brushWidth,
      visible: true,
      classIds,
      ...layerAppearance(state, 'curve'),
      points,
    };
    return curve;
  }

  if (draft.tool === 'freeform') {
    if (draft.points.length < 2) return null;
    const freeform: AnnotationPathRecord = {
      id: layerId,
      tool: 'freeform',
      label: defaultLayerLabel(state),
      color: brushColor,
      strokeWidth: brushWidth,
      visible: true,
      classIds,
      ...layerAppearance(state, 'freeform'),
      points: [...draft.points],
    };
    return freeform;
  }

  if (draft.tool === 'circle') {
    const center = draft.points[0];
    if (!center) return null;
    const radiusX = Math.abs(center.x - endPoint.x);
    const radiusY = Math.abs(center.y - endPoint.y);
    if (radiusX <= 0.005 && radiusY <= 0.005) return null;
    const circle: AnnotationCircleRecord = {
      id: layerId,
      tool: 'circle',
      label: defaultLayerLabel(state),
      color: brushColor,
      strokeWidth: brushWidth,
      visible: true,
      classIds,
      ...layerAppearance(state, 'circle'),
      center,
      radiusX,
      radiusY,
    };
    return circle;
  }

  return null;
}

export function extendPolygonDraft(
  draft: EmrDrawingDraft | null,
  point: AnnotationPoint,
): { action: 'close' } | { action: 'update'; draft: EmrDrawingDraft } {
  if (!draft || draft.tool !== 'polygon') {
    return { action: 'update', draft: { tool: 'polygon', points: [point] } };
  }
  const existing = draft.points;
  const first = existing[0];
  if (existing.length > 2 && first && pointDistance(first, point) < 0.018) {
    return { action: 'close' };
  }
  if (existing.some(p => pointDistance(p, point) < 0.005)) {
    return { action: 'update', draft };
  }
  return { action: 'update', draft: { tool: 'polygon', points: [...existing, point] } };
}

/**
 * Computes numbered markers in the left/right gutters and their leader anchor coordinates (0–100%).
 */
export function layoutAnnotationMarkers(
  layers: readonly AnnotationLayerRecord[],
  aspectRatio = 1,
): EmrMarker[] {
  const inner = 1 - 2 * CANVAS_GUTTER;
  const baseGap = 0.05 + 0.06 * Math.min(1, Math.max(0, aspectRatio - 0.5));
  const items = layers.flatMap((layer, index) => {
    if (!layer.visible) return [];
    const centre =
      layer.tool === 'circle'
        ? layer.center
        : layer.tool === 'text'
          ? layer.point
          : layer.tool === 'arrow' || layer.tool === 'callout'
            ? layer.points[1]
            : layer.points[0];
    if (!centre) return [];
    const left = layer.tool === 'text' || centre.x < 0.5;
    const anchor =
      layer.tool === 'circle'
        ? { x: layer.center.x + (left ? -layer.radiusX : layer.radiusX), y: layer.center.y }
        : centre;
    return [{ id: layer.id, number: index + 1, left, anchor, y: anchor.y }];
  });

  const markers: EmrMarker[] = [];
  for (const left of [true, false]) {
    const side = items.filter(item => item.left === left).sort((a, b) => a.y - b.y);
    if (!side.length) continue;
    const gap = Math.min(baseGap, 0.94 / Math.max(1, side.length));
    const edge = Math.min(0.03, gap / 2);
    const ys = side.map(item => Math.min(1 - edge, Math.max(edge, item.y)));
    for (let i = 1; i < ys.length; i += 1) {
      ys[i] = Math.max(ys[i], ys[i - 1] + gap);
    }
    if (ys[ys.length - 1] > 1 - edge) {
      ys[ys.length - 1] = 1 - edge;
      for (let i = ys.length - 2; i >= 0; i -= 1) {
        ys[i] = Math.min(ys[i], ys[i + 1] - gap);
      }
    }
    side.forEach((item, i) =>
      markers.push({
        id: item.id,
        number: item.number,
        lx: (left ? CANVAS_GUTTER / 2 : 1 - CANVAS_GUTTER / 2) * 100,
        ly: ys[i] * 100,
        sx: (left ? CANVAS_GUTTER : 1 - CANVAS_GUTTER) * 100,
        ax: (CANVAS_GUTTER + item.anchor.x * inner) * 100,
        ay: item.anchor.y * 100,
      }),
    );
  }
  return markers.sort((a, b) => a.number - b.number);
}

export function buildToolbarViewModel(
  state: EmrClinicalAnnotationCanvasState,
  options: {
    canUndo: boolean;
    canRedo: boolean;
    zoom: number;
    zoomLocked: boolean;
    toolLabels?: Partial<Record<EmrAnnotationSelectedTool, string>>;
    saveLabel?: string;
  },
): AnnotationToolbarViewModel {
  const colours = state.colourOptions ?? [];
  const widths = state.widthOptions ?? [];
  const labels = { ...CANVAS_TOOL_LABELS, ...options.toolLabels };
  return {
    tools: AVAILABLE_CANVAS_TOOLS.map(tool => ({
      id: tool,
      label: labels[tool],
      icon: CANVAS_TOOL_GLYPHS[tool],
    })),
    selectedToolId: state.selectedTool,
    colours,
    selectedColourId: colours.find(
      c => c.hex.toLowerCase() === (state.brushColor ?? '').toLowerCase(),
    )?.id,
    widths,
    selectedWidthId: widths.find(w => w.px === state.brushWidth)?.id,
    canUndo: options.canUndo,
    canRedo: options.canRedo,
    zoomLabel: `${options.zoom}%`,
    canSave: true,
    saveLabel: options.saveLabel,
    readOnly: !!state.readOnly,
    zoomLocked: options.zoomLocked,
  };
}

export function buildListViewModel(
  state: EmrClinicalAnnotationCanvasState,
  drawMode: boolean,
  emptyDrawMessage = 'No marks yet. Choose a tool and draw on the image.',
  emptyCompactMessage = 'No marks drawn on this image.',
): AnnotationListViewModel {
  return {
    items: state.layers.map((layer, index) => ({
      layer,
      number: index + 1,
      classLabel: findAnnotationLabel(state, layer.classIds?.[0])?.label,
    })),
    selectedLayerId: state.selectedLayerId,
    emptyMessage: drawMode ? emptyDrawMessage : emptyCompactMessage,
    readOnly: !drawMode,
    canLock: false,
  };
}

// ---------------------------------------------------------------------------
// React Native View segment geometry
// ---------------------------------------------------------------------------

export function computeSegment(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number,
  color: string,
  key: string,
  dashed?: boolean,
): ViewSegment | null {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.hypot(dx, dy);
  if (length < 0.5) return null;
  return {
    key,
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2,
    length,
    angleRad: Math.atan2(dy, dx),
    thickness: Math.max(MIN_STROKE_PX, thickness),
    color,
    dashed,
  };
}

export function computeArrowSegments(
  p0: AnnotationPoint,
  p1: AnnotationPoint,
  stageWidth: number,
  stageHeight: number,
  thickness: number,
  color: string,
  keyPrefix: string,
  dashed?: boolean,
): ViewSegment[] {
  const ax = p0.x * stageWidth;
  const ay = p0.y * stageHeight;
  const bx = p1.x * stageWidth;
  const by = p1.y * stageHeight;
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 1) return [];
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  const headSize = Math.min(Math.max(10, stageWidth * HEAD_FRACTION), len);
  const halfWidth = headSize * 0.45;
  const baseX = bx - ux * headSize;
  const baseY = by - uy * headSize;
  const wing1X = baseX - uy * halfWidth;
  const wing1Y = baseY + ux * halfWidth;
  const wing2X = baseX + uy * halfWidth;
  const wing2Y = baseY - ux * halfWidth;

  const segments: ViewSegment[] = [];
  const shaft = computeSegment(ax, ay, bx, by, thickness, color, `${keyPrefix}-shaft`, dashed);
  if (shaft) segments.push(shaft);
  const w1 = computeSegment(bx, by, wing1X, wing1Y, thickness, color, `${keyPrefix}-w1`);
  if (w1) segments.push(w1);
  const w2 = computeSegment(bx, by, wing2X, wing2Y, thickness, color, `${keyPrefix}-w2`);
  if (w2) segments.push(w2);
  return segments;
}

export function computeSutureOrStapleSegments(
  points: readonly AnnotationPoint[],
  closed: boolean,
  style: 'sutured' | 'stapled',
  stageWidth: number,
  stageHeight: number,
  thickness: number,
  color: string,
  keyPrefix: string,
): ViewSegment[] {
  if (points.length < 2 || stageWidth <= 0 || stageHeight <= 0) return [];
  const path = points.map(p => [p.x * stageWidth, p.y * stageHeight] as const);
  if (closed) path.push(path[0]);
  const step = stageWidth * TICK_SPEC[style].step;
  const half = stageWidth * TICK_SPEC[style].half;
  const leg = stageWidth * 0.009;
  if (step <= 0.5) return [];

  const out: ViewSegment[] = [];
  let walked = 0;
  let at = step / 2;
  let count = 0;
  for (let i = 1; i < path.length && count < 200; i += 1) {
    const [x0, y0] = path[i - 1];
    const [x1, y1] = path[i];
    const segLen = Math.hypot(x1 - x0, y1 - y0);
    if (segLen < 1e-3) continue;
    const dx = (x1 - x0) / segLen;
    const dy = (y1 - y0) / segLen;
    while (walked + segLen >= at && count < 200) {
      const t = at - walked;
      const cx = x0 + dx * t;
      const cy = y0 + dy * t;
      const ax = cx - dy * half;
      const ay = cy + dx * half;
      const bx = cx + dy * half;
      const by = cy - dx * half;
      const cross = computeSegment(ax, ay, bx, by, thickness, color, `${keyPrefix}-tick-${count}`);
      if (cross) out.push(cross);
      if (style === 'stapled') {
        const leg1 = computeSegment(
          ax - dx * leg,
          ay - dy * leg,
          ax,
          ay,
          thickness,
          color,
          `${keyPrefix}-leg1-${count}`,
        );
        const leg2 = computeSegment(
          bx,
          by,
          bx - dx * leg,
          by - dy * leg,
          thickness,
          color,
          `${keyPrefix}-leg2-${count}`,
        );
        if (leg1) out.push(leg1);
        if (leg2) out.push(leg2);
      }
      at += step;
      count += 1;
    }
    walked += segLen;
  }
  return out;
}

export function computeLayerSegments(
  layer: AnnotationLayerRecord,
  stageWidth: number,
  stageHeight: number,
): ViewSegment[] {
  if (!layer.visible || stageWidth <= 0 || stageHeight <= 0) return [];
  const thickness = Math.max(MIN_STROKE_PX, layer.strokeWidth);
  const dashed = layer.strokeStyle === 'dashed';
  const segments: ViewSegment[] = [];

  if (layer.tool === 'line') {
    const [p0, p1] = layer.points;
    const seg = computeSegment(
      p0.x * stageWidth,
      p0.y * stageHeight,
      p1.x * stageWidth,
      p1.y * stageHeight,
      thickness,
      layer.color,
      `${layer.id}-line`,
      dashed,
    );
    if (seg) segments.push(seg);
  } else if (layer.tool === 'arrow' || layer.tool === 'callout') {
    segments.push(
      ...computeArrowSegments(
        layer.points[0],
        layer.points[1],
        stageWidth,
        stageHeight,
        thickness,
        layer.color,
        layer.id,
        dashed,
      ),
    );
  } else if (layer.tool === 'curve' || layer.tool === 'freeform' || layer.tool === 'polygon') {
    const pts = layer.points;
    for (let i = 1; i < pts.length; i += 1) {
      const seg = computeSegment(
        pts[i - 1].x * stageWidth,
        pts[i - 1].y * stageHeight,
        pts[i].x * stageWidth,
        pts[i].y * stageHeight,
        thickness,
        layer.color,
        `${layer.id}-s-${i}`,
        dashed,
      );
      if (seg) segments.push(seg);
    }
    if (layer.tool === 'polygon' && pts.length > 2) {
      const closeSeg = computeSegment(
        pts[pts.length - 1].x * stageWidth,
        pts[pts.length - 1].y * stageHeight,
        pts[0].x * stageWidth,
        pts[0].y * stageHeight,
        thickness,
        layer.color,
        `${layer.id}-close`,
        dashed,
      );
      if (closeSeg) segments.push(closeSeg);
    }
  }

  if (
    (layer.strokeStyle === 'sutured' || layer.strokeStyle === 'stapled') &&
    layer.tool !== 'text' &&
    layer.tool !== 'circle'
  ) {
    segments.push(
      ...computeSutureOrStapleSegments(
        layer.points,
        layer.tool === 'polygon',
        layer.strokeStyle,
        stageWidth,
        stageHeight,
        thickness,
        layer.color,
        layer.id,
      ),
    );
  }

  return segments;
}

export function computeDraftSegments(
  draft: EmrDrawingDraft | null,
  stageWidth: number,
  stageHeight: number,
  color: string,
  strokeWidth = 2,
): ViewSegment[] {
  if (!draft || stageWidth <= 0 || stageHeight <= 0 || draft.points.length < 2) return [];
  const thickness = Math.max(MIN_STROKE_PX, strokeWidth);
  if (draft.tool === 'arrow' || draft.tool === 'callout') {
    return computeArrowSegments(
      draft.points[0],
      draft.points[1],
      stageWidth,
      stageHeight,
      thickness,
      color,
      'draft',
      true,
    );
  }
  if (
    draft.tool === 'line' ||
    draft.tool === 'curve' ||
    draft.tool === 'freeform' ||
    draft.tool === 'polygon'
  ) {
    const out: ViewSegment[] = [];
    for (let i = 1; i < draft.points.length; i += 1) {
      const seg = computeSegment(
        draft.points[i - 1].x * stageWidth,
        draft.points[i - 1].y * stageHeight,
        draft.points[i].x * stageWidth,
        draft.points[i].y * stageHeight,
        thickness,
        color,
        `draft-s-${i}`,
        true,
      );
      if (seg) out.push(seg);
    }
    if (draft.tool === 'polygon' && draft.points.length > 2) {
      const closeSeg = computeSegment(
        draft.points[draft.points.length - 1].x * stageWidth,
        draft.points[draft.points.length - 1].y * stageHeight,
        draft.points[0].x * stageWidth,
        draft.points[0].y * stageHeight,
        thickness,
        color,
        'draft-close',
        true,
      );
      if (closeSeg) out.push(closeSeg);
    }
    return out;
  }
  return [];
}

export function computeCalloutLabelPosition(
  layer: AnnotationCalloutRecord,
  stageWidth: number,
  stageHeight: number,
): { left: number; top: number; textAlign: 'left' | 'center' | 'right' } {
  const tx = layer.points[0].x * stageWidth;
  const ty = layer.points[0].y * stageHeight;
  const dx = layer.points[1].x * stageWidth - tx;
  const dy = layer.points[1].y * stageHeight - ty;
  const gap = 8;
  if (Math.abs(dx) >= Math.abs(dy) * 0.6) {
    return {
      left: Math.max(4, Math.min(stageWidth - 60, dx >= 0 ? tx - gap : tx + gap)),
      top: Math.max(4, ty - 10),
      textAlign: dx >= 0 ? 'right' : 'left',
    };
  }
  return {
    left: Math.max(4, tx - 30),
    top: Math.max(4, dy >= 0 ? ty - 20 : ty + gap),
    textAlign: 'center',
  };
}
