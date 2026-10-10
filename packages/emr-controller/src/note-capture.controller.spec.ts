import { describe, expect, it } from 'vitest';
import { NoteCaptureController, type NoteCapturePort } from './note-capture.controller.js';
import type { EvidenceSpan, FieldSuggestion, NoteCaptureViewModel } from './note-capture.models.js';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

const suggestion = (id: string, over: Partial<FieldSuggestion> = {}): FieldSuggestion => ({
  id, path: ['hpi', id], fieldLabel: id, value: `value ${id}`, valueLabel: `value ${id}`, spanIds: [], status: 'pending', valueType: 'text', ...over
});
const span = (id: string, suggestionIds: string[], segmentId = 'seg-1'): EvidenceSpan => ({ id, segmentId, start: 0, end: 4, suggestionIds });

function model(over: Partial<NoteCaptureViewModel> = {}): NoteCaptureViewModel {
  return deepFreeze({
    id: 'note', title: 'OPD note',
    dictation: { status: 'idle', label: 'Dictation off', canStart: true, canStop: false },
    segments: [{ id: 'seg-1', text: 'Pain in the right eye for three days', startMs: 0, endMs: 4000, source: 'spoken', timeLabel: '00:00', editable: true }],
    spans: [span('sp-a', ['s1']), span('sp-b', ['s1', 's2']), span('sp-c', ['s3'])],
    suggestions: [suggestion('s1', { spanIds: ['sp-a', 'sp-b'] }), suggestion('s2', { spanIds: ['sp-b'] }), suggestion('s3', { spanIds: ['sp-c'] })],
    highlightedSpanIds: [], highlightedSuggestionIds: [], canSummarise: true, ...over
  });
}

const idle: NoteCapturePort = { summarise: async () => ({ spans: [], suggestions: [] }) };
const make = (m = model(), port: NoteCapturePort = idle) => {
  let n = 0;
  return new NoteCaptureController(m, port, () => `new-${++n}`);
};
const status = (c: NoteCaptureController, id: string) => c.getSnapshot().suggestions.find(s => s.id === id)?.status;

describe('NoteCaptureController linking', () => {
  it('a span highlights itself and the suggestions it feeds', () => {
    const c = make();
    c.dispatch({ type: 'spanSelected', spanId: 'sp-b' });
    expect(c.getSnapshot().highlightedSpanIds).toEqual(['sp-b']);
    expect(c.getSnapshot().highlightedSuggestionIds).toEqual(['s1', 's2']);
  });

  it('a suggestion highlights itself and every span that supports it', () => {
    const c = make();
    c.dispatch({ type: 'suggestionSelected', suggestionId: 's1' });
    expect(c.getSnapshot().highlightedSuggestionIds).toEqual(['s1']);
    expect(c.getSnapshot().highlightedSpanIds).toEqual(['sp-a', 'sp-b']);
  });

  it('selecting the same item again, or clearing, removes the highlight', () => {
    const c = make();
    c.dispatch({ type: 'spanSelected', spanId: 'sp-a' });
    c.dispatch({ type: 'spanSelected', spanId: 'sp-a' });
    expect(c.getSnapshot().highlightedSpanIds).toEqual([]);
    c.dispatch({ type: 'suggestionSelected', suggestionId: 's3' });
    c.dispatch({ type: 'highlightClearRequested' });
    expect(c.getSnapshot().highlightedSuggestionIds).toEqual([]);
    expect(c.getSnapshot().highlightedSpanIds).toEqual([]);
  });

  it('ignores ids that do not exist and still allows selection when read-only', () => {
    const c = make(model({ readOnly: true }));
    const before = c.getSnapshot();
    c.dispatch({ type: 'spanSelected', spanId: 'nope' });
    expect(c.getSnapshot()).toBe(before);
    c.dispatch({ type: 'spanSelected', spanId: 'sp-c' });
    expect(c.getSnapshot().highlightedSuggestionIds).toEqual(['s3']);
  });
});

