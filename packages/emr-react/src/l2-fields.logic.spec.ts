import { describe, expect, it } from 'vitest';
import type { DoseSlot, EmrCodedValue, ScheduleSlotDefinition } from '@drguptavivek/emr-controller';
import {
  applySlotPreset,
  codedInputChips,
  formatSlotReadout,
  isPresetActive,
  setSlotAmount,
  toggleSlot,
} from './l2-fields.logic';

const slots: ScheduleSlotDefinition[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am' },
  { id: 'a', label: 'Afternoon' },
  { id: 'e', label: 'Evening' },
  { id: 'n', label: 'Night' },
];
const one = { amount: 1 };
const ids = (v: readonly DoseSlot[]) => v.map(s => s.id);

describe('codedInputChips', () => {
  const snomed = 'http://snomed.info/sct';
  const icd10 = 'http://hl7.org/fhir/sid/icd-10';
  const labels = { [snomed]: 'SNOMED CT' };
  const c1: EmrCodedValue = { system: snomed, code: '77075001', display: 'Primary open-angle glaucoma' };
  const c2: EmrCodedValue = { system: icd10, code: 'H40.11', display: 'Primary open-angle glaucoma' };

  it('normalises null, single concept, and concept array with resolved system labels', () => {
    expect(codedInputChips(null, labels)).toEqual([]);
    expect(codedInputChips(c1, labels)).toEqual([
      { concept: c1, key: `${snomed}|77075001`, system: 'SNOMED CT' },
    ]);
    expect(codedInputChips([c1, c2], labels)).toEqual([
      { concept: c1, key: `${snomed}|77075001`, system: 'SNOMED CT' },
      { concept: c2, key: `${icd10}|H40.11`, system: icd10 },
    ]);
  });
});

describe('schedule slot value building', () => {
  it('ticks from empty and null, copying label and time hint', () => {
    expect(toggleSlot(null, slots, 'm', true, one)).toEqual([{ id: 'm', label: 'Morning', timeHint: '8 am', amount: 1 }]);
    expect(toggleSlot([], slots, 'a', true, one)).toEqual([{ id: 'a', label: 'Afternoon', amount: 1 }]);
  });

  it('keeps slot order from the definitions, not click order', () => {
    const v = toggleSlot(toggleSlot(null, slots, 'n', true, one), slots, 'm', true, one);
    expect(ids(v)).toEqual(['m', 'n']);
  });

  it('unticking omits the slot; re-ticking an already ticked slot keeps its amount', () => {
    const v = [{ id: 'm', label: 'Morning', amount: 2 }, { id: 'n', label: 'Night', amount: 1 }];
    expect(ids(toggleSlot(v, slots, 'm', false, one))).toEqual(['n']);
    expect(toggleSlot(v, slots, 'm', true, one)[0]?.amount).toBe(2);
  });

  it('does not mutate the input value', () => {
    const v = Object.freeze([Object.freeze({ id: 'm', label: 'Morning', amount: 1 })]);
    expect(() => toggleSlot(v, slots, 'n', true, one)).not.toThrow();
    expect(v).toHaveLength(1);
  });

  it('sets the amount of a ticked slot only, allowing null and labels', () => {
    const v = [{ id: 'm', label: 'Morning', amount: 1, householdLabel: '1 teaspoon' }];
    expect(setSlotAmount(v, slots, 'm', { amount: 0.5 })[0]).toMatchObject({ amount: 0.5, householdLabel: '1 teaspoon' });
    expect(setSlotAmount(v, slots, 'm', { amount: null })[0]?.amount).toBeNull();
    expect(setSlotAmount(v, slots, 'n', { amount: 3 })).toHaveLength(1);
    expect(setSlotAmount(v, slots, 'm', { amount: null, amountLabel: 'thin layer' })[0]).toMatchObject({ amount: null, amountLabel: 'thin layer' });
  });

  it('a preset replaces the selection, keeping existing amounts and seeding new slots', () => {
    const v = [{ id: 'm', label: 'Morning', amount: 2 }, { id: 'a', label: 'Afternoon', amount: 1 }];
    const bd = applySlotPreset(v, slots, { id: 'bd', label: 'BD', slotIds: ['n', 'm'] }, one);
    expect(bd.map(s => [s.id, s.amount])).toEqual([['m', 2], ['n', 1]]);
  });

  it('ignores unknown ids in value and presets', () => {
    expect(applySlotPreset([{ id: 'x', label: 'X', amount: 1 }], slots, { id: 'p', label: 'P', slotIds: ['zz'] }, one)).toEqual([]);
  });

  it('checks preset active state by set equality', () => {
    const bdPreset = { id: 'bd', label: 'BD', slotIds: ['m', 'n'] };
    const odPreset = { id: 'od', label: 'OD', slotIds: ['m'] };
    const v: DoseSlot[] = [{ id: 'm', label: 'Morning', amount: 1 }, { id: 'n', label: 'Night', amount: 1 }];
    expect(isPresetActive(v, bdPreset)).toBe(true);
    expect(isPresetActive(v, odPreset)).toBe(false);
    expect(isPresetActive(null, bdPreset)).toBe(false);
  });

  it('formats slot readout for numeric, unit, label, and null amounts', () => {
    expect(formatSlotReadout({ id: 'm', label: 'Morning', amount: 2 }, 'tablets')).toBe('2 tablets');
    expect(formatSlotReadout({ id: 'm', label: 'Morning', amount: 2 })).toBe('2');
    expect(formatSlotReadout({ id: 'm', label: 'Morning', amount: null }, 'tablets')).toBe('Selected, no amount');
    expect(formatSlotReadout({ id: 'n', label: 'Night', amount: null, amountLabel: 'thin layer' }, 'tablets')).toBe('thin layer');
  });
});
