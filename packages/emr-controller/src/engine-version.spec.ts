import { describe, expect, it } from 'vitest';
import { EMR_ENGINE_VERSION, requiredEngineFor } from './engine-version';
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
});
