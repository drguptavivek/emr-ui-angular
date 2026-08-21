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
