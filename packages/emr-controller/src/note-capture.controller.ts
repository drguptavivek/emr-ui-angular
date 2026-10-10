import { StateController } from './contracts.js';
import type { ClinicalFieldValue } from './clinical-form.models.js';
import { serializePath } from './node-path.js';
import type {
  EvidenceSpan,
  FieldSuggestion,
  NoteCaptureIntent,
  NoteCaptureSummary,
  NoteCaptureViewModel,
  SuggestionStatus,
  TranscriptSegment
} from './note-capture.models.js';

/** What a dictation adapter hands over for each recognised utterance. The controller assigns id and source. */
export type SpokenSegmentInput = Omit<TranscriptSegment, 'id' | 'source'>;

/**
 * Everything that touches a microphone, a speech engine or a summarising service lives behind this port.
 * The controller never calls a browser API.
 */
export interface NoteCapturePort {
  summarise(segments: readonly TranscriptSegment[], signal: AbortSignal): Promise<NoteCaptureSummary>;
  /** Begin capturing speech; call `sink` for each utterance. Resolves once listening has started. */
  startDictation?(sink: (segment: SpokenSegmentInput) => void, signal: AbortSignal): Promise<void>;
  stopDictation?(): Promise<void>;
}

const IDLE = { status: 'idle', label: 'Dictation off', canStart: true, canStop: false } as const;

const same = (a: ClinicalFieldValue | undefined, b: ClinicalFieldValue | undefined): boolean =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Label for an edited value: the option label when the field has options, else the value as text. */
function labelFor(suggestion: FieldSuggestion, value: ClinicalFieldValue): string {
  const option = suggestion.options?.find(candidate => candidate.value === value);
  if (option) return option.label;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return suggestion.valueLabel;
}

/**
 * Headless state for evidence-linked note capture. It keeps the two halves in step: selecting a span
 * highlights the suggestions it feeds, selecting a suggestion highlights its spans. It never writes to
 * the form; applying accepted suggestions is the adapter's job.
 */
export class NoteCaptureController extends StateController<NoteCaptureViewModel, NoteCaptureIntent> {
  private summariseRun?: AbortController;
  private dictationRun?: AbortController;

  constructor(
    initial: NoteCaptureViewModel,
    private readonly port: NoteCapturePort,
    private readonly idFactory: () => string
  ) {
    super(initial);
  }

  dispatch(intent: NoteCaptureIntent): void {
    switch (intent.type) {
      case 'spanSelected': return this.selectSpan(intent.spanId);
      case 'suggestionSelected': return this.selectSuggestion(intent.suggestionId);
      case 'highlightClearRequested': return this.setState(state => ({ ...state, highlightedSpanIds: [], highlightedSuggestionIds: [] }));
      case 'summariseRequested': return void this.summarise();
      case 'dictationStartRequested': return void this.startDictation();
      case 'dictationStopRequested': return void this.stopDictation();
    }
    // Everything below changes the note, so a read-only note ignores it.
    if (this.getSnapshot().readOnly) return;
    switch (intent.type) {
      case 'textAppendRequested': return this.appendTyped(intent.text);
      case 'segmentEditRequested': return this.editSegment(intent.segmentId, intent.text);
      case 'suggestionAccepted': return this.review(intent.suggestionId, s => (s.status === 'edited' ? s : { ...s, status: 'accepted' }));
      case 'suggestionRejected': return this.review(intent.suggestionId, s => ({ ...s, status: 'rejected' }));
      case 'suggestionReopened': return this.review(intent.suggestionId, ({ editedValue, editedValueLabel, ...s }) => ({ ...s, status: 'pending' }));
      case 'suggestionEdited': return this.review(intent.suggestionId, s => same(s.value, intent.value)
        ? { ...s, status: 'accepted', editedValue: undefined, editedValueLabel: undefined }
        : { ...s, status: 'edited', editedValue: intent.value, editedValueLabel: labelFor(s, intent.value) });
      case 'acceptAllPendingRequested':
        return this.setState(state => ({ ...state, suggestions: state.suggestions.map(s => (s.status === 'pending' ? { ...s, status: 'accepted' as SuggestionStatus } : s)) }));
    }
  }

  /** Adapter entry point: a recognised utterance arrives while listening. */
  addSpokenSegment(input: SpokenSegmentInput): void {
    if (!input.text.trim()) return;
    this.addSegment({ ...input, id: this.idFactory(), source: 'spoken' });
  }

  private addSegment(segment: TranscriptSegment): void {
    this.setState(state => {
      const segments = [...state.segments, segment];
      return { ...state, segments, canSummarise: !state.summarising };
    });
  }

  private appendTyped(raw: string): void {
    const text = raw.trim();
    if (text) this.addSegment({ id: this.idFactory(), text, startMs: null, endMs: null, source: 'typed', timeLabel: '' });
  }

  /** New text invalidates the character offsets of its spans, so those links are dropped rather than left pointing at the wrong words. */
  private editSegment(segmentId: string, raw: string): void {
    const text = raw.trim();
    this.setState(state => {
      const segment = state.segments.find(candidate => candidate.id === segmentId);
      if (!segment?.editable || !text || text === segment.text) return state;
      const dropped = new Set(state.spans.filter(span => span.segmentId === segmentId).map(span => span.id));
      return {
        ...state,
        segments: state.segments.map(candidate => (candidate.id === segmentId ? { ...candidate, text } : candidate)),
        spans: state.spans.filter(span => !dropped.has(span.id)),
        suggestions: state.suggestions.map(s => ({ ...s, spanIds: s.spanIds.filter(id => !dropped.has(id)) })),
        highlightedSpanIds: state.highlightedSpanIds.filter(id => !dropped.has(id))
      };
    });
  }

