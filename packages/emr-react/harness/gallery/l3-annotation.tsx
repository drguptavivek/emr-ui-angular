'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  filterImageTemplates,
  type AnnotationLayerRecord,
  type AnnotationListIntent,
  type AnnotationListItem,
  type AnnotationToolbarIntent,
  type AnnotationToolbarViewModel,
  type ClinicalFormIntent,
  type ImageTemplateGroup,
  type ImageTemplateOption,
  type ImageTemplatePickerIntent,
  type RepeatableGroupDefinition,
  type RepeatableItemState,
  type ToolbarColour,
  type ToolbarTool,
} from '@drguptavivek/emr-controller';
import {
  EmrAnnotationList,
  EmrAnnotationToolbar,
  EmrImageTemplatePicker,
  EmrRepeatableGroup,
} from '../../src/l3-annotation';
import type { GallerySection } from './types';

// ---------------------------------------------------------------------------
// 1. EmrRepeatableGroup demo
// ---------------------------------------------------------------------------

const medicationGroupDef: RepeatableGroupDefinition = {
  kind: 'repeatable',
  id: 'discharge-meds',
  label: 'Topical eye drops',
  description: 'Record each drop, eye, and frequency.',
  addLabel: 'Add drop',
  fields: [
    { id: 'drug', label: 'Medication', type: 'text', required: true, span: 6, placeholder: 'e.g. Prednisolone 1%' },
    {
      id: 'eye',
      label: 'Eye',
      type: 'select',
      span: 6,
      options: [
        { value: 'OD', label: 'Right (OD)' },
        { value: 'OS', label: 'Left (OS)' },
        { value: 'OU', label: 'Both (OU)' },
      ],
    },
    { id: 'freq', label: 'Frequency', type: 'text', span: 6, placeholder: 'e.g. 4 times daily' },
    { id: 'days', label: 'Duration', type: 'quantity', unit: 'days', span: 6 },
  ],
};

const initialRepeatItems: readonly RepeatableItemState[] = [
  {
    id: 'item-1',
    label: 'Drop 1',
    fields: {
      drug: { value: 'Moxifloxacin 0.5%' },
      eye: { value: 'OD' },
      freq: { value: '4 times daily' },
      days: { value: { value: 7, unit: 'days' } },
    },
  },
  {
    id: 'item-2',
    label: 'Drop 2 (locked)',
    readOnly: true,
    fields: {
      drug: { value: 'Carboxymethylcellulose 0.5%' },
      eye: { value: 'OU' },
      freq: { value: 'PRN' },
      days: { value: { value: 30, unit: 'days' } },
    },
  },
];

