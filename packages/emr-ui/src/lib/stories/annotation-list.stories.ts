import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { AnnotationLayerRecord, AnnotationListItem, AnnotationListViewModel } from '@drguptavivek/emr-controller';
import { EmrAnnotationListComponent } from '../structures/emr-annotation-list.component';

const meta: Meta<EmrAnnotationListComponent> = {
  title: 'EMR / Annotation / List',
  component: EmrAnnotationListComponent,
  decorators: [moduleMetadata({ imports: [EmrAnnotationListComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Tight numbered list of annotation layers. Each row shows number, colour, label, class and tool glyph, with icon buttons to hide, lock, reorder and delete. The list owns no order, visibility or lock state: it renders what it is given and emits intents. Arrow keys move between rows; only the active row\'s buttons are in the Tab order.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrAnnotationListComponent>;

const common = { strokeWidth: 3, visible: true };
const lesion1: AnnotationLayerRecord = { ...common, id: 'l1', label: 'Lesion 1 — circle', color: '#d92d20', tool: 'circle', center: { x: 0.42, y: 0.38 }, radiusX: 0.08, radiusY: 0.07 };
const incision: AnnotationLayerRecord = { ...common, id: 'l2', label: 'Incision — line', color: '#1d4ed8', tool: 'line', points: [{ x: 0.2, y: 0.5 }, { x: 0.6, y: 0.55 }] };
const margin: AnnotationLayerRecord = { ...common, id: 'l3', label: 'Lesion margin — freehand', color: '#15803d', tool: 'freeform', points: [{ x: 0.3, y: 0.3 }, { x: 0.35, y: 0.33 }, { x: 0.4, y: 0.3 }] };
const note: AnnotationLayerRecord = { ...common, id: 'l4', label: 'Note — text', color: '#111827', tool: 'text', point: { x: 0.7, y: 0.2 }, text: 'Erythema spreading laterally', fontSize: 14 };
const border: AnnotationLayerRecord = { ...common, id: 'l5', label: 'Plaque border — polygon', color: '#7e22ce', tool: 'polygon', points: [{ x: 0.5, y: 0.6 }, { x: 0.6, y: 0.65 }, { x: 0.55, y: 0.75 }] };
const vessel: AnnotationLayerRecord = { ...common, id: 'l6', label: 'Vessel course — curve', color: '#ea580c', tool: 'curve', points: [{ x: 0.1, y: 0.8 }, { x: 0.3, y: 0.7 }, { x: 0.5, y: 0.85 }] };

const items: readonly AnnotationListItem[] = [
  { layer: lesion1, number: 1, classLabel: 'Lesion' },
  { layer: incision, number: 2, classLabel: 'Incision' },
  { layer: margin, number: 3, classLabel: 'Margin', description: 'Drawn at 12 o\'clock edge of the plaque' },
  { layer: note, number: 4 },
  { layer: border, number: 5, classLabel: 'Plaque' }
];
const base = (extra: Partial<AnnotationListViewModel> = {}): AnnotationListViewModel => ({
  items, selectedLayerId: 'l2', emptyMessage: 'No annotations yet. Pick a tool and draw on the image.', ...extra
});

const render = (model: AnnotationListViewModel, wrap = 'max-width: 560px') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="${wrap}"><emr-annotation-list [model]="model" /></div></div>`
});

export const Populated: Story = { render: () => render(base()) };

export const Empty: Story = { render: () => render(base({ items: [], selectedLayerId: undefined })) };

export const WithHiddenAndLocked: Story = {
  render: () => render(base({
    items: [
      { layer: lesion1, number: 1, classLabel: 'Lesion', locked: true },
      { layer: { ...incision, visible: false }, number: 2, classLabel: 'Incision' },
      { layer: { ...margin, visible: false }, number: 3, classLabel: 'Margin', locked: true },
      { layer: note, number: 4 }
    ]
  }))
};

export const ReadOnly: Story = {
  render: () => render(base({ readOnly: true, items: items.map((it, i) => (i === 0 ? { ...it, locked: true } : it)) }))
};

export const LongLabels: Story = {
  render: () => render(base({
    items: [
      { layer: { ...lesion1, label: 'Lesion 1 — circle around the superotemporal pigmented naevus with feathered, irregular borders and satellite flecks' }, number: 1, classLabel: 'Pigmented lesion under surveillance', description: 'Measured against the previous visit photograph taken in the same lighting, with the ruler in frame' },
      { layer: { ...incision, label: 'Incision_planned_along_Langer_lines_superior_to_the_lesion_with_two_centimetre_margin' }, number: 2 },
      { layer: vessel, number: 3, classLabel: 'Vessel' }
    ]
  }), 'max-width: 360px')
};

const kinds = [lesion1, incision, margin, note, border, vessel];
const NAMES = ['Lesion', 'Incision', 'Margin', 'Note', 'Plaque border', 'Vessel course'];
export const FiftyItems: Story = {
  render: () => render(base({
    selectedLayerId: 'g12',
    items: Array.from({ length: 50 }, (_, i): AnnotationListItem => {
      const k = kinds[i % kinds.length];
      return { layer: { ...k, id: `g${i + 1}`, label: `${NAMES[i % NAMES.length]} ${i + 1} — ${k.tool}`, visible: i % 7 !== 3 } as AnnotationLayerRecord, number: i + 1, locked: i % 9 === 4 };
    })
  }), 'max-width: 560px; max-height: 420px; overflow: auto')
};

export const Mobile: Story = {
  render: () => render(base({ items: items.map((it, i) => (i === 3 ? { ...it, locked: true } : it)) }), 'width: 360px; max-width: 100%'),
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};
