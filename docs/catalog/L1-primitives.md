# L1 — Primitives

L1 is the layer of mechanical, presentation-only building blocks: inputs, choice controls, feedback surfaces, tabs, a separator, a Likert scale, and three layout helpers. None of these components know anything about clinical meaning — they bind a value, options, and validation *display* state, and emit change/intent events. A component at this layer may depend only on L0 (CSS tokens/classes) and framework/controller primitive types (`EmrOption`, `EmrTone`) from `@drguptavivek/emr-controller`. It must never import anything from L2 or above, and per the verified import graph it never imports another L1 sibling either — the 21 components below are independent leaves.

Source files: `packages/emr-ui/src/lib/primitives/*.component.ts` (including `emr-card-layout.component.ts`).

## Shared base: `EmrFieldBase`

Six of the input components (`EmrTextInput`, `EmrNumberInput`, `EmrDateInput`, `EmrSelect`, `EmrQuantityInput`, `EmrPairedInput`) extend a shared, **non-exported** abstract base defined in `emr-inputs.component.ts`:

```ts
@Directive()
abstract class EmrFieldBase {
  @Input() inputId = 'emr-field';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readOnly = false;

  describedBy(): string | null; // joins `${inputId}-hint` / `${inputId}-error` for aria-describedby
}
```

Because it is not exported, consumers cannot reference `EmrFieldBase` by type — it only documents the common surface. Each subclass entry below is documented as `extends EmrFieldBase` and lists only its own additional inputs/outputs.

---

### EmrButton
**Layer** L1 · **Selector** `emr-button` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Every workflow needs a consistent, accessible clickable affordance (save, cancel, delete, preview) with a busy/loading state that doesn't require re-deriving `disabled`/`aria-busy` wiring in every consumer.

**Purpose** — Renders a styled `<button>` with variant/size/loading/disabled visual states and emits a raw click event. It does not perform navigation, submit forms itself beyond the native `type` attribute, call any API, or know what the click "means" — that is entirely the caller's responsibility via the `clicked` output.

**API**
```ts
export type EmrButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type EmrButtonSize = 'small' | 'medium';

// Decorator-based (@Input/@Output), not signal input()/output()
interface EmrButtonProps {
  variant: EmrButtonVariant; // default 'primary'
  size: EmrButtonSize;       // default 'medium'
  type: 'button' | 'submit' | 'reset'; // default 'button'
  disabled: boolean; // default false
  loading: boolean;  // default false
  block: boolean;    // default false
}
// @Output() clicked: EventEmitter<MouseEvent>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| variant | `EmrButtonVariant` | `'primary'` | maps to `.emr-button--secondary/--outline/--ghost/--danger` |
| size | `EmrButtonSize` | `'medium'` | `'small'` maps to `.emr-button--small` |
| type | `'button' \| 'submit' \| 'reset'` | `'button'` | forwarded to native `type` attribute |
| disabled | `boolean` | `false` | also true while `loading` |
| loading | `boolean` | `false` | shows `•••` glyph, sets `aria-busy` |
| block | `boolean` | `false` | maps to `.emr-button--block` (full width) |
| clicked (output) | `EventEmitter<MouseEvent>` | — | emitted on native click |

**Example**
```html
<emr-button variant="danger" [disabled]="isSaving" (clicked)="onDelete()">Delete</emr-button>
```

**Depends on** — L0 tokens only (`.emr-button`, `.emr-button--*`)
**Used by** — not consumed internally

---

### EmrTextInput
**Layer** L1 · **Selector** `emr-text-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Free-text fields (patient name, remarks, MRN entry) need a labelled, described, error-capable text control that behaves identically everywhere in the catalogue.

**Purpose** — Renders a labelled `<input>` bound to a plain string, wiring `aria-invalid`/`aria-describedby` from `error`/`hint`. It performs no input masking, no format validation, and no debouncing — it emits every keystroke as-is via `valueChange`.

**API**
```ts
// extends (non-exported) EmrFieldBase: inputId, label, hint, error, placeholder, required, disabled, readOnly
interface EmrTextInputProps extends EmrFieldProps {
  value: string; // default ''
}
// @Output() valueChange: EventEmitter<string>
// @Output() blurred: EventEmitter<void>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `string` | `''` | controlled — component does not mutate it internally |
| valueChange (output) | `EventEmitter<string>` | — | emitted on every native `input` event |
| blurred (output) | `EventEmitter<void>` | — | emitted on native `blur` |
| *(inherited)* inputId/label/hint/error/placeholder/required/disabled/readOnly | see `EmrFieldBase` | | |

**Example**
```html
<emr-text-input inputId="demo-name" label="Patient name" [value]="name" required
  (valueChange)="name = $event" />