describe('NoteCaptureController statuses', () => {
  it('accepts, rejects and reopens one suggestion without touching the others', () => {
    const c = make();
    c.dispatch({ type: 'suggestionAccepted', suggestionId: 's1' });
    c.dispatch({ type: 'suggestionRejected', suggestionId: 's2' });
    expect([status(c, 's1'), status(c, 's2'), status(c, 's3')]).toEqual(['accepted', 'rejected', 'pending']);
    c.dispatch({ type: 'suggestionReopened', suggestionId: 's2' });
    expect(status(c, 's2')).toBe('pending');
  });

  it('an edit keeps the original, takes its label from the options, and survives a later accept', () => {
    const options = [{ value: 'od', label: 'Right eye' }, { value: 'os', label: 'Left eye' }];
    const c = make(model({ suggestions: [suggestion('s1', { value: 'od', valueLabel: 'Right eye', valueType: 'select', options })] }));
    c.dispatch({ type: 'suggestionEdited', suggestionId: 's1', value: 'os' });
    const s = c.getSnapshot().suggestions[0];
    expect([s.status, s.value, s.valueLabel, s.editedValue, s.editedValueLabel]).toEqual(['edited', 'od', 'Right eye', 'os', 'Left eye']);
    c.dispatch({ type: 'suggestionAccepted', suggestionId: 's1' });
    expect(status(c, 's1')).toBe('edited');
  });

  it('an edit back to the suggested value is just an acceptance, and reopening clears an edit', () => {
    const c = make();
    c.dispatch({ type: 'suggestionEdited', suggestionId: 's1', value: 'value s1' });
    expect(c.getSnapshot().suggestions[0]).toMatchObject({ status: 'accepted', editedValue: undefined });
    c.dispatch({ type: 'suggestionEdited', suggestionId: 's1', value: 'changed' });
    c.dispatch({ type: 'suggestionReopened', suggestionId: 's1' });
    const s = c.getSnapshot().suggestions[0];
    expect([s.status, s.editedValue, s.editedValueLabel]).toEqual(['pending', undefined, undefined]);
  });

  it('accept-all touches only pending suggestions', () => {
    const c = make();
    c.dispatch({ type: 'suggestionRejected', suggestionId: 's1' });
    c.dispatch({ type: 'acceptAllPendingRequested' });
    expect([status(c, 's1'), status(c, 's2'), status(c, 's3')]).toEqual(['rejected', 'accepted', 'accepted']);
  });

  it('a read-only note refuses every change', () => {
    const c = make(model({ readOnly: true }));
    const before = c.getSnapshot();
    for (const intent of [
      { type: 'suggestionAccepted', suggestionId: 's1' }, { type: 'acceptAllPendingRequested' },
      { type: 'textAppendRequested', text: 'x' }, { type: 'suggestionEdited', suggestionId: 's1', value: 'y' }
    ] as const) c.dispatch(intent);
    expect(c.getSnapshot()).toBe(before);
  });
});

describe('NoteCaptureController immutability', () => {
  it('never mutates the model it was given or an earlier snapshot', () => {
    const initial = model(); // deep-frozen: any in-place write throws in strict mode
    const c = make(initial);
    const first = c.getSnapshot();
    c.dispatch({ type: 'suggestionSelected', suggestionId: 's1' });
    c.dispatch({ type: 'suggestionEdited', suggestionId: 's1', value: 'z' });
    c.dispatch({ type: 'acceptAllPendingRequested' });
    c.dispatch({ type: 'textAppendRequested', text: 'Pressure is normal' });
    c.dispatch({ type: 'segmentEditRequested', segmentId: 'seg-1', text: 'Pain in the left eye' });
    expect(first).toBe(initial);
    expect(first.suggestions[0].status).toBe('pending');
    expect(first.segments).toHaveLength(1);
    expect(c.getSnapshot()).not.toBe(first);
  });
});

