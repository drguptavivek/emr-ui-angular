import type { ClinicalFormSchema } from './clinical-form.models.js';
import type { CmpOp, EmrCondition, EmrExpr, EmrFn } from './condition.models.js';
import { operatorsUsed } from './condition.models.js';
import type { EmrFormLogic } from './form-logic.js';

/**
 * Feature level of the form engine and renderers in this build. Bump it, and give the new feature a
 * level below, whenever block kinds, field types, condition operators or functions are added, so a
 * definition stamped with `minEngine` is never opened by a build that cannot render or evaluate it.
 *
 *   1  sections, field and repeatable blocks, all ClinicalFieldType values
 *   2  matrix blocks
 *   3  condition engine (resolveLogic): all/any/not, the six comparisons, the 14 functions below
 */
export const EMR_ENGINE_VERSION = 3;

/** Level at which each logic operator and function became available. Absent = unknown to this build. */
export const EMR_LOGIC_LEVELS: Readonly<Record<'all' | 'any' | 'not' | CmpOp | EmrFn, number>> = {
  all: 3, any: 3, not: 3,
  '=': 3, '!=': 3, '>': 3, '>=': 3, '<': 3, '<=': 3,
  includesValue: 3, matchesPattern: 3, coalesce: 3, if: 3, length: 3, join: 3, formatDate: 3, toBoolean: 3,
  add: 3, sub: 3, mul: 3, div: 3, mod: 3, neg: 3,
};

const levelOf = (op: string): number | undefined => (EMR_LOGIC_LEVELS as Record<string, number>)[op];

function logicTrees(logic: EmrFormLogic): (EmrCondition | EmrExpr)[] {
  const trees: (EmrCondition | EmrExpr)[] = [];
  for (const f of Object.values(logic.fields)) {
    if (f.relevant) trees.push(f.relevant);
    if (f.requiredCondition) trees.push(f.requiredCondition);
    if (f.constraint) trees.push(f.constraint.condition);
  }
  for (const c of logic.computed) {
    if (c.relevant) trees.push(c.relevant);
    if (c.calculation) trees.push(c.calculation);
  }
  return trees;
}

/**
 * Minimum engine level a definition needs: the highest level of any feature it uses. An operator this
 * build does not know yields Infinity, so no device ever accepts the definition by accident.
 */
export function requiredEngineFor(schema: ClinicalFormSchema, logic?: EmrFormLogic): number {
  let level = 1;
  for (const section of schema.sections) {
    for (const block of section.blocks) {
      if (block.kind === 'matrix') level = Math.max(level, 2);
    }
  }
  if (logic) {
    const trees = logicTrees(logic);
    if (trees.length) level = Math.max(level, 3);
    for (const tree of trees) {
      for (const op of operatorsUsed(tree)) level = Math.max(level, levelOf(op) ?? Number.POSITIVE_INFINITY);
    }
  }
  return level;
}

/** Load-time check: operators this build cannot evaluate. Empty = safe to resolve. */
export function validateLogic(logic: EmrFormLogic): string[] {
  const unknown = new Set<string>();
  for (const tree of logicTrees(logic)) for (const op of operatorsUsed(tree)) if (levelOf(op) === undefined) unknown.add(op);
  return [...unknown].map(op => `Unknown logic operator or function "${op}"`);
}
