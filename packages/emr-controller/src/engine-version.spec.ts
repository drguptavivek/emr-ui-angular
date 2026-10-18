import { describe, expect, it } from 'vitest';
import { EMR_ENGINE_VERSION, EMR_LOGIC_LEVELS, requiredEngineFor, validateLogic } from './engine-version';
import { BUILTIN_FNS } from './condition.models';
import type { EmrFormLogic } from './form-logic';
import type { ClinicalFormSchema } from './clinical-form.models';

const base: ClinicalFormSchema = { id: 'f', label: 'F', sections: [{ id: 's', label: 'S', blocks: [
  { id: 'a', label: 'A', type: 'text' },
  { kind: 'repeatable', id: 'r', label: 'R', fields: [{ id: 'b', label: 'B', type: 'date' }] },
] }] };

describe('engine version', () => {
  it('needs level 1 for fields and repeatables, 2 once a matrix appears', () => {
    expect(requiredEngineFor(base)).toBe(1);
    const withMatrix: ClinicalFormSchema = { ...base, sections: [...base.sections, { id: 'm', label: 'M', blocks: [
      { kind: 'matrix', id: 'eyes', label: 'Eyes', columns: [{ id: 'OD', label: 'OD' }], rows: [{ id: 'iop', label: 'IOP', cells: { OD: { id: 'IOP_RE', label: 'IOP', type: 'integer' } } }] },
    ] }] };
    expect(requiredEngineFor(withMatrix)).toBe(2);
  });

  it('never reports a level above what this build supports', () => {
    expect(EMR_ENGINE_VERSION).toBeGreaterThanOrEqual(2);
  });

  it('needs level 3 once a definition carries logic, and Infinity for an operator this build does not know', () => {
    const logic: EmrFormLogic = { computed: [], fields: { a: { relevant: { op: '=', left: { path: 'b' }, right: { value: '1' } } } } };
    expect(requiredEngineFor(base, logic)).toBe(3);
    expect(requiredEngineFor(base, { computed: [], fields: { a: {} } })).toBe(1); // logic block without trees
    const future: EmrFormLogic = { computed: [{ id: 'd', calculation: { fn: 'today' as never, args: [] } }], fields: {} };
    expect(requiredEngineFor(base, future)).toBe(Number.POSITIVE_INFINITY);
    expect(validateLogic(future)).toEqual(['Unknown logic operator or function "today"']);
    expect(validateLogic(logic)).toEqual([]);
  });

  it('gives every built-in function and operator a level no higher than this build', () => {
    for (const fn of BUILTIN_FNS) expect(EMR_LOGIC_LEVELS[fn]).toBeLessThanOrEqual(EMR_ENGINE_VERSION);
    expect(EMR_ENGINE_VERSION).toBe(3);
  });
});