```

**Depends on** — L0 tokens only (`.emr-field`, `.emr-control`)
**Used by** — `EmrFavouritesPanel` (L4), `EmrOrderDetails` (L4)

---

### EmrNumberInput
**Layer** L1 · **Selector** `emr-number-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Numeric clinical readings (IOP, refractive power, counts) need integer vs. decimal input mode, min/max/step guidance, and a nullable value so "not yet entered" is distinguishable from zero.

**Purpose** — Renders a `type="number"` control with `inputmode`/`step` derived from `mode`. It performs no clinical range validation (min/max are advisory HTML attributes only, not enforced business rules) and no unit conversion.

**API**
```ts
interface EmrNumberInputProps extends EmrFieldProps {
  mode: 'integer' | 'decimal'; // default 'decimal'
  value: number | null;        // default null
  min?: number;
  max?: number;
  step: number; // default 0.01
}
// @Output() valueChange: EventEmitter<number | null>
// @Output() blurred: EventEmitter<void>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| mode | `'integer' \| 'decimal'` | `'decimal'` | integer forces `step=1` and `inputmode="numeric"` |
| value | `number \| null` | `null` | empty native value emits `null`, not `0` or `NaN` |
| min / max | `number \| undefined` | `undefined` | forwarded as HTML `min`/`max` only |
| step | `number` | `0.01` | ignored when `mode === 'integer'` |
| valueChange (output) | `EventEmitter<number \| null>` | — | |
| blurred (output) | `EventEmitter<void>` | — | |

**Example**
```html
<emr-number-input inputId="demo-iop" label="Intraocular pressure" [value]="18" mode="decimal" [step]="0.1" hint="mmHg" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrDateInput
**Layer** L1 · **Selector** `emr-date-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Encounter, order, and history dates need a native date picker consistent with the rest of the form chrome.

**Purpose** — Renders a `type="date"` control bound to an ISO date string. It performs no calendar validation, no timezone handling, and no formatting beyond what the browser's native date input provides.

**API**
```ts
interface EmrDateInputProps extends EmrFieldProps {
  value: string; // default ''
  min: string;   // default ''
  max: string;   // default ''
}
// @Output() valueChange: EventEmitter<string>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `string` | `''` | ISO `yyyy-mm-dd` expected by native input |
| min / max | `string` | `''` | forwarded as HTML `min`/`max` attributes |
| valueChange (output) | `EventEmitter<string>` | — | |

Note: unlike its sibling inputs, `EmrDateInput` does not emit a `blurred` output.

**Example**
```html
<emr-date-input inputId="demo-date" label="Encounter date" [value]="date" (valueChange)="date = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrSelect
**Layer** L1 · **Selector** `emr-select` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Controlled enumerations (status, urgency, order category) need a labelled `<select>` bound to a caller-owned option list, with a nullable "no selection" state.

**Purpose** — Renders a native `<select>` from `EmrOption[]`, with an optional blank placeholder option. It does not fetch or filter its own option list, and does not interpret option semantics beyond `value`/`label`/`disabled`.

**API**
```ts
interface EmrSelectProps extends EmrFieldProps {
  value: string | null;
  options: readonly EmrOption[]; // default []
}
// @Output() valueChange: EventEmitter<string | null>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `string \| null` | `null` | |
| options | `readonly EmrOption[]` | `[]` | `EmrOption = { value, label, description?, disabled? }` |
| valueChange (output) | `EventEmitter<string \| null>` | — | empty native selection emits `null` |
| *(inherited)* placeholder | `string` | `''` | when set, rendered as a blank first `<option>` |

**Example**
```html
<emr-select inputId="demo-status" label="Encounter status" [value]="status" [options]="statusOptions"
  (valueChange)="status = $event" />
```

**Depends on** — L0 tokens only
**Used by** — `EmrOrderDetails` (L4)

---

