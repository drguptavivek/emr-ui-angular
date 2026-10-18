'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  AnnotationListIntent,
  AnnotationPoint,
  AnnotationTool,
  AnnotationToolbarIntent,
  EmrAnnotationSelectedTool,
  EmrClinicalAnnotationCanvasIntent,
  EmrClinicalAnnotationCanvasState,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrAnnotationList, EmrAnnotationToolbar } from './l3-annotation';
import { EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  AVAILABLE_CANVAS_TOOLS,
  CANVAS_GUTTER,
  MAX_HISTORY,
  MIN_STROKE_PX,
  TWO_POINT_TOOLS,
  UNTRACKED_REASONS,
  activateToolInState,
  applySymbolPresetToState,
  buildListViewModel,
  buildToolbarViewModel,
  canvasSurfaceSize,
  clampBrushWidth,
  clampUnit,
  cloneCanvasState,
  computeCalloutLabelPosition,
  computeDraftSegments,
  computeLayerSegments,
  computeSegment,
  createLayerFromDraft,
  createLayerFromText,
  createPolygonLayer,
  extendPolygonDraft,
  layoutAnnotationMarkers,
  moveLayerInState,
  nextUniqueLayerId,
  nextZoomStep,
  normalizeCanvasState,
  pointDistance,
  removeLayerFromState,
  selectedCanvasImage,
  toggleLayerVisibilityInState,
  type EmrDrawingDraft,
  type ViewSegment,
} from './l4-annotation-canvas.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

export const ANNOTATION_CANVAS_DEFAULTS = {
  defaultTitle: 'Clinical annotation',
  markSingular: 'mark',
  markPlural: 'marks',
  marksHeading: 'Marks',
  showNumbersAria: 'Show numbers on image',
  hideNumbersTitle: 'Hide numbers on image',
  showNumbersTitle: 'Show numbers on image',
  showMarksAria: 'Show marks on image',
  hideMarksTitle: 'Hide marks on image',
  showMarksTitle: 'Show marks on image',
  openDrawAria: 'Open drawing mode',
  drawButton: 'Draw',
  lockPanZoomAria: 'Lock pan and zoom',
  unlockPanZoomTitle: 'Unlock pan and zoom',
  lockPanZoomTitle: 'Lock pan and zoom',
  doneDrawingAria: 'Done drawing',
  doneButton: 'Done',
  classSelectLabel: 'Annotation class for new marks',
  noClassOption: 'No class',
  symbolSelectLabel: 'Symbol for new marks',
  noSymbolOption: 'No symbol',
  backgroundSelectLabel: 'Background image',
  addPhoto: 'Add photo',
  calloutTextLabel: 'Text for the next callout',
  textMarkLabel: 'Text for the next text mark',
  calloutTextPlaceholder: 'Text, then drag from the text to the area',
  textMarkPlaceholder: 'Text, then click the image',
  polygonNotice: 'Click to add points; click the first point or Finish polygon to close.',
  finishPolygon: 'Finish polygon',
  canvasAria: (title: string) => `Annotation canvas for ${title}`,
  defaultImageAlt: 'clinical image background',
  emptyImageDraw: 'No background image. Add a photo or choose a template.',
  emptyImageCompact: 'No background image.',
  emptyListDraw: 'No marks yet. Choose a tool and draw on the image.',
  emptyListCompact: 'No marks drawn on this image.',
  saveAnnotations: 'Save annotations',
};

export type EmrClinicalAnnotationCanvasLabels = typeof ANNOTATION_CANVAS_DEFAULTS;

export interface EmrClinicalAnnotationCanvasProps {
  model: EmrClinicalAnnotationCanvasState;
  headingId?: string;
  labels?: Partial<typeof ANNOTATION_CANVAS_DEFAULTS>;
  onIntent?: (intent: EmrClinicalAnnotationCanvasIntent) => void;
  onNativeFilesSelected?: (files: readonly unknown[]) => void;
}

