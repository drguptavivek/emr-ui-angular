import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { userEvent, within } from 'storybook/test';
import type { NoteCaptureViewModel } from '@drguptavivek/emr-controller';
import { EmrEvidenceSuggestionListComponent } from '../domain/emr-evidence-suggestion-list.component';
import { opdNote, opdSuggestions, withStatuses } from './note-capture.fixtures';

const meta: Meta<EmrEvidenceSuggestionListComponent> = {
  title: 'EMR / Notes / Suggestions',
  component: EmrEvidenceSuggestionListComponent,
  decorators: [moduleMetadata({ imports: [EmrEvidenceSuggestionListComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled list of suggested field values, grouped by section. Each row carries the number shown beside its passage in the transcript and quotes that passage, so the link reads without the transcript on screen. Accept, Edit and Reject only emit intents: nothing is written to the form until the controller applies accepted suggestions.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrEvidenceSuggestionListComponent>;

const render = (model: NoteCaptureViewModel, width = '640px') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: ${width}"><emr-evidence-suggestion-list [model]="model" /></div></div>`
});

export const Pending: Story = { render: () => render(opdNote()) };

export const MixedStatuses: Story = {
  render: () => render(opdNote({
    suggestions: withStatuses(
      { f1: 'accepted', f2: 'accepted', f3: 'edited', f4: 'accepted', f6: 'edited', f8: 'rejected' },
      { f3: { value: 'ou', label: 'Both eyes' }, f6: { value: 22, label: '22 mmHg' } }
    )
  }))
};

export const EditingInline: Story = {
  render: () => render(opdNote()),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Edit suggestion for Diagnosis' }));
  }
};

export const FieldHighlightedFromTranscript: Story = {
  render: () => render(opdNote({ highlightedSpanIds: ['p1'], highlightedSuggestionIds: ['f1', 'f3'] }))
};

export const WithValidationMessages: Story = {
  render: () => render(opdNote({
    suggestions: opdSuggestions.map((s) => s.id === 'f2'
      ? { ...s, messages: [{ path: ['history', 'f2'], severity: 'error', message: 'Duration needs a unit. Dictated as "three days" only.', source: 'mechanical' }] }
      : s.id === 'f5'
        ? { ...s, messages: [{ path: ['examination', 'f5'], severity: 'info', message: 'Heard as "six by six". Confirm the recording is with glasses.' }] }
        : s)
  }))
};

export const AllAccepted: Story = {
  render: () => render(opdNote({ suggestions: withStatuses(Object.fromEntries(opdSuggestions.map((s) => [s.id, 'accepted' as const]))) }))
};

export const Empty: Story = { render: () => render(opdNote({ spans: [], suggestions: [], canSummarise: true })) };

export const ReadOnly: Story = {
  render: () => render(opdNote({ readOnly: true, suggestions: withStatuses({ f1: 'accepted', f9: 'edited', f8: 'rejected' }, { f9: { value: 'fk', label: 'Fungal keratitis, right eye' } }), highlightedSuggestionIds: ['f9'], highlightedSpanIds: ['p9'] }))
};

export const ManySuggestions: Story = {
  render: () => render(opdNote({
    suggestions: Array.from({ length: 5 }, (_, round) => opdSuggestions.map((s) => ({ ...s, id: `${s.id}-${round}`, fieldLabel: round ? `${s.fieldLabel} (visit ${round + 1})` : s.fieldLabel, spanIds: round ? [] : s.spanIds }))).flat()
  }))
};

export const Mobile: Story = {
  render: () => render(opdNote({ highlightedSuggestionIds: ['f6'], highlightedSpanIds: ['p6'] }), '360px')
};