### EmrQuantityInput
**Layer** L1 · **Selector** `emr-quantity-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Measured quantities (weight, dose, volume) need a value paired with a unit selector, laid out as one field with two coordinated controls, rather than two separately-labelled fields.

**Purpose** — Renders a numeric value input beside a unit `<select>`, both described by the same hint/error region. It performs no unit conversion or clinical range checking — `units` is purely a caller-supplied `EmrOption[]` list.

**API**
```ts
interface EmrQuantityInputProps extends EmrFieldProps {
  value: number | null; // default null
  unit: string | null;  // default null
  units: readonly EmrOption[]; // default []
}
// @Output() valueChange: EventEmitter<number | null>
// @Output() unitChange: EventEmitter<string | null>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| value | `number \| null` | `null` | empty numeric input emits `null` |
| unit | `string \| null` | `null` | |
| units | `readonly EmrOption[]` | `[]` | |
| valueChange (output) | `EventEmitter<number \| null>` | — | |
| unitChange (output) | `EventEmitter<string \| null>` | — | empty unit selection emits `null`, not `''` |

**Example**
```html
<emr-quantity-input inputId="demo-weight" label="Weight" [value]="weight" unit="kg" [units]="unitOptions"
  (valueChange)="weight = $event" (unitChange)="unit = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrPairedInput
**Layer** L1 · **Selector** `emr-paired-input` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Bilateral clinical values (right/left eye visual acuity, systolic/diastolic BP) are conventionally recorded as a labelled pair with a separator glyph between them, not as two independent fields.

**Purpose** — Renders two text inputs with caller-supplied prefix labels and a separator glyph between them. It does not validate that the two values are related or consistent, and does not know which side is "right" vs "left" beyond the label strings it is given.

**API**
```ts
interface EmrPairedInputProps extends EmrFieldProps {
  firstLabel: string;  // default 'First'
  secondLabel: string; // default 'Second'
  firstValue: string;  // default ''
  secondValue: string; // default ''
  separator: string;   // default '/'
}
// @Output() firstValueChange: EventEmitter<string>
// @Output() secondValueChange: EventEmitter<string>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| firstLabel / secondLabel | `string` | `'First'` / `'Second'` | rendered as prefix glyphs and folded into each input's `aria-label` |
| firstValue / secondValue | `string` | `''` | |
| separator | `string` | `'/'` | rendered between the two inputs, `aria-hidden` |
| firstValueChange / secondValueChange (outputs) | `EventEmitter<string>` | — | |

Note: unlike the other five `EmrFieldBase` subclasses, `EmrPairedInput` does not use `inputId`/`placeholder`/`required` from the base in its template beyond deriving `${inputId}-first`/`${inputId}-second` ids, and it renders `hint`/`error` without wiring `aria-describedby`.

**Example**
```html
<emr-paired-input inputId="demo-pair" label="Visual acuity" firstLabel="OD" secondLabel="OS"
  [firstValue]="od" [secondValue]="os" separator="/" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrCheckbox
**Layer** L1 · **Selector** `emr-checkbox` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Boolean flags (fasting required, consent obtained) need a labelled checkbox with a controlled boolean value.

**Purpose** — Renders a native `<input type="checkbox">` inside a label. It carries no tri-state/indeterminate support and no grouping logic.

**API**
```ts
// Decorator-based (@Input/@Output)
interface EmrCheckboxProps {
  label: string;    // default ''
  checked: boolean; // default false
  disabled: boolean; // default false
}
// @Output() checkedChange: EventEmitter<boolean>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| label | `string` | `''` | rendered as sibling text, not `aria-label` |
| checked | `boolean` | `false` | |
| disabled | `boolean` | `false` | |
| checkedChange (output) | `EventEmitter<boolean>` | — | |

**Example**
```html
<emr-checkbox label="Fasting required" [checked]="fasting" (checkedChange)="fasting = $event" />
```

**Depends on** — L0 tokens only
**Used by** — `EmrOrderDetails` (L4)

---

### EmrToggle
**Layer** L1 · **Selector** `emr-toggle` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — On/off preferences (show only active orders) read more clearly as a switch than a checkbox in list-toolbar contexts.

**Purpose** — Renders a `role="switch"` checkbox styled as a track/thumb toggle. Functionally identical to `EmrCheckbox` — a distinct visual affordance for the same boolean contract, nothing more.

