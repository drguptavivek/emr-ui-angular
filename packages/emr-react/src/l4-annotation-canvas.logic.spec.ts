import { describe, expect, it } from 'vitest';
import type {
  AnnotationLayerRecord,
  EmrClinicalAnnotationCanvasState,
} from '@drguptavivek/emr-controller';
import {
  activateToolInState,
  applySymbolPresetToState,
  buildListViewModel,
  buildToolbarViewModel,
  canvasSurfaceSize,
  clampBrushWidth,
  clampUnit,
  computeArrowSegments,
  computeCalloutLabelPosition,
  computeDraftSegments,
  computeLayerSegments,
  computeSutureOrStapleSegments,
  createLayerFromDraft,
  createLayerFromText,
  createPolygonLayer,
  extendPolygonDraft,
  layoutAnnotationMarkers,
  moveLayerInState,
  nextUniqueLayerId,
  nextZoomStep,
  normalizeCanvasState,
  removeLayerFromState,
  toggleLayerVisibilityInState,
} from './l4-annotation-canvas.logic';

const baseState: EmrClinicalAnnotationCanvasState = {
  instanceId: 'test-canvas',
  title: 'Dermatology canvas',
  imageTemplates: [
    { id: 'img-1', label: 'Outline 1', imageUrl: 'data:image/svg+xml,', width: 800, height: 600 },
  ],
  availableLabels: [
    { id: 'lesion', label: 'Lesion', color: '#dc2626' },
    { id: 'scar', label: 'Scar', color: '#475569' },
  ],
  selectedImageId: 'img-1',
  selectedLabelId: 'lesion',
  selectedTool: 'line',
  brushColor: '#dc2626',
  brushWidth: 3,
  colourOptions: [{ id: 'red', label: 'Red', hex: '#dc2626' }],
  widthOptions: [{ id: 'w3', label: 'Medium', px: 3 }],
  symbolPresets: [
    {
      id: 'sym-suture',
      label: 'Sutures',
      tool: 'curve',
      strokeStyle: 'sutured',
      colour: '#6d28d9',
      width: 4,
      classId: 'scar',
    },
    {
      id: 'sym-lattice',
      label: 'Lattice',
      tool: 'polygon',
      fillPattern: 'lattice',
      colour: '#2563eb',
      width: 3,
    },
  ],
  layers: [
    {
      id: 'annot-1',
      tool: 'circle',
      label: 'Index lesion',
      color: '#dc2626',
      strokeWidth: 3,
      visible: true,
      classIds: ['lesion', 'unknown-id'],
      center: { x: 0.3, y: 0.4 },
      radiusX: 0.1,
      radiusY: 0.08,
    },
    {
      id: 'annot-2',
      tool: 'text',
      label: 'Note',
      color: '#111827',
      strokeWidth: 2,
      visible: true,
      point: { x: 0.7, y: 0.25 },
      text: '6mm',
      fontSize: 20,
    },
  ],
};

