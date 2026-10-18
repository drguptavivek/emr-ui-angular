import type { ClinicalFieldValue } from './clinical-form.models.js';
import type { EmrValueType } from './field-contract.models.js';
import type { EmrOption, EmrBadge } from './models.js';
import type { EmrNodePath } from './node-path.js';
import type { EmrValidationMessage } from './validation.models.js';

/**
 * Evidence-linked note capture. A dictated or typed transcript is summarised into form-field
 * suggestions, and every suggested value points back to the transcript passages it came from.
 * The link is two-way and lives in the data: `EvidenceSpan.suggestionIds` and
 * `FieldSuggestion.spanIds` name each other. Both components take the same view model, so the
 * controller can keep them in step with two highlight lists.
 */

/** One utterance or typed entry. */
export interface TranscriptSegment {
  readonly id: string;
  readonly text: string;
  readonly startMs: number | null;
  readonly endMs: number | null;
  readonly source: 'spoken' | 'typed';
  readonly speakerLabel?: string;
  /** Controller-formatted, e.g. '00:12'. Empty for typed entries, which have no clock time. The component never formats times. */
  readonly timeLabel: string;
  readonly editable?: boolean;
}

/** A passage of one segment that supports one or more suggestions. `start`/`end` are character offsets within `segment.text`. */
export interface EvidenceSpan {
  readonly id: string;
  readonly segmentId: string;
  readonly start: number;
  readonly end: number;
  readonly suggestionIds: readonly string[];
}

/** pending = awaiting review; accepted = taken as suggested; edited = taken with a changed value; rejected = refused. */
export type SuggestionStatus = 'pending' | 'accepted' | 'edited' | 'rejected';

export interface FieldSuggestion {
  readonly id: string;
  readonly path: EmrNodePath;
  readonly fieldLabel: string;
  readonly sectionLabel?: string;
  readonly value: ClinicalFieldValue;
  readonly valueLabel: string;
  readonly editedValue?: ClinicalFieldValue;
  readonly editedValueLabel?: string;
  readonly spanIds: readonly string[];
  readonly status: SuggestionStatus;
  /** Label only, never a number. e.g. { label: 'High confidence', tone: 'success' }. */
  readonly confidence?: EmrBadge;
  readonly valueType: EmrValueType;
  readonly options?: readonly EmrOption[];
  readonly messages?: readonly EmrValidationMessage[];
}

export interface NoteCaptureViewModel {
  readonly id: string;
  readonly title: string;
  readonly dictation: {
    readonly status: 'idle' | 'listening' | 'processing' | 'error';
    readonly label: string;
    readonly canStart: boolean;
    readonly canStop: boolean;
    readonly error?: string;
  };
  readonly segments: readonly TranscriptSegment[];
  readonly spans: readonly EvidenceSpan[];
  readonly suggestions: readonly FieldSuggestion[];
  /** Durable highlight. Spans and suggestions are highlighted together by the controller. */
  readonly highlightedSpanIds: readonly string[];
  readonly highlightedSuggestionIds: readonly string[];
  readonly focusedPath?: EmrNodePath;
  readonly summarising?: boolean;
  /** Set when the last summarise attempt failed. Cleared by the next attempt. */
  readonly summariseError?: string;
  readonly canSummarise: boolean;
  readonly readOnly?: boolean;
}

/**
 * There is deliberately no `fieldEditRequested`: nothing is written to the form until the
 * controller applies accepted suggestions.
 */
export type NoteCaptureIntent =
  | { type: 'dictationStartRequested' }
  | { type: 'dictationStopRequested' }
  | { type: 'textAppendRequested'; text: string }
  | { type: 'segmentEditRequested'; segmentId: string; text: string }
  | { type: 'summariseRequested' }
  | { type: 'spanSelected'; spanId: string }
  | { type: 'suggestionSelected'; suggestionId: string }
  | { type: 'suggestionAccepted'; suggestionId: string }
  | { type: 'suggestionEdited'; suggestionId: string; value: ClinicalFieldValue }
  | { type: 'suggestionRejected'; suggestionId: string }
  | { type: 'suggestionReopened'; suggestionId: string }
  | { type: 'acceptAllPendingRequested' }
  | { type: 'highlightClearRequested' };

/** What a summariser returns: new spans and the suggestions they feed. Replaces the previous result. */
export interface NoteCaptureSummary {
  readonly spans: readonly EvidenceSpan[];
  readonly suggestions: readonly FieldSuggestion[];
}

export type ClinicalTranscriptViewModel = NoteCaptureViewModel;
export type ClinicalTranscriptIntent = NoteCaptureIntent;
export type EvidenceSuggestionListViewModel = NoteCaptureViewModel;
export type EvidenceSuggestionListIntent = NoteCaptureIntent;
