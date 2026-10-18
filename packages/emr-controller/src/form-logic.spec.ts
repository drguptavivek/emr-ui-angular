import { describe, expect, it } from 'vitest';
import type { CmpOp, EmrCondition, EmrExpr } from './condition.models';
import { isEmptyValue, resolveLogic, type EmrFormLogic } from './form-logic';

// Parity suite for vcms-app's resolveForm semantics (form-engine.test.ts), on a synthetic definition.
const p = (path: string): EmrExpr => ({ path });
const v = (value: string | number | null): EmrExpr => ({ value });
const cmp = (left: EmrExpr, op: CmpOp, right: EmrExpr): EmrCondition => ({ op, left, right });

const opd: EmrFormLogic = {
  computed: [
    { id: 'opd', calculation: { fn: 'if', args: [{ cond: cmp(p('opdBarCode'), '!=', v('')) }, p('opdBarCode'), p('opdText')] } },
    { id: 'uhidNo' }, // prefill: supplied by the app
  ],
  fields: {
    name: { required: true },
    opdBarCode: {},
    opdText: { relevant: cmp(p('opdBarCode'), '=', v('')) },
    SpecBook: {},
    SpecType: { relevant: cmp(p('SpecBook'), '=', v(1)) },
    Sph1: { constraint: { condition: { all: [cmp(p('Sph1'), '>=', v(-25)), cmp(p('Sph1'), '<=', v(25))] }, message: 'Sph must be -25 to 25' } },
    note1: { display: true, required: true },
  },
};

describe('resolveLogic', () => {
  it('calculates, hides and clears non-relevant fields (as ODK does)', () => {
    const r = resolveLogic(opd, { opdBarCode: '17-26-000123', SpecBook: '2', SpecType: ['1'] });
    expect(r.values['opd']).toBe('17-26-000123');
    expect(r.fields['opdText']!.hidden).toBe(true);
    expect(r.fields['SpecType']!.hidden).toBe(true);
    expect(r.values['SpecType']).toBeNull();
    expect(r.fields['SpecType']!.value).toBeNull();
  });

  it('keeps app-supplied computed values (prefill)', () => {
    expect(resolveLogic(opd, { uhidNo: '123456789' }).values['uhidNo']).toBe('123456789');
  });

  it('constraints judge values; required errors show only after a submit attempt but always block', () => {
    const r = resolveLogic(opd, { opdBarCode: 'x', Sph1: '30' });
    expect(r.fields['Sph1']!.error).toBe('Sph must be -25 to 25');
    expect(r.fields['name']!.error).toBeUndefined();
    expect(r.blockingErrors['name']).toBe('Required');
    expect(r.canSubmit).toBe(false);
    expect(resolveLogic(opd, { opdBarCode: 'x' }, { showRequiredErrors: true, requiredMessage: 'आवश्यक' }).fields['name']!.error).toBe('आवश्यक');
    expect(resolveLogic(opd, { opdBarCode: 'x', name: 'Test Patient A', Sph1: '-1.25' }).canSubmit).toBe(true);
  });

  it('display-only fields are never required', () => {
    expect(resolveLogic(opd, {}).fields['note1']!.required).toBe(false);
  });

  it('stage gating: later stages hidden, earlier read-only unless data manager, required only for the current stage', () => {
    const sx: EmrFormLogic = { computed: [], fields: { crNo: { required: true, stage: 1 }, sxDone: { required: true, stage: 2 } } };
    const s1 = resolveLogic(sx, {}, { stage: 1, showRequiredErrors: true });
    expect(s1.fields['sxDone']).toMatchObject({ hidden: true, required: false });
    expect(s1.fields['crNo']!.readOnly).toBeUndefined();
    expect(s1.fields['crNo']!.error).toBe('Required');
    const s2 = resolveLogic(sx, { crNo: 'CR1' }, { stage: 2 });
    expect(s2.fields['crNo']!.readOnly).toBe(true);
    expect(s2.fields['crNo']!.required).toBe(false);
    expect(s2.fields['sxDone']!.hidden).toBeUndefined();
    expect(resolveLogic(sx, { crNo: 'CR1' }, { stage: 2, canEditEarlierStages: true }).fields['crNo']!.readOnly).toBeUndefined();
  });

  it('clearing cascades: a cleared field can make another non-relevant', () => {
    const chain: EmrFormLogic = { computed: [], fields: {
      a: {},
      b: { relevant: cmp(p('a'), '=', v('yes')) },
      c: { relevant: cmp(p('b'), '!=', v('')) },
    } };
    const r = resolveLogic(chain, { a: 'no', b: 'x', c: 'y' });
    expect(r.values['b']).toBeNull();
    expect(r.fields['c']!.hidden).toBe(true);
    expect(r.values['c']).toBeNull();
  });

  it('a long clearing cascade settles within the pass budget (no settleError)', () => {
    // Values are only ever cleared, so relevance always converges; settleError is a guard, not a reachable path today.
    const n = 30;
    const fields = Object.fromEntries(Array.from({ length: n }, (_, i) =>
      [`f${i}`, i === 0 ? {} : { relevant: cmp(p(`f${i - 1}`), '!=', v('')) }]));
    const input = Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i}`, i === 0 ? '' : 'x']));
    const r = resolveLogic({ computed: [], fields }, input);
    expect(r.settleError).toBeUndefined();
    expect(r.values[`f${n - 1}`]).toBeNull();
    expect(r.fields[`f${n - 1}`]!.hidden).toBe(true);
  });

  it('one emptiness rule', () => {
    expect([null, undefined, '', [], { value: null, unit: 'mmHg' }].every(x => isEmptyValue(x as never))).toBe(true);
    expect([0, false, 'x', ['a'], { value: 0, unit: 'mmHg' }].some(x => isEmptyValue(x as never))).toBe(false);
  });
});
