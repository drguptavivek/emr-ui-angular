import { describe, expect, it } from 'vitest';
import type {
  AnnotationLayerRecord,
  AnnotationListItem,
  AnnotationToolbarViewModel,
  ImageTemplateOption,
  ImageTemplatePickerViewModel,
} from '@drguptavivek/emr-controller';
import {
  FAVOURITES_GROUP_ID,
  annotationFullSummary,
  annotationLayerGlyph,
  annotationLayerGlyphId,
  annotationLayerToolName,
  annotationListTabStopId,
  annotationPrimaryLabel,
  annotationSecondaryLabel,
  canEditTemplateFavourites,
  filterImageTemplates,
  hasToolbarPen,
  isKnownToolIcon,
  isRepeatableStacked,
  isTemplateFavourite,
  partitionImageTemplates,
  repeatableControlId,
  repeatableFieldSpanPercent,
  repeatableFocusFieldId,
  showFavouritePinHint,
  showFavouritesFilterChip,
  templateGridNextIndex,
  templateTabStopId,
  templateTileLabel,
  toolbarActiveTabStop,
  toolbarEnabledKeys,
  toolbarPenLabel,
  toolbarRovingNextKey,
  toolbarToolGlyph,
  toolbarToolTitle,
} from './l3-annotation.logic';