  private selectSpan(spanId: string): void {
    this.setState(state => {
      const span = state.spans.find(candidate => candidate.id === spanId);
      if (!span) return state;
      const known = new Set(state.suggestions.map(s => s.id));
      const suggestionIds = span.suggestionIds.filter(id => known.has(id));
      const alreadyOn = state.highlightedSpanIds.length === 1 && state.highlightedSpanIds[0] === spanId;
      return alreadyOn
        ? { ...state, highlightedSpanIds: [], highlightedSuggestionIds: [] }
        : { ...state, highlightedSpanIds: [spanId], highlightedSuggestionIds: suggestionIds };
    });
  }

  private selectSuggestion(suggestionId: string): void {
    this.setState(state => {
      const suggestion = state.suggestions.find(candidate => candidate.id === suggestionId);
      if (!suggestion) return state;
      const known = new Set(state.spans.map(span => span.id));
      const spanIds = suggestion.spanIds.filter(id => known.has(id));
      const alreadyOn = state.highlightedSuggestionIds.length === 1 && state.highlightedSuggestionIds[0] === suggestionId;
      return alreadyOn
        ? { ...state, highlightedSpanIds: [], highlightedSuggestionIds: [] }
        : { ...state, highlightedSuggestionIds: [suggestionId], highlightedSpanIds: spanIds };
    });
  }

  private review(suggestionId: string, change: (suggestion: FieldSuggestion) => FieldSuggestion): void {
    this.setState(state => state.suggestions.some(s => s.id === suggestionId)
      ? { ...state, suggestions: state.suggestions.map(s => (s.id === suggestionId ? change(s) : s)) }
      : state);
  }

  private async summarise(): Promise<void> {
    const { canSummarise, summarising, readOnly, segments } = this.getSnapshot();
    if (!canSummarise || summarising || readOnly) return;
    this.summariseRun?.abort();
    const run = (this.summariseRun = new AbortController());
    this.setState(state => ({ ...state, summarising: true, canSummarise: false, summariseError: undefined }));
    try {
      const result = await this.port.summarise(segments, run.signal);
      if (run.signal.aborted) return;
      this.setState(state => ({ ...this.merge(state, result), summarising: false, canSummarise: true }));
    } catch (error) {
      if (run.signal.aborted) return;
      this.setState(state => ({
        ...state,
        summarising: false,
        canSummarise: true,
        summariseError: error instanceof Error && error.message ? error.message : 'Could not summarise the transcript.'
      }));
    }
  }

  /**
   * Re-summarising must not throw away review work: accepted, edited and rejected suggestions (and the
   * spans that feed them) stay, and a new suggestion for a path that already has one is dropped.
   * ponytail: assumes the port issues ids that do not collide with the kept ones.
   */
  private merge(state: NoteCaptureViewModel, result: NoteCaptureSummary): NoteCaptureViewModel {
    const kept = state.suggestions.filter(s => s.status !== 'pending');
    const taken = new Set(kept.map(s => serializePath(s.path)));
    const fresh = result.suggestions.filter(s => !taken.has(serializePath(s.path)));
    const live = new Set(fresh.map(s => s.id));
    const keptSpanIds = new Set(kept.flatMap(s => s.spanIds));
    const spans: EvidenceSpan[] = [
      ...state.spans.filter(span => keptSpanIds.has(span.id)),
      ...result.spans
        .map(span => ({ ...span, suggestionIds: span.suggestionIds.filter(id => live.has(id)) }))
        .filter(span => span.suggestionIds.length)
    ];
    return { ...state, spans, suggestions: [...kept, ...fresh], highlightedSpanIds: [], highlightedSuggestionIds: [] };
  }

  private async startDictation(): Promise<void> {
    const { dictation, readOnly } = this.getSnapshot();
    if (!dictation.canStart || readOnly) return;
    if (!this.port.startDictation) {
      this.setState(state => ({ ...state, dictation: { ...IDLE, status: 'error', label: 'Dictation unavailable', error: 'Dictation is not available here.' } }));
      return;
    }
    this.dictationRun?.abort();
    const run = (this.dictationRun = new AbortController());
    this.setState(state => ({ ...state, dictation: { status: 'listening', label: 'Listening', canStart: false, canStop: true } }));
    try {
      await this.port.startDictation(segment => { if (!run.signal.aborted) this.addSpokenSegment(segment); }, run.signal);
    } catch (error) {
      if (run.signal.aborted) return;
      this.setState(state => ({
        ...state,
        dictation: { ...IDLE, status: 'error', label: 'Dictation error', error: error instanceof Error && error.message ? error.message : 'Dictation stopped unexpectedly.' }
      }));
    }
  }

  private async stopDictation(): Promise<void> {
    if (!this.getSnapshot().dictation.canStop) return;
    this.setState(state => ({ ...state, dictation: { status: 'processing', label: 'Finishing transcript', canStart: false, canStop: false } }));
    try {
      await this.port.stopDictation?.();
    } catch {
      // The adapter failed to stop cleanly; the transcript so far is kept either way.
    }
    this.dictationRun?.abort();
    this.setState(state => ({ ...state, dictation: IDLE }));
  }

  protected override onDestroy(): void {
    this.summariseRun?.abort();
    this.dictationRun?.abort();
  }
}