describe('NoteCaptureController transcript', () => {
  it('appends a typed segment with an injected id and ignores blank text', () => {
    const c = make();
    c.dispatch({ type: 'textAppendRequested', text: '   ' });
    expect(c.getSnapshot().segments).toHaveLength(1);
    c.dispatch({ type: 'textAppendRequested', text: '  IOP 14 right  ' });
    expect(c.getSnapshot().segments[1]).toMatchObject({ id: 'new-1', text: 'IOP 14 right', source: 'typed', startMs: null, endMs: null });
  });

  it('editing a segment drops the spans that pointed into the old text and unlinks their suggestions', () => {
    const c = make();
    c.dispatch({ type: 'spanSelected', spanId: 'sp-a' });
    c.dispatch({ type: 'segmentEditRequested', segmentId: 'seg-1', text: 'Pain in the left eye' });
    const s = c.getSnapshot();
    expect(s.segments[0].text).toBe('Pain in the left eye');
    expect(s.spans).toEqual([]);
    expect(s.suggestions.every(x => x.spanIds.length === 0)).toBe(true);
    expect(s.highlightedSpanIds).toEqual([]);
  });

  it('does not edit a segment that is not editable', () => {
    const base = model();
    const c = make(model({ segments: [{ ...base.segments[0], editable: false }] }));
    const before = c.getSnapshot();
    c.dispatch({ type: 'segmentEditRequested', segmentId: 'seg-1', text: 'changed' });
    expect(c.getSnapshot()).toBe(before);
  });
});

describe('NoteCaptureController summarise', () => {
  it('passes the segments to the port and keeps reviewed suggestions when it re-runs', async () => {
    const seen: number[] = [];
    const port: NoteCapturePort = {
      summarise: async segments => {
        seen.push(segments.length);
        return {
          spans: [span('n-sp', ['n1', 'n2'])],
          suggestions: [suggestion('n1', { path: ['hpi', 's1'], spanIds: ['n-sp'] }), suggestion('n2', { spanIds: ['n-sp'] })]
        };
      }
    };
    const c = make(model(), port);
    c.dispatch({ type: 'suggestionAccepted', suggestionId: 's1' });
    c.dispatch({ type: 'summariseRequested' });
    expect(c.getSnapshot().summarising).toBe(true);
    await new Promise(r => setTimeout(r));
    const s = c.getSnapshot();
    expect(seen).toEqual([1]);
    expect(s.summarising).toBe(false);
    // s1 was accepted and keeps its place; n1 targets the same path so it is dropped; s2 and s3 (pending) are replaced.
    expect(s.suggestions.map(x => x.id)).toEqual(['s1', 'n2']);
    expect(s.spans.map(x => x.id)).toEqual(['sp-a', 'sp-b', 'n-sp']);
    expect(s.spans.find(x => x.id === 'n-sp')?.suggestionIds).toEqual(['n2']);
  });

  it('reports a failed summarise and lets the user try again', async () => {
    const c = make(model(), { summarise: async () => { throw new Error('Service unavailable'); } });
    c.dispatch({ type: 'summariseRequested' });
    await new Promise(r => setTimeout(r));
    expect(c.getSnapshot()).toMatchObject({ summarising: false, canSummarise: true, summariseError: 'Service unavailable' });
  });

  it('aborts the request when destroyed', async () => {
    let signal!: AbortSignal;
    const c = make(model(), { summarise: (_s, sig) => { signal = sig; return new Promise(() => undefined); } });
    c.dispatch({ type: 'summariseRequested' });
    c.destroy();
    expect(signal.aborted).toBe(true);
  });
});

describe('NoteCaptureController dictation', () => {
  it('listens, receives spoken segments from the adapter, and stops', async () => {
    let push!: (s: { text: string; startMs: number | null; endMs: number | null; timeLabel: string }) => void;
    const c = make(model(), { ...idle, startDictation: async sink => { push = sink; }, stopDictation: async () => undefined });
    c.dispatch({ type: 'dictationStartRequested' });
    await new Promise(r => setTimeout(r));
    expect(c.getSnapshot().dictation).toMatchObject({ status: 'listening', canStart: false, canStop: true });
    push({ text: 'IOP fourteen right', startMs: 5000, endMs: 7000, timeLabel: '00:05' });
    expect(c.getSnapshot().segments[1]).toMatchObject({ id: 'new-1', source: 'spoken', timeLabel: '00:05' });
    c.dispatch({ type: 'dictationStopRequested' });
    await new Promise(r => setTimeout(r));
    expect(c.getSnapshot().dictation).toMatchObject({ status: 'idle', canStart: true, canStop: false });
  });

  it('shows an error when dictation cannot start', async () => {
    const c = make(model(), { ...idle, startDictation: async () => { throw new Error('Microphone not available'); } });
    c.dispatch({ type: 'dictationStartRequested' });
    await new Promise(r => setTimeout(r));
    expect(c.getSnapshot().dictation).toMatchObject({ status: 'error', error: 'Microphone not available', canStart: true });
  });
});
