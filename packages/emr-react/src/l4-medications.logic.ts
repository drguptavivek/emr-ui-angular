import type {
  ClinicalAssessmentStatus,
  DoseForm,
  DoseScheduleViewModel,
  DoseSlot,
  DoseTaperStep,
  DoseUnit,
  ReconMedication,
  ReconRow,
  ScoreResultCardViewModel,
} from '@drguptavivek/emr-controller';

// ---------------------------------------------------------------------------
// EmrScoreResultCard logic
// ---------------------------------------------------------------------------

export const SCORE_STATUS_DEFAULTS: Readonly<Record<Exclude<ClinicalAssessmentStatus, 'recorded'>, string>> = {
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown',
};

/** Text for any status other than 'recorded'; those replace the score. */
export function scoreStatusText(
  status: ClinicalAssessmentStatus | undefined,
  labels: Readonly<Record<Exclude<ClinicalAssessmentStatus, 'recorded'>, string>> = SCORE_STATUS_DEFAULTS,
): string {
  return status && status !== 'recorded' ? labels[status] : '';
}

/** The result body (interpretation, breakdown, time) shows only when a recorded result is on display. */
export function showScoreResult(model: ScoreResultCardViewModel): boolean {
  return !model.loading && !model.error && !scoreStatusText(model.status) && !!model.result;
}

// ---------------------------------------------------------------------------
// EmrDoseSchedule logic
// ---------------------------------------------------------------------------

/** Forms whose amounts are counted items, so quarter fractions read naturally as ¼ ½ ¾. */
export const COUNTED_DOSE_FORMS: readonly DoseForm[] = ['tablet', 'capsule', 'suppository', 'sachet', 'patch'];

export const DOSE_FRACTION_GLYPH: Readonly<Record<number, string>> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

export type DoseIconKind =
  | 'tablet'
  | 'tablet-half'
  | 'tablet-quarter'
  | 'tablet-three'
  | 'capsule'
  | 'drop'
  | 'tube'
  | 'spoon'
  | 'spray'
  | 'inhaler'
  | 'syringe'
  | 'patch'
  | 'sachet'
  | 'suppository';

const FRACTION_ICON: Readonly<Record<number, DoseIconKind>> = {
  0.25: 'tablet-quarter',
  0.5: 'tablet-half',
  0.75: 'tablet-three',
};

export const DOSE_ICON_GLYPH: Readonly<Record<DoseIconKind, string>> = {
  tablet: '●',
  'tablet-half': '◐',
  'tablet-quarter': '◔',
  'tablet-three': '◕',
  capsule: '⬭',
  drop: '💧',
  tube: '▭',
  spoon: '🥄',
  spray: '⛫',
  inhaler: '☖',
  syringe: '💉',
  patch: '▣',
  sachet: '▤',
  suppository: '⬬',
};

const WHOLE_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;
const FRACTION_WORDS: Readonly<Record<number, string>> = {
  0.25: 'a quarter',
  0.5: 'half',
  0.75: 'three quarters',
};

export function isCountedDoseForm(form: DoseForm): boolean {
  return COUNTED_DOSE_FORMS.includes(form);
}

/** Splits into whole + quarter glyph; null when the amount is not a clean quarter step. */
export function splitDoseParts(n: number): { whole: number; frac: number } | null {
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 100) / 100;
  return frac === 0 || DOSE_FRACTION_GLYPH[frac] ? { whole, frac } : null;
}

export function formatDoseAmount(n: number | null, form: DoseForm): string {
  if (n === null) return '';
  const p = isCountedDoseForm(form) ? splitDoseParts(n) : null;
  if (!p || !p.frac) return String(n);
  return p.whole ? `${p.whole}${DOSE_FRACTION_GLYPH[p.frac]}` : DOSE_FRACTION_GLYPH[p.frac]!;
}

/** Words for fractional counted amounts only ('one and a half'); whole numbers are already clear. */
export function doseAmountWord(n: number | null, form: DoseForm): string {
  const p = n === null || !isCountedDoseForm(form) ? null : splitDoseParts(n);
  if (!p || !p.frac) return '';
  const w = FRACTION_WORDS[p.frac]!;
  return p.whole ? `${WHOLE_WORDS[p.whole] ?? p.whole} and ${w}` : w;
}

export function doseUnitText(n: number | null, unit: DoseUnit | undefined): string {
  return n === null || !unit ? '' : n <= 1 ? unit.one : unit.other;
}

/** No amount and no descriptive label: this slot is not taken. */
export function isDoseSlotNone(slot: DoseSlot): boolean {
  return slot.amount === null && !slot.amountLabel;
}

