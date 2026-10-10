import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ANNOTATION_FILL_PATTERNS, ANNOTATION_STROKE_STYLES } from '@drguptavivek/emr-controller';
import type { AnnotationSymbolSet } from '@drguptavivek/emr-controller';
import { GENERAL_FINDINGS_SYMBOLS } from './general-findings';
import { RETINA_SYMBOLS } from './retina';
import { SURGERY_SYMBOLS } from './surgery';

/** L5 annotation symbol sets: data only, so these checks keep them that way. */
const root = join(process.cwd(), 'packages/emr-ui/src/lib/recipes/annotation-symbols');
const docFile = join(process.cwd(), 'docs/catalog/L5-recipes.md');
const sets: readonly [string, AnnotationSymbolSet][] = [['surgery', SURGERY_SYMBOLS], ['retina', RETINA_SYMBOLS], ['general-findings', GENERAL_FINDINGS_SYMBOLS]];
const TOOLS = ['text', 'line', 'arrow', 'callout', 'curve', 'circle', 'polygon', 'freeform'];

describe('L5 annotation symbol sets', () => {
  it.each(sets)('%s: is data only (type imports, nothing runs)', (file) => {
    const source = readFileSync(join(root, `${file}.ts`), 'utf8');
    const imports = source.split('\n').filter(line => /^\s*import\b/.test(line));
    expect(imports.length).toBeGreaterThan(0);
    for (const line of imports) expect(line).toMatch(/^import type /);
    expect(source).not.toMatch(/@angular|\bfunction\b|=>/);
  });

  it.each(sets)('%s: unique ids, valid enums and hex colours, every class resolves', (_file, set) => {
    expect(set.reviewStatus).toBe('unreviewed');
    expect(set.version).toBeGreaterThanOrEqual(1);
    const ids = set.presets.map(preset => preset.id);
    expect(new Set(ids).size, 'duplicate preset ids').toBe(ids.length);
    const labelIds = set.labels.map(label => label.id);
    expect(new Set(labelIds).size, 'duplicate label ids').toBe(labelIds.length);
    for (const preset of set.presets) {
      expect(TOOLS, preset.id).toContain(preset.tool);
      if (preset.strokeStyle) expect(ANNOTATION_STROKE_STYLES as readonly string[], preset.id).toContain(preset.strokeStyle);
      if (preset.fillPattern) expect(ANNOTATION_FILL_PATTERNS as readonly string[], preset.id).toContain(preset.fillPattern);
      if (preset.colour) expect(preset.colour, preset.id).toMatch(/^#[0-9a-f]{6}$/i);
      if (preset.width) expect(preset.width).toBeGreaterThan(0);
      if (preset.classId) expect(labelIds, `${preset.id} names an unknown class`).toContain(preset.classId);
    }
    for (const label of set.labels) if (label.color) expect(label.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('keeps preset ids unique across sets', () => {
    const ids = sets.flatMap(([, set]) => set.presets.map(preset => preset.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists every set under the annotation-symbols heading of the L5 catalogue', () => {
    const doc = readFileSync(docFile, 'utf8');
    const start = doc.indexOf('### annotation-symbols');
    expect(start, 'missing "### annotation-symbols" in docs/catalog/L5-recipes.md').toBeGreaterThanOrEqual(0);
    const rest = doc.slice(start + 4);
    const end = rest.search(/\n##+ /);
    const section = end < 0 ? rest : rest.slice(0, end);
    for (const [, set] of sets) expect(section, `set ${set.id} not documented`).toContain(`\`${set.id}\``);
  });
});
