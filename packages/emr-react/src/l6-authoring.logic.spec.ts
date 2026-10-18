import { describe, expect, it } from 'vitest';
import type { EhrTemplateDefinition, EmrGeneratedFieldDefinition, TerminologyBinding } from '@drguptavivek/emr-controller';
import {
  buildValidationRule,
  canAcceptTemplateImport,
  canAddValidationRule,
  deriveTemplatePreview,
  filterBindingsByRole,
  summarizeFieldTerminology,
  summarizeValidationRule,
  toPreviewFieldDefinition,
} from './l6-authoring.logic';

const sampleField = (overrides: Partial<EmrGeneratedFieldDefinition> = {}): EmrGeneratedFieldDefinition => ({
  schemaVersion: '1.0',
  id: 'body-weight',
  revision: 1,
  label: 'Body weight',
  type: 'quantity',
  required: true,
  repeats: false,
  unit: 'kg',
  validationRules: [],
  terminologyBindings: [],
  ...overrides,
});

describe('l6 authoring logic', () => {
  it('validates whether a rule draft can be added', () => {
    expect(canAddValidationRule('minimum', '', '')).toBe(false);
    expect(canAddValidationRule('minimum', '0', '')).toBe(true);
    expect(canAddValidationRule('minimum', 'abc', '')).toBe(false);
    expect(canAddValidationRule('custom', 'systolic-range', '')).toBe(false);
    expect(canAddValidationRule('custom', 'systolic-range', 'Out of range.')).toBe(true);
    expect(canAddValidationRule('allowed-values', ' , ', '')).toBe(false);
    expect(canAddValidationRule('allowed-values', 'OD, OS', '')).toBe(true);
  });

  it('builds and summarizes validation rules across all rule kinds', () => {
    const minRule = buildValidationRule('minimum', '0', 'Must be positive.');
    expect(minRule).toEqual({ id: '', kind: 'minimum', value: 0, message: 'Must be positive.' });
    expect(summarizeValidationRule(minRule)).toBe('0');

    const patternRule = buildValidationRule('pattern', '^[A-Z]+$', '');
    expect(patternRule).toEqual({
      id: '',
      kind: 'pattern',
      value: '^[A-Z]+$',
      message: 'Value does not match the required pattern.',
    });
    expect(summarizeValidationRule(patternRule)).toBe('^[A-Z]+$');

    const allowedRule = buildValidationRule('allowed-values', ' OD , OS , OU ', '');
    expect(allowedRule).toEqual({ id: '', kind: 'allowed-values', values: ['OD', 'OS', 'OU'] });
    expect(summarizeValidationRule(allowedRule)).toBe('OD, OS, OU');

    const customRule = buildValidationRule('custom', 'iop-validator', 'Invalid IOP.');
    expect(customRule).toEqual({ id: '', kind: 'custom', customValidatorId: 'iop-validator', message: 'Invalid IOP.' });
    expect(summarizeValidationRule(customRule)).toBe('iop-validator');
  });

  it('filters terminology bindings by role and summarizes field terminology', () => {
    const bindings: TerminologyBinding[] = [
      {
        id: 'b1',
        role: 'question-meaning',
        concept: { sourceId: 'loinc', system: 'http://loinc.org', code: '29463-7', display: 'Body weight' },
      },
      {
        id: 'b2',
        role: 'unit',
        concept: { sourceId: 'ucum', system: 'http://unitsofmeasure.org', code: 'kg', display: 'kilogram' },
      },
    ];
    expect(filterBindingsByRole(bindings, 'question-meaning')).toHaveLength(1);
    expect(summarizeFieldTerminology(sampleField({ terminologyBindings: bindings }))).toBe('29463-7 · kg');
  });

  it('projects a generated field draft into a ClinicalFieldDefinition for preview', () => {
    const preview = toPreviewFieldDefinition(sampleField({ id: '', label: '', instructions: 'Enter in kg' }));
    expect(preview.id).toBe('generated-field');
    expect(preview.label).toBe('Untitled field');
    expect(preview.hint).toBe('Enter in kg');
    expect(preview.unit).toBe('kg');
  });

  it('determines whether template import issues can be accepted', () => {
    expect(canAcceptTemplateImport(undefined)).toBe(false);
    expect(canAcceptTemplateImport([])).toBe(false);
    expect(
      canAcceptTemplateImport([{ severity: 'warning', code: 'lossy', message: 'Display hint omitted' }]),
    ).toBe(true);
    expect(
      canAcceptTemplateImport([
        { severity: 'warning', code: 'lossy', message: 'Display hint omitted' },
        { severity: 'error', code: 'bad-id', message: 'Missing id' },
      ]),
    ).toBe(false);
  });

  it('derives a ClinicalFormViewModel preview for single and repeatable template fields', () => {
    const single = sampleField({ id: 'weight', label: 'Weight', repeats: false });
    const repeating = sampleField({ id: 'allergy', label: 'Allergy', type: 'text', repeats: true });
    const template: EhrTemplateDefinition = {
      schemaVersion: '1.0',
      id: 'exam',
      revision: 1,
      title: 'General exam',
      locale: 'en-IN',
      status: 'draft',
      sections: [
        {
          id: 'sec-1',
          label: 'Vitals',
          fields: [
            { id: 'p-weight', sourceFieldId: 'weight', sourceFieldRevision: 1, field: single },
            { id: 'p-allergy', sourceFieldId: 'allergy', sourceFieldRevision: 1, field: repeating },
          ],
        },
      ],
    };
    const preview = deriveTemplatePreview(template);
    expect(preview.schema.id).toBe('exam-form');
    expect(preview.fields).toEqual({ 'p-weight': { value: null } });
    expect(preview.repeatableGroups).toEqual({ 'p-allergy': [] });
    expect(preview.schema.sections[0]?.blocks).toHaveLength(2);
  });
});
