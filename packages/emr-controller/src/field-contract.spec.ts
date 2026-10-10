import { describe, expect, it } from 'vitest';
import {
  fromClinicalFieldDefinition,
  fromGeneratedFieldDefinition,
  toClinicalFieldDefinition,
  toGeneratedFieldDefinition
} from './field-contract.adapters.js';
import type { ClinicalFieldDefinition } from './clinical-form.models.js';
import type { EmrFieldDefinition } from './field-contract.models.js';
import type { EmrGeneratedFieldDefinition, FieldValidationRule } from './field-generator.models.js';
import type { TerminologyBinding } from './terminology.models.js';

const validationRules: readonly FieldValidationRule[] = [
  { id: 'min', kind: 'minimum', value: 10, message: 'too low' },
  { id: 'max', kind: 'maximum', value: 100 }
];

const terminologyBindings: readonly TerminologyBinding[] = [
  {
    id: 'binding-1',
    role: 'answer-value-set',
    valueSetCanonical: 'http://example.org/vs/weight',
    strength: 'extensible',
    concept: { sourceId: 'snomed', system: 'http://snomed.info/sct', code: '27113001', display: 'Body weight' }
  },
  { id: 'binding-2', role: 'unit', valueSetCanonical: 'http://unitsofmeasure.org', strength: 'required' }
];

const fullyPopulated = (overrides: Partial<EmrGeneratedFieldDefinition> = {}): EmrGeneratedFieldDefinition => ({
  schemaVersion: '1.0',
  id: 'weight',
  revision: 3,
  label: 'Weight',
  description: 'Body weight at triage',
  instructions: 'Measure in kilograms without shoes',
  type: 'decimal',
  required: true,
  repeats: true,
  readOnly: false,
  defaultValue: 70,
  placeholder: 'e.g. 70',
  span: 6,
  rows: undefined,
  precision: 1,
  unit: 'kg',
  unitSystem: 'http://unitsofmeasure.org',
  unitCode: 'kg',
  options: [{ value: 'a', label: 'A' }],
  validationRules,
  terminologyBindings,
  tags: ['vitals', 'triage'],
  ...overrides
});

