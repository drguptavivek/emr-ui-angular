import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Meta, StoryObj } from '@storybook/angular';
import { NoteCaptureController } from '@drguptavivek/emr-controller';
import type { NoteCaptureIntent, NoteCapturePort, NoteCaptureSummary, NoteCaptureViewModel, SpokenSegmentInput } from '@drguptavivek/emr-controller';
import { EmrClinicalTranscriptComponent } from '../domain/emr-clinical-transcript.component';
import { EmrEvidenceSuggestionListComponent } from '../domain/emr-evidence-suggestion-list.component';
import { opdNote, opdSegments, opdSpans, opdSuggestions, spanOf } from './note-capture.fixtures';

/** What the doctor says if dictation is started: one more utterance, so Summarise has something new to link. */
const extraUtterance: SpokenSegmentInput = {
  text: 'Please also send a corneal scraping for culture before the first drop.',
  startMs: 84000, endMs: 88000, speakerLabel: 'Doctor', timeLabel: '01:24'
};

/** A fake service: no network, no microphone. Canned answers after a short delay, stopped by the AbortSignal. */
const fakePort: NoteCapturePort = {
  summarise: (segments, signal) => new Promise<NoteCaptureSummary>((resolve, reject) => {
    const timer = setTimeout(() => {
      const extra = segments.find((s) => s.text === extraUtterance.text);
      if (!extra) return resolve({ spans: opdSpans, suggestions: opdSuggestions });
      resolve({
        spans: [...opdSpans, spanOf([extra], 'p12', extra.id, 'corneal scraping for culture', ['f12'])],
        suggestions: [...opdSuggestions, {
          id: 'f12', path: ['assessment-and-plan', 'f12'], fieldLabel: 'Investigation', sectionLabel: 'Assessment and plan',
          value: 'Corneal scraping for culture', valueLabel: 'Corneal scraping for culture', spanIds: ['p12'], status: 'pending', valueType: 'text',
          confidence: { label: 'High confidence', tone: 'success' }
        }]
      });
    }, 700);
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('aborted')); });
  }),
  startDictation: (sink, signal) => {
    const timer = setTimeout(() => sink(extraUtterance), 1200);
    signal.addEventListener('abort', () => clearTimeout(timer));
    return Promise.resolve();
  },
  stopDictation: () => Promise.resolve()
};

/**
 * Wires both halves to one NoteCaptureController, the way an application would. Default change detection and a
 * signal, because the controller's updates arrive from timers and event handlers outside the template.
 */
@Component({
  selector: 'emr-evidence-linked-story',
  standalone: true,
  imports: [EmrClinicalTranscriptComponent, EmrEvidenceSuggestionListComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="emr-story-surface">
      <p class="hint">Select a field to see the passages it came from. Select a passage to see the fields it feeds. Matching numbers link the two sides.</p>
      <div class="split">
        <emr-clinical-transcript [model]="model()" (intent)="dispatch($event)" />
        <emr-evidence-suggestion-list [model]="model()" (intent)="dispatch($event)" />
      </div>
    </div>
  `,
  styles: [`
    .hint{margin:0 0 12px;max-width:70ch;font-size:var(--emr-text-md);color:var(--emr-text-muted)}
    .split{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:16px;align-items:start;--ct-max:36rem;--sl-max:36rem}
  `]
})
class EvidenceLinkedStoryComponent implements OnInit, OnDestroy {
  readonly model = signal<NoteCaptureViewModel>(opdNote());
  private controller?: NoteCaptureController;
  private unsubscribe?: () => void;

  ngOnInit(): void {
    let n = 0;
    this.controller = new NoteCaptureController(opdNote(), fakePort, () => `seg-${++n}`);
    this.unsubscribe = this.controller.subscribe((state) => this.model.set(state));
  }

  ngOnDestroy(): void { this.unsubscribe?.(); this.controller?.destroy(); }

  dispatch(intent: NoteCaptureIntent): void { this.controller?.dispatch(intent); }
}

const meta: Meta = {
  title: 'EMR / Notes / Evidence-linked capture',
  parameters: {
    docs: {
      description: {
        component:
          'A dictated or typed transcript is summarised into form-field suggestions, and every suggested value links back to the exact passage it came from, in both directions. EmrClinicalTranscript and EmrEvidenceSuggestionList are both driven by one NoteCaptureController behind a fake port. Nothing is written to a form: accepted suggestions are for the application to apply.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

export const EvidenceLinkedJourney: Story = {
  render: () => ({ moduleMetadata: { imports: [EvidenceLinkedStoryComponent] }, template: `<emr-evidence-linked-story />` })
};