describe('l3-annotation logic', () => {
  describe('repeatable group helpers', () => {
    it('stacks below 720px only once measured', () => {
      expect(isRepeatableStacked(0)).toBe(false);
      expect(isRepeatableStacked(480)).toBe(true);
      expect(isRepeatableStacked(720)).toBe(false);
    });

    it('computes field span percentage and control/focus ids', () => {
      expect(repeatableFieldSpanPercent(undefined, false)).toBe('50%');
      expect(repeatableFieldSpanPercent(4, false)).toBe(`${(4 / 12) * 100}%`);
      expect(repeatableFieldSpanPercent(4, true)).toBe('100%');
      expect(repeatableControlId('meds', 'i1', 'dose')).toBe('meds-i1-dose');
      expect(repeatableControlId('meds', 'i1', 'dose', 'form')).toBe('form-meds-i1-dose');
      expect(repeatableFocusFieldId('meds', 'i1', 'dose')).toBe('meds.i1.dose');
    });
  });

  describe('annotation toolbar helpers', () => {
    const baseToolbar: AnnotationToolbarViewModel = {
      tools: [
        { id: 'select', label: 'Select', icon: 'heroCursorArrowRays', shortcutLabel: 'V' },
        { id: 'line', label: 'Line', icon: 'shape-line', shortcutLabel: 'L' },
        { id: 'custom', label: 'Marker', icon: 'unknown-icon', disabled: true },
      ],
      selectedToolId: 'line',
      colours: [
        { id: 'red', label: 'Red', hex: '#d92d20' },
        { id: 'blue', label: 'Blue', hex: '#1d4ed8' },
      ],
      selectedColourId: 'red',
      widths: [
        { id: 'w1', label: 'Thin, 1 px', px: 1 },
        { id: 'w2', label: 'Medium, 3 px', px: 3 },
      ],
      selectedWidthId: 'w2',
      canUndo: true,
      canRedo: false,
      zoomLabel: '100%',
      canSave: true,
      saveLabel: 'Save annotations',
    };

    it('resolves known tool icons and falls back to initial for unknown icons', () => {
      expect(isKnownToolIcon('shape-line')).toBe(true);
      expect(isKnownToolIcon('heroCursorArrowRays')).toBe(true);
      expect(isKnownToolIcon('unknown-icon')).toBe(false);
      expect(toolbarToolGlyph({ icon: 'shape-line', label: 'Line' })).toBe('╱');
      expect(toolbarToolGlyph({ icon: 'unknown-icon', label: 'Marker' })).toBe('M');
      expect(toolbarToolTitle({ label: 'Line', shortcutLabel: 'L' })).toBe('Line (L)');
      expect(toolbarToolTitle({ label: 'Line' })).toBe('Line');
    });

    it('formats pen summary and detects pen availability', () => {
      expect(hasToolbarPen(baseToolbar)).toBe(true);
      expect(hasToolbarPen({ colours: [], widths: [] })).toBe(false);
      expect(toolbarPenLabel(baseToolbar)).toBe('Pen: Red, Medium, 3 px');
      expect(toolbarPenLabel({ colours: [], widths: [] })).toBe('Pen colour and width');
    });

    it('computes enabled keys, active tab stop, and roving key movement', () => {
      const keys = toolbarEnabledKeys(baseToolbar);
      expect(keys).toEqual(['t:select', 't:line', 'pen', 'undo', 'zoomOut', 'zoomReset', 'zoomIn', 'zoomFit', 'save']);
      expect(toolbarActiveTabStop(baseToolbar)).toBe('t:line');
      expect(toolbarActiveTabStop(baseToolbar, 'undo')).toBe('undo');
      expect(toolbarRovingNextKey('ArrowRight', 'save', keys)).toBe('t:select');
      expect(toolbarRovingNextKey('ArrowLeft', 't:select', keys)).toBe('save');
      expect(toolbarRovingNextKey('Home', 'undo', keys)).toBe('t:select');
      expect(toolbarRovingNextKey('End', 'undo', keys)).toBe('save');

      const readOnlyKeys = toolbarEnabledKeys({ ...baseToolbar, readOnly: true });
      expect(readOnlyKeys).toEqual(['zoomOut', 'zoomReset', 'zoomIn', 'zoomFit']);
    });
  });

  describe('annotation list helpers', () => {
    const layer: AnnotationLayerRecord = {
      id: 'l1',
      label: 'Superotemporal naevus',
      color: '#d92d20',
      strokeWidth: 3,
      visible: true,
      tool: 'circle',
      center: { x: 0.4, y: 0.4 },
      radiusX: 0.1,
      radiusY: 0.1,
    };
    const item: AnnotationListItem = {
      layer,
      number: 1,
      classLabel: 'Lesion',
      description: '12 o’clock margin',
    };

    it('resolves primary, secondary, full summary, and tool labels', () => {
      expect(annotationPrimaryLabel(item)).toBe('Lesion');
      expect(annotationSecondaryLabel(item)).toBe('Superotemporal naevus');
      expect(annotationSecondaryLabel({ ...item, classLabel: 'Superotemporal naevus' })).toBe('');
      expect(annotationFullSummary(item)).toBe('Lesion · Superotemporal naevus · 12 o’clock margin');
      expect(annotationLayerGlyphId('circle')).toBe('shape-ellipse');
      expect(annotationLayerGlyph('circle')).toBe('◯');
      expect(annotationLayerToolName('circle')).toBe('Circle');
    });

    it('picks the roving tab stop id', () => {
      const items: AnnotationListItem[] = [item, { layer: { ...layer, id: 'l2' }, number: 2 }];
      expect(annotationListTabStopId({ items, selectedLayerId: 'l2' })).toBe('l2');
      expect(annotationListTabStopId({ items, selectedLayerId: 'l2' }, 'l1')).toBe('l1');
      expect(annotationListTabStopId({ items, selectedLayerId: 'missing' })).toBe('l1');
    });
  });

  describe('image template picker helpers', () => {
    const options: readonly ImageTemplateOption[] = [
      { id: 't1', label: 'Retina OD', imageUrl: '/r-od.svg', width: 200, height: 200, groupId: 'retina', badges: ['Right', 'Posterior'] },
      { id: 't2', label: 'Retina OS', imageUrl: '/r-os.svg', width: 200, height: 200, groupId: 'retina', badges: ['Left'] },
      { id: 't3', label: 'Cornea OD', imageUrl: '/c-od.svg', width: 200, height: 200, groupId: 'cornea', badges: ['Right'] },
    ];
    const basePicker: ImageTemplatePickerViewModel = {
      title: 'Choose an outline',
      options,
      groups: [
        { id: 'retina', label: 'Retina', count: 2 },
        { id: 'cornea', label: 'Cornea', count: 1 },
      ],
      query: '',
      emptyMessage: 'No outlines match.',
      favouriteIds: ['t3', 't1'],
      canEditFavourites: true,
    };

    it('partitions options into favourites in favouriteIds order followed by rest', () => {
      const p = partitionImageTemplates(basePicker);
      expect(p.favs.map(o => o.id)).toEqual(['t3', 't1']);
      expect(p.rest.map(o => o.id)).toEqual(['t2']);
      expect(p.flat.map(o => o.id)).toEqual(['t3', 't1', 't2']);
    });

    it('filters templates and computes favourite flags and tile labels', () => {
      expect(filterImageTemplates(options, 'left', null, basePicker.groups, basePicker.favouriteIds).map(o => o.id)).toEqual(['t2']);
      expect(filterImageTemplates(options, '', FAVOURITES_GROUP_ID, basePicker.groups, basePicker.favouriteIds).map(o => o.id)).toEqual(['t3', 't1']);
      expect(canEditTemplateFavourites(basePicker)).toBe(true);
      expect(canEditTemplateFavourites({ ...basePicker, readOnly: true })).toBe(false);
      expect(showFavouritesFilterChip(basePicker)).toBe(true);
      expect(showFavouritePinHint({ ...basePicker, favouriteIds: [] })).toBe(true);
      expect(isTemplateFavourite(basePicker, 't3')).toBe(true);
      expect(isTemplateFavourite(basePicker, 't2')).toBe(false);
      expect(templateTileLabel(options[0])).toBe('Retina OD, Right, Posterior');
      expect(templateTabStopId(options, 't2')).toBe('t2');
    });

    it('navigates across favourite and rest grids by keyboard', () => {
      expect(templateGridNextIndex('ArrowRight', 0, 5, 2, 2)).toBe(1);
      expect(templateGridNextIndex('ArrowDown', 0, 5, 2, 2)).toBe(2);
      expect(templateGridNextIndex('ArrowUp', 2, 5, 2, 2)).toBe(0);
      expect(templateGridNextIndex('End', 0, 5, 2, 2)).toBe(4);
      expect(templateGridNextIndex('Home', 4, 5, 2, 2)).toBe(0);
    });
  });
});
