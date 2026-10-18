'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type {
  AnnotationSymbolSet,
  EmrAnnotationLabel,
  EmrClinicalAnnotationCanvasIntent,
  EmrClinicalAnnotationCanvasState,
} from '@drguptavivek/emr-controller';
import { EmrClinicalAnnotationCanvas } from '../../src/l4-annotation-canvas';
import type { GallerySection } from './types';

const placeholderSize = { width: 1400, height: 900 } as const;
const slate = '#475f70';

const svgFromText = (label: string, subtitle: string, accent: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">` +
      `<rect width="1400" height="900" fill="#f8fafc"/>` +
      `<rect x="55" y="55" width="1290" height="790" rx="20" fill="#fff" stroke="#cbd5e1" stroke-width="6"/>` +
      `<text x="90" y="140" fill="${accent}" font-size="46" font-family="Inter,system-ui,sans-serif" font-weight="700">${label}</text>` +
      `<text x="90" y="188" fill="#64748b" font-size="25" font-family="Inter,system-ui,sans-serif">${subtitle}</text>` +
      `<path d="M90 260h1220M90 420h1220M90 580h1220M90 740h1220" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round"/>` +
      `</svg>`,
  )}`;

const penColours = [
  { id: 'slate', label: 'Slate', hex: '#475f70' },
  { id: 'red', label: 'Red', hex: '#dc2626' },
  { id: 'blue', label: 'Blue', hex: '#2563eb' },
  { id: 'green', label: 'Green', hex: '#15803d' },
  { id: 'amber', label: 'Amber', hex: '#b45309' },
  { id: 'purple', label: 'Purple', hex: '#7c3aed' },
] as const;

const penWidths = [
  { id: 'fine', label: 'Fine', px: 2 },
  { id: 'medium', label: 'Medium', px: 3 },
  { id: 'bold', label: 'Bold', px: 4 },
  { id: 'heavy', label: 'Heavy', px: 6 },
] as const;

const dermatologyLabels: EmrAnnotationLabel[] = [
  { id: 'lesion', label: 'Lesion', color: '#dc2626' },
  { id: 'scar', label: 'Scar', color: '#475569' },
  { id: 'excoriation', label: 'Excoriation', color: '#ea580c' },
  { id: 'inflammatory', label: 'Inflammatory patch', color: '#be123c' },
  { id: 'normal', label: 'Normal skin', color: '#64748b' },
];

const surgicalLabels: EmrAnnotationLabel[] = [
  { id: 'incision', label: 'Incision', color: '#7c3aed' },
  { id: 'margin', label: 'Margin', color: '#b45309' },
  { id: 'excision', label: 'Excision plan', color: '#be185d' },
  { id: 'landmark', label: 'Landmark', color: '#0369a1' },
  { id: 'normal', label: 'Normal anatomy', color: '#64748b' },
];

const generalFindingsSymbols: AnnotationSymbolSet = {
  id: 'general-findings',
  label: 'General findings',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Synthetic demo symbols',
  labels: [
    { id: 'inflammation', label: 'Inflammation', color: '#dc2626' },
    { id: 'sutures', label: 'Sutures', color: '#6d28d9' },
    { id: 'staples', label: 'Staples', color: '#475569' },
  ],
  presets: [
    {
      id: 'finding-inflammation',
      label: 'Inflammation',
      tool: 'polygon',
      fillPattern: 'hatch',
      colour: '#dc2626',
      width: 3,
      classId: 'inflammation',
    },
    {
      id: 'finding-sutures',
      label: 'Sutures',
      tool: 'curve',
      strokeStyle: 'sutured',
      colour: '#6d28d9',
      width: 3,
      classId: 'sutures',
    },
    {
      id: 'finding-staples',
      label: 'Staples',
      tool: 'curve',
      strokeStyle: 'stapled',
      colour: '#475569',
      width: 3,
      classId: 'staples',
    },
  ],
};

const surgerySymbols: AnnotationSymbolSet = {
  id: 'surgery',
  label: 'Surgery',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Synthetic operative marks',
  labels: [
    { id: 'suture-line', label: 'Suture line', color: '#6d28d9' },
    { id: 'planned-incision', label: 'Planned incision', color: '#be123c' },
    { id: 'drain-site', label: 'Drain site', color: '#0369a1' },
  ],
  presets: [
    {
      id: 'surgery-sutures',
      label: 'Sutures',
      tool: 'curve',
      strokeStyle: 'sutured',
      colour: '#6d28d9',
      width: 3,
      classId: 'suture-line',
    },
    {
      id: 'surgery-planned-incision',
      label: 'Planned incision',
      tool: 'curve',
      strokeStyle: 'dashed',
      colour: '#be123c',
      width: 3,
      classId: 'planned-incision',
    },
    {
      id: 'surgery-drain-site',
      label: 'Drain site',
      tool: 'arrow',
      colour: '#0369a1',
      width: 3,
      classId: 'drain-site',
    },
  ],
};

const retinaSymbols: AnnotationSymbolSet = {
  id: 'retina',
  label: 'Retina',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Conventional retinal colour code',
  labels: [
    { id: 'lattice-degeneration', label: 'Lattice degeneration', color: '#2563eb' },
    { id: 'retinal-break', label: 'Retinal break', color: '#dc2626' },
    { id: 'retina-detached', label: 'Detached retina', color: '#2563eb' },
    { id: 'retina-note', label: 'Note', color: '#334155' },
  ],
  presets: [
    {
      id: 'retina-lattice',
      label: 'Lattice degeneration',
      tool: 'polygon',
      fillPattern: 'lattice',
      colour: '#2563eb',
      width: 3,
      classId: 'lattice-degeneration',
    },
    {
      id: 'retina-break',
      label: 'Retinal break',
      tool: 'polygon',
      colour: '#dc2626',
      width: 3,
      classId: 'retinal-break',
    },
    {
      id: 'retina-detached',
      label: 'Detached retina',
      tool: 'polygon',
      fillPattern: 'hatch',
      colour: '#2563eb',
      width: 3,
      classId: 'retina-detached',
    },
    {
      id: 'retina-callout',
      label: 'Callout note',
      tool: 'callout',
      colour: '#334155',
      width: 3,
      classId: 'retina-note',
    },
  ],
};

const withSymbols = (
  state: EmrClinicalAnnotationCanvasState,
  set: AnnotationSymbolSet,
): EmrClinicalAnnotationCanvasState => ({
  ...state,
  symbolPresets: set.presets,
  availableLabels: [
    ...state.availableLabels,
    ...set.labels.filter(label => !state.availableLabels.some(own => own.id === label.id)),
  ],
});

const dermStoryState: EmrClinicalAnnotationCanvasState = withSymbols(
  {
    instanceId: 'photo-annotator-derm-demo',
    title: 'Dermatology photo annotation',
    description:
      'Upload a skin photo and tag each annotation with lesion class labels for dermatology reporting workflows.',
    imageTemplates: [
      {
        id: 'derm-outline',
        label: 'Dermatology outline',
        imageUrl: svgFromText('Dermatology', 'Right forearm lesion map', slate),
        ...placeholderSize,
        altText: 'Dermatology anatomy outline',
      },
      {
        id: 'derm-sample',
        label: 'Uploaded clinical photo',
        imageUrl: svgFromText('Patient skin photo', 'Right forearm clinical photo', '#0369a1'),
        ...placeholderSize,
        altText: 'Dermatology sample photo',
      },
    ],
    availableLabels: dermatologyLabels,
    selectedImageId: 'derm-sample',
    selectedLabelId: 'lesion',
    selectedTool: 'freeform',
    brushColor: slate,
    brushWidth: 3,
    colourOptions: penColours,
    widthOptions: penWidths,
    textContent: 'ABCD',
    layers: [
      {
        id: 'demo-derm-1',
        tool: 'circle',
        label: 'Index lesion',
        color: '#dc2626',
        strokeWidth: 3,
        visible: true,
        classIds: ['lesion'],
        center: { x: 0.48, y: 0.43 },
        radiusX: 0.11,
        radiusY: 0.08,
      },
      {
        id: 'demo-derm-2',
        tool: 'text',
        label: 'Measurement',
        color: '#334155',
        strokeWidth: 2,
        visible: true,
        classIds: ['normal'],
        point: { x: 0.21, y: 0.2 },
        text: '6 x 4 mm',
        fontSize: 20,
      },
    ],
    selectedLayerId: 'demo-derm-1',
  },
  generalFindingsSymbols,
);

const surgeryDrawState: EmrClinicalAnnotationCanvasState = withSymbols(
  {
    ...dermStoryState,
    instanceId: 'photo-annotator-surgery-demo',
    title: 'Surgery planning annotation',
    description:
      'Upload surgical field images and classify markings like margins, incisions, and landmarks.',
    imageTemplates: [
      {
        id: 'surgery-body',
        label: 'Surgical body template',
        imageUrl: svgFromText('Surgical planning', 'Operative field and incision map', slate),
        ...placeholderSize,
        altText: 'Surgical field template',
      },
    ],
    availableLabels: surgicalLabels,
    selectedImageId: 'surgery-body',
    selectedLabelId: 'landmark',
    selectedTool: 'line',
    layout: 'draw',
    layers: [
      {
        id: 'demo-surg-1',
        tool: 'line',
        label: 'Primary incision',
        color: '#be185d',
        strokeWidth: 3,
        visible: true,
        classIds: ['incision'],
        strokeStyle: 'sutured',
        points: [
          { x: 0.2, y: 0.46 },
          { x: 0.8, y: 0.54 },
        ],
      },
      {
        id: 'demo-surg-2',
        tool: 'polygon',
        label: 'Planned margin',
        color: '#b45309',
        strokeWidth: 3,
        visible: true,
        classIds: ['margin'],
        points: [
          { x: 0.56, y: 0.34 },
          { x: 0.66, y: 0.46 },
          { x: 0.58, y: 0.68 },
          { x: 0.48, y: 0.48 },
        ],
      },
    ],
  },
  surgerySymbols,
);

const retinaSymbolsState: EmrClinicalAnnotationCanvasState = withSymbols(
  {
    ...dermStoryState,
    instanceId: 'photo-annotator-retina-symbols-demo',
    title: 'Retinal drawing: OD periphery',
    description:
      'Standard retinal-drawing colour code: blue hatching for detached retina, blue lattice for lattice degeneration, red for breaks.',
    imageTemplates: [
      {
        id: 'retina-peripheral-od',
        label: 'Retina — peripheral (OD)',
        imageUrl: svgFromText('Retina OD', 'Peripheral retinal chart (OD)', '#2563eb'),
        ...placeholderSize,
        altText: 'Retina peripheral OD outline',
      },
    ],
    availableLabels: [],
    selectedImageId: 'retina-peripheral-od',
    selectedLabelId: 'lattice-degeneration',
    selectedTool: 'polygon',
    selectedSymbolId: 'retina-lattice',
    brushFillPattern: 'lattice',
    brushColor: '#2563eb',
    brushWidth: 3,
    layout: 'draw',
    layers: [
      {
        id: 'sym-lattice',
        tool: 'polygon',
        label: 'Lattice degeneration',
        color: '#2563eb',
        strokeWidth: 3,
        visible: true,
        fillPattern: 'lattice',
        classIds: ['lattice-degeneration'],
        points: [
          { x: 0.68, y: 0.22 },
          { x: 0.82, y: 0.3 },
          { x: 0.85, y: 0.4 },
          { x: 0.72, y: 0.37 },
        ],
      },
      {
        id: 'sym-tear',
        tool: 'polygon',
        label: 'Horseshoe tear',
        color: '#dc2626',
        strokeWidth: 3,
        visible: true,
        classIds: ['retinal-break'],
        points: [
          { x: 0.22, y: 0.62 },
          { x: 0.24, y: 0.55 },
          { x: 0.3, y: 0.53 },
          { x: 0.35, y: 0.58 },
          { x: 0.33, y: 0.6 },
          { x: 0.3, y: 0.57 },
          { x: 0.26, y: 0.59 },
          { x: 0.25, y: 0.64 },
        ],
      },
      {
        id: 'sym-note',
        tool: 'callout',
        label: "Lattice 2 o'clock",
        color: '#334155',
        strokeWidth: 3,
        visible: true,
        classIds: ['retina-note'],
        points: [
          { x: 0.8, y: 0.14 },
          { x: 0.75, y: 0.27 },
        ],
        text: "Lattice 2 o'clock",
        fontSize: 40,
      },
    ],
    selectedLayerId: undefined,
    textContent: '',
  },
  retinaSymbols,
);

function CanvasDemo({ initial }: { initial: EmrClinicalAnnotationCanvasState }) {
  const [lastReason, setLastReason] = useState('none');
  const onIntent = (intent: EmrClinicalAnnotationCanvasIntent) => {
    setLastReason(`${intent.type} (${intent.reason}) — ${intent.state.layers.length} marks`);
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrClinicalAnnotationCanvas model={initial} onIntent={onIntent} />
      <Text>{`Last intent: ${lastReason}`}</Text>
    </View>
  );
}

export const gallery: GallerySection[] = [
  {
    id: 'annotation-canvas-derm',
    title: 'EmrClinicalAnnotationCanvas (Dermatology, compact → Draw)',
    render: () => <CanvasDemo initial={dermStoryState} />,
  },
  {
    id: 'annotation-canvas-draw',
    title: 'EmrClinicalAnnotationCanvas (Surgery planning, draw mode)',
    render: () => <CanvasDemo initial={surgeryDrawState} />,
  },
  {
    id: 'annotation-canvas-retina-symbols',
    title: 'EmrClinicalAnnotationCanvas (Retina symbols & callout)',
    render: () => <CanvasDemo initial={retinaSymbolsState} />,
  },
  {
    id: 'annotation-canvas-readonly',
    title: 'EmrClinicalAnnotationCanvas (Read-only)',
    render: () => <CanvasDemo initial={{ ...dermStoryState, readOnly: true }} />,
  },
];