**API**
```ts
interface EmrToggleProps {
  label: string;     // default ''
  checked: boolean;  // default false
  disabled: boolean; // default false
}
// @Output() checkedChange: EventEmitter<boolean>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| label | `string` | `''` | |
| checked | `boolean` | `false` | |
| disabled | `boolean` | `false` | |
| checkedChange (output) | `EventEmitter<boolean>` | — | |

**Example**
```html
<emr-toggle label="Show only active orders" [checked]="activeOnly" (checkedChange)="activeOnly = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrRadioGroup
**Layer** L1 · **Selector** `emr-radio-group` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Mutually-exclusive single-choice sets (urgency: routine/urgent/STAT) need a native `<fieldset>`/radio group with correct grouping semantics.

**Purpose** — Renders a `<fieldset>` with a `<legend>` and one radio per `EmrOption`. It does not support option-level custom rendering beyond `label`.

**API**
```ts
interface EmrRadioGroupProps {
  name: string;   // default 'emr-radio'
  label: string;  // default ''
  value: string | null; // default null
  options: readonly EmrOption[]; // default []
  disabled: boolean; // default false
}
// @Output() valueChange: EventEmitter<string>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| name | `string` | `'emr-radio'` | native radio grouping name |
| label | `string` | `''` | rendered as `<legend>` |
| value | `string \| null` | `null` | |
| options | `readonly EmrOption[]` | `[]` | per-option `disabled` respected |
| disabled | `boolean` | `false` | disables the whole `<fieldset>` |
| valueChange (output) | `EventEmitter<string>` | — | emits the selected option's `value` |

**Example**
```html
<emr-radio-group name="urgency" label="Urgency" [value]="urgency" [options]="urgencyOptions"
  (valueChange)="urgency = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrBadge
**Layer** L1 · **Selector** `emr-badge` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Compact status labels (Completed, Review, Allergy) need a consistent tone-coded pill that always pairs colour with text.

**Purpose** — Renders projected content inside a tone-coded pill span. Carries no interactivity and interprets nothing about what tone "means" clinically — tone is a purely presentational input chosen by the caller.

**API**
```ts
// tone type imported from @drguptavivek/emr-controller
import { EmrTone } from '@drguptavivek/emr-controller';
interface EmrBadgeProps {
  tone: EmrTone; // 'neutral' | 'info' | 'success' | 'warning' | 'danger'; default 'neutral'
}
// content via <ng-content />, no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| tone | `EmrTone` | `'neutral'` | maps to `.emr-tone-*` |

**Example**
```html
<emr-badge tone="danger">Allergy</emr-badge>
```

**Depends on** — L0 tokens only
**Used by** — `EmrSectionCard` (L3)

---

### EmrChip
**Layer** L1 · **Selector** `emr-chip` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Same need as `EmrBadge` but for denser, list-style tags (e.g. condition chips in a chip row) rather than single status pills.

**Purpose** — Structurally identical to `EmrBadge` (tone-coded pill around projected content); the only difference is the `.emr-chip` class (`font-weight: 600` vs. badge's `700`) and its typical use inside `.emr-chip-row`.

**API**
```ts
interface EmrChipProps {
  tone: EmrTone; // default 'neutral'
}
// content via <ng-content />, no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| tone | `EmrTone` | `'neutral'` | maps to `.emr-tone-*` |

**Example**
```html
<emr-chip tone="info">Diabetes</emr-chip>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrAlert
**Layer** L1 · **Selector** `emr-alert` · **Status** stable · **Story** `foundations-primitives--feedback-states`

**Need** — Inline banner-style notices (informational, review-required, safety) need a consistent title + body layout with `role="status"` announcement.

**Purpose** — Renders a tone-coded, left-accented banner with a title and projected body content. It does not auto-dismiss, queue, or stack itself — placement and lifecycle are entirely caller-managed.

**API**
```ts
interface EmrAlertProps {
  tone: EmrTone; // default 'info'
  title: string; // default ''
}
// content via <ng-content /> (alert body), no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| tone | `EmrTone` | `'info'` | |
| title | `string` | `''` | rendered bold above the projected body |

Note: template always sets `role="status"` regardless of tone — even `tone="danger"` alerts use `role="status"`, not `role="alert"`.

**Example**
```html
<emr-alert tone="danger" title="Safety alert">Penicillin allergy is recorded.</emr-alert>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrStateMessage
**Layer** L1 · **Selector** `emr-state-message` · **Status** stable · **Story** `foundations-primitives--feedback-states`

**Need** — Empty/loading/error placeholder states recur across every list, table, and matrix in the catalogue and need one consistent, centred presentation with correct ARIA role per kind.

**Purpose** — Renders a centred title + optional message + projected extra content, with `role="alert"` for `kind="error"` and `role="status"` otherwise. It carries no retry/loading-spinner behaviour of its own.

**API**
```ts
interface EmrStateMessageProps {
  kind: 'empty' | 'loading' | 'error'; // default 'empty'
  title: string;   // default ''
  message: string; // default ''
}
// content via <ng-content />, no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| kind | `'empty' \| 'loading' \| 'error'` | `'empty'` | drives `role` only ("error" → `role="alert"`); no other visual difference by kind in this component's own CSS |
| title | `string` | `''` | |
| message | `string` | `''` | rendered only if non-empty |