describe('field-contract adapters', () => {
  it('round-trips EmrGeneratedFieldDefinition -> EmrFieldDefinition -> EmrGeneratedFieldDefinition without loss', () => {
    const original = fullyPopulated();
    const definition = fromGeneratedFieldDefinition(original);
    const roundTripped = toGeneratedFieldDefinition(definition);
    expect(roundTripped).toEqual(original);
  });

  it('round-trips a minimal (mostly-undefined) EmrGeneratedFieldDefinition without loss', () => {
    const original: EmrGeneratedFieldDefinition = {
      schemaVersion: '1.0',
      id: 'note',
      revision: 0,
      label: 'Note',
      type: 'text',
      required: false,
      repeats: false,
      validationRules: [],
      terminologyBindings: []
    };
    const roundTripped = toGeneratedFieldDefinition(fromGeneratedFieldDefinition(original));
    expect(roundTripped).toEqual(original);
  });

  it('maps contract fields correctly when converting from EmrGeneratedFieldDefinition', () => {
    const original = fullyPopulated();
    const definition = fromGeneratedFieldDefinition(original);
    expect(definition.contract.linkId).toBe('weight');
    expect(definition.contract.revision).toBe(3);
    expect(definition.contract.terminology).toBe(terminologyBindings);
    expect(definition.contract.validation).toBe(validationRules);
    expect(definition.presentation.label).toBe('Weight');
    expect(definition.presentation.instructions).toBe('Measure in kilograms without shoes');
  });

  it('maps required to cardinality.min === 1 when converting from ClinicalFieldDefinition', () => {
    const required: ClinicalFieldDefinition = { id: 'f1', label: 'Field 1', type: 'text', required: true };
    const optional: ClinicalFieldDefinition = { id: 'f2', label: 'Field 2', type: 'text', required: false };
    const notSpecified: ClinicalFieldDefinition = { id: 'f3', label: 'Field 3', type: 'text' };

    expect(fromClinicalFieldDefinition(required).contract.cardinality).toEqual({ min: 1, max: 1 });
    expect(fromClinicalFieldDefinition(optional).contract.cardinality).toEqual({ min: 0, max: 1 });
    expect(fromClinicalFieldDefinition(notSpecified).contract.cardinality).toEqual({ min: 0, max: 1 });
  });

  it('separates the UCUM unit binding from the display unit string', () => {
    // Both a UCUM code and a (possibly different) display string are present.
    const withBoth = fromGeneratedFieldDefinition(fullyPopulated({ unit: 'kilograms', unitSystem: 'http://unitsofmeasure.org', unitCode: 'kg' }));
    expect(withBoth.contract.unit).toEqual({ system: 'http://unitsofmeasure.org', code: 'kg' });
    expect(withBoth.presentation.unitDisplay).toBe('kilograms');

    // Only a legacy display string exists: contract.unit stays undefined.
    const displayOnly = fromGeneratedFieldDefinition(fullyPopulated({ unit: 'kg', unitSystem: undefined, unitCode: undefined }));
    expect(displayOnly.contract.unit).toBeUndefined();
    expect(displayOnly.presentation.unitDisplay).toBe('kg');

    // Neither exists: both stay undefined.
    const neither = fromGeneratedFieldDefinition(fullyPopulated({ unit: undefined, unitSystem: undefined, unitCode: undefined }));
    expect(neither.contract.unit).toBeUndefined();
    expect(neither.presentation.unitDisplay).toBeUndefined();
  });

  it('round-trips cardinality for all four required/repeats combinations', () => {
    const cases: readonly { required: boolean; repeats: boolean }[] = [
      { required: false, repeats: false },
      { required: false, repeats: true },
      { required: true, repeats: false },
      { required: true, repeats: true }
    ];

    for (const { required, repeats } of cases) {
      const original = fullyPopulated({ required, repeats });
      const definition = fromGeneratedFieldDefinition(original);
      expect(definition.contract.cardinality).toEqual({
        min: required ? 1 : 0,
        max: repeats ? null : 1
      });
      const roundTripped = toGeneratedFieldDefinition(definition);
      expect(roundTripped.required).toBe(required);
      expect(roundTripped.repeats).toBe(repeats);
      expect(roundTripped).toEqual(original);
    }
  });

  it('round-trips time and datetime value types without falling back to text', () => {
    for (const type of ['time', 'datetime'] as const) {
      const generated = fullyPopulated({ type });
      expect(fromGeneratedFieldDefinition(generated).contract.valueType).toBe(type);
      expect(toGeneratedFieldDefinition(fromGeneratedFieldDefinition(generated))).toEqual(generated);

      const clinical: ClinicalFieldDefinition = { kind: 'field', id: 'seen-at', label: 'Seen at', type };
      expect(toClinicalFieldDefinition(fromClinicalFieldDefinition(clinical)).type).toBe(type);
    }
  });

  it('still narrows value types with no legacy counterpart to text', () => {
    const coded = fromClinicalFieldDefinition({ id: 'dx', label: 'Diagnosis', type: 'text' });
    expect(toClinicalFieldDefinition({ ...coded, contract: { ...coded.contract, valueType: 'coded' } }).type).toBe('text');
  });

  it('toClinicalFieldDefinition is intentionally lossy for terminology, validation and revision', () => {
    const original = fullyPopulated();
    const definition = fromGeneratedFieldDefinition(original);
    const clinical = toClinicalFieldDefinition(definition);

    expect(clinical.id).toBe('weight');
    expect(clinical.label).toBe('Weight');
    expect(clinical.required).toBe(true);
    expect(clinical.unit).toBe('kg');
    expect('terminologyBindings' in clinical).toBe(false);
    expect('validationRules' in clinical).toBe(false);
    expect('revision' in clinical).toBe(false);
  });
});

describe('serialization safety', () => {
  it('survives a JSON round trip, so no field is carried on a non-enumerable channel', () => {
    const source: EmrGeneratedFieldDefinition = fullyPopulated();

    const definition = fromGeneratedFieldDefinition(source);
    const throughJson = JSON.parse(JSON.stringify(definition)) as EmrFieldDefinition;

    // Every field must survive persistence, not merely an in-memory object copy.
    expect(toGeneratedFieldDefinition(throughJson)).toEqual(
      toGeneratedFieldDefinition(definition),
    );
    expect(throughJson.schemaVersion).toBe(source.schemaVersion);
    expect(throughJson.contract.readOnly).toBe(source.readOnly);
    expect(throughJson.contract.defaultValue).toEqual(source.defaultValue);
    expect(throughJson.contract.tags).toEqual(source.tags);
  });

  it('exposes every carried field as an enumerable own property', () => {
    const definition = fromGeneratedFieldDefinition(fullyPopulated());
    expect(Object.getOwnPropertySymbols(definition)).toHaveLength(0);
    expect(Object.getOwnPropertySymbols(definition.contract)).toHaveLength(0);
  });
});
