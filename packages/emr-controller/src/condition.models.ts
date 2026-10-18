/**
 * EmrCondition / EmrExpr — the serialisable form-logic language (docs/openrosa-logic-engine-proposal.md,
 * concept 9). Definitions are compiled on the server (e.g. from XLSForm XPath) into these JSON trees; no
 * XPath runs on the device. Field references are bare field ids.
 *
 * Adding an operator or function: add it here, give it a level in engine-version.ts and bump
 * EMR_ENGINE_VERSION, so a device that cannot evaluate it never opens the definition.
 */
export type CmpOp = '=' | '!=' | '>' | '>=' | '<' | '<=';

export type EmrFn =
  | 'includesValue' // selected(field, value)
  | 'matchesPattern' // regex(value, pattern)
  | 'coalesce'
  | 'if' // if(cond, then, else) — first arg is { cond }
  | 'length' // string-length
  | 'join' // concat(…)
  | 'formatDate' // format-date(value, ODK pattern)
  | 'toBoolean'
  | 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'neg';

export type EmrExpr =
  | { path: string }
  | { value: string | number | boolean | null }
  | { fn: EmrFn; args: EmrExpr[] }
  | { cond: EmrCondition };

export type EmrCondition =
  | { all: EmrCondition[] } // { all: [] } = true()
  | { any: EmrCondition[] } // { any: [] } = false()
  | { not: EmrCondition }
  | { op: CmpOp; left: EmrExpr; right: EmrExpr }
  | { fn: EmrFn; args: EmrExpr[] };

export const BUILTIN_FNS: ReadonlySet<EmrFn> = new Set<EmrFn>([
  'includesValue', 'matchesPattern', 'coalesce', 'if', 'length', 'join', 'formatDate', 'toBoolean',
  'add', 'sub', 'mul', 'div', 'mod', 'neg',
]);

/** Field ids a condition or expression reads (dependency tracking and load-time validation). */
export function references(node: EmrCondition | EmrExpr, out = new Set<string>()): Set<string> {
  if ('path' in node) out.add(node.path);
  else if ('all' in node) node.all.forEach(c => references(c, out));
  else if ('any' in node) node.any.forEach(c => references(c, out));
  else if ('not' in node) references(node.not, out);
  else if ('cond' in node) references(node.cond, out);
  else if ('op' in node) { references(node.left, out); references(node.right, out); }
  else if ('fn' in node) node.args.forEach(a => references(a, out));
  return out;
}

/** Every function and comparison operator a tree uses (engine-level and load-time checks). */
export function operatorsUsed(node: EmrCondition | EmrExpr, out = new Set<string>()): Set<string> {
  if ('all' in node) { out.add('all'); node.all.forEach(c => operatorsUsed(c, out)); }
  else if ('any' in node) { out.add('any'); node.any.forEach(c => operatorsUsed(c, out)); }
  else if ('not' in node) { out.add('not'); operatorsUsed(node.not, out); }
  else if ('cond' in node) operatorsUsed(node.cond, out);
  else if ('op' in node) { out.add(node.op); operatorsUsed(node.left, out); operatorsUsed(node.right, out); }
  else if ('fn' in node) { out.add(node.fn); node.args.forEach(a => operatorsUsed(a, out)); }
  return out;
}
