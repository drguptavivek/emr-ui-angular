import { describe, expect, it } from 'vitest';
import { FieldGeneratorController } from './field-generator.controller.js';
import type { EmrGeneratedFieldDefinition } from './field-generator.models.js';
import type { TerminologyConcept, TerminologySource } from './terminology.models.js';

const sources: readonly TerminologySource[] = [
  { id: 'loinc', kind: 'loinc', label: 'LOINC', available: true },
  { id: 'snomed', kind: 'snomed-ct', label: 'SNOMED CT', available: true },
  { id: 'icd10', kind: 'icd-10', label: 'ICD-10', available: true },
  { id: 'icd11', kind: 'icd-11', label: 'ICD-11', available: true },
  { id: 'ucum', kind: 'ucum', label: 'UCUM', available: true },
  { id: 'offline', kind: 'custom', label: 'Offline', available: false }
];

const draft = (overrides: Partial<EmrGeneratedFieldDefinition> = {}): EmrGeneratedFieldDefinition => ({
  schemaVersion: '1.0', id: 'weight', revision: 1, label: 'Weight', type: 'decimal', required: false,
  repeats: false, validationRules: [], terminologyBindings: [], ...overrides
});

const concept = (code: string, sourceId = 'loinc'): TerminologyConcept => ({
  sourceId, system: `https://${sourceId}.example`, code, display: `Concept ${code}`
});

const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };

