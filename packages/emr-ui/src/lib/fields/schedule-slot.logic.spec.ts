import { describe, expect, it } from 'vitest';
import type { DoseSlot, ScheduleSlotDefinition } from '@drguptavivek/emr-controller';
import { applySlotPreset, setSlotAmount, toggleSlot } from './schedule-slot.logic';

const slots: ScheduleSlotDefinition[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am' },
  { id: 'a', label: 'Afternoon' },
  { id: 'e', label: 'Evening' },
  { id: 'n', label: 'Night' },
];
const one = { amount: 1 };
const ids = (v: readonly DoseSlot[]) => v.map((s) => s.id);

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
    expect(bd.map((s) => [s.id, s.amount])).toEqual([['m', 2], ['n', 1]]);
  });

  it('ignores unknown ids in value and presets', () => {
    expect(applySlotPreset([{ id: 'x', label: 'X', amount: 1 }], slots, { id: 'p', label: 'P', slotIds: ['zz'] }, one)).toEqual([]);
  });
});