**Example**
```html
<emr-state-message kind="error" title="Unable to load" message="Retry when the service is available." />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrSearchSelect
**Layer** L1 · **Selector** `emr-search-select` · **Status** stable · **Story** `foundations-primitives--search-single` (also covered by `foundations-primitives--search-multi-select`)

**Need** — Terminology/medication/test lookups need an accessible search-then-select combobox with single- and multi-select modes, keyboard listbox navigation, and a chip row for existing multi-select selections — without the component itself performing any search.

**Purpose** — Renders a search input + button + optional results listbox, entirely from caller-supplied `options`/`selected`/`open`/`loading` state; emits intents (`queryChanged`, `searchRequested`, `openRequested`, `closeRequested`, `optionSelected`, `removeRequested`) for the controller to fulfil. It performs zero actual searching, debouncing, or HTTP calls — every keystroke and click only emits an intent.

**API**
```ts
// Decorator-based (@Input/@Output)
interface EmrSearchSelectProps {
  inputId: string;    // default 'emr-search'
  label: string;      // default 'Search'
  placeholder: string; // default 'Type to search'
  query: string;       // default ''
  options: readonly EmrOption[];  // default []
  selected: readonly EmrOption[]; // default []
  multiple: boolean;  // default false
  open: boolean;       // default false
  loading: boolean;    // default false
  disabled: boolean;   // default false
  error: string;        // default ''
  emptyMessage: string; // default 'No matching options'
}
// @Output() queryChanged: EventEmitter<string>
// @Output() searchRequested: EventEmitter<void>
// @Output() openRequested: EventEmitter<void>
// @Output() closeRequested: EventEmitter<void>
// @Output() optionSelected: EventEmitter<string>   // emits option.value
// @Output() removeRequested: EventEmitter<string>  // emits option.value
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| inputId | `string` | `'emr-search'` | |
| label | `string` | `'Search'` | |
| labelHidden | `boolean` | `false` | keeps the label for assistive tech but hides it visually, for use inside a frame that already shows a label (e.g. `EmrCodedInput`) |
| placeholder | `string` | `'Type to search'` | |
| query | `string` | `''` | |
| options | `readonly EmrOption[]` | `[]` | rendered inside the listbox panel when `open` |
| selected | `readonly EmrOption[]` | `[]` | rendered as removable chips when `multiple && selected.length` |
| multiple | `boolean` | `false` | shows chip row and sets `aria-multiselectable` |
| open | `boolean` | `false` | controls listbox panel visibility |
| loading | `boolean` | `false` | swaps search button label to "Searching…" |
| disabled | `boolean` | `false` | |
| error | `string` | `''` | rendered with `role="alert"` |
| emptyMessage | `string` | `'No matching options'` | shown when `!loading && options.length === 0` |

Keyboard support: ArrowDown/ArrowUp move option focus, Home/End jump to first/last, Escape emits `closeRequested`.

**Example**
```html
<emr-search-select inputId="med-search" label="Medication" [options]="options" [selected]="selected" [open]="isOpen"
  (queryChanged)="onQuery($event)" (searchRequested)="onSearch()" (optionSelected)="onSelect($event)" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrTabs
**Layer** L1 · **Selector** `emr-tabs` · **Status** stable · **Story** `foundations-primitives--controls`

**Need** — Sectioned views (patient overview/orders/history, favourites categories) need a WAI-ARIA-compliant tablist with roving-tabindex keyboard navigation, not just styled buttons.

**Purpose** — Renders a `role="tablist"` of buttons from `EmrOption[]`, manages `tabindex`/`aria-selected`, and implements ArrowLeft/ArrowRight/Home/End navigation among enabled tabs. It does not render or manage any associated tab panel content — the caller owns what's shown for the `active` value.

**API**
```ts
interface EmrTabsProps {
  ariaLabel: string; // default 'Sections'
  tabs: readonly EmrOption[]; // default []
  active: string; // default ''
}
// @Output() tabChanged: EventEmitter<string>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| ariaLabel | `string` | `'Sections'` | sets `aria-label` on the tablist |
| tabs | `readonly EmrOption[]` | `[]` | per-tab `disabled` respected and skipped in arrow navigation |
| active | `string` | `''` | matched against each tab's `value` for `aria-selected`/`tabindex` |
| tabChanged (output) | `EventEmitter<string>` | — | emitted on click or arrow/home/end keyboard selection |

