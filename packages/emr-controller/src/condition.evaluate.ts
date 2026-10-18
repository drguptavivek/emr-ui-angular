import type { EmrCondition, EmrExpr } from './condition.models.js';

/**
 * Evaluator for EmrCondition / EmrExpr with XPath 1.0 coercion for comparisons (numbers if either side is
 * a number, booleans if either is boolean, else strings).
 *
 * Arithmetic deliberately departs from XPath: a result that is not a finite number (division by zero, an
 * empty or non-numeric operand) is empty (null), never Infinity or NaN. A calculated clinical value must
 * show as "no value", not as a number nobody entered.
 */
export type EmrLogicValues = Readonly<Record<string, unknown>>;
export type EmrScalar = string | number | boolean | null;

const str = (v: unknown): string => (v === null || v === undefined ? '' : Array.isArray(v) ? v.join(' ') : String(v));
const num = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const s = str(v).trim();
  return s === '' ? NaN : Number(s);
};
const finite = (n: number): number | null => (Number.isFinite(n) ? n : null);
const truthy = (v: EmrScalar) => (typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 && !Number.isNaN(v) : str(v) !== '');

// Patterns come from the server, not users; compile each once instead of on every evaluation.
// ponytail: unbounded cache; definitions carry a handful of patterns. Add an LRU if that ever changes.
const regexCache = new Map<string, RegExp>();
const regex = (pattern: string) => {
  let r = regexCache.get(pattern);
  if (!r) { r = new RegExp(pattern); regexCache.set(pattern, r); }
  return r;
};

export function evalExpr(e: EmrExpr, values: EmrLogicValues): EmrScalar {
  if ('path' in e) { const v = values[e.path]; return v === undefined ? '' : Array.isArray(v) ? v.join(' ') : (v as EmrScalar); }
  if ('value' in e) return e.value;
  if ('cond' in e) return evalCondition(e.cond, values);
  const a = e.args.map(x => evalExpr(x, values));
  switch (e.fn) {
    case 'add': return finite(num(a[0]) + num(a[1]));
    case 'sub': return finite(num(a[0]) - num(a[1]));
    case 'mul': return finite(num(a[0]) * num(a[1]));
    case 'div': return finite(num(a[0]) / num(a[1]));
    case 'mod': return finite(num(a[0]) % num(a[1]));
    case 'neg': return finite(-num(a[0]));
    case 'coalesce': return a.find(x => str(x) !== '') ?? '';
    case 'if': return truthy(a[0] ?? null) ? a[1] ?? null : a[2] ?? null;
    case 'length': return str(a[0]).length;
    case 'join': return a.map(str).join('');
    case 'formatDate': return formatDate(str(a[0]), str(a[1]));
    case 'toBoolean': return truthy(a[0] ?? null);
    case 'includesValue': return str(a[0]).split(' ').includes(str(a[1]));
    case 'matchesPattern': return regex(str(a[1])).test(str(a[0]));
    default: throw new Error(`Unknown EmrFn "${(e as { fn: string }).fn}" — validate definitions at load (validateLogic).`);
  }
}

export function evalCondition(c: EmrCondition, values: EmrLogicValues): boolean {
  if ('all' in c) return c.all.every(x => evalCondition(x, values));
  if ('any' in c) return c.any.some(x => evalCondition(x, values));
  if ('not' in c) return !evalCondition(c.not, values);
  if ('fn' in c) return truthy(evalExpr(c, values));
  const l = evalExpr(c.left, values);
  const r = evalExpr(c.right, values);
  if (c.op === '=' || c.op === '!=') {
    const eq = typeof l === 'boolean' || typeof r === 'boolean' ? truthy(l) === truthy(r)
      : typeof l === 'number' || typeof r === 'number' ? num(l) === num(r)
      : str(l) === str(r);
    return c.op === '=' ? eq : !eq;
  }
  const a = num(l), b = num(r);
  switch (c.op) {
    case '<': return a < b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '>=': return a >= b;
    default: throw new Error(`Unknown comparison "${(c as { op: string }).op}".`);
  }
}

function formatDate(iso: string, pattern: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return '';
  return pattern.replace('%Y', m[1]!).replace('%m', m[2]!).replace('%d', m[3]!).replace('%y', m[1]!.slice(2));
}
