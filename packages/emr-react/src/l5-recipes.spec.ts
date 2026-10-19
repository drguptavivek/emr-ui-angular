import { describe, expect, it } from 'vitest';
import {
  ANATOMY_RECIPES,
  ANNOTATION_SYMBOL_SETS,
  GENERAL_FINDINGS_SYMBOLS,
  RETINA_SYMBOLS,
  SURGERY_SYMBOLS,
} from './l5-recipes';
import {
  ANATOMY_RECIPES as CONTROLLER_ANATOMY_RECIPES,
  GENERAL_FINDINGS_SYMBOLS as CONTROLLER_GENERAL_FINDINGS_SYMBOLS,
  RETINA_SYMBOLS as CONTROLLER_RETINA_SYMBOLS,
  SURGERY_SYMBOLS as CONTROLLER_SURGERY_SYMBOLS,
} from '../../emr-controller/src/recipes/index.js';

describe('L5 recipes (anatomy and annotation symbol sets)', () => {
  it('exports all 226 anatomy outline recipes across 43 groups with valid dimensions, unique ids, and provenance', () => {
    expect(ANATOMY_RECIPES).toHaveLength(226);
    const ids = new Set<string>();
    for (const recipe of ANATOMY_RECIPES) {
      expect(recipe.id.trim().length).toBeGreaterThan(0);
      expect(ids.has(recipe.id)).toBe(false);
      ids.add(recipe.id);
      expect(recipe.width).toBeGreaterThan(0);
      expect(recipe.height).toBeGreaterThan(0);
      expect(recipe.asset).toMatch(/\.svg$/);
      expect(recipe.provenance.author.length).toBeGreaterThan(0);
      expect(recipe.provenance.licence.length).toBeGreaterThan(0);
    }
  });

  it('exports GENERAL_FINDINGS_SYMBOLS, RETINA_SYMBOLS, and SURGERY_SYMBOLS with valid labels and presets', () => {
    expect(ANNOTATION_SYMBOL_SETS).toEqual([GENERAL_FINDINGS_SYMBOLS, RETINA_SYMBOLS, SURGERY_SYMBOLS]);

    for (const set of [GENERAL_FINDINGS_SYMBOLS, RETINA_SYMBOLS, SURGERY_SYMBOLS]) {
      expect(set.id.length).toBeGreaterThan(0);
      expect(set.label.length).toBeGreaterThan(0);
      expect(set.labels.length).toBeGreaterThan(0);
      expect(set.presets.length).toBeGreaterThan(0);

      const labelIds = new Set(set.labels.map(l => l.id));
      for (const preset of set.presets) {
        expect(preset.id.length).toBeGreaterThan(0);
        expect(preset.label.length).toBeGreaterThan(0);
        if (preset.classId) {
          expect(labelIds.has(preset.classId)).toBe(true);
        }
      }
    }
  });

  it('stays in exact parity with emr-controller recipes', () => {
    expect(ANATOMY_RECIPES).toEqual(CONTROLLER_ANATOMY_RECIPES);
    expect(GENERAL_FINDINGS_SYMBOLS).toEqual(CONTROLLER_GENERAL_FINDINGS_SYMBOLS);
    expect(RETINA_SYMBOLS).toEqual(CONTROLLER_RETINA_SYMBOLS);
    expect(SURGERY_SYMBOLS).toEqual(CONTROLLER_SURGERY_SYMBOLS);
  });
});