**Example**
```html
<emr-tabs ariaLabel="Patient sections" [active]="section" [tabs]="tabOptions" (tabChanged)="section = $event" />
```

**Depends on** — L0 tokens only
**Used by** — `EmrFavouritesPanel` (L4)

---

### EmrSeparator
**Layer** L1 · **Selector** `emr-separator` · **Status** stable · **Story** `foundations-layout-primitives--separators`

**Need** — Sections need a consistent visual divider — plain rule, labelled rule, or vertical inline divider — instead of ad hoc borders scattered through consumer markup.

**Purpose** — Renders a `role="separator"` divider: a plain horizontal rule, a centred-label rule (`label` set), or a vertical rule (`orientation="vertical"`). Purely decorative structure; no state or interaction.

**API**
```ts
// Signal-based input() (NOT @Input decorators) — part of the known L1 signal/decorator split
export type EmrSeparatorOrientation = 'horizontal' | 'vertical';
interface EmrSeparatorProps {
  orientation: EmrSeparatorOrientation; // input(), default 'horizontal'
  label?: string; // input(), optional — presence switches to the labelled-rule template branch
}
// no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'` | ignored when `label` is set (labelled variant is always horizontal) |
| label | `string \| undefined` | `undefined` | when present, renders the labelled two-line variant instead of the plain rule |

**Example**
```html
<emr-separator label="Clinical history" />
<emr-separator orientation="vertical" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrLikert
**Layer** L1 · **Selector** `emr-likert` · **Status** stable · **Story** `foundations-likert-scale--pain-score` (also `--unselected`, `--all-zones`, `--custom-range`, `--with-error`, `--read-only`, `--disabled`)

**Need** — Numeric rating scales (pain score 0–10, satisfaction 1–5) are a recurring clinical-assessment input shape that needs correct radiogroup semantics, per-point ARIA labelling, and an optional anchor-label row, without hardcoding the pain-severity meaning into every consumer.

**Purpose** — Renders a `<fieldset>`/`<legend>` numeric rating scale as a row of radio "pips" between `min` and `max`, with optional min/max anchor labels. The selected pip is coloured only by the controller-supplied `tone` input (`EmrTone`); the primitive never derives a severity from the number, so a 5/5 muscle-strength score and a 10/10 pain score are toned by the controllers that know what they mean.

**API**
```ts
export interface EmrLikertAnchor {
  value: number;
  label: string;
  assistiveLabel?: string;
}

// Decorator-based (@Input/@Output)
interface EmrLikertProps {
  name: string;   // default '' → per-instance generated group id
  label: string;  // default ''
  hint?: string;
  error?: string;
  min: number; // default 0
  max: number; // default 10
  value: number | null; // default null
  anchors: readonly EmrLikertAnchor[]; // default []
  disabled: boolean;  // default false
  readOnly: boolean;  // default false
  required: boolean;  // default false
  tone?: EmrTone;     // controller-supplied colour for the selected pip
}
// @Output() valueChange: EventEmitter<number>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| name | `string` | `''` | native radio grouping name; empty → unique per-instance id, so two likerts never share a group |
| label | `string` | `''` | rendered as `<legend>` |
| min / max | `number` | `0` / `10` | defines the generated point range (inclusive) |
| value | `number \| null` | `null` | |
| anchors | `readonly EmrLikertAnchor[]` | `[]` | only anchors matching exactly `min` or `max` are rendered |
| disabled | `boolean` | `false` | suppresses anchor row entirely when true |
| readOnly | `boolean` | `false` | blocks selection via `aria-readonly` + click prevention; inputs stay focusable and announceable (not `disabled`) |
| tone | `EmrTone \| undefined` | `undefined` | colours the selected pip (`data-tone`); undefined → neutral outline only |
| required | `boolean` | `false` | shows `*` plus an `.emr-sr-only` "Required" announcement |
| valueChange (output) | `EventEmitter<number>` | — | only emitted when neither `disabled` nor `readOnly` |