function RepeatableGroupDemo({ readOnly, empty }: { readOnly?: boolean; empty?: boolean }) {
  const [items, setItems] = useState<readonly RepeatableItemState[]>(empty ? [] : initialRepeatItems);
  const [lastIntent, setLastIntent] = useState('none');

  const onIntent = (intent: ClinicalFormIntent) => {
    setLastIntent(JSON.stringify(intent));
    switch (intent.type) {
      case 'repeatItemAddRequested':
        setItems(prev => [
          ...prev,
          {
            id: `item-${prev.length + 1}`,
            fields: {
              drug: { value: '' },
              eye: { value: null },
              freq: { value: '' },
              days: { value: { value: null, unit: 'days' } },
            },
          },
        ]);
        break;
      case 'repeatItemRemoveRequested':
        setItems(prev => prev.filter(it => it.id !== intent.itemId));
        break;
      case 'repeatItemEditRequested':
        setItems(prev =>
          prev.map(it =>
            it.id === intent.itemId
              ? {
                  ...it,
                  fields: {
                    ...it.fields,
                    [intent.fieldId]: { ...it.fields[intent.fieldId], value: intent.value },
                  },
                }
              : it,
          ),
        );
        break;
      case 'repeatItemStatusEditRequested':
        setItems(prev =>
          prev.map(it =>
            it.id === intent.itemId
              ? {
                  ...it,
                  fields: {
                    ...it.fields,
                    [intent.fieldId]: {
                      ...it.fields[intent.fieldId],
                      value: it.fields[intent.fieldId]?.value ?? null,
                      assessmentStatus: intent.status,
                    },
                  },
                }
              : it,
          ),
        );
        break;
      default:
        break;
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <EmrRepeatableGroup
        definition={medicationGroupDef}
        model={items}
        readOnly={readOnly}
        idPrefix={readOnly ? 'ro' : empty ? 'empty' : 'live'}
        onIntent={onIntent}
      />
      <Text>{`Last intent: ${lastIntent}`}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrAnnotationToolbar demo
// ---------------------------------------------------------------------------

const tool = (id: string, label: string, icon: string, shortcutLabel?: string): ToolbarTool => ({
  id,
  label,
  icon,
  shortcutLabel,
});

const ALL_TOOLS: readonly ToolbarTool[] = [
  tool('select', 'Select', 'heroCursorArrowRays', 'V'),
  tool('move', 'Move', 'heroArrowsPointingOut', 'M'),
  tool('eraser', 'Eraser', 'shape-eraser', 'E'),
  tool('text', 'Text', 'shape-text', 'T'),
  tool('line', 'Line', 'shape-line', 'L'),
  tool('arrow', 'Arrow', 'shape-arrow', 'A'),
  tool('curve', 'Curve', 'shape-curve', 'C'),
  tool('rect', 'Rectangle', 'shape-rect', 'R'),
  tool('ellipse', 'Ellipse', 'shape-ellipse', 'O'),
  tool('polygon', 'Polygon', 'shape-polygon', 'P'),
  tool('freehand', 'Freehand', 'shape-freehand', 'F'),
];

const COLOURS: readonly ToolbarColour[] = [
  { id: 'red', label: 'Red', hex: '#d92d20' },
  { id: 'blue', label: 'Blue', hex: '#1d4ed8' },
  { id: 'green', label: 'Green', hex: '#15803d' },
  { id: 'yellow', label: 'Yellow', hex: '#facc15' },
  { id: 'black', label: 'Black', hex: '#111827' },
  { id: 'white', label: 'White', hex: '#ffffff' },
];

const WIDTHS = [
  { id: 'w1', label: 'Thin, 1 px', px: 1 },
  { id: 'w2', label: 'Medium, 3 px', px: 3 },
  { id: 'w3', label: 'Thick, 6 px', px: 6 },
] as const;

function AnnotationToolbarDemo({ readOnly }: { readOnly?: boolean }) {
  const [zoomPct, setZoomPct] = useState(readOnly ? 75 : 100);
  const [model, setModel] = useState<AnnotationToolbarViewModel>({
    tools: ALL_TOOLS,
    selectedToolId: 'line',
    colours: COLOURS,
    selectedColourId: 'red',
    widths: WIDTHS,
    selectedWidthId: 'w2',
    canUndo: true,
    canRedo: true,
    zoomLabel: `${readOnly ? 75 : 100}%`,
    canSave: !readOnly,
    saveLabel: 'Save annotations',
    readOnly,
  });
  const [lastIntent, setLastIntent] = useState('none');

  const onIntent = (intent: AnnotationToolbarIntent) => {
    setLastIntent(JSON.stringify(intent));
    switch (intent.type) {
      case 'toolSelected':
        setModel(m => ({ ...m, selectedToolId: intent.toolId }));
        break;
      case 'colourSelected':
        setModel(m => ({ ...m, selectedColourId: intent.colourId }));
        break;
      case 'widthSelected':
        setModel(m => ({ ...m, selectedWidthId: intent.widthId }));
        break;
      case 'zoomInRequested': {
        const next = Math.min(400, zoomPct + 25);
        setZoomPct(next);
        setModel(m => ({ ...m, zoomLabel: `${next}%` }));
        break;
      }
      case 'zoomOutRequested': {
        const next = Math.max(25, zoomPct - 25);
        setZoomPct(next);
        setModel(m => ({ ...m, zoomLabel: `${next}%` }));
        break;
      }
      case 'zoomResetRequested':
      case 'zoomFitRequested':
        setZoomPct(100);
        setModel(m => ({ ...m, zoomLabel: '100%' }));
        break;
      default:
        break;
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <EmrAnnotationToolbar model={model} onIntent={onIntent} />
      <Text>{`Last intent: ${lastIntent}`}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrAnnotationList demo
// ---------------------------------------------------------------------------

const commonLayer = { strokeWidth: 3, visible: true };
const seedLayers: readonly AnnotationListItem[] = [
  {
    layer: {
      ...commonLayer,
      id: 'l1',
      label: 'Superotemporal naevus',
      color: '#d92d20',
      tool: 'circle',
      center: { x: 0.42, y: 0.38 },
      radiusX: 0.08,
      radiusY: 0.07,
    } as AnnotationLayerRecord,
    number: 1,
    classLabel: 'Lesion',
  },
  {
    layer: {
      ...commonLayer,
      id: 'l2',
      label: 'Incision',
      color: '#1d4ed8',
      tool: 'line',
      points: [
        { x: 0.2, y: 0.5 },
        { x: 0.6, y: 0.55 },
      ],
    } as AnnotationLayerRecord,
    number: 2,
    classLabel: 'Incision',
  },
  {
    layer: {
      ...commonLayer,
      id: 'l3',
      label: 'Lesion margin',
      color: '#15803d',
      tool: 'freeform',
      points: [
        { x: 0.3, y: 0.3 },
        { x: 0.35, y: 0.33 },
        { x: 0.4, y: 0.3 },
      ],
    } as AnnotationLayerRecord,
    number: 3,
    classLabel: 'Margin',
    description: "Drawn at 12 o'clock edge of the plaque",
  },
  {
    layer: {
      ...commonLayer,
      id: 'l4',
      label: 'Erythema spreading laterally',
      color: '#111827',
      tool: 'text',
      point: { x: 0.7, y: 0.2 },
      text: 'Erythema spreading laterally',
      fontSize: 14,
    } as AnnotationLayerRecord,
    number: 4,
  },
];

function AnnotationListDemo({
  readOnly,
  empty,
  canLock = true,
}: {
  readOnly?: boolean;
  empty?: boolean;
  canLock?: boolean;
}) {
  const [items, setItems] = useState<readonly AnnotationListItem[]>(empty ? [] : seedLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>(empty ? undefined : 'l2');
  const [lastIntent, setLastIntent] = useState('none');

  const onIntent = (intent: AnnotationListIntent) => {
    setLastIntent(JSON.stringify(intent));
    switch (intent.type) {
      case 'layerSelected':
        setSelectedLayerId(intent.layerId);
        break;
      case 'layerVisibilityToggleRequested':
        setItems(prev =>
          prev.map(it =>
            it.layer.id === intent.layerId
              ? { ...it, layer: { ...it.layer, visible: !it.layer.visible } }
              : it,
          ),
        );
        break;
      case 'layerLockToggleRequested':
        setItems(prev =>
          prev.map(it =>
            it.layer.id === intent.layerId ? { ...it, locked: !it.locked } : it,
          ),
        );
        break;
      case 'layerMoveRequested':
        setItems(prev => {
          const idx = prev.findIndex(it => it.layer.id === intent.layerId);
          if (idx < 0) return prev;
          const targetIdx = intent.direction === 'up' ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= prev.length) return prev;
          const next = [...prev];
          const [moved] = next.splice(idx, 1);
          next.splice(targetIdx, 0, moved);
          return next.map((it, i) => ({ ...it, number: i + 1 }));
        });
        break;
      case 'layerRemoveRequested':
        setItems(prev =>
          prev
            .filter(it => it.layer.id !== intent.layerId)
            .map((it, i) => ({ ...it, number: i + 1 })),
        );
        break;
      default:
        break;
    }
  };

  return (
    <View style={{ gap: 8, maxWidth: 560 }}>
      <EmrAnnotationList
        model={{
          items,
          selectedLayerId,
          emptyMessage: 'No annotations yet. Pick a tool and draw on the image.',
          readOnly,
          canLock,
        }}
        onIntent={onIntent}
      />
      <Text>{`Last intent: ${lastIntent}`}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrImageTemplatePicker demo
// ---------------------------------------------------------------------------

const svgDataUri = (circleColor: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><circle cx="60" cy="60" r="46" fill="none" stroke="${circleColor}" stroke-width="3"/><circle cx="60" cy="60" r="14" fill="none" stroke="${circleColor}" stroke-width="2"/><text x="60" y="112" text-anchor="middle" font-size="11" fill="${circleColor}" font-family="sans-serif">${label}</text></svg>`,
  )}`;

const TEMPLATE_GROUPS: readonly ImageTemplateGroup[] = [
  { id: 'retina', label: 'Eye — retina', count: 2 },
  { id: 'cornea', label: 'Eye — cornea', count: 2 },
  { id: 'optic-disc', label: 'Eye — optic disc', count: 1 },
  { id: 'anterior-segment', label: 'Eye — anterior segment', count: 1 },
];

const ALL_TEMPLATES: readonly ImageTemplateOption[] = [
  {
    id: 'retina-posterior-pole-od',
    label: 'Retina — posterior pole (OD)',
    imageUrl: svgDataUri('#263847', 'Retina OD'),
    width: 120,
    height: 120,
    groupId: 'retina',
    badges: ['Right', 'Posterior'],
  },
  {
    id: 'retina-posterior-pole-os',
    label: 'Retina — posterior pole (OS)',
    imageUrl: svgDataUri('#263847', 'Retina OS'),
    width: 120,
    height: 120,
    groupId: 'retina',
    badges: ['Left', 'Posterior'],
  },
  {
    id: 'cornea-frontal-od',
    label: 'Cornea — frontal & cross-section (OD)',
    imageUrl: svgDataUri('#486f86', 'Cornea OD'),
    width: 120,
    height: 120,
    groupId: 'cornea',
    badges: ['Right', 'Anterior'],
  },
  {
    id: 'cornea-frontal-os',
    label: 'Cornea — frontal & cross-section (OS)',
    imageUrl: svgDataUri('#486f86', 'Cornea OS'),
    width: 120,
    height: 120,
    groupId: 'cornea',
    badges: ['Left', 'Anterior'],
  },
  {
    id: 'optic-disc-bilateral',
    label: 'Optic disc — bilateral comparison',
    imageUrl: svgDataUri('#2b7650', 'Optic Disc'),
    width: 120,
    height: 120,
    groupId: 'optic-disc',
    badges: ['Both', 'Fundus'],
  },
  {
    id: 'anterior-segment-od',
    label: 'Anterior segment — gonioscopy (OD)',
    imageUrl: svgDataUri('#8a651f', 'Anterior OD'),
    width: 120,
    height: 120,
    groupId: 'anterior-segment',
    badges: ['Right', 'Anterior'],
  },
];

function ImageTemplatePickerDemo({ readOnly }: { readOnly?: boolean }) {
  const [query, setQuery] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>('retina-posterior-pole-od');
  const [favouriteIds, setFavouriteIds] = useState<readonly string[]>([
    'retina-posterior-pole-od',
    'cornea-frontal-od',
  ]);
  const [lastIntent, setLastIntent] = useState('none');

  const options = filterImageTemplates(
    ALL_TEMPLATES,
    query,
    groupId,
    TEMPLATE_GROUPS,
    favouriteIds,
  );

  const onIntent = (intent: ImageTemplatePickerIntent) => {
    setLastIntent(JSON.stringify(intent));
    switch (intent.type) {
      case 'queryChangeRequested':
        setQuery(intent.query);
        break;
      case 'groupSelected':
        setGroupId(intent.groupId ?? undefined);
        break;
      case 'templateSelected':
        setSelectedId(intent.templateId);
        break;
      case 'favouriteToggleRequested':
        setFavouriteIds(prev =>
          intent.favourite
            ? [...prev.filter(id => id !== intent.templateId), intent.templateId]
            : prev.filter(id => id !== intent.templateId),
        );
        break;
      case 'closeRequested':
        break;
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <EmrImageTemplatePicker
        model={{
          title: 'Choose an outline',
          options,
          groups: TEMPLATE_GROUPS,
          selectedGroupId: groupId,
          query,
          selectedId,
          totalLabel: `${options.length} of ${ALL_TEMPLATES.length} outlines`,
          emptyMessage: 'No outlines match your search.',
          readOnly,
          favouriteIds,
          canEditFavourites: true,
        }}
        onIntent={onIntent}
      />
      <Text>{`Last intent: ${lastIntent}`}</Text>
    </View>
  );
}

export const gallery: GallerySection[] = [
  {
    id: 'repeatable-group',
    title: 'EmrRepeatableGroup (interactive)',
    render: () => <RepeatableGroupDemo />,
  },
  {
    id: 'repeatable-group-empty',
    title: 'EmrRepeatableGroup (empty)',
    render: () => <RepeatableGroupDemo empty />,
  },
  {
    id: 'repeatable-group-readonly',
    title: 'EmrRepeatableGroup (read-only)',
    render: () => <RepeatableGroupDemo readOnly />,
  },
  {
    id: 'annotation-toolbar',
    title: 'EmrAnnotationToolbar (all tools + pen panel)',
    render: () => <AnnotationToolbarDemo />,
  },
  {
    id: 'annotation-toolbar-readonly',
    title: 'EmrAnnotationToolbar (read-only)',
    render: () => <AnnotationToolbarDemo readOnly />,
  },
  {
    id: 'annotation-list',
    title: 'EmrAnnotationList (interactive layers)',
    render: () => <AnnotationListDemo />,
  },
  {
    id: 'annotation-list-readonly',
    title: 'EmrAnnotationList (read-only legend)',
    render: () => <AnnotationListDemo readOnly />,
  },
  {
    id: 'annotation-list-empty',
    title: 'EmrAnnotationList (empty)',
    render: () => <AnnotationListDemo empty />,
  },
  {
    id: 'image-template-picker',
    title: 'EmrImageTemplatePicker (favourites, search, filter chips)',
    render: () => <ImageTemplatePickerDemo />,
  },
  {
    id: 'image-template-picker-readonly',
    title: 'EmrImageTemplatePicker (read-only)',
    render: () => <ImageTemplatePickerDemo readOnly />,
  },
];
