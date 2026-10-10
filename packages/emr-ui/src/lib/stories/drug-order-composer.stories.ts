import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  AttestationIntent, AttestationViewModel, ClinicalFieldDefinition, ClinicalFieldState, ClinicalFieldValue,
  CodedInputIntent, CodedInputViewModel, DoseForm, DoseScheduleViewModel, DoseSlot, DoseTaperStep, DoseUnit,
  EmrCodedValue, EmrFieldDefinition, EmrOption, ScheduleAmountMode, ScheduleSlotDefinition, ScheduleSlotPreset
} from '@drguptavivek/emr-controller';
import { EmrCodedInputComponent } from '../fields/emr-coded-input.component';
import { EmrScheduleSlotPickerComponent } from '../fields/emr-schedule-slot-picker.component';
import { EmrTypedFieldComponent } from '../fields/emr-typed-field.component';
import { EmrAttestationComponent } from '../fields/emr-attestation.component';
import { EmrQuantityInputComponent, EmrSelectComponent } from '../primitives/emr-inputs.component';
import { EmrDoseScheduleComponent } from '../domain/emr-dose-schedule.component';

/**
 * Recipe, not a component: a drug order assembled from existing L1/L2/L4 pieces. The `OrderComposer`
 * class below stands in for the application controller. It owns all state, filters the (synthetic)
 * formulary, maps the slot picker's `DoseSlot[]` into a `DoseScheduleViewModel`, words the frequency,
 * and validates on sign. The UI components only render what it supplies and emit changes.
 */
