import type { AnnotationSymbolSet } from '../../annotation-symbol.models.js';

/** Surgical planning and operative marks. Colours are data; a clinician reviews them before production use. */
export const SURGERY_SYMBOLS: AnnotationSymbolSet = {
  id: 'surgery',
  label: 'Surgery',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Conventional operative-note drawing marks; drafted for this library, not yet reviewed by a surgeon.',
  labels: [
    { id: 'suture-line', label: 'Suture line', color: '#6d28d9' },
    { id: 'incision', label: 'Incision', color: '#be123c' },
    { id: 'planned-incision', label: 'Planned incision', color: '#be123c' },
    { id: 'excision-margin', label: 'Excision margin', color: '#b45309' },
    { id: 'drain-site', label: 'Drain site', color: '#0369a1' },
    { id: 'area-to-excise', label: 'Area to excise', color: '#be185d' },
    { id: 'surgical-note', label: 'Note', color: '#334155' },
  ],
  presets: [
    { id: 'surgery-sutures', label: 'Sutures', description: 'Closed wound, drawn as a line crossed by ticks', tool: 'curve', strokeStyle: 'sutured', colour: '#6d28d9', width: 3, classId: 'suture-line' },
    { id: 'surgery-incision', label: 'Incision', description: 'Made incision', tool: 'curve', strokeStyle: 'solid', colour: '#be123c', width: 3, classId: 'incision' },
    { id: 'surgery-planned-incision', label: 'Planned incision', description: 'Marked, not yet made', tool: 'curve', strokeStyle: 'dashed', colour: '#be123c', width: 3, classId: 'planned-incision' },
    { id: 'surgery-excision-margin', label: 'Excision margin', description: 'Outline of tissue to be removed', tool: 'polygon', strokeStyle: 'dashed', colour: '#b45309', width: 3, classId: 'excision-margin' },
    { id: 'surgery-drain-site', label: 'Drain site', description: 'Arrow pointing at the drain exit', tool: 'arrow', colour: '#0369a1', width: 3, classId: 'drain-site' },
    { id: 'surgery-area-to-excise', label: 'Area to excise', description: 'Hatched area', tool: 'polygon', fillPattern: 'hatch', colour: '#be185d', width: 2, classId: 'area-to-excise' },
    { id: 'surgery-callout', label: 'Callout note', description: 'Text with an arrow to the area', tool: 'callout', colour: '#334155', width: 3, classId: 'surgical-note' },
  ],
};
