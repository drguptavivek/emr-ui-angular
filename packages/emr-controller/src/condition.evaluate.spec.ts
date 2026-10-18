import { describe, expect, it } from 'vitest';
import { evalCondition, evalExpr } from './condition.evaluate';
import type { CmpOp, EmrCondition, EmrExpr } from './condition.models';
import { references } from './condition.models';

// Parity suite: the cases vcms-app pinned against compiled ODK forms (xpath.test.ts), written as trees.
const p = (path: string): EmrExpr => ({ path });
const v = (value: string | number | boolean | null): EmrExpr => ({ value });
const cmp = (left: EmrExpr, op: CmpOp, right: EmrExpr): EmrCondition => ({ op, left, right });
const sel = (field: string, value: string): EmrCondition => ({ fn: 'includesValue', args: [p(field), v(value)] });

describe('evalCondition (XPath coercion)', () => {
  it('matches the p59 relevant/constraint shapes', () => {
    expect(evalCondition({ any: ['99', '98', '96'].map(x => cmp(p('Cluster'), '=', v(x))) }, { Cluster: '98' })).toBe(true);
    expect(evalCondition(cmp(p('opdBarCode'), '=', v('')), { opdBarCode: '' })).toBe(true);
    expect(evalCondition({ all: [cmp(p('N_O'), '=', v(2)), cmp(p('DryPmtDil'), '=', v(2))] }, { N_O: '2', DryPmtDil: '2' })).toBe(true);
    expect(evalCondition({ any: [sel('referred', '1'), sel('referred', '4')] }, { referred: '3 4' })).toBe(true);
    expect(evalCondition(cmp(p('bcva1'), '>', p('pva1')), { bcva1: '7', pva1: '12' })).toBe(false); // numeric, not string
    expect(evalCondition({ all: [cmp(p('aiDecisionGL'), '=', v(2)), { any: [cmp(p('IOP_RE'), '>', v(25)), cmp(p('IOP_LE'), '>', v(25))] }] },
      { aiDecisionGL: '2', IOP_RE: '', IOP_LE: '30' })).toBe(true);
    expect(evalCondition(cmp(p('clinic'), '=', v('Cataract')), { clinic: 'Cataract' })).toBe(true);
  });

  it('empty values follow XPath NaN rules', () => {
    expect(evalCondition(cmp(p('age'), '>=', v(38)), { age: '' })).toBe(false);
    expect(evalCondition(cmp(p('DiagnosisCode'), '!=', v(3)), { DiagnosisCode: '' })).toBe(true);
  });

  it('regex and negative numbers', () => {
    expect(evalCondition({ fn: 'matchesPattern', args: [p('opdText'), v('^[0-9\\- ]{12}$')] }, { opdText: '17 26 000123' })).toBe(true);
    const range: EmrCondition = { all: [cmp(p('Sph1'), '>=', v(-25)), cmp(p('Sph1'), '<=', v(25))] };
    expect(evalCondition(range, { Sph1: '-25' })).toBe(true);
    expect(evalCondition(range, { Sph1: '-25.25' })).toBe(false);
  });

  it('multiselect arrays read as space-separated values', () => {
    expect(evalCondition(sel('curTD', '4'), { curTD: ['1', '4'] })).toBe(true);
  });
});

describe('evalExpr', () => {
  it('calculations', () => {
    expect(evalExpr({ fn: 'if', args: [{ cond: cmp(p('opdBarCode'), '!=', v('')) }, p('opdBarCode'), p('opdText')] }, { opdBarCode: '', opdText: 'x' })).toBe('x');
    const sum = (ids: string[]): EmrExpr => ids.map(id => ({ fn: 'coalesce' as const, args: [p(id), v(0)] }) as EmrExpr)
      .reduce((a, b) => ({ fn: 'add', args: [a, b] }));
    expect(evalExpr(sum(['cost_travel', 'cost_food', 'cost_other']), { cost_travel: '10', cost_food: '', cost_other: '5' })).toBe(15);
    expect(evalExpr({ fn: 'join', args: [p('Cluster'), v('-'), p('ReferNo')] }, { Cluster: '17', ReferNo: '42' })).toBe('17-42');
    expect(evalExpr({ fn: 'formatDate', args: [p('dateForSx'), v('%d-%m-%Y')] }, { dateForSx: '2026-10-18' })).toBe('18-10-2026');
    expect(evalExpr({ fn: 'if', args: [{ cond: sel('curTD', '4') }, v('Use Insulin'), v('Not use Insuline')] }, { curTD: '1 4' })).toBe('Use Insulin');
  });

  it('arithmetic that is not a finite number is empty, never Infinity or NaN (clinical default)', () => {
    expect(evalExpr({ fn: 'div', args: [v(10), v(0)] }, {})).toBeNull();
    expect(evalExpr({ fn: 'div', args: [p('a'), v(2)] }, { a: '' })).toBeNull();
    expect(evalExpr({ fn: 'add', args: [p('a'), v(1)] }, { a: 'abc' })).toBeNull();
    expect(evalExpr({ fn: 'mod', args: [v(5), v(0)] }, {})).toBeNull();
    expect(evalExpr({ fn: 'div', args: [v(9), v(3)] }, {})).toBe(3);
  });

  it('fails loudly on an unknown function instead of evaluating it as true', () => {
    expect(() => evalExpr({ fn: 'today' as never, args: [] }, {})).toThrow(/Unknown EmrFn/);
  });

  it('lists the fields a tree reads', () => {
    expect([...references({ all: [cmp(p('a'), '=', p('b')), sel('c', '1')] })].sort()).toEqual(['a', 'b', 'c']);
  });
});
