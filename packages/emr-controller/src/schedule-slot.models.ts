import type { DoseSlot } from './dose-schedule.models.js';

/** One slot a schedule picker offers: 'Morning', '06:00', 'PRN'. Supplied by the controller, never derived. */
export interface ScheduleSlotDefinition {
  id: string;
  label: string;
  timeHint?: string;
}

/** A one-click selection such as 'BD' -> ['m', 'n']. The picker never infers a preset from the ticked slots' meaning. */
export interface ScheduleSlotPreset {
  id: string;
  label: string;
  slotIds: readonly string[];
}

/** `numeric` edits `DoseSlot.amount`; `label` edits `DoseSlot.amountLabel` ('thin layer'). */
export type ScheduleAmountMode = 'numeric' | 'label';

/** What a newly ticked slot starts with: `{ amount: 1 }` or `{ amount: null, amountLabel: 'thin layer' }`. */
export type ScheduleSlotSeed = Pick<DoseSlot, 'amount' | 'amountLabel'>;