export function doseSlotText(slot: DoseSlot, form: DoseForm, unit?: DoseUnit, noneWord = 'none'): string {
  if (slot.amountLabel) return slot.amountLabel;
  if (slot.amount === null) return noneWord;
  return [formatDoseAmount(slot.amount, form), doseUnitText(slot.amount, unit)].filter(Boolean).join(' ');
}

export function dosePatternSentence(
  slots: readonly DoseSlot[],
  form: DoseForm,
  unit?: DoseUnit,
  noneWord = 'none',
): string {
  return slots.map((s) => `${s.label} ${doseSlotText(s, form, unit, noneWord)}`).join(', ');
}

/** '1 - 0 - 1', formatted straight from the supplied amounts. Empty when any slot is only described in words. */
export function dosePatternNotation(slots: readonly DoseSlot[], form: DoseForm): string {
  if (slots.length < 2 || slots.some((s) => s.amount === null && s.amountLabel)) return '';
  return slots.map((s) => (s.amount === null ? '0' : formatDoseAmount(s.amount, form))).join(' - ');
}

/**
 * Hide the frequency code when it repeats the site code: "Once daily (OD)" beside
 * "Right eye (OD)" puts one abbreviation on the card with two meanings. Words still show.
 */
export function showFrequencyCode(frequencyCode: string | undefined, siteCode: string | undefined): boolean {
  return !!frequencyCode && frequencyCode.toUpperCase() !== siteCode?.toUpperCase();
}

export function doseSlotIcons(slot: DoseSlot, form: DoseForm): DoseIconKind[] {
  const n = slot.amount;
  const countable = n !== null && n > 0 && n <= 6;
  switch (form) {
    case 'tablet': {
      const p = countable ? splitDoseParts(n) : null;
      if (!p) return ['tablet'];
      return [...Array<DoseIconKind>(p.whole).fill('tablet'), ...(p.frac ? [FRACTION_ICON[p.frac]!] : [])];
    }
    case 'capsule':
      return Array<DoseIconKind>(countable ? Math.ceil(n) : 1).fill('capsule');
    case 'drop':
      return Array<DoseIconKind>(countable ? Math.ceil(n) : 1).fill('drop');
    case 'liquid':
      return ['spoon'];
    case 'ointment':
    case 'cream':
    case 'gel':
      return ['tube'];
    case 'injection':
      return ['syringe'];
    case 'spray':
    case 'inhaler':
    case 'patch':
    case 'sachet':
    case 'suppository':
      return [form];
    default:
      return ['capsule'];
  }
}

export function hasDoseMeta(model: DoseScheduleViewModel): boolean {
  return !!(model.route || model.foodRelation || model.duration || model.startLabel);
}

export function taperHasPattern(taper: readonly DoseTaperStep[] | undefined): boolean {
  return !!taper?.some((s) => s.slots?.length);
}

/** When a narrow container has more than 3 slots, wrap into a 2-column grid. */
export function isDoseGridCompact(width: number | null, slotCount: number): boolean {
  return width !== null && width > 0 && width <= 480 && slotCount > 3;
}

// ---------------------------------------------------------------------------
// EmrMedicationReconciliation logic
// ---------------------------------------------------------------------------

/** Below this container width (px) medication reconciliation renders stacked cards instead of a table. */
export const RECON_TABLE_MIN_WIDTH = 760;

/** Unmeasured (null or 0) renders as a table so first paint does not flash cards. */
export function isReconStacked(width: number | null): boolean {
  return width !== null && width > 0 && width < RECON_TABLE_MIN_WIDTH;
}

export function isReconRowSelected(row: ReconRow, selectedRowId?: string): boolean {
  return row.id === selectedRowId;
}

export function isReconRowLocked(modelReadOnly?: boolean, rowReadOnly?: boolean): boolean {
  return !!(modelReadOnly || rowReadOnly);
}

/** Accessible name for the row's controls: the left medicine, else the right one. */
export function reconRowName(row: ReconRow, fallback = 'medicine'): string {
  const m: ReconMedication | undefined = row.left ?? row.right;
  return m?.nameLabel ?? fallback;
}

/** Marks the reason invalid only when the controller addressed an error to a node named 'reason'. */
export function isReconReasonInvalid(row: ReconRow): boolean {
  return !!row.messages?.some((m) => m.severity === 'error' && m.path[m.path.length - 1] === 'reason');
}

export function reconSeverityWord(
  severity: 'error' | 'warning' | 'info',
  words: { error: string; warning: string; info: string } = { error: 'Error', warning: 'Warning', info: 'Note' },
): string {
  return severity === 'error' ? words.error : severity === 'warning' ? words.warning : words.info;
}