const meta: Meta = {
  title: 'EMR / Medications / Order composer',
  decorators: [moduleMetadata({
    imports: [EmrCodedInputComponent, EmrQuantityInputComponent, EmrSelectComponent, EmrScheduleSlotPickerComponent, EmrTypedFieldComponent, EmrAttestationComponent, EmrDoseScheduleComponent]
  })],
  parameters: {
    docs: {
      description: {
        component:
          'Drug order recipe composed only from existing components: coded drug search, strength (quantity), form / route / site (selects), schedule (slot picker), duration and instructions (typed fields), prescriber sign-off (attestation), and a live dose-schedule card as the preview. The story acts as the controller: it owns state, maps picker output into a `DoseScheduleViewModel`, supplies every label, and validates when the prescriber signs.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

// ---- Synthetic formulary and option lists (controller data) -------------------------------------
const FORMULARY = 'urn:emr:synthetic-formulary';
const drug = (code: string, display: string): EmrCodedValue => ({ system: FORMULARY, code, display });
const paracetamol = drug('SYN-0001', 'Paracetamol');
const amoxicillin = drug('SYN-0002', 'Amoxicillin');
const prednisoloneEye = drug('SYN-0003', 'Prednisolone acetate eye drops');
const metformin = drug('SYN-0004', 'Metformin');
const formulary = [paracetamol, amoxicillin, prednisoloneEye, metformin, drug('SYN-0005', 'Moxifloxacin eye drops'), drug('SYN-0006', 'Pantoprazole')];

const strengthUnits: EmrOption[] = [{ value: 'mg', label: 'mg' }, { value: 'mcg', label: 'mcg' }, { value: 'g', label: 'g' }, { value: '%', label: '%' }, { value: 'mg/5 mL', label: 'mg/5 mL' }];
const formOptions: EmrOption<DoseForm>[] = [
  { value: 'tablet', label: 'Tablet' }, { value: 'capsule', label: 'Capsule' },
  { value: 'drop', label: 'Eye drops' }, { value: 'liquid', label: 'Oral liquid' }
];
const routeOptions: EmrOption[] = [{ value: 'oral', label: 'By mouth' }, { value: 'eye', label: 'Into the eye' }, { value: 'iv', label: 'Intravenous' }];
const siteOptions: EmrOption[] = [{ value: 'OD', label: 'Right eye (OD)' }, { value: 'OS', label: 'Left eye (OS)' }, { value: 'OU', label: 'Both eyes (OU)' }];
const siteWords: Record<string, string> = { OD: 'Right eye', OS: 'Left eye', OU: 'Both eyes' };
const units: Partial<Record<DoseForm, DoseUnit>> = {
  tablet: { one: 'tablet', other: 'tablets' }, capsule: { one: 'capsule', other: 'capsules' },
  drop: { one: 'drop', other: 'drops' }, liquid: { one: 'mL', other: 'mL' }
};

const daySlots: ScheduleSlotDefinition[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am' }, { id: 'a', label: 'Afternoon', timeHint: '2 pm' },
  { id: 'e', label: 'Evening', timeHint: '6 pm' }, { id: 'n', label: 'Night', timeHint: '10 pm' }
];
const dayPresets: ScheduleSlotPreset[] = [
  { id: 'od', label: 'Once daily (OD)', slotIds: ['m'] }, { id: 'bd', label: 'Twice daily (BD)', slotIds: ['m', 'n'] },
  { id: 'tds', label: 'Three times daily (TDS)', slotIds: ['m', 'a', 'n'] }, { id: 'qid', label: 'Four times daily (QID)', slotIds: ['m', 'a', 'e', 'n'] }
];
const eyeSlots: ScheduleSlotDefinition[] = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((t) => ({ id: t, label: t }));
const prnSlots: ScheduleSlotDefinition[] = [{ id: 'prn', label: 'When needed', timeHint: 'PRN' }];

// Frequency wording and abbreviations are controller decisions, never the picker's.
const frequencyWords = ['Not set', 'Once daily', 'Twice daily', 'Three times daily', 'Four times daily'];
const frequencyCodes = ['', 'OD', 'BD', 'TDS', 'QID'];
const timesDaily = (n: number) => frequencyWords[n] ?? `${n} times daily`;

// ---- Field definitions --------------------------------------------------------------------------
const drugDefinition: EmrFieldDefinition = {
  schemaVersion: '1.0',
  contract: {
    linkId: 'medication', valueType: 'coded', cardinality: { min: 1, max: 1 }, validation: [],
    terminology: [{ id: 'formulary', role: 'answer-value-set', valueSetCanonical: `${FORMULARY}/vs/inpatient`, strength: 'required' }]
  },
  presentation: { label: 'Medicine', hint: 'Search the hospital formulary.' }
};
const durationDefinition: ClinicalFieldDefinition = { id: 'duration', label: 'Duration', type: 'text', placeholder: 'For example 5 days', required: true };
const instructionsDefinition: ClinicalFieldDefinition = { id: 'instructions', label: 'Instructions to patient', type: 'multiline', rows: 3, hint: 'One instruction per line.' };
const prnMaxDefinition: ClinicalFieldDefinition = { id: 'prnMax', label: 'Maximum doses in 24 hours', type: 'integer', required: true };

const prescriber = { id: 'presc', displayName: 'Dr S. Iyer', roleLabel: 'Prescriber' };
const pendingBadge = { label: 'Not signed', tone: 'warning' as const };
const signedBadge = { label: 'Signed', tone: 'success' as const };

// ---- The controller -----------------------------------------------------------------------------
type ErrorKey = 'drug' | 'strength' | 'form' | 'route' | 'site' | 'slots' | 'duration' | 'prnMax';

interface OrderState {
  drug: EmrCodedValue | null;
  query: string;
  strength: number | null;
  strengthUnit: string | null;
  form: DoseForm | null;
  route: string | null;
  site: string | null;
  slots: readonly DoseSlot[] | null;
  duration: string;
  instructions: string;
  prn: boolean;
  prnMax: number | null;
  /** Later taper steps; step 1 comes from the picker. */
  taperRest?: readonly DoseTaperStep[];
  signed: boolean;
  readOnly: boolean;
  errors: Partial<Record<ErrorKey, string>>;
}

const blank: OrderState = {
  drug: null, query: '', strength: null, strengthUnit: 'mg', form: null, route: null, site: null, slots: null,
  duration: '', instructions: '', prn: false, prnMax: null, signed: false, readOnly: false, errors: {}
};

class OrderComposer {
  // Every derived model is a field reassigned in `refresh()`, so bindings never see a fresh object per check.
  coded!: CodedInputViewModel;
  durationState!: ClinicalFieldState;
  instructionsState!: ClinicalFieldState;
  prnMaxState!: ClinicalFieldState;
  attestation!: AttestationViewModel;
  preview!: DoseScheduleViewModel;
  slotDefinitions!: readonly ScheduleSlotDefinition[];
  presets!: readonly ScheduleSlotPreset[];
  unitLabel = '';
  amountMode: ScheduleAmountMode = 'numeric';

  readonly drugDefinition = drugDefinition;
  readonly durationDefinition = durationDefinition;
  readonly instructionsDefinition = instructionsDefinition;
  readonly prnMaxDefinition = prnMaxDefinition;
  readonly strengthUnits = strengthUnits;
  readonly formOptions = formOptions;
  readonly routeOptions = routeOptions;
  readonly siteOptions = siteOptions;

  private open = false;

  constructor(public s: OrderState) { this.refresh(); }

  private update(patch: Partial<OrderState>): void {
    this.s = { ...this.s, ...patch };
    // After a failed sign attempt, messages track the fields live so fixed ones clear.
    if (!('errors' in patch) && Object.keys(this.s.errors).length) this.s = { ...this.s, errors: this.validate() };
    this.refresh();
  }

  onDrugIntent(intent: CodedInputIntent): void {
    switch (intent.type) {
      case 'queryChangeRequested':
      case 'searchRequested': this.open = intent.query.trim().length > 0; this.update({ query: intent.query }); break;
      case 'openRequested': this.open = this.s.query.trim().length > 0; this.refresh(); break;
      case 'closeRequested': this.open = false; this.refresh(); break;
      case 'conceptSelected': this.open = false; this.update({ drug: intent.concept, query: '' }); break;
      case 'conceptRemoveRequested': this.update({ drug: null }); break;
      case 'statusChangeRequested': break;
    }
  }
  setStrength(strength: number | null): void { this.update({ strength }); }
  setStrengthUnit(strengthUnit: string | null): void { this.update({ strengthUnit }); }
  setForm(form: string | null): void { this.update({ form: form as DoseForm | null }); }
  setRoute(route: string | null): void { this.update({ route, site: route === 'eye' ? this.s.site : null }); }
  setSite(site: string | null): void { this.update({ site }); }
  setSlots(slots: readonly DoseSlot[]): void { this.update({ slots }); }
  setDuration(v: ClinicalFieldValue): void { this.update({ duration: typeof v === 'string' ? v : '' }); }
  setInstructions(v: ClinicalFieldValue): void { this.update({ instructions: typeof v === 'string' ? v : '' }); }
  setPrnMax(v: ClinicalFieldValue): void { this.update({ prnMax: typeof v === 'number' ? v : null }); }

  onAttestationIntent(intent: AttestationIntent): void {
    if (intent.type === 'signRequested') {
      const errors = this.validate();
      this.update(Object.keys(errors).length ? { errors } : { errors: {}, signed: true });
    } else if (intent.type === 'amendRequested') {
      this.update({ signed: false });
    }
  }

  /** Clinical and completeness rules live here, never in the UI. */
  private validate(): Partial<Record<ErrorKey, string>> {
    const s = this.s;
    const e: Partial<Record<ErrorKey, string>> = {};
    if (!s.drug) e.drug = 'Choose a medicine from the formulary.';
    if (s.strength === null || s.strength <= 0) e.strength = 'Enter the strength.';
    if (!s.form) e.form = 'Choose a form.';
    if (!s.route) e.route = 'Choose a route.';
    if (s.route === 'eye' && !s.site) e.site = 'Choose which eye.';
    if (!s.slots?.length) e.slots = s.prn ? 'Tick when needed.' : 'Tick at least one time of day.';
    if (s.slots?.some((slot) => slot.amount === null && !slot.amountLabel)) e.slots = 'Enter an amount for every ticked time.';
    if (!s.prn && !s.duration.trim()) e.duration = 'Enter how long to take it.';
    if (s.prn && !s.prnMax) e.prnMax = 'Enter the maximum number of doses in 24 hours.';
    return e;
  }

  private refresh(): void {
    const s = this.s;
    const locked = s.readOnly || s.signed;
    const e = s.errors;

    const needle = s.query.trim().toLowerCase();
    this.coded = {
      definition: drugDefinition, value: s.drug, query: s.query, open: this.open && !locked, loading: false,
      options: needle ? formulary.filter((d) => d.display.toLowerCase().includes(needle)) : [],
      messages: e.drug ? [{ path: ['medication'], severity: 'error', message: e.drug }] : [],
      readOnly: locked, emptyMessage: 'No formulary match', systemLabels: { [FORMULARY]: 'Formulary' }
    };

    this.slotDefinitions = s.prn ? prnSlots : s.route === 'eye' ? eyeSlots : daySlots;
    this.presets = s.prn || s.route === 'eye' ? [] : dayPresets;
    const unit = s.form ? units[s.form] : undefined;
    this.unitLabel = unit?.other ?? '';

    this.durationState = { value: s.duration, error: e.duration };
    this.instructionsState = { value: s.instructions };
    this.prnMaxState = { value: s.prnMax ?? '', error: e.prnMax };

    this.attestation = {
      id: 'order-sign', title: 'Prescriber sign-off',
      statement: 'I have checked the medicine, dose, route and schedule for this patient.',
      signatories: [{ ...prescriber, status: s.signed ? signedBadge : pendingBadge, signedAtLabel: s.signed ? '10 Oct 2026, 09:20' : undefined }],
      canSign: !s.signed, signLabel: 'Sign order', canAmend: s.signed, amendLabel: 'Amend',
      readOnly: s.readOnly,
      error: Object.keys(e).length ? 'Complete the highlighted fields before signing.' : undefined
    };

    this.preview = this.toPreview(unit);
  }

  /** Maps picker output and the other fields into the dose card. */
  private toPreview(unit: DoseUnit | undefined): DoseScheduleViewModel {
    const s = this.s;
    const slots = s.slots ?? [];
    const form = formOptions.find((o) => o.value === s.form);
    const site = s.site ? { code: s.site, label: siteWords[s.site] } : undefined;
    const taper: DoseTaperStep[] | undefined = s.taperRest
      ? [{ id: 'step-1', periodLabel: 'Week 1', frequencyLabel: timesDaily(slots.length), slots }, ...s.taperRest]
      : undefined;
    return {
      medication: {
        label: s.drug?.display ?? 'No medicine chosen',
        strength: s.strength !== null && s.strengthUnit ? `${s.strength} ${s.strengthUnit}` : undefined,
        formLabel: form?.label ?? 'Form not set',
        form: s.form ?? 'other'
      },
      unit,
      frequency: s.prn ? { label: 'When needed' }
        : taper ? { label: `Reducing over ${taper.length} weeks` }
        : { code: frequencyCodes[slots.length] || undefined, label: timesDaily(slots.length) },
      slots: taper ? [] : slots,
      taper,
      site,
      route: routeOptions.find((o) => o.value === s.route)?.label,
      duration: s.duration.trim() || undefined,
      instructions: s.instructions.split('\n').map((line) => line.trim()).filter(Boolean),
      prn: s.prn ? { label: 'Only when needed for pain', maxLabel: s.prnMax ? `No more than ${s.prnMax} doses in 24 hours` : undefined } : undefined,
      status: s.signed ? signedBadge : { label: 'Draft', tone: 'neutral' },
      readOnly: true
    };
  }
}

// ---- Template -----------------------------------------------------------------------------------
const TEMPLATE = `
<div class="emr-story-surface" [style.max-width]="width">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:24px;align-items:start">
    <form style="display:grid;gap:16px;min-width:0" aria-label="Drug order" (submit)="$event.preventDefault()">
      <emr-coded-input [model]="c.coded" (intent)="c.onDrugIntent($event)" />
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:12px">
        <emr-quantity-input controlId="order-strength" label="Strength" [required]="true" [value]="c.s.strength" [unit]="c.s.strengthUnit" [units]="c.strengthUnits"
          [readOnly]="c.s.readOnly || c.s.signed" [error]="c.s.errors.strength ?? ''" (valueChange)="c.setStrength($event)" (unitChange)="c.setStrengthUnit($event)" />
        <emr-select controlId="order-form" label="Form" placeholder="Choose" [required]="true" [value]="c.s.form" [options]="c.formOptions"
          [readOnly]="c.s.readOnly || c.s.signed" [error]="c.s.errors.form ?? ''" (valueChange)="c.setForm($event)" />
        <emr-select controlId="order-route" label="Route" placeholder="Choose" [required]="true" [value]="c.s.route" [options]="c.routeOptions"
          [readOnly]="c.s.readOnly || c.s.signed" [error]="c.s.errors.route ?? ''" (valueChange)="c.setRoute($event)" />
        @if (c.s.route === 'eye') {
          <emr-select controlId="order-site" label="Which eye" placeholder="Choose" [required]="true" [value]="c.s.site" [options]="c.siteOptions"
            [readOnly]="c.s.readOnly || c.s.signed" [error]="c.s.errors.site ?? ''" (valueChange)="c.setSite($event)" />
        }
      </div>
      <emr-schedule-slot-picker controlId="order-slots" [label]="c.s.taperRest ? 'Week 1 schedule' : c.s.prn ? 'As needed' : 'When to take'" [required]="true"
        [slots]="c.slotDefinitions" [presets]="c.presets" [value]="c.s.slots" [unitLabel]="c.unitLabel" [amountMode]="c.amountMode"
        [readOnly]="c.s.readOnly || c.s.signed" [error]="c.s.errors.slots" [hint]="c.s.taperRest ? 'Later weeks follow the reducing plan shown in the preview.' : undefined"
        (valueChange)="c.setSlots($event)" />
      @if (c.s.prn) {
        <emr-typed-field controlId="order-prn-max" [definition]="c.prnMaxDefinition" [model]="c.prnMaxState" [readOnly]="c.s.readOnly || c.s.signed" (valueChange)="c.setPrnMax($event)" />
      } @else {
        <emr-typed-field controlId="order-duration" [definition]="c.durationDefinition" [model]="c.durationState" [readOnly]="c.s.readOnly || c.s.signed" (valueChange)="c.setDuration($event)" />
      }
      <emr-typed-field controlId="order-instructions" [definition]="c.instructionsDefinition" [model]="c.instructionsState" [readOnly]="c.s.readOnly || c.s.signed" (valueChange)="c.setInstructions($event)" />
      <emr-attestation [model]="c.attestation" (intent)="c.onAttestationIntent($event)" />
    </form>
    <section style="display:grid;gap:8px;min-width:0" aria-label="Order preview">
      <emr-dose-schedule [model]="c.preview" />
    </section>
  </div>
</div>`;

const render = (state: Partial<OrderState>, width = '1040px') => ({
  props: { c: new OrderComposer({ ...blank, ...state }), width },
  template: TEMPLATE
});

const bd: DoseSlot[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am', amount: 1 },
  { id: 'n', label: 'Night', timeHint: '10 pm', amount: 1 }
];
const tabletBd: Partial<OrderState> = {
  drug: metformin, strength: 500, strengthUnit: 'mg', form: 'tablet', route: 'oral', slots: bd,
  duration: '30 days', instructions: 'Take with food.\nDo not crush.'
};

export const Blank: Story = { render: () => render({}) };

export const TabletBd: Story = { render: () => render(tabletBd) };

export const EyeDropTaper: Story = {
  render: () => render({
    drug: prednisoloneEye, strength: 1, strengthUnit: '%', form: 'drop', route: 'eye', site: 'OD',
    slots: eyeSlots.map((d) => ({ id: d.id, label: d.label, amount: 1 })),
    duration: '5 weeks', instructions: 'Shake the bottle before use.\nWait 5 minutes between different eye drops.',
    taperRest: [
      { id: 'w2', periodLabel: 'Week 2', frequencyLabel: '4 times daily' },
      { id: 'w3', periodLabel: 'Week 3', frequencyLabel: '3 times daily' },
      { id: 'w4', periodLabel: 'Week 4', frequencyLabel: 'Twice daily' },
      { id: 'w5', periodLabel: 'Week 5', frequencyLabel: 'Once daily, then stop' }
    ]
  })
};

export const PrnAnalgesia: Story = {
  render: () => render({
    drug: paracetamol, strength: 500, strengthUnit: 'mg', form: 'tablet', route: 'oral', prn: true,
    slots: [{ id: 'prn', label: 'When needed', timeHint: 'PRN', amount: 2 }], prnMax: 4,
    instructions: 'Leave at least 4 hours between doses.'
  })
};

export const ReadOnly: Story = { render: () => render({ ...tabletBd, signed: true, readOnly: true }) };

export const WithValidationMessages: Story = {
  render: () => render({
    strength: null, form: 'tablet', route: null, slots: null,
    errors: {
      drug: 'Choose a medicine from the formulary.', strength: 'Enter the strength.', route: 'Choose a route.',
      slots: 'Tick at least one time of day.', duration: 'Enter how long to take it.'
    }
  })
};

export const Mobile: Story = {
  render: () => render({ ...tabletBd, drug: amoxicillin, strength: 500, slots: [...bd.slice(0, 1), { id: 'a', label: 'Afternoon', timeHint: '2 pm', amount: 1 }, bd[1]], duration: '5 days', instructions: 'Complete the full course.' }, '360px'),
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};
