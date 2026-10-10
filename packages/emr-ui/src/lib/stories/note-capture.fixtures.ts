import type { EmrBadge, EvidenceSpan, FieldSuggestion, NoteCaptureSummary, NoteCaptureViewModel, SuggestionStatus, TranscriptSegment } from '@drguptavivek/emr-controller';

/** Synthetic ophthalmology OPD dictation. Every value here is invented. */

const seg = (id: string, timeLabel: string, speakerLabel: string, text: string, over: Partial<TranscriptSegment> = {}): TranscriptSegment => ({
  id, text, startMs: null, endMs: null, source: 'spoken', speakerLabel, timeLabel, ...over
});

export const opdSegments: readonly TranscriptSegment[] = [
  seg('g1', '00:04', 'Doctor', 'What brings you in today?'),
  seg('g2', '00:09', 'Patient', 'My right eye has been red and painful for three days, and the vision is blurry.'),
  seg('g3', '00:21', 'Doctor', 'Let me check your vision. With glasses, right eye six by twelve, left eye six by six.'),
  seg('g4', '00:38', 'Doctor', 'Eye pressure is 24 in the right eye and 15 in the left.'),
  seg('g5', '00:52', 'Doctor', 'The right cornea shows an epithelial defect with stromal infiltrate. This looks like bacterial keratitis of the right eye.'),
  seg('g6', '01:10', 'Doctor', 'I will start moxifloxacin eye drops every two hours in the right eye and review you tomorrow.'),
];

/** Builds a span by locating `phrase` inside its segment, so offsets can never drift from the text. */
export function spanOf(segments: readonly TranscriptSegment[], id: string, segmentId: string, phrase: string, suggestionIds: readonly string[]): EvidenceSpan {
  const text = segments.find((s) => s.id === segmentId)?.text ?? '';
  const start = text.indexOf(phrase);
  if (start < 0) throw new Error(`"${phrase}" is not in segment ${segmentId}`);
  return { id, segmentId, start, end: start + phrase.length, suggestionIds };
}

export const opdSpans: readonly EvidenceSpan[] = [
  spanOf(opdSegments, 'p1', 'g2', 'right eye has been red and painful', ['f1', 'f3']),
  spanOf(opdSegments, 'p2', 'g2', 'for three days', ['f2']),
  spanOf(opdSegments, 'p3', 'g2', 'the vision is blurry', ['f1']),
  spanOf(opdSegments, 'p4', 'g3', 'right eye six by twelve', ['f4']),
  spanOf(opdSegments, 'p5', 'g3', 'left eye six by six', ['f5']),
  spanOf(opdSegments, 'p6', 'g4', '24 in the right eye', ['f6']),
  spanOf(opdSegments, 'p7', 'g4', '15 in the left', ['f7']),
  spanOf(opdSegments, 'p8', 'g5', 'epithelial defect with stromal infiltrate', ['f8']),
  spanOf(opdSegments, 'p9', 'g5', 'bacterial keratitis of the right eye', ['f9']),
  spanOf(opdSegments, 'p10', 'g6', 'moxifloxacin eye drops every two hours in the right eye', ['f10']),
  spanOf(opdSegments, 'p11', 'g6', 'review you tomorrow', ['f11']),
];

const high: EmrBadge = { label: 'High confidence', tone: 'success' };
const check: EmrBadge = { label: 'Check wording', tone: 'warning' };

const eyes = [{ value: 'od', label: 'Right eye' }, { value: 'os', label: 'Left eye' }, { value: 'ou', label: 'Both eyes' }];
const dx = [
  { value: 'bk', label: 'Bacterial keratitis, right eye' },
  { value: 'fk', label: 'Fungal keratitis, right eye' },
  { value: 'vk', label: 'Viral keratitis, right eye' },
  { value: 'ca', label: 'Corneal abrasion, right eye' },
];