describe('l4-annotation-canvas logic', () => {
  it('normalizes canvas state and filters unknown classIds', () => {
    const norm = normalizeCanvasState(baseState);
    expect(norm.selectedImageId).toBe('img-1');
    expect(norm.selectedLabelId).toBe('lesion');
    expect(norm.layers[0].classIds).toEqual(['lesion']);
    expect(clampUnit(-0.4)).toBe(0);
    expect(clampUnit(1.5)).toBe(1);
    expect(clampBrushWidth(undefined)).toBe(2);
    expect(clampBrushWidth(20)).toBe(12);
    expect(canvasSurfaceSize(norm)).toEqual({ width: 800, height: 600, aspectRatio: 800 / 600 });
  });

  it('generates unique layer ids skipping existing ones', () => {
    const first = nextUniqueLayerId(baseState.layers, 0);
    expect(first.id).toBe('annot-3');
    expect(first.nextCounter).toBe(3);
  });

  it('applies symbol presets and clears symbol overrides on tool switch', () => {
    const withSymbol = applySymbolPresetToState(baseState, 'sym-suture');
    expect(withSymbol.selectedSymbolId).toBe('sym-suture');
    expect(withSymbol.selectedTool).toBe('curve');
    expect(withSymbol.brushStrokeStyle).toBe('sutured');
    expect(withSymbol.brushColor).toBe('#6d28d9');
    expect(withSymbol.brushWidth).toBe(4);
    expect(withSymbol.selectedLabelId).toBe('scar');

    const switched = activateToolInState(withSymbol, 'line');
    expect(switched.selectedTool).toBe('line');
    expect(switched.selectedSymbolId).toBeUndefined();
    expect(switched.brushStrokeStyle).toBeUndefined();
    expect(switched.brushFillPattern).toBeUndefined();
  });

  it('creates text, line, arrow, callout, circle, freeform, and polygon layers from drafts', () => {
    const norm = normalizeCanvasState({ ...baseState, textContent: 'Margin 2cm' });
    const textLayer = createLayerFromText(norm, { x: 0.2, y: 0.3 }, 't1');
    expect(textLayer.tool).toBe('text');
    expect(textLayer.text).toBe('Margin 2cm');

    const arrowNull = createLayerFromDraft(
      norm,
      { tool: 'arrow', points: [{ x: 0.5, y: 0.5 }] },
      { x: 0.501, y: 0.501 },
      'a0',
    );
    expect(arrowNull).toBeNull();

    const callout = createLayerFromDraft(
      norm,
      { tool: 'callout', points: [{ x: 0.2, y: 0.2 }] },
      { x: 0.5, y: 0.5 },
      'c1',
      1000,
    );
    expect(callout?.tool).toBe('callout');
    if (callout?.tool === 'callout') {
      expect(callout.text).toBe('Margin 2cm');
      expect(callout.fontSize).toBe(30);
    }

    const circle = createLayerFromDraft(
      norm,
      { tool: 'circle', points: [{ x: 0.5, y: 0.5 }] },
      { x: 0.65, y: 0.6 },
      'cir1',
    );
    expect(circle?.tool).toBe('circle');

    const polyState = applySymbolPresetToState(norm, 'sym-lattice');
    const poly = createPolygonLayer(
      polyState,
      [
        { x: 0.1, y: 0.1 },
        { x: 0.3, y: 0.1 },
        { x: 0.2, y: 0.3 },
      ],
      'p1',
    );
    expect(poly?.fillPattern).toBe('lattice');
  });

  it('extends polygon drafts and detects closing click near first vertex', () => {
    const s1 = extendPolygonDraft(null, { x: 0.2, y: 0.2 });
    expect(s1.action).toBe('update');
    if (s1.action !== 'update') return;
    const s2 = extendPolygonDraft(s1.draft, { x: 0.6, y: 0.2 });
    if (s2.action !== 'update') return;
    const s3 = extendPolygonDraft(s2.draft, { x: 0.4, y: 0.6 });
    if (s3.action !== 'update') return;
    const closed = extendPolygonDraft(s3.draft, { x: 0.205, y: 0.205 });
    expect(closed.action).toBe('close');
  });

  it('toggles visibility, moves layers, and removes layers', () => {
    const toggled = toggleLayerVisibilityInState(baseState, 'annot-1');
    expect(toggled.layers[0].visible).toBe(false);

    const moved = moveLayerInState(baseState, 'annot-1', 1);
    expect(moved.layers.map(l => l.id)).toEqual(['annot-2', 'annot-1']);

    const removed = removeLayerFromState({ ...baseState, selectedLayerId: 'annot-1' }, 'annot-1');
    expect(removed.layers).toHaveLength(1);
    expect(removed.selectedLayerId).toBeUndefined();
  });

  it('lays out gutter markers and builds toolbar/list view models', () => {
    const markers = layoutAnnotationMarkers(baseState.layers, 4 / 3);
    expect(markers).toHaveLength(2);
    expect(markers[0].number).toBe(1);
    expect(markers[1].number).toBe(2);

    const tb = buildToolbarViewModel(baseState, {
      canUndo: true,
      canRedo: false,
      zoom: 100,
      zoomLocked: false,
    });
    expect(tb.selectedToolId).toBe('line');
    expect(tb.selectedColourId).toBe('red');
    expect(tb.selectedWidthId).toBe('w3');
    expect(nextZoomStep(100, 'in')).toBe(150);
    expect(nextZoomStep(100, 'out')).toBe(75);

    const list = buildListViewModel(baseState, true);
    expect(list.items[0].classLabel).toBe('Lesion');
    expect(list.readOnly).toBe(false);
  });

  it('computes React Native View segments for lines, arrows, sutures, staples, polygons, and drafts', () => {
    const arrowSegs = computeArrowSegments(
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.5 },
      400,
      300,
      3,
      '#dc2626',
      'arr',
    );
    expect(arrowSegs).toHaveLength(3);

    const sutureLayer: AnnotationLayerRecord = {
      id: 'sut-1',
      tool: 'curve',
      label: 'Suture',
      color: '#6d28d9',
      strokeWidth: 3,
      visible: true,
      strokeStyle: 'sutured',
      points: [
        { x: 0.1, y: 0.5 },
        { x: 0.9, y: 0.5 },
      ],
    };
    const sutureSegs = computeLayerSegments(sutureLayer, 400, 300);
    expect(sutureSegs.length).toBeGreaterThan(5);

    const stapleTicks = computeSutureOrStapleSegments(
      [
        { x: 0.1, y: 0.5 },
        { x: 0.5, y: 0.5 },
      ],
      false,
      'stapled',
      400,
      300,
      3,
      '#475569',
      'stp',
    );
    expect(stapleTicks.length).toBeGreaterThan(3);

    const draftSegs = computeDraftSegments(
      {
        tool: 'polygon',
        points: [
          { x: 0.1, y: 0.1 },
          { x: 0.4, y: 0.1 },
          { x: 0.3, y: 0.4 },
        ],
      },
      400,
      300,
      '#2563eb',
      3,
    );
    expect(draftSegs).toHaveLength(3);

    const calloutPos = computeCalloutLabelPosition(
      {
        id: 'cal-1',
        tool: 'callout',
        label: 'Note',
        color: '#111827',
        strokeWidth: 2,
        visible: true,
        points: [
          { x: 0.2, y: 0.3 },
          { x: 0.6, y: 0.35 },
        ],
        text: 'Note',
        fontSize: 20,
      },
      400,
      300,
    );
    expect(calloutPos.textAlign).toBe('right');
  });
});