const ZOOM_INTENTS = new Set([
  'zoomInRequested',
  'zoomOutRequested',
  'zoomFitRequested',
  'zoomResetRequested',
]);

function renderSegmentBar(seg: ViewSegment) {
  return (
    <View
      key={seg.key}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: seg.cx - seg.length / 2,
        top: seg.cy - seg.thickness / 2,
        width: seg.length,
        height: seg.thickness,
        backgroundColor: seg.dashed ? 'transparent' : seg.color,
        borderBottomWidth: seg.dashed ? seg.thickness : 0,
        borderColor: seg.color,
        borderStyle: seg.dashed ? 'dashed' : 'solid',
        borderRadius: seg.thickness / 2,
        transform: [{ rotate: `${seg.angleRad}rad` }],
      }}
    />
  );
}

/**
 * L4. Clinical photo/anatomy annotation surface with drawing tools, symbol presets,
 * class labels, numbered gutter markers, undo/redo history, and layer list.
 */
export function EmrClinicalAnnotationCanvas({
  model,
  headingId = 'emr-clinical-annotation-canvas-heading',
  labels,
  onIntent,
  onNativeFilesSelected,
}: EmrClinicalAnnotationCanvasProps) {
  const t = useEmrTheme();
  const l = { ...ANNOTATION_CANVAS_DEFAULTS, ...labels };
  const font = fontFamily(t);

  const [state, setState] = useState<EmrClinicalAnnotationCanvasState>(() =>
    normalizeCanvasState(model),
  );
  const [undoStack, setUndoStack] = useState<readonly EmrClinicalAnnotationCanvasState[]>([]);
  const [redoStack, setRedoStack] = useState<readonly EmrClinicalAnnotationCanvasState[]>([]);
  const [drawing, setDrawing] = useState<EmrDrawingDraft | null>(null);
  const [zoom, setZoom] = useState(100);
  const [marksShown, setMarksShown] = useState(true);
  const [locked, setLocked] = useState(() => normalizeCanvasState(model).selectedTool !== 'pan');
  const [rootWidth, setRootWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const layerCounterRef = useRef(0);

  useEffect(() => {
    const next = normalizeCanvasState(model);
    setState(next);
    setDrawing(null);
    setUndoStack([]);
    setRedoStack([]);
  }, [model]);

  const readOnly = state.readOnly === true;
  const drawMode = state.layout === 'draw' && !readOnly;
  const showNumbers = state.showMarkerNumbers !== false;
  const surface = useMemo(() => canvasSurfaceSize(state), [state]);
  const markers = useMemo(
    () => layoutAnnotationMarkers(state.layers, surface.aspectRatio),
    [state.layers, surface.aspectRatio],
  );
  const hasGutter = markers.length > 0 && showNumbers && marksShown;
  const gutterFrac = hasGutter ? CANVAS_GUTTER : 0;

  const baseFigureWidth = viewportWidth > 16 ? viewportWidth - 12 : 480;
  const figureWidth = baseFigureWidth * (drawMode ? zoom / 100 : 1);
  const stageWidth = figureWidth * (1 - 2 * gutterFrac);
  const stageHeight = stageWidth / Math.max(0.2, surface.aspectRatio);
  const gutterWidth = figureWidth * gutterFrac;

  const toolbarModel = useMemo(
    () =>
      buildToolbarViewModel(state, {
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        zoom,
        zoomLocked: locked,
        saveLabel: l.saveAnnotations,
      }),
    [state, undoStack.length, redoStack.length, zoom, locked, l.saveAnnotations],
  );

  const listModel = useMemo(
    () => buildListViewModel(state, drawMode, l.emptyListDraw, l.emptyListCompact),
    [state, drawMode, l.emptyListDraw, l.emptyListCompact],
  );

  const applyState = (nextRaw: EmrClinicalAnnotationCanvasState, reason: string) => {
    const normalized = normalizeCanvasState(nextRaw);
    if (!UNTRACKED_REASONS.has(reason)) {
      setUndoStack(prev => [...prev.slice(-(MAX_HISTORY - 1)), cloneCanvasState(state)]);
      setRedoStack([]);
    }
    setState(normalized);
    setDrawing(null);
    if (reason.endsWith('-added')) setMarksShown(true);
    onIntent?.({ type: 'stateChanged', state: cloneCanvasState(normalized), reason });
  };

  const allocLayerId = (): string => {
    const { id, nextCounter } = nextUniqueLayerId(state.layers, layerCounterRef.current);
    layerCounterRef.current = nextCounter;
    return id;
  };

  const setLayout = (layout: 'compact' | 'draw') => {
    const next = cloneCanvasState(state);
    next.layout = layout;
    setZoom(100);
    applyState(next, 'layout-changed');
  };

  const toggleNumbers = () => {
    const next = cloneCanvasState(state);
    next.showMarkerNumbers = !showNumbers;
    applyState(next, 'marker-numbers-toggled');
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const snapshot = undoStack[undoStack.length - 1];
    const current = cloneCanvasState(state);
    const restored: EmrClinicalAnnotationCanvasState = {
      ...cloneCanvasState(snapshot),
      layout: current.layout,
      showMarkerNumbers: current.showMarkerNumbers,
    };
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, current]);
    setState(restored);
    setDrawing(null);
    onIntent?.({ type: 'undoRequested', state: cloneCanvasState(restored), reason: 'undo' });
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const snapshot = redoStack[redoStack.length - 1];
    const current = cloneCanvasState(state);
    const restored: EmrClinicalAnnotationCanvasState = {
      ...cloneCanvasState(snapshot),
      layout: current.layout,
      showMarkerNumbers: current.showMarkerNumbers,
    };
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, current]);
    setState(restored);
    setDrawing(null);
    onIntent?.({ type: 'redoRequested', state: cloneCanvasState(restored), reason: 'redo' });
  };

  const save = () => {
    onIntent?.({ type: 'saveRequested', state: cloneCanvasState(state), reason: 'save' });
  };

  const onToolbar = (intent: AnnotationToolbarIntent) => {
    if (locked && ZOOM_INTENTS.has(intent.type)) return;
    switch (intent.type) {
      case 'toolSelected': {
        const tool = AVAILABLE_CANVAS_TOOLS.find(c => c === intent.toolId);
        if (tool && !readOnly) {
          setLocked(tool !== 'pan');
          applyState(activateToolInState(state, tool), `tool-changed:${tool}`);
        }
        break;
      }
      case 'colourSelected': {
        const colour = state.colourOptions?.find(c => c.id === intent.colourId);
        if (colour) {
          const next = cloneCanvasState(state);
          next.brushColor = colour.hex;
          applyState(next, `brush-color:${colour.hex}`);
        }
        break;
      }
      case 'widthSelected': {
        const width = state.widthOptions?.find(w => w.id === intent.widthId);
        if (width) {
          const next = cloneCanvasState(state);
          next.brushWidth = clampBrushWidth(width.px);
          applyState(next, `brush-width:${next.brushWidth}`);
        }
        break;
      }
      case 'undoRequested':
        undo();
        break;
      case 'redoRequested':
        redo();
        break;
      case 'saveRequested':
        save();
        break;
      case 'zoomInRequested':
        setZoom(z => nextZoomStep(z, 'in'));
        break;
      case 'zoomOutRequested':
        setZoom(z => nextZoomStep(z, 'out'));
        break;
      case 'zoomFitRequested':
      case 'zoomResetRequested':
        setZoom(100);
        break;
    }
  };

  const onList = (intent: AnnotationListIntent) => {
    switch (intent.type) {
      case 'layerSelected': {
        const next = cloneCanvasState(state);
        next.selectedLayerId = intent.layerId;
        applyState(next, `layer-selected:${intent.layerId}`);
        break;
      }
      case 'layerVisibilityToggleRequested': {
        const next = toggleLayerVisibilityInState(state, intent.layerId);
        const target = next.layers.find(layer => layer.id === intent.layerId);
        applyState(next, `layer-visibility:${intent.layerId}:${target?.visible ?? false}`);
        break;
      }
      case 'layerMoveRequested':
        if (!readOnly) {
          applyState(
            moveLayerInState(state, intent.layerId, intent.direction === 'up' ? -1 : 1),
            `layer-reordered:${intent.layerId}`,
          );
        }
        break;
      case 'layerRemoveRequested':
        if (!readOnly) {
          applyState(removeLayerFromState(state, intent.layerId), `layer-removed:${intent.layerId}`);
        }
        break;
      default:
        break;
    }
  };

  const finishPolygon = (pointsOverride?: readonly AnnotationPoint[]) => {
    const pts = pointsOverride ?? (drawing?.tool === 'polygon' ? drawing.points : []);
    if (pts.length < 3 || readOnly) return;
    const layer = createPolygonLayer(state, pts, allocLayerId());
    if (!layer) return;
    const next = cloneCanvasState(state);
    next.layers = [...next.layers, layer];
    next.selectedLayerId = layer.id;
    applyState(next, 'polygon-added');
  };

  const pointFromResponder = (e: GestureResponderEvent): AnnotationPoint | null => {
    if (stageWidth <= 0 || stageHeight <= 0) return null;
    const { locationX, locationY } = e.nativeEvent;
    if (typeof locationX !== 'number' || typeof locationY !== 'number') return null;
    return {
      x: clampUnit(locationX / stageWidth),
      y: clampUnit(locationY / stageHeight),
    };
  };

  const handleStageDown = (point: AnnotationPoint | null) => {
    if (!drawMode || !point || state.selectedTool === 'pan') return;
    const tool: AnnotationTool = state.selectedTool ?? 'line';

    if (tool === 'text') {
      const layer = createLayerFromText(state, point, allocLayerId());
      const next = cloneCanvasState(state);
      next.layers = [...next.layers, layer];
      next.selectedLayerId = layer.id;
      applyState(next, 'text-added');
      return;
    }

    if (tool === 'polygon') {
      const res = extendPolygonDraft(drawing, point);
      if (res.action === 'close' && drawing) {
        finishPolygon(drawing.points);
      } else if (res.action === 'update') {
        setDrawing(res.draft);
      }
      return;
    }

    setDrawing({
      tool,
      points: TWO_POINT_TOOLS.has(tool) || tool === 'circle' ? [point, point] : [point],
    });
  };

  const handleStageMove = (point: AnnotationPoint | null) => {
    if (!drawMode || !point || !drawing || drawing.tool === 'polygon') return;
    if (TWO_POINT_TOOLS.has(drawing.tool) || drawing.tool === 'circle') {
      setDrawing({ tool: drawing.tool, points: [drawing.points[0], point] });
      return;
    }
    if (drawing.tool === 'freeform') {
      const tail = drawing.points[drawing.points.length - 1];
      if (!tail || pointDistance(tail, point) > 0.004) {
        setDrawing({ tool: 'freeform', points: [...drawing.points, point] });
      }
    }
  };

  const handleStageUp = (point: AnnotationPoint | null) => {
    if (!drawMode || !drawing || drawing.tool === 'polygon') return;
    const endPoint = point ?? drawing.points[drawing.points.length - 1] ?? drawing.points[0];
    if (!endPoint) {
      setDrawing(null);
      return;
    }
    const created = createLayerFromDraft(state, drawing, endPoint, allocLayerId(), surface.width);
    if (!created) {
      setDrawing(null);
      return;
    }
    const next = cloneCanvasState(state);
    next.layers = [...next.layers, created];
    next.selectedLayerId = created.id;
    applyState(next, `${drawing.tool}-added`);
  };

  const image = selectedCanvasImage(state);
  const wideLayout = rootWidth >= 760;
  const showSidePanel = drawMode || state.showLayerPanel !== false;

  const iconToggleBtn = ({
    ariaLabel,
    pressed,
    glyph,
    onPress,
  }: {
    ariaLabel: string;
    pressed: boolean;
    glyph: string;
    onPress: () => void;
  }) => (
    <Pressable
      role="button"
      aria-label={ariaLabel}
      aria-pressed={pressed}
      onPress={onPress}
      style={(st: PressState) => [
        styles.iconBtn,
        {
          width: t.controlHeight,
          height: t.controlHeight,
          borderColor: pressed ? t.primaryBorder : t.border,
          backgroundColor: pressed ? t.primarySoft : t.surface,
        },
        focusRing(t, st.focused),
      ]}
    >
      <Text
        aria-hidden
        style={{
          color: pressed ? t.primaryContrast : t.text,
          fontSize: t.textMd,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: font,
        }}
      >
        {glyph}
      </Text>
    </Pressable>
  );

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      onLayout={(e: LayoutChangeEvent) => setRootWidth(e.nativeEvent.layout.width)}
      style={[styles.root, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.header, { minHeight: t.controlHeight }]}>
        <Text
          role="heading"
          aria-level={2}
          nativeID={headingId}
          style={[
            styles.title,
            {
              color: t.text,
              fontSize: t.textLg,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            },
          ]}
        >
          {state.title}
        </Text>
        <View
          aria-label={`${state.layers.length} ${state.layers.length === 1 ? l.markSingular : l.markPlural}`}
          style={[styles.countBadge, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
        >
          <Text
            style={{
              color: t.text,
              fontSize: t.textXs,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: t.fontMono,
            }}
          >
            {state.layers.length}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {iconToggleBtn({
            ariaLabel: l.showNumbersAria,
            pressed: showNumbers,
            glyph: '#',
            onPress: toggleNumbers,
          })}
          {iconToggleBtn({
            ariaLabel: l.showMarksAria,
            pressed: marksShown,
            glyph: marksShown ? '👁' : '⊘',
            onPress: () => setMarksShown(v => !v),
          })}
          {!drawMode ? (
            !readOnly ? (
              <EmrButton
                small
                variant="outline"
                label={`✎ ${l.drawButton}`}
                accessibilityLabel={l.openDrawAria}
                onPress={() => setLayout('draw')}
              />
            ) : null
          ) : (
            <>
              {iconToggleBtn({
                ariaLabel: l.lockPanZoomAria,
                pressed: locked,
                glyph: locked ? '🔒' : '🔓',
                onPress: () => setLocked(v => !v),
              })}
              <EmrButton
                small
                variant="outline"
                label={`✓ ${l.doneButton}`}
                accessibilityLabel={l.doneDrawingAria}
                onPress={() => setLayout('compact')}
              />
            </>
          )}
        </View>
      </View>

      {drawMode ? (
        <>
          {state.description ? (
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
              {state.description}
            </Text>
          ) : null}

          <View style={styles.toolsRow}>
            <EmrAnnotationToolbar model={toolbarModel} onIntent={onToolbar} />

            {state.availableLabels.length > 0 ? (
              <View style={styles.selectWrap}>
                <EmrSelect
                  label={l.classSelectLabel}
                  value={state.selectedLabelId ?? null}
                  options={state.availableLabels.map(item => ({
                    value: item.id,
                    label: item.label,
                  }))}
                  onChange={val => {
                    const next = cloneCanvasState(state);
                    next.selectedLabelId = val ?? undefined;
                    applyState(next, `selected-label:${val ?? ''}`);
                  }}
                />
              </View>
            ) : null}

            {state.symbolPresets?.length ? (
              <View style={styles.selectWrap}>
                <EmrSelect
                  label={l.symbolSelectLabel}
                  value={state.selectedSymbolId ?? null}
                  options={state.symbolPresets.map(preset => ({
                    value: preset.id,
                    label: preset.label,
                  }))}
                  onChange={val => applyState(applySymbolPresetToState(state, val), 'symbol-selected')}
                />
              </View>
            ) : null}

            {state.imageTemplates.length > 1 ? (
              <View style={styles.selectWrap}>
                <EmrSelect
                  label={l.backgroundSelectLabel}
                  value={state.selectedImageId ?? null}
                  options={state.imageTemplates.map(tpl => ({
                    value: tpl.id,
                    label: tpl.group ? `${tpl.group}: ${tpl.label}` : tpl.label,
                  }))}
                  onChange={val => {
                    if (!val) return;
                    const next = cloneCanvasState(state);
                    next.selectedImageId = val;
                    applyState(next, `background-changed:${val}`);
                  }}
                />
              </View>
            ) : null}

            {onNativeFilesSelected ? (
              <EmrButton
                small
                variant="outline"
                label={`⬆ ${l.addPhoto}`}
                accessibilityLabel={state.photoUploadHint || l.addPhoto}
                onPress={() => onNativeFilesSelected([])}
              />
            ) : null}

            {state.selectedTool === 'text' || state.selectedTool === 'callout' ? (
              <View style={styles.textInputWrap}>
                <ThemedInput
                  aria-label={
                    state.selectedTool === 'callout' ? l.calloutTextLabel : l.textMarkLabel
                  }
                  placeholder={
                    state.selectedTool === 'callout'
                      ? l.calloutTextPlaceholder
                      : l.textMarkPlaceholder
                  }
                  maxLength={120}
                  value={state.textContent ?? ''}
                  onChangeText={txt => {
                    const next = cloneCanvasState(state);
                    next.textContent = txt;
                    applyState(next, 'text-content-changed');
                  }}
                />
              </View>
            ) : null}
          </View>

          {state.selectedTool === 'polygon' && drawing?.tool === 'polygon' ? (
            <View
              style={[
                styles.polygonNotice,
                { borderColor: t.border, backgroundColor: t.surfaceAccent },
              ]}
            >
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font, flex: 1 }}>
                {l.polygonNotice}
              </Text>
              <EmrButton
                small
                variant="outline"
                label={`✓ ${l.finishPolygon}`}
                disabled={drawing.points.length < 3}
                onPress={() => finishPolygon()}
              />
            </View>
          ) : null}
        </>
      ) : null}

      <View style={[styles.body, wideLayout ? styles.bodyWide : null]}>
        <View
          onLayout={(e: LayoutChangeEvent) => setViewportWidth(e.nativeEvent.layout.width)}
          style={[
            styles.viewport,
            wideLayout ? styles.stageColWide : null,
            { borderColor: t.border, backgroundColor: t.surface },
          ]}
        >
          <ScrollView
            horizontal={drawMode && zoom > 100 && !locked}
            scrollEnabled={!locked}
            contentContainerStyle={styles.scrollContent}
          >
            <View
              style={[
                styles.figure,
                { width: figureWidth, height: stageHeight },
              ]}
            >
              <View
                role="group"
                aria-label={l.canvasAria(state.title)}
                onStartShouldSetResponder={() => drawMode && state.selectedTool !== 'pan'}
                onMoveShouldSetResponder={() => drawMode && state.selectedTool !== 'pan'}
                onResponderGrant={e => handleStageDown(pointFromResponder(e))}
                onResponderMove={e => handleStageMove(pointFromResponder(e))}
                onResponderRelease={e => handleStageUp(pointFromResponder(e))}
                style={[
                  styles.stage,
                  {
                    marginLeft: gutterWidth,
                    width: stageWidth,
                    height: stageHeight,
                    borderColor: t.border,
                    backgroundColor: t.surface,
                  },
                ]}
              >
                {image ? (
                  <Image
                    source={{ uri: image.imageUrl }}
                    accessibilityLabel={image.altText ?? l.defaultImageAlt}
                    resizeMode="contain"
                    style={styles.stageImage}
                  />
                ) : (
                  <View style={styles.emptyStage}>
                    <Text
                      style={{
                        color: t.textMuted,
                        fontSize: t.textSm,
                        fontFamily: font,
                        textAlign: 'center',
                      }}
                    >
                      {drawMode ? l.emptyImageDraw : l.emptyImageCompact}
                    </Text>
                  </View>
                )}

                {marksShown && stageWidth > 0 && stageHeight > 0 ? (
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {state.layers.map(layer => {
                      if (!layer.visible) return null;
                      const segments = computeLayerSegments(layer, stageWidth, stageHeight);
                      return (
                        <View key={layer.id} pointerEvents="none" style={StyleSheet.absoluteFill}>
                          {segments.map(renderSegmentBar)}

                          {layer.tool === 'circle' ? (
                            <View
                              style={{
                                position: 'absolute',
                                left: (layer.center.x - layer.radiusX) * stageWidth,
                                top: (layer.center.y - layer.radiusY) * stageHeight,
                                width: layer.radiusX * 2 * stageWidth,
                                height: layer.radiusY * 2 * stageHeight,
                                borderRadius: Math.max(
                                  layer.radiusX * stageWidth,
                                  layer.radiusY * stageHeight,
                                ),
                                borderWidth: Math.max(MIN_STROKE_PX, layer.strokeWidth),
                                borderColor: layer.color,
                                borderStyle: layer.strokeStyle === 'dashed' ? 'dashed' : 'solid',
                                backgroundColor:
                                  layer.fillPattern && layer.fillPattern !== 'none'
                                    ? `${layer.color}22`
                                    : 'transparent',
                              }}
                            />
                          ) : null}

                          {layer.tool === 'text' ? (
                            <Text
                              style={{
                                position: 'absolute',
                                left: layer.point.x * stageWidth,
                                top: Math.max(0, layer.point.y * stageHeight - 16),
                                color: layer.color,
                                fontSize: t.textMd,
                                fontWeight: fontWeight(t.weightBold),
                                fontFamily: font,
                              }}
                            >
                              {layer.text}
                            </Text>
                          ) : null}

                          {layer.tool === 'callout' ? (
                            <Text
                              style={{
                                position: 'absolute',
                                ...computeCalloutLabelPosition(layer, stageWidth, stageHeight),
                                color: layer.color,
                                fontSize: t.textSm,
                                fontWeight: fontWeight(t.weightBold),
                                fontFamily: font,
                              }}
                            >
                              {layer.text}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}

                    {drawing ? (
                      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                        {computeDraftSegments(
                          drawing,
                          stageWidth,
                          stageHeight,
                          state.brushColor || t.primary,
                          state.brushWidth,
                        ).map(renderSegmentBar)}

                        {drawing.tool === 'circle' && drawing.points.length === 2 ? (
                          <View
                            style={{
                              position: 'absolute',
                              left:
                                (drawing.points[0].x -
                                  Math.abs(drawing.points[0].x - drawing.points[1].x)) *
                                stageWidth,
                              top:
                                (drawing.points[0].y -
                                  Math.abs(drawing.points[0].y - drawing.points[1].y)) *
                                stageHeight,
                              width:
                                Math.abs(drawing.points[0].x - drawing.points[1].x) *
                                2 *
                                stageWidth,
                              height:
                                Math.abs(drawing.points[0].y - drawing.points[1].y) *
                                2 *
                                stageHeight,
                              borderRadius: Math.max(
                                Math.abs(drawing.points[0].x - drawing.points[1].x) * stageWidth,
                                Math.abs(drawing.points[0].y - drawing.points[1].y) * stageHeight,
                              ),
                              borderWidth: Math.max(MIN_STROKE_PX, state.brushWidth ?? 2),
                              borderColor: state.brushColor || t.primary,
                              borderStyle: 'dashed',
                            }}
                          />
                        ) : null}

                        {drawing.tool === 'polygon'
                          ? drawing.points.map((pt, i) => (
                              <View
                                key={`poly-pt-${i}`}
                                style={{
                                  position: 'absolute',
                                  left: pt.x * stageWidth - 4,
                                  top: pt.y * stageHeight - 4,
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: state.brushColor || t.primary,
                                }}
                              />
                            ))
                          : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {!drawMode && !readOnly ? (
                  <Pressable
                    role="button"
                    aria-label={l.openDrawAria}
                    onPress={() => setLayout('draw')}
                    style={[
                      styles.openDrawBadge,
                      { borderColor: t.border, backgroundColor: t.surface },
                    ]}
                  >
                    <Text aria-hidden style={{ color: t.text, fontSize: t.textSm }}>
                      ✎
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {hasGutter && figureWidth > 0 && stageHeight > 0 ? (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {markers.map(marker => {
                    const sx = (marker.sx / 100) * figureWidth;
                    const ly = (marker.ly / 100) * stageHeight;
                    const ax = (marker.ax / 100) * figureWidth;
                    const ay = (marker.ay / 100) * stageHeight;
                    const lx = (marker.lx / 100) * figureWidth;
                    const leader = computeSegment(
                      sx,
                      ly,
                      ax,
                      ay,
                      1,
                      t.textMuted,
                      `leader-${marker.id}`,
                    );
                    return (
                      <View key={`marker-${marker.id}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
                        {leader ? renderSegmentBar({ ...leader, thickness: 1 }) : null}
                        <View
                          style={[
                            styles.markerDot,
                            {
                              left: ax - 2.5,
                              top: ay - 2.5,
                              backgroundColor: t.textMuted,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.markerBadge,
                            {
                              left: lx - 8,
                              top: ly - 8,
                              borderColor: t.border,
                              backgroundColor: t.surfaceRaised,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: t.textMuted,
                              fontSize: t.text2xs,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: t.fontMono,
                            }}
                          >
                            {marker.number}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>

        {showSidePanel ? (
          <View style={wideLayout ? styles.sideColWide : styles.sideColStacked}>
            {drawMode ? (
              <View style={styles.asideHeader}>
                <Text
                  role="heading"
                  aria-level={3}
                  nativeID={`${headingId}-marks`}
                  style={{
                    color: t.text,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: font,
                  }}
                >
                  {l.marksHeading}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { borderColor: t.border, backgroundColor: t.surfaceSoft },
                  ]}
                >
                  <Text
                    style={{
                      color: t.text,
                      fontSize: t.textXs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: t.fontMono,
                    }}
                  >
                    {state.layers.length}
                  </Text>
                </View>
              </View>
            ) : null}
            <EmrAnnotationList
              model={listModel}
              headingId={drawMode ? `${headingId}-marks` : undefined}
              onIntent={onList}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    minWidth: 120,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  iconBtn: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  selectWrap: {
    minWidth: 150,
    maxWidth: 220,
  },
  textInputWrap: {
    flex: 1,
    minWidth: 180,
  },
  polygonNotice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  body: {
    gap: 12,
  },
  bodyWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  viewport: {
    padding: 6,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: 0,
  },
  stageColWide: {
    flex: 1,
  },
  sideColWide: {
    width: 320,
    gap: 6,
  },
  sideColStacked: {
    width: '100%',
    gap: 6,
  },
  asideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  figure: {
    position: 'relative',
  },
  stage: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  stageImage: {
    width: '100%',
    height: '100%',
  },
  emptyStage: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openDrawBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  markerBadge: {
    position: 'absolute',
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