describe('FieldGeneratorController', () => {
  it('updates drafts immutably and validates incompatible rules and bounds', () => {
    const controller = new FieldGeneratorController(draft(), { terminology: { search: async () => ({ items: [], total: 0 }) } });
    const before = controller.getSnapshot().draft;
    controller.dispatch({ type: 'validationRuleAdded', rule: { id: 'min', kind: 'minimum', value: 10 } });
    expect(controller.getSnapshot().validationErrors.min).toBeUndefined();
    controller.dispatch({ type: 'draftPatched', changes: { type: 'text', defaultValue: 'hi' } });
    expect(controller.getSnapshot().validationErrors.min).toContain('not compatible');
    expect(before).not.toBe(controller.getSnapshot().draft);
    controller.dispatch({ type: 'draftPatched', changes: { type: 'decimal', defaultValue: 4, validationRules: [{ id: 'min', kind: 'minimum', value: 10 }] } });
    expect(controller.getSnapshot().validationErrors.min).toContain('at least 10');
    controller.dispatch({ type: 'draftPatched', changes: { defaultValue: null, required: true, validationRules: [{ id: 'min', kind: 'minimum', value: 10 }, { id: 'max', kind: 'maximum', value: 5 }] } });
    expect(controller.getSnapshot().validationErrors.required).toBeUndefined();
    expect(controller.getSnapshot().validationErrors.max).toContain('greater than or equal');
  });

  it('suppresses stale terminology responses and aborts superseded requests', async () => {
    const resolvers: Array<(result: { items: readonly TerminologyConcept[]; total: number }) => void> = [];
    const signals: AbortSignal[] = [];
    const controller = new FieldGeneratorController(draft(), sources, {
      terminology: { search: async ({ signal }) => new Promise(resolve => { signals.push(signal); resolvers.push(resolve); }) }
    });
    controller.dispatch({ type: 'terminologySearchOpened', role: 'question-meaning', sourceId: 'loinc' });
    controller.dispatch({ type: 'terminologyQueryChanged', role: 'question-meaning', query: 'glucose' });
    controller.dispatch({ type: 'terminologySearchRequested', role: 'question-meaning' });
    controller.dispatch({ type: 'terminologyQueryChanged', role: 'question-meaning', query: 'blood glucose' });
    controller.dispatch({ type: 'terminologySearchRequested', role: 'question-meaning' });
    expect(signals[0].aborted).toBe(true);
    resolvers[0]({ items: [concept('old')], total: 1 });
    resolvers[1]({ items: [concept('new')], total: 1 });
    await tick();
    expect(controller.getSnapshot().terminologySearches['question-meaning']?.options[0].code).toBe('new');
  });

  it('does not apply an in-flight terminology response after the query changes', async () => {
    let resolve!: (result: { items: readonly TerminologyConcept[]; total: number }) => void;
    const controller = new FieldGeneratorController(draft(), sources, {
      terminology: { search: async () => new Promise(done => { resolve = done; }) }
    });
    controller.dispatch({ type: 'terminologySearchOpened', role: 'question-meaning', sourceId: 'loinc' });
    controller.dispatch({ type: 'terminologyQueryChanged', role: 'question-meaning', query: 'weight' });
    controller.dispatch({ type: 'terminologySearchRequested', role: 'question-meaning' });
    controller.dispatch({ type: 'terminologyQueryChanged', role: 'question-meaning', query: 'body mass' });
    resolve({ items: [concept('stale')], total: 1 });
    await tick();
    expect(controller.getSnapshot().terminologySearches['question-meaning']).toMatchObject({ query: 'body mass', options: [], loading: false });
  });

  it('adds terminology bindings with source provenance and removes them', () => {
    const controller = new FieldGeneratorController(draft(), sources, { terminology: { search: async () => ({ items: [], total: 0 }) } });
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'question-meaning', concept: concept('1234') });
    const binding = controller.getSnapshot().draft.terminologyBindings[0];
    expect(binding).toMatchObject({ role: 'question-meaning', concept: { sourceId: 'loinc', code: '1234' } });
    controller.dispatch({ type: 'terminologyBindingRemoved', bindingId: binding.id });
    expect(controller.getSnapshot().draft.terminologyBindings).toHaveLength(0);
  });

  it('retains multiple classification mappings and records answer value-set canonicals', () => {
    const controller = new FieldGeneratorController(draft(), sources, { terminology: { search: async () => ({ items: [], total: 0 }) } });
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'classification-mapping', concept: concept('E11', 'icd10'), mappingRelationship: 'equivalent' });
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'classification-mapping', concept: concept('5A11', 'icd11'), mappingRelationship: 'related-to' });
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'answer-value-set', concept: { ...concept('answers'), canonicalUri: 'https://example.org/fhir/ValueSet/answers' }, strength: 'required' });
    expect(controller.getSnapshot().draft.terminologyBindings.filter(binding => binding.role === 'classification-mapping')).toHaveLength(2);
    expect(controller.getSnapshot().draft.terminologyBindings.find(binding => binding.role === 'answer-value-set')?.valueSetCanonical).toBe('https://example.org/fhir/ValueSet/answers');
  });

  it('rejects unavailable, inactive, and role-incompatible terminology selections', () => {
    const controller = new FieldGeneratorController(draft(), sources, { terminology: { search: async () => ({ items: [], total: 0 }) } });
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'unit', concept: concept('kg', 'loinc') });
    expect(controller.getSnapshot().error).toContain('UCUM');
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'unit', concept: { ...concept('kg', 'ucum'), active: false } });
    expect(controller.getSnapshot().error).toContain('Inactive');
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'answer-value-set', concept: concept('answers', 'loinc') });
    expect(controller.getSnapshot().error).toContain('canonical');
    expect(controller.getSnapshot().draft.terminologyBindings).toHaveLength(0);
  });

  it('assigns validation-rule identities in the controller when the UI supplies none', () => {
    const controller = new FieldGeneratorController(draft(), sources, { terminology: { search: async () => ({ items: [], total: 0 }) } });
    controller.dispatch({ type: 'validationRuleAdded', rule: { id: '', kind: 'maximum', value: 250 } });
    expect(controller.getSnapshot().draft.validationRules[0]).toMatchObject({ id: 'rule-1', kind: 'maximum', value: 250 });
  });

  it('rejects malformed pattern and date rule definitions without requiring a default value', () => {
    const pattern = new FieldGeneratorController(draft({ type: 'text', validationRules: [{ id: 'pattern', kind: 'pattern', value: '[', message: 'Invalid' }] }), sources, { terminology: { search: async () => ({ items: [], total: 0 }) } });
    expect(pattern.getSnapshot().validationErrors.pattern).toContain('regular expression');
    const date = new FieldGeneratorController(draft({ type: 'date', validationRules: [{ id: 'date', kind: 'earliest-date', value: '2026-02-31' }] }), sources, { terminology: { search: async () => ({ items: [], total: 0 }) } });
    expect(date.getSnapshot().validationErrors.date).toContain('valid YYYY-MM-DD');
  });

  it('protects read-only drafts and supports save, reset, and save errors', async () => {
    const saved: EmrGeneratedFieldDefinition[] = [];
    const controller = new FieldGeneratorController(draft({ readOnly: true }), sources, {
      terminology: { search: async () => ({ items: [], total: 0 }) },
      repository: { save: async field => { saved.push(field); return { fieldId: field.id, revision: 2 }; } }
    });
    controller.dispatch({ type: 'draftPatched', changes: { label: 'Changed' } });
    controller.dispatch({ type: 'terminologyConceptSelected', role: 'unit', concept: concept('mg') });
    controller.dispatch({ type: 'saveRequested' });
    await tick();
    expect(controller.getSnapshot().draft.label).toBe('Weight');
    expect(saved).toHaveLength(0);

    const writable = new FieldGeneratorController(draft(), sources, {
      terminology: { search: async () => ({ items: [], total: 0 }) },
      repository: { save: async field => { saved.push(field); return { fieldId: 'saved-weight', revision: 3 }; } }
    });
    writable.dispatch({ type: 'draftPatched', changes: { label: 'Body weight' } });
    writable.dispatch({ type: 'saveRequested' });
    await tick();
    expect(writable.getSnapshot()).toMatchObject({ saving: false, dirty: false, savedFieldId: 'saved-weight' });
    expect(writable.getSnapshot().draft.revision).toBe(3);
    writable.dispatch({ type: 'resetRequested', draft: draft({ label: 'Reset weight', revision: 9 }) });
    expect(writable.getSnapshot().draft.label).toBe('Reset weight');
    expect(writable.getSnapshot().dirty).toBe(false);
  });

  it('preserves dirty state when the draft changes during a save', async () => {
    let resolve!: (result: { fieldId: string; revision: number }) => void;
    const controller = new FieldGeneratorController(draft(), sources, {
      terminology: { search: async () => ({ items: [], total: 0 }) },
      repository: { save: async () => new Promise(done => { resolve = done; }) }
    });
    controller.dispatch({ type: 'saveRequested' });
    controller.dispatch({ type: 'draftPatched', changes: { label: 'Edited during save' } });
    resolve({ fieldId: 'weight', revision: 2 });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ dirty: true, saving: false, draft: { label: 'Edited during save', revision: 2 } });
  });

  it('reports terminology failures and unavailable sources without calling the port', async () => {
    let calls = 0;
    const controller = new FieldGeneratorController(draft(), sources, {
      terminology: { search: async () => { calls += 1; throw new Error('service unavailable'); } }
    });
    controller.dispatch({ type: 'terminologySearchOpened', role: 'unit', sourceId: 'offline' });
    expect(controller.getSnapshot().terminologySearches.unit?.error).toContain('unavailable');
    controller.dispatch({ type: 'terminologySearchOpened', role: 'unit', sourceId: 'loinc' });
    controller.dispatch({ type: 'terminologySearchRequested', role: 'unit' });
    await tick();
    expect(calls).toBe(1);
    expect(controller.getSnapshot().terminologySearches.unit?.error).toBe('service unavailable');
  });

  it('aborts in-flight searches and saves on destroy', () => {
    let searchSignal: AbortSignal | undefined;
    let saveSignal: AbortSignal | undefined;
    const controller = new FieldGeneratorController(draft(), sources, {
      terminology: { search: async ({ signal }) => { searchSignal = signal; return new Promise(() => undefined); } },
      repository: { save: async (_field, { signal }) => { saveSignal = signal; return new Promise(() => undefined); } }
    });
    controller.dispatch({ type: 'terminologySearchOpened', role: 'question-meaning', sourceId: 'loinc' });
    controller.dispatch({ type: 'terminologySearchRequested', role: 'question-meaning' });
    controller.dispatch({ type: 'saveRequested' });
    controller.destroy();
    expect(searchSignal?.aborted).toBe(true);
    expect(saveSignal?.aborted).toBe(true);
  });
});
