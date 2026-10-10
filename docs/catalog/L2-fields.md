# L2 — Fields

L2 binds a single `ClinicalFieldDefinition` (from the controller's schema) to a concrete L1 primitive control, and wraps it in the shared label/hint/error frame. L2 has no clinical semantics of its own — it is the mechanical adapter between "here is a field definition and its current state" and "here is a rendered, accessible control." Every schema-driven container above it (L3 `EmrClinicalForm`, `EmrRepeatableGroup`, L4 domain forms, L6 authoring previews) renders fields through this layer rather than talking to L1 primitives directly.

Source: `packages/emr-ui/src/lib/fields/emr-field-frame.component.ts`, `packages/emr-ui/src/lib/fields/emr-typed-field.component.ts`.

---

### EmrFieldFrame
**Layer** L2 · **Selector** `emr-field-frame` · **Status** stable · **Story** none — coverage gap

**Need** — every clinical field, regardless of its underlying control (text input, select, textarea, checkbox…), needs the same accessible label association, the same required-marker treatment, and the same single message slot beneath the control. Duplicating that layout and `aria-describedby` wiring in every field-type branch would drift.

**Purpose** — renders the field's `<label>` (with a visually hidden "Required" announcement when `required()` is true), a content-projection slot (`<ng-content/>`) for the actual control, and one `aria-live="polite"` message region that shows **error**, else **warning**, else **hint**, in that strict priority order. It does NOT know what kind of control is projected into it, does NOT hold or validate a value, does NOT decide field type, and carries no dependency on `ClinicalFieldDefinition` or any other clinical-form model — its inputs are plain strings/booleans supplied by whatever wraps it (normally `EmrTypedField`).

**API**
```ts
@Component({
  selector: 'emr-field-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrFieldFrameComponent {
  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly required = input(false);
  readonly hint = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();

  readonly messageId = () => `${this.controlId()}-message`;
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `label` | `string` (signal input, required) | — | Rendered as the `<label for>` text |
| `controlId` | `string` (signal input, required) | — | Must match the projected control's `id`; also derives `messageId()` |
| `required` | `boolean` (signal input) | `false` | Shows a `*` and an `emr-sr-only` "Required" announcement |
| `hint` | `string \| undefined` | `undefined` | Shown only when neither `error` nor `warning` is set |
| `warning` | `string \| undefined` | `undefined` | Shown only when `error` is not set |
| `error` | `string \| undefined` | `undefined` | Highest priority; also drives `aria-invalid` on whatever control consumes `messageId()` |

**Example**
```html
<emr-field-frame [label]="'Systolic BP'" [controlId]="'bp-sys'" [required]="true" [error]="fieldState.error">
  <input class="emr-control" id="bp-sys" type="number" [attr.aria-describedby]="'bp-sys-message'" />
</emr-field-frame>
```

**Depends on** — none (no component imports; pure template + projected content).
**Used by** — `EmrTypedField` (verified: `emr-typed-field -> emr-field-frame`).

---

### EmrTypedField
**Layer** L2 · **Selector** `emr-typed-field` · **Status** stable · **Story** none — coverage gap

**Need** — a schema-driven form needs one place that turns a `ClinicalFieldDefinition` + its current `ClinicalFieldState` into the right native control (`<input type="number">`, `<select>`, `<textarea>`, a checkbox, a quantity pair…) without every container (`EmrClinicalForm`, `EmrRepeatableGroup`, `EmrFieldGenerator`'s preview) re-implementing that switch.

**Purpose** — renders one control per `ClinicalFieldDefinition.type`, wraps it in `EmrFieldFrame`, and additionally renders the field's `assessmentStatus` (badge + optional status-editing select) when the field carries `assessmentStatusOptions` or a recorded status. It emits mechanical value/status/focus events only. It does NOT call HTTP, does NOT persist, does NOT clinically validate a value, does NOT infer whether a value is complete/normal/safe, and does NOT collapse the distinct clinical states `not-assessed`/`unable-to-assess`/`not-applicable`/`declined`/`unknown` — `assessmentStatus` is passed straight through as a controller-supplied enum value with no interpretation.

**API**
```ts
// clinical-form.models.ts — real union, quoted verbatim
export type ClinicalFieldType =
  | 'text'
  | 'multiline'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'quantity'
  | 'custom';

export interface ClinicalFieldDefinition {
  kind?: 'field';
  id: string;
  label: string;
  type: ClinicalFieldType;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  unit?: string;
  precision?: number;
  rows?: number;
  options?: readonly ClinicalOption[];
  assessmentStatusOptions?: readonly ClinicalAssessmentStatusOption[];
  customRendererKey?: string;
}

export interface ClinicalFieldState {
  value: ClinicalFieldValue;
  assessmentStatus?: ClinicalAssessmentStatus;
  readOnly?: boolean;
  disabled?: boolean;
  warning?: string;
  error?: string;
}

export type ClinicalFieldValue = string | number | boolean | readonly string[] | ClinicalQuantityValue | null;

@Component({ selector: 'emr-typed-field', standalone: true })
export class EmrTypedFieldComponent {
  @Input({ required: true }) field!: ClinicalFieldDefinition;
  @Input() state?: ClinicalFieldState;
  @Input({ required: true }) controlId!: string;
  @Input() readOnly = false;
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly valueChange = new EventEmitter<ClinicalFieldValue>();
  @Output() readonly statusChange = new EventEmitter<ClinicalAssessmentStatus | undefined>();
  @Output() readonly focused = new EventEmitter<void>();
}

export interface EmrCustomFieldContext {
  $implicit?: EmrCustomFieldContext;
  field: ClinicalFieldDefinition;
  state?: ClinicalFieldState;
  controlId: string;
}
```

**`ClinicalFieldType` case coverage** — the component's `@switch (field.type)` handles every member of the real, current union:

| case | handled | rendered as |
|---|---|---|
| `text` | yes | `@default` branch → `<input type="text">` |
| `multiline` | yes | `<textarea>` |
| `integer` | yes | `<input type="number" step="1">` |
| `decimal` | yes | `<input type="number">` with `decimalStep()` |
| `date` | yes | `<input type="date">` |
| `select` | yes | `<select>` over `field.options` |
| `multiselect` | yes | `<select multiple>` |
| `boolean` | yes | checkbox |
| `quantity` | yes | number input + unit label, emits `ClinicalQuantityValue` |
| `custom` | yes | looks up `customTemplates[field.customRendererKey]`; renders an "unregistered" status message if absent |

All 10 cases in the real `ClinicalFieldType` union are handled — there is no unhandled case today.

**Known gaps**
- **`EmrFieldGenerator` can author terminology-bound fields that `EmrTypedField` cannot render.** `EmrGeneratedFieldDefinition` (see `field-generator.models.ts`) carries `terminologyBindings: readonly TerminologyBinding[]` — LOINC/SNOMED/ICD/UCUM concept bindings a user attaches in the authoring layer. `ClinicalFieldDefinition`, the type `EmrTypedField` actually consumes, has **no field for terminology bindings at all**. `EmrFieldGeneratorComponent.previewField()` (`authoring/emr-field-generator.component.ts`) demonstrates the boundary directly — it hand-builds a `ClinicalFieldDefinition` from the draft and silently drops `terminologyBindings`, `instructions`, `unitSystem`, `unitCode`, `repeats`, and `tags` in the process. So a field can be fully coded (e.g. bound to a LOINC "question-meaning" concept and a SNOMED "answer-value-set") in the authoring layer, and `EmrTypedField` will still render it as a bare `<select>`/`<input>` with no visual or programmatic indication that a terminology binding exists. This is a genuine authoring→capture contract gap, not a missing switch case.

**Composition** — renders `EmrFieldFrameComponent` (same layer, L2) around whichever native control the `field.type` switch selects; when `field.type === 'custom'`, projects a consumer-supplied `TemplateRef` via `NgTemplateOutlet` instead of owning any custom rendering itself. It renders no other clinical component, which is why L2 has no cross-layer composition graph of its own.

**Depends on** — `EmrFieldFrameComponent` (L2, same layer).
**Used by** — `EmrRepeatableGroup` (L3), `EmrClinicalForm` (L3), `EmrFieldGenerator` (L6, for its live preview) — all verified in the import graph.

---

### EmrCodedInput
**Layer** L2 · **Selector** `emr-coded-input` · **Status** stable · **Story** `emr-fields-coded-input--single`

**Need** — A coded answer (diagnosis, observation, procedure) must be captured as a real concept (system, code, display), not free text, and the clinician must be able to see which terminology each chosen concept comes from. `docs/field-contract.md` names this component as the consumer of the `answer-value-set` terminology binding.

**Purpose** — Renders one coded field: the chosen concepts as chips, each with the display name and the code system name and code as text ("SNOMED CT 77075001", "ICD-10 H40.11", "LOINC 56844-4"), a 44px "Remove <display>" button per chip, and a search box built on `EmrSearchSelect` inside an `EmrFieldFrame`. Typing, search, open/close, choosing a result and removing a chip are emitted as intents; the search intent carries the contract's `answer-value-set` `valueSetCanonical`. Single or multiple follows `cardinality.max` through the shape of `value` (one concept, or a list). An optional assessment-status select (`presentation.assessmentStatusOptions`) emits `statusChangeRequested`, and the six no-value states keep their own badge. Validation messages are shown with a text prefix (Error / Warning / Note) and linked to the control with `aria-describedby`. The controller owns terminology lookup, paging, debouncing, edition and version, synonym matching and all validation including binding strength; the UI never calls a port and never filters or reorders `options`. A read-only field with no value shows "Not supplied".

**API**
```ts
export interface CodedInputViewModel {
  readonly definition: EmrFieldDefinition;
  readonly value: EmrCodedValue | readonly EmrCodedValue[] | null;
  readonly status?: ClinicalAssessmentStatus;
  readonly query: string; readonly options: readonly EmrCodedValue[];
  readonly open: boolean; readonly loading: boolean;
  readonly messages: readonly EmrValidationMessage[];
  readonly readOnly?: boolean; readonly emptyMessage: string;
  readonly systemLabels?: Readonly<Record<string, string>>;   // system URI -> "SNOMED CT"
}
export type CodedInputIntent =
  | { type: 'queryChangeRequested'; query: string }
  | { type: 'searchRequested'; query: string; valueSetCanonical?: string }
  | { type: 'openRequested' } | { type: 'closeRequested' }
  | { type: 'conceptSelected'; concept: EmrCodedValue }
  | { type: 'conceptRemoveRequested'; code: string; system: string }
  | { type: 'statusChangeRequested'; status: ClinicalAssessmentStatus };

export class EmrCodedInputComponent {
  @Input({ required: true }) model!: CodedInputViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<CodedInputIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `CodedInputViewModel` (required) | — | field definition, value, query, results and messages, all supplied by the controller |
| `headingId` | `string` | field label | id of an external heading; when set it names the group via `aria-labelledby` |
| `intent` (output) | `EventEmitter<CodedInputIntent>` | — | the seven intents above |

**Example**
```html
<emr-coded-input [model]="diagnosisModel" (intent)="onDiagnosisIntent($event)" />
```

**Known gaps**
- API deviation: it is L2 but takes `model` and a single `intent`, because it has a multi-action surface (query, search, selection, removal, status) that does not fit a single `valueChange`.
- `systemLabels` is an addition to the spec's view model: `EmrCodedValue.system` is a URI, and the UI must not map URIs to names, so the controller supplies the names. An unmapped system is shown as its raw URI.
- The results list is the `EmrSearchSelect` panel: results are keyed by system and code, and the panel's own empty state is replaced by a status line below the input when there are no results, because an empty `role="listbox"` fails axe `aria-required-children`.
- No terminology lookup, paging, debouncing, synonym matching, edition/version handling or binding-strength validation (all controller).
- Chips show the display name given in the value; a concept version (`EmrCodedValue.version`) is not displayed.

**Depends on** — `EmrFieldFrameComponent`, `EmrSearchSelectComponent`.

**Used by** — none yet (intended for `EmrTypedField` coded fields with a `search` widget and for diagnosis and observation capture).

---

### EmrAttestation
**Layer** L2 · **Selector** `emr-attestation` · **Status** stable · **Story** `EMR / Capture / Attestation`

**Need** - signing, witnessing and co-signing recur across inpatient records (MAR witness, transfusion two-person check, swab counts, controlled drugs, consent, discharge sign-off). The status bar and staged checklist each carried a private version.

**Purpose** - renders the caller-supplied attestation statement, one row per `CaptureSignatory` (name, role, status badge, signed-at label or "Not supplied") and Sign / Amend buttons shown only when `canSign` / `canAmend` and not `readOnly`. It does NOT decide who may sign, format timestamps, or evaluate completeness; every label and badge comes from the controller. Compact enough for a flowsheet cell popover or checklist phase footer; action buttons are hidden in print.

**API**
```ts
export class EmrAttestationComponent {
  readonly model = input.required<AttestationViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<AttestationIntent>();
}
// AttestationIntent = signRequested(signatoryId?) | amendRequested | signatorySelected(signatoryId)
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `AttestationViewModel` (required) | - | title, statement, signatories, canSign, signLabel, canAmend, amendLabel, readOnly, error |
| `headingId` | `string` | generated | id of the title heading, used for `aria-labelledby` |

**Example**
```html
<emr-attestation [model]="witnessModel" (intent)="onAttest($event)" />
```

**Depends on** - none. **Used by** - none yet (status bar and staged checklist not retrofitted).

---

### EmrScheduleSlotPicker
**Layer** L2 · **Selector** `emr-schedule-slot-picker` · **Status** stable · **Story** `emr-medications-slot-picker--four-slots-empty`

**Need** — a drug order composer must capture *when* and *how much* a medicine is taken as structured `DoseSlot[]`, the same shape `EmrDoseSchedule` renders, rather than a free-text frequency that the patient-facing card would have to parse.

**Purpose** — renders a `<fieldset>`/`<legend>` group with one checkbox per controller-supplied slot (four standard slots, hourly slots, or a single PRN slot). A ticked slot shows an amount control: a number input (`amountMode: 'numeric'`, with `unitLabel` beside it) or a text input (`amountMode: 'label'`, e.g. "thin layer"). Optional preset buttons tick a fixed set of slot ids and replace the selection; slots already ticked keep their amount, new ones start at `defaultAmount` / `defaultAmountLabel`. The button whose slot ids equal the current selection shows `aria-pressed="true"` and a tick glyph. Every change emits a new immutable `DoseSlot[]` in `slots` order through `valueChange`; unticked slots are omitted, and an emptied amount becomes `amount: null` with the slot still ticked. It does NOT derive frequency text or codes, totals, durations or tapers, does NOT validate amounts (no clinical bounds), and does NOT pluralise units — the controller does all of that from the emitted value. Value building lives in the controller as pure functions (`toggleSlot`, `setSlotAmount`, `applySlotPreset`). Read-only renders each slot as text ("1 tablets" uses the supplied `unitLabel` verbatim; "Not selected" otherwise); `disabled` disables the whole fieldset.

**API**
```ts
// schedule-slot.models.ts
export interface ScheduleSlotDefinition { id: string; label: string; timeHint?: string }
export interface ScheduleSlotPreset { id: string; label: string; slotIds: readonly string[] }
export type ScheduleAmountMode = 'numeric' | 'label';
export type ScheduleSlotSeed = Pick<DoseSlot, 'amount' | 'amountLabel'>;
export const toggleSlot: (value, slots, slotId, checked, seed) => DoseSlot[];
export const setSlotAmount: (value, slots, slotId, amounts: ScheduleSlotSeed) => DoseSlot[];
export const applySlotPreset: (value, slots, preset, seed) => DoseSlot[];

export class EmrScheduleSlotPickerComponent {
  readonly controlId = input<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);
  readonly readOnly = input(false);
  readonly disabled = input(false);
  readonly value = input<readonly DoseSlot[] | null>(null);
  readonly slots = input.required<readonly ScheduleSlotDefinition[]>();
  readonly unitLabel = input<string>();
  readonly amountMode = input<ScheduleAmountMode>('numeric');
  readonly presets = input<readonly ScheduleSlotPreset[]>([]);
  readonly defaultAmount = input(1);
  readonly defaultAmountLabel = input('');
  readonly valueChange = output<readonly DoseSlot[]>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `controlId` | `string` | generated | id of the fieldset; checkboxes are `{controlId}-{slot.id}`, amounts `{controlId}-{slot.id}-amount`, message `{controlId}-message` |
| `label` | `string` (required) | — | legend text |
| `hint` / `error` | `string` | — | one message region below the grid; error wins and is prefixed "Error:" |
| `required` | `boolean` | `false` | `*` plus a screen-reader "Required"; the controller decides whether an empty value is an error |
| `readOnly` | `boolean` | `false` | renders text, no controls, no presets |
| `disabled` | `boolean` | `false` | disables the fieldset |
| `value` | `readonly DoseSlot[] \| null` | `null` | ticked slots; ids not in `slots` are ignored |
| `slots` | `readonly ScheduleSlotDefinition[]` (required) | — | available slots, in display and emission order |
| `unitLabel` | `string` | — | shown after numeric amounts and in the amount's accessible name |
| `amountMode` | `'numeric' \| 'label'` | `'numeric'` | edits `amount` or `amountLabel` |
| `presets` | `readonly ScheduleSlotPreset[]` | `[]` | buttons above the grid |
| `defaultAmount` | `number` | `1` | starting amount for a newly ticked slot (numeric) |
| `defaultAmountLabel` | `string` | `''` | starting text for a newly ticked slot (label) |
| `valueChange` (output) | `readonly DoseSlot[]` | — | `[(value)]` partner |

**Example**
```html
<emr-schedule-slot-picker controlId="rx-slots" label="When to take" [slots]="slots" [presets]="presets"
  unitLabel="tablets" [(value)]="doseSlots" />
<emr-dose-schedule [model]="scheduleModelFrom(doseSlots)" />
```

**Known gaps**
- `defaultAmountLabel` is an addition to the brief: `EmrDoseSchedule` shows a slot with `amount: null` and an empty `amountLabel` as "none", so label mode needs a starting text to read as ticked.
- `valueChange` emits `readonly DoseSlot[]` (an empty array when nothing is ticked), never `null`.
- Presets are not a `role="toolbar"` with arrow-key roving focus; they are a labelled group of tab-stop buttons.
- Numeric amounts accept any non-negative decimal; fractions are typed as decimals (0.5) and `EmrDoseSchedule` formats them.

**Depends on** — none (no component imports). Value building: `toggleSlot`, `setSlotAmount`, `applySlotPreset` from `@drguptavivek/emr-controller`.
**Used by** — none yet (intended for the drug order composer, paired with `EmrDoseSchedule` as its preview).
