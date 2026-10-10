import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { NoteCaptureViewModel } from '@drguptavivek/emr-controller';
import { EmrClinicalTranscriptComponent } from '../domain/emr-clinical-transcript.component';
import { idleDictation, longSegments, opdNote, opdSegments, opdTranscriptOnly } from './note-capture.fixtures';

const meta: Meta<EmrClinicalTranscriptComponent> = {
  title: 'EMR / Notes / Transcript',
  component: EmrClinicalTranscriptComponent,
  decorators: [moduleMetadata({ imports: [EmrClinicalTranscriptComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled transcript for dictated or typed notes. Passages that support a suggested field are buttons carrying the same field number as the suggestion list; selecting one asks the controller to highlight the fields it feeds. The component owns no microphone and no speech engine: the controller supplies the dictation status, the segments and the span offsets.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrClinicalTranscriptComponent>;

const render = (model: NoteCaptureViewModel, width = '720px') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: ${width}"><emr-clinical-transcript [model]="model" /></div></div>`
});

export const Idle: Story = { render: () => render(opdTranscriptOnly({ canSummarise: true })) };

export const Listening: Story = {
  render: () => render(opdTranscriptOnly({
    segments: opdSegments.slice(0, 3),
    dictation: { status: 'listening', label: 'Listening', canStart: false, canStop: true }, canSummarise: false
  }))
};

export const Processing: Story = {
  render: () => render(opdTranscriptOnly({
    dictation: { status: 'processing', label: 'Finishing transcript', canStart: false, canStop: false }, canSummarise: false
  }))
};

export const WithEvidenceSpans: Story = { render: () => render(opdNote()) };

export const SpanHighlighted: Story = {
  render: () => render(opdNote({ highlightedSpanIds: ['p1'], highlightedSuggestionIds: ['f1', 'f3'] }))
};

export const TypedOnly: Story = {
  render: () => render(opdTranscriptOnly({
    segments: [
      { id: 't1', text: 'Right eye redness and pain for 3 days. No discharge.', startMs: null, endMs: null, source: 'typed', timeLabel: '', editable: true },
      { id: 't2', text: 'Vision 6/12 right, 6/6 left. IOP 24 right, 15 left.', startMs: null, endMs: null, source: 'typed', timeLabel: '', editable: true }
    ],
    dictation: { status: 'idle', label: 'Dictation off', canStart: false, canStop: false }
  }))
};

export const DictationError: Story = {
  render: () => render(opdTranscriptOnly({
    segments: opdSegments.slice(0, 2),
    dictation: { status: 'error', label: 'Dictation error', canStart: true, canStop: false, error: 'The microphone is not available. Check that it is connected and allowed, then start again, or type the note instead.' }
  }))
};

export const ReadOnly: Story = {
  render: () => render(opdNote({ readOnly: true, canSummarise: false, highlightedSpanIds: ['p9'], highlightedSuggestionIds: ['f9'] }))
};

export const LongTranscript: Story = {
  render: () => render(opdTranscriptOnly({ segments: [...opdSegments, ...longSegments] }))
};

export const Mobile: Story = {
  render: () => render(opdNote({ highlightedSpanIds: ['p6'], highlightedSuggestionIds: ['f6'], dictation: idleDictation }), '360px')
};
