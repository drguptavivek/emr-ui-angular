# EMR component API conventions

Binding contract for every component in `@drguptavivek/emr-ui`. Enforced by
`packages/emr-ui/src/lib/catalog.spec.ts`; violations fail `pnpm test`.

The library's architecture is *controlled components*: a component renders an immutable
view model and emits typed intents. It never owns domain state. Every rule below follows
from that single premise — where a name implies ownership, it is wrong.

---

## 1. Inputs

### 1.1 The view model is always `model`

```ts
@Input({ required: true }) model!: TViewModel;
```

One name, every layer. `model` is the immutable snapshot the component renders.

Retired names and their replacements:

| Was | Now | Components affected |
|---|---|---|
| `state` | `model` | PatientList, FavouritesPanel, HierarchyOrderPicker, DocumentUploadQueue, PatientDocuments |
| `view` | `model` | DocumentViewer, PacChecklist, StagedChecklist |
| `patient` | `model` | PatientBanner |
| `order` | `model` | OrderDetails |
| `result` | `model` | DiagnosticResultSummary |

`state` was rejected because it implies the component owns the data, which is exactly what
this architecture forbids. Domain-specific names (`patient`, `order`, `result`) hide the
shared pattern and do not scale.

### 1.2 Schema-driven components take `definition` + `model`

Where a component is driven by a *shape* as well as *data*, the two are separate inputs.
Definitions are typically static; values change on every keystroke. Folding them together
would force controllers to rebuild the whole object per edit.

```ts
@Input({ required: true }) definition!: TDefinition;   // what fields exist
@Input()                   model?: TValues;            // what has been entered
```

| Component | Was | Now |
|---|---|---|
| `EmrClinicalMatrix` | `schema` + `values` | `definition` + `model` |
| `EmrTypedField` | `field` + `state` | `definition` + `model` |
| `EmrRepeatableGroup` | `group` + `items` | `definition` + `model` |

### 1.3 Identity inputs — exactly three, each with a distinct job

| Name | Use | Layer |
|---|---|---|
| `controlId` | the id of the one form control the component renders | L1, L2 |
| `headingId` | the id of the component's region heading, for `aria-labelledby` | L3, L4, L6 |
| `idPrefix` | namespace for a component that generates many ids | any |

Retired: `inputId` → `controlId`; `titleId` → `headingId`; `detailsId` → derived from `idPrefix`.

### 1.4 Boolean state

| Name | Meaning | Where |
|---|---|---|
| `readOnly` | value is visible but not editable | L1/L2 as a plain input; L3/L4/L6 as a field on `model` |
| `disabled` | control is inoperable | **L1/L2 only** |
| `required` | value must be supplied | L1/L2 only |

`readOnly` must never be both an input and a model field on the same component. The
setter-OR'd-with-model pattern in `EmrFieldGenerator`, `EmrTemplateComposer` and
`EmrTemplatePreview` is retired: at L6 it lives on `model` alone.

`disabled` is forbidden above L2. A controlled component's operability is a property of
its view model, not a separate binding that can contradict it.

---

## 2. Outputs

### 2.1 L3, L4 and L6 emit exactly one `intent`

```ts
@Output() readonly intent = new EventEmitter<TIntent>();
```

Every user action becomes a member of one discriminated union. Adding an interaction
means adding a union member, not a new output — so a consumer's `(intent)` handler keeps
compiling and the controller stays the single place that decides what an action means.

Retired ad-hoc outputs, folded into their component's intent union:

| Component | Was | Becomes intent member |
|---|---|---|
| `EmrClinicalList` (+4 domain lists) | `action` | `ClinicalListIntent` |
| `EmrOrderDetails` | `detailChanged`, `removeRequested` | `OrderDetailsIntent` |
| `EmrTimeline` | `eventSelected` | `TimelineIntent` |
| `EmrPatientBanner` | `expandedChangeRequested` | `PatientBannerIntent` |
| `EmrLeftNav` | `collapseToggled`, `itemSelected`, `itemExpansionRequested` | `LeftNavIntent` |
| `EmrRightFlyout` | `closeRequested`, `backRequested` | `RightFlyoutIntent` |
| `EmrSectionCard` | `toggleRequested` | `SectionCardIntent` |
| `EmrAppShell` | — (none today) | `AppShellIntent` when it gains one |

Application chrome (shell, nav, flyout) is included deliberately: it is controlled by the
same contract, and exempting it would leave the rule with an arbitrary boundary.

### 2.2 L1 and L2 primitives keep native change outputs

```ts
@Output() readonly valueChange = new EventEmitter<T>();
```

Primitives are mechanical controls, not workflow surfaces. Angular's two-way binding
sugar `[(value)]` requires the `<prop>Change` name, so this is a technical requirement
rather than a stylistic exception. Applies to `valueChange`, `checkedChange`,
`unitChange`, `firstValueChange`, `secondValueChange`, `statusChange`.

### 2.3 Event naming — tense carries meaning

| Suffix | Meaning | Example |
|---|---|---|
| `<prop>Change` | this value changed; partner for `[(prop)]` | `valueChange`, `unitChange` |
| past tense verb | a DOM event passed through unchanged | `clicked`, `blurred`, `focused` |
| `native<Thing>` | a non-serializable browser object escaping the intent channel | `nativeFilesSelected` |

Retired: the `-Changed` past-tense form (`tabChanged`, `queryChanged`, `detailChanged`)
and the `-Toggled` / `-Selected` forms at L3+. `-Requested` disappears as an output suffix
because that meaning now lives inside intent union members, where it belongs.

`EmrSearchSelect` is the one L1 component with a rich interaction surface
(`queryChanged`, `searchRequested`, `openRequested`, `closeRequested`, `optionSelected`,
`removeRequested`). It keeps named outputs: it sits below the intent layer and its
consumers are other primitives. `queryChanged` is renamed `queryChange` for tense
consistency.

### 2.4 Sanctioned escape hatches

Two outputs deliberately bypass `intent` because they carry objects that cannot live in a
serializable union:

| Output | Payload | Why |
|---|---|---|
| `nativeFilesSelected` | `readonly File[]` | `File` is a live browser handle |
| `nativeTriggerElement` | `HTMLElement` | focus-return origin, transient UI concern |

`previewTrigger` on `EmrPatientDocuments` is renamed `nativeTriggerElement`. Any future
escape hatch must use the `native` prefix and be justified in the catalogue entry.

---

## 3. Declaration style

All components use Angular signal `input()` / `output()`. At the time of writing only
four do (`EmrSeparator`, `EmrCard`, `EmrColumns`, `EmrFieldValueRow`, `EmrSectionCard`,
`EmrFieldFrame`); the remainder use decorators and are migrated in the same pass as the
renames above.

`architecture.spec.ts` currently detects only `@Output()` when checking that interactive
components expose an output, and carries an exclusion list to work around that. The check
must recognise `output()` and the exclusion list must be deleted rather than extended.

---

## 4. Quick reference

```ts
// L3 / L4 / L6 — a controlled workflow surface
@Input({ required: true }) model!: TViewModel;
@Input() headingId?: string;
@Output() readonly intent = new EventEmitter<TIntent>();

// L3 — schema-driven
@Input({ required: true }) definition!: TDefinition;
@Input() model?: TValues;
@Output() readonly intent = new EventEmitter<TIntent>();

// L1 / L2 — a mechanical control
@Input() controlId?: string;
@Input() value: T | null = null;
@Input() readOnly = false;
@Input() disabled = false;
@Output() readonly valueChange = new EventEmitter<T | null>();
```
