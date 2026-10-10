import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { AnnotationToolbarViewModel, ToolbarColour, ToolbarTool } from '@drguptavivek/emr-controller';
import { EmrAnnotationToolbarComponent } from '../structures/emr-annotation-toolbar.component';

const meta: Meta<EmrAnnotationToolbarComponent> = {
  title: 'EMR / Annotation / Toolbar',
  component: EmrAnnotationToolbarComponent,
  decorators: [moduleMetadata({ imports: [EmrAnnotationToolbarComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'One dense, wrapping row of icon buttons for any annotation surface. Every button has a 44px hit area around a smaller visible face, a tooltip and an accessible name. The toolbar is a single Tab stop: arrow keys move between buttons. It renders the tools, colours and widths it is given and emits intents; it never knows what a tool does and keeps no zoom, history or colour state.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrAnnotationToolbarComponent>;

const t = (id: string, label: string, icon: string, shortcutLabel?: string): ToolbarTool => ({ id, label, icon, shortcutLabel });
const ALL_TOOLS: readonly ToolbarTool[] = [
  t('select', 'Select', 'heroCursorArrowRays', 'V'),
  t('move', 'Move', 'heroArrowsPointingOut', 'M'),
  t('eraser', 'Eraser', 'shape-eraser', 'E'),
  t('text', 'Text', 'shape-text', 'T'),
  t('line', 'Line', 'shape-line', 'L'),
  t('arrow', 'Arrow', 'shape-arrow', 'A'),
  t('curve', 'Curve', 'shape-curve', 'C'),
  t('rect', 'Rectangle', 'shape-rect', 'R'),
  t('ellipse', 'Ellipse', 'shape-ellipse', 'O'),
  t('polygon', 'Polygon', 'shape-polygon', 'P'),
  t('freehand', 'Freehand', 'shape-freehand', 'F')
];
const COLOURS: readonly ToolbarColour[] = [
  { id: 'red', label: 'Red', hex: '#d92d20' },
  { id: 'blue', label: 'Blue', hex: '#1d4ed8' },
  { id: 'green', label: 'Green', hex: '#15803d' },
  { id: 'yellow', label: 'Yellow', hex: '#facc15' },
  { id: 'black', label: 'Black', hex: '#111827' },
  { id: 'white', label: 'White', hex: '#ffffff' }
];
const WIDTHS = [
  { id: 'w1', label: 'Thin, 1 px', px: 1 },
  { id: 'w2', label: 'Medium, 3 px', px: 3 },
  { id: 'w3', label: 'Thick, 6 px', px: 6 }
] as const;

const base = (extra: Partial<AnnotationToolbarViewModel> = {}): AnnotationToolbarViewModel => ({
  tools: ALL_TOOLS, selectedToolId: 'line', colours: COLOURS, selectedColourId: 'red', widths: WIDTHS, selectedWidthId: 'w2',
  canUndo: true, canRedo: true, zoomLabel: '100%', canSave: true, saveLabel: 'Save annotations', ...extra
});

/** Opens the pen panel after render so the story shows the colours and widths. */
const openPen = ({ canvasElement }: { canvasElement: HTMLElement }): void => { canvasElement.querySelector<HTMLButtonElement>('button[aria-controls]')?.click(); };

const render = (model: AnnotationToolbarViewModel, width = '') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div ${width ? `style="width: ${width}; max-width: 100%"` : ''}><emr-annotation-toolbar [model]="model" /></div></div>`
});

export const AllTools: Story = { render: () => render(base()) };

export const MinimalTools: Story = {
  render: () => render(base({
    tools: [ALL_TOOLS[0], ALL_TOOLS[3], ALL_TOOLS[4], ALL_TOOLS[8]], selectedToolId: 'select',
    colours: COLOURS.slice(0, 3), widths: WIDTHS.slice(0, 2), selectedWidthId: 'w1', canRedo: false, zoomLabel: '150%'
  }))
};

export const ReadOnly: Story = { render: () => render(base({ readOnly: true, canSave: false, zoomLabel: '75%' })) };

export const NothingToUndo: Story = { render: () => render(base({ canUndo: false, canRedo: false, canSave: false, selectedToolId: 'select' })) };

export const ManyColours: Story = {
  play: openPen,
  render: () => render(base({
    colours: [
      ...COLOURS,
      { id: 'orange', label: 'Orange', hex: '#ea580c' }, { id: 'purple', label: 'Purple', hex: '#7e22ce' },
      { id: 'teal', label: 'Teal', hex: '#0f766e' }, { id: 'pink', label: 'Pink', hex: '#db2777' },
      { id: 'brown', label: 'Brown', hex: '#78350f' }, { id: 'grey', label: 'Grey', hex: '#6b7280' }
    ],
    selectedColourId: 'teal'
  }))
};

export const Mobile: Story = {
  render: () => render(base({ selectedToolId: 'eraser' }), '360px'),
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};

export const PenPanelOpen: Story = { render: () => render(base()), play: openPen };