Implements `OnChanges` to regenerate the point array and resolved min/max anchors whenever inputs change.

**Example**
```html
<emr-likert name="pain" label="Pain score (0–10)" [min]="0" [max]="10" [value]="painScore"
  [anchors]="[{ value: 0, label: 'No pain' }, { value: 10, label: 'Worst pain' }]"
  (valueChange)="painScore = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrVas
**Layer** L1 · **Selector** `emr-vas` · **Status** stable · **Story** `foundations-vas-scale--pain-vas` (also `--health-thermometer`, `--unmarked`, `--read-only-vas`, `--interactive`, `--with-error`, `--disabled-vas`)

**Need** — A visual analogue scale is a different instrument from a Likert scale: the respondent marks a point anywhere along a continuous line rather than choosing one of N discrete pips. Both the horizontal 0–10 form and the vertical 0–100 EQ-5D-5L health thermometer are recurring instruments, and both need a ruler — major markers every *X*, minor markers every *Y* — that a finger can land on anywhere.

**Purpose** — Renders a continuous track with arithmetic tick positions, a recorded mark and thumb, and optional end anchors. Pointer input is captured (`setPointerCapture`), so a stroke that leaves the track keeps tracking and cannot resume on re-entry; keyboard input follows the ARIA slider pattern. `orientation="vertical"` reads bottom-up: `min` at the bottom, `max` at the top. The component derives no clinical meaning — it does not know whether a high number is good or bad, does not compute severity, and never labels an unset scale; `anchors`, `tone` and `valueText` are controller-supplied, and an unmarked scale simply omits `aria-valuenow`.

**API**
```ts
export interface EmrVasAnchor {
  value: number;          // typically min or max
  label: string;
  assistiveLabel?: string;
}

// Signal inputs/outputs (input()/output())
interface EmrVasProps {
  controlId: string;      // default 'emr-vas'
  label: string;          // default ''
  hint?: string;
  error?: string;
  min: number;            // default 0
  max: number;            // default 100
  value: number | null;   // default null
  step: number;           // default 1; 0 records the raw continuous position
  majorInterval: number;  // default 10 — labelled markers
  minorInterval: number;  // default 2  — unlabelled markers
  orientation: 'horizontal' | 'vertical';  // default 'horizontal'
  anchors: readonly EmrVasAnchor[];        // default []
  readOnly: boolean;      // default false
  disabled: boolean;      // default false
  required: boolean;      // default false
  tone?: EmrTone;         // controller-supplied colour for the recorded mark
  valueText?: string;     // controller-supplied aria-valuetext
}
// valueChange: OutputEmitterRef<number | null>
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| controlId | `string` | `'emr-vas'` | ids the slider and derives the label/hint/error ids |
| min / max | `number` | `0` / `100` | scale bounds; vertical renders `min` at the bottom |
| value | `number \| null` | `null` | `null` omits `aria-valuenow` rather than inventing a value |
| step | `number` | `1` | snap granularity; `0` keeps the raw position (4 dp) |
| majorInterval | `number` | `10` | labelled tick spacing; also the PageUp/PageDown increment |
| minorInterval | `number` | `2` | unlabelled tick spacing; tick count is capped at 400 |
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'` | sets `aria-orientation` and the axis geometry |
| tone | `EmrTone \| undefined` | `undefined` | colours the recorded mark; the primitive derives no severity |
| valueText | `string \| undefined` | `undefined` | `aria-valuetext`, e.g. `'72 out of 100'` |
| readOnly | `boolean` | `false` | stays focusable and announceable; input is ignored |
| disabled | `boolean` | `false` | removes it from the tab order |
| valueChange (output) | `number \| null` | — | only emitted when neither `disabled` nor `readOnly`, and only on an actual change |

**Keyboard** — `ArrowRight`/`ArrowUp` +`step`, `ArrowLeft`/`ArrowDown` −`step`, `PageUp`/`PageDown` ±`majorInterval`, `Home` → `min`, `End` → `max`.