const f = (id: string, fieldLabel: string, sectionLabel: string, valueLabel: string, spanIds: string[], over: Partial<FieldSuggestion> = {}): FieldSuggestion => ({
  id, path: [sectionLabel.toLowerCase().replace(/\W+/g, '-'), id], fieldLabel, sectionLabel, value: valueLabel, valueLabel, spanIds, status: 'pending', valueType: 'text', confidence: high, ...over
});

export const opdSuggestions: readonly FieldSuggestion[] = [
  f('f1', 'Chief complaint', 'History', 'Red, painful right eye with blurred vision', ['p1', 'p3'], { valueType: 'multiline' }),
  f('f2', 'Duration', 'History', '3 days', ['p2']),
  f('f3', 'Affected eye', 'History', 'Right eye', ['p1'], { value: 'od', valueType: 'select', options: eyes }),
  f('f4', 'Visual acuity, right, with glasses', 'Examination', '6/12', ['p4']),
  f('f5', 'Visual acuity, left, with glasses', 'Examination', '6/6', ['p5']),
  f('f6', 'Intraocular pressure, right', 'Examination', '24 mmHg', ['p6'], {
    value: 24, valueType: 'integer',
    messages: [{ path: ['examination', 'f6'], severity: 'warning', message: 'Above the usual reference range. Confirm the reading.', source: 'clinical' }],
  }),
  f('f7', 'Intraocular pressure, left', 'Examination', '15 mmHg', ['p7'], { value: 15, valueType: 'integer' }),
  f('f8', 'Cornea, right', 'Examination', 'Epithelial defect with stromal infiltrate', ['p8'], { valueType: 'multiline', confidence: check }),
  f('f9', 'Diagnosis', 'Assessment and plan', 'Bacterial keratitis, right eye', ['p9'], { value: 'bk', valueType: 'select', options: dx, confidence: check }),
  f('f10', 'Treatment', 'Assessment and plan', 'Moxifloxacin eye drops, right eye, every 2 hours', ['p10'], { valueType: 'multiline' }),
  f('f11', 'Follow-up', 'Assessment and plan', 'Next day', ['p11']),
];

export const idleDictation = { status: 'idle', label: 'Dictation off', canStart: true, canStop: false } as const;

/** A full note: transcript, links and suggestions all pending. */
export function opdNote(over: Partial<NoteCaptureViewModel> = {}): NoteCaptureViewModel {
  return {
    id: 'opd-note', title: 'Ophthalmology OPD note',
    dictation: idleDictation,
    segments: opdSegments, spans: opdSpans, suggestions: opdSuggestions,
    highlightedSpanIds: [], highlightedSuggestionIds: [], canSummarise: true, ...over
  };
}

/** The transcript before any summarising: no links, no suggestions. */
export const opdTranscriptOnly = (over: Partial<NoteCaptureViewModel> = {}): NoteCaptureViewModel =>
  opdNote({ spans: [], suggestions: [], ...over });

export const withStatuses = (statuses: Readonly<Record<string, SuggestionStatus>>, edits: Readonly<Record<string, { value: string | number; label: string }>> = {}): readonly FieldSuggestion[] =>
  opdSuggestions.map((s) => ({
    ...s,
    status: statuses[s.id] ?? s.status,
    ...(edits[s.id] ? { editedValue: edits[s.id].value, editedValueLabel: edits[s.id].label } : {}),
  }));

/** What a summariser would return for the OPD dictation. */
export const opdSummary: NoteCaptureSummary = { spans: opdSpans, suggestions: opdSuggestions };

/** A long dictation, for scroll behaviour. */
export const longSegments: readonly TranscriptSegment[] = Array.from({ length: 30 }, (_, i) =>
  seg(`l${i}`, `${String(Math.floor((i * 14) / 60)).padStart(2, '0')}:${String((i * 14) % 60).padStart(2, '0')}`, i % 2 ? 'Patient' : 'Doctor',
    i % 2
      ? 'It happens mostly in the evening, and the light from the screen makes it worse. Drops from the pharmacy helped a little.'
      : 'Any discharge, itching, or sensitivity to light? Does it affect one eye or both? Have you worn contact lenses recently?'));
