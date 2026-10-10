import type { DoseSlot, ScheduleSlotDefinition, ScheduleSlotPreset, ScheduleSlotSeed } from '@drguptavivek/emr-controller';

// Pure value-building for EmrScheduleSlotPicker. Lives in the UI package so the UI's only runtime
// dependency on the controller stays type-only (the SSR smoke loads the built bundle without it).

// Spreads `amounts` first so an existing slot keeps controller-added fields such as `householdLabel`.
const slotFrom = (definition: ScheduleSlotDefinition, amounts: ScheduleSlotSeed): DoseSlot => ({
  ...amounts,
  id: definition.id,
  label: definition.label,
  ...(definition.timeHint ? { timeHint: definition.timeHint } : {}),
});

/**
 * Rebuilds the value in `slots` order. `pick` returns the amounts for a slot that should be ticked, or
 * `undefined` to leave it out. Ids in `value` that are not in `slots` are dropped.
 */
const rebuild = (
  slots: readonly ScheduleSlotDefinition[],
  pick: (definition: ScheduleSlotDefinition, current: DoseSlot | undefined) => ScheduleSlotSeed | undefined,
  value: readonly DoseSlot[] | null,
): DoseSlot[] => {
  const current = new Map((value ?? []).map((slot) => [slot.id, slot]));
  return slots.flatMap((definition) => {
    const amounts = pick(definition, current.get(definition.id));
    return amounts ? [slotFrom(definition, amounts)] : [];
  });
};

/** Ticks (`checked`) or unticks one slot. A slot that was already ticked keeps its amount. */
export const toggleSlot = (
  value: readonly DoseSlot[] | null,
  slots: readonly ScheduleSlotDefinition[],
  slotId: string,
  checked: boolean,
  seed: ScheduleSlotSeed,
): DoseSlot[] =>
  rebuild(slots, (definition, current) => {
    if (definition.id !== slotId) return current;
    if (!checked) return undefined;
    return current ?? seed;
  }, value);

/** Sets the amount of one ticked slot. An unticked slot stays unticked. */
export const setSlotAmount = (
  value: readonly DoseSlot[] | null,
  slots: readonly ScheduleSlotDefinition[],
  slotId: string,
  amounts: ScheduleSlotSeed,
): DoseSlot[] =>
  rebuild(slots, (definition, current) => (current && definition.id === slotId ? { ...current, ...amounts } : current), value);

/**
 * Replaces the selection with the preset's slots. Slots already ticked keep their amount; newly ticked
 * ones get `seed`. Preset ids missing from `slots` are ignored.
 */
export const applySlotPreset = (
  value: readonly DoseSlot[] | null,
  slots: readonly ScheduleSlotDefinition[],
  preset: ScheduleSlotPreset,
  seed: ScheduleSlotSeed,
): DoseSlot[] =>
  rebuild(slots, (definition, current) => (preset.slotIds.includes(definition.id) ? current ?? seed : undefined), value);