**Example**
```html
<emr-vas
  controlId="vas-health"
  label="Your health today"
  orientation="vertical"
  [min]="0" [max]="100" [step]="1"
  [majorInterval]="10" [minorInterval]="5"
  [value]="healthToday"
  valueText="72 out of 100"
  [anchors]="healthAnchors"
  (valueChange)="healthToday = $event" />
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrCard
**Layer** L1 · **Selector** `emr-card` · **Status** stable · **Story** `foundations-layout-primitives--single-card`

**Need** — Every clinical panel needs a consistent bordered surface with an optional heading, without re-declaring the same card chrome CSS in every consumer.

**Purpose** — A single-surface wrapper (optional title bar + padded body) around projected content. It owns no data and no collapse/expand state — purely a layout shell.

**API**
```ts
// Signal-based input() (NOT @Input decorators) — part of the known L1 signal/decorator split
interface EmrCardProps {
  label?: string;  // input(), optional card title
  padded: boolean; // input(), default true — false removes body padding (.emr-card--flush)
}
// content via <ng-content />, no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| label | `string \| undefined` | `undefined` | omit for a headerless card |
| padded | `boolean` | `true` | `false` applies `.emr-card--flush` (zero body padding) |

**Example**
```html
<emr-card label="Vitals">
  <p>Projected content.</p>
</emr-card>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrColumns
**Layer** L1 · **Selector** `emr-columns` · **Status** stable · **Story** `foundations-layout-primitives--two-column`

**Need** — Side-by-side clinical panels (right eye / left eye, assessment / plan / follow-up) need equal-height CSS-grid columns that collapse to one column on narrow screens, without hand-writing grid-template-columns per screen.

**Purpose** — A thin wrapper that sets `grid-template-columns` (and `gap`) on its host from either an explicit `widths` array or a `count`. It performs no responsive logic itself beyond the shared `.emr-columns` media-query rule in `emr.css`, which forces a single column under 768px.

**API**
```ts
// Signal-based input() (NOT @Input decorators) — part of the known L1 signal/decorator split
interface EmrColumnsProps {
  count: number;                 // input(), default 2 — used when widths is not set
  widths?: readonly string[];    // input(), optional explicit CSS track sizes, e.g. ['2fr','1fr']
  gap: string;                   // input(), default '16px'
}
// content via <ng-content />, no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| count | `number` | `2` | ignored when `widths` is provided and non-empty |
| widths | `readonly string[] \| undefined` | `undefined` | joined with spaces as `grid-template-columns` |
| gap | `string` | `'16px'` | any valid CSS `gap` value |

**Example**
```html
<emr-columns [widths]="['2fr','1fr','1fr']">
  <emr-card label="Assessment">…</emr-card>
  <emr-card label="Plan">…</emr-card>
  <emr-card label="Follow-up">…</emr-card>
</emr-columns>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally

---

### EmrFieldValueRow
**Layer** L1 · **Selector** `emr-field-value-row` · **Status** stable · **Story** `foundations-layout-primitives--field-value-remarks-notes`

**Need** — Tabular clinical findings (field / value / remarks / notes) recur across assessments and need one aligned four-column row primitive that also degrades gracefully to a stacked, labelled layout on narrow screens.

**Purpose** — Renders one `role="row"` of four `role="cell"` divs (field, value, remarks, notes) as plain strings. It performs no computation, formatting, or clinical value interpretation — `value`/`remarks`/`notes` are opaque display strings supplied by the caller.

**API**
```ts
// Signal-based input() (NOT @Input decorators) — part of the known L1 signal/decorator split
interface EmrFieldValueRowProps {
  field: string;       // input(), default ''
  value: string;        // input(), default ''
  remarks: string;      // input(), default ''
  notes: string;        // input(), default ''
  heading: boolean;      // input(), default false
  placeholder: string;   // input(), default '—'
}
// no outputs
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| field | `string` | `''` | rendered in the styled "field" cell (`.emr-fvr__field`) |
| value | `string` | `''` | when empty and not a heading row, falls back to `placeholder` |
| remarks / notes | `string` | `''` | |
| heading | `boolean` | `false` | renders the styled column-title row and suppresses the placeholder fallback for `value` |
| placeholder | `string` | `'—'` | shown in place of an empty `value` on non-heading rows |

On narrow screens (`max-width: 767px`) each cell renders its `data-label` (Field/Value/Remarks/Notes) as an inline prefix via `::before`, and the dedicated heading row is hidden.

**Example**
```html
<div role="table" aria-label="Clinical findings">
  <emr-field-value-row heading field="Field" value="Value" remarks="Remarks" notes="Notes" />
  <emr-field-value-row field="Intraocular pressure" value="18 mmHg" remarks="Within range" notes="Rechecked at 11:20" />
</div>
```

**Depends on** — L0 tokens only
**Used by** — not consumed internally
