# The field contract — separating meaning, display, and state

Design contract for every capture surface in the library. Amends
`IMPLEMENTATION_PLAN.md`; consumed by `docs/catalog/`.

---

## The problem this solves

The library has **two parallel field models that cannot round-trip**:

| | `EmrGeneratedFieldDefinition` (authoring) | `ClinicalFieldDefinition` (capture) |
|---|---|---|
| validation rules | `readonly FieldValidationRule[]` | absent |
| terminology bindings | `readonly TerminologyBinding[]` | absent |
| UCUM unit | `unitSystem` + `unitCode` | a display-only `unit` string |
| cardinality | `required` + `repeats` | `required` only |
| revision | `revision: number` | absent |

`EmrFieldGeneratorComponent.previewField()` converts the first into the second and
**silently drops `terminologyBindings`, `validationRules`, `instructions`, `unitSystem`,
`unitCode`, `repeats` and `tags`**. The loss is structural, not a bug to patch: the target
type has nowhere to put them.

The consequence is that a field can be *authored* with a SNOMED CT answer value set, a
UCUM unit and a validation rule set, and none of that survives into capture. The authoring
layer writes contracts the capture layer cannot honour.

The second problem is addressing. Every intent today carries a flat `fieldId`. That cannot
express *which instance* of a repeatable group was edited, nor *which cell* of a matrix —
so each container has invented its own ad-hoc identifiers.

---

## The split

A field is three things. Keeping them apart is what makes the model both FHIR-mappable and
re-skinnable.

```ts
// ─────────────────────────────────────────────────────────────
// 1. CONTRACT — what the data MEANS.
//    Stable, serializable, interoperable. Contains no display data.
//    This is the part that maps to FHIR Questionnaire.item.
// ─────────────────────────────────────────────────────────────
export interface EmrFieldContract {
  readonly linkId: string;                 // stable identity; FHIR Questionnaire.item.linkId
  readonly valueType: EmrValueType;
  readonly cardinality: EmrCardinality;    // replaces `required` + `repeats`
  readonly terminology: readonly TerminologyBinding[];
  readonly validation: readonly FieldValidationRule[];
  readonly enableWhen?: readonly EmrEnableWhen[];
  readonly enableBehavior?: 'all' | 'any';
  readonly unit?: EmrUnitBinding;          // UCUM system + code, NOT a display string
  readonly revision?: number;
}

export interface EmrCardinality {
  readonly min: number;                    // 0 = optional, >=1 = required
  readonly max: number | null;             // null = unbounded (repeats)
}

export interface EmrUnitBinding {
  readonly system: string;                 // 'http://unitsofmeasure.org'
  readonly code: string;                   // 'kg', 'mm[Hg]'
}

// ─────────────────────────────────────────────────────────────
// 2. PRESENTATION — how it LOOKS.
//    Freely swappable without changing what the data means.
// ─────────────────────────────────────────────────────────────
export interface EmrFieldPresentation {
  readonly label: string;
  readonly hint?: string;
  readonly instructions?: string;
  readonly placeholder?: string;
  readonly span?: 3 | 4 | 6 | 8 | 9 | 12;
  readonly rows?: number;
  readonly precision?: number;             // display rounding only
  readonly widget?: EmrWidgetHint;
  readonly unitDisplay?: string;           // 'kg' shown to a clinician
  readonly options?: readonly ClinicalOption[];        // display labels for coded answers
  readonly assessmentStatusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly customRendererKey?: string;
}

// One valueType may be rendered several ways. The widget hint chooses; it never
// changes meaning. A 'coded' field is the same data whether shown as a dropdown,
// a radio list, or a search box.
export type EmrWidgetHint =
  | 'input' | 'textarea' | 'select' | 'radio' | 'checkbox'
  | 'chips' | 'likert' | 'search' | 'stepper';

// ─────────────────────────────────────────────────────────────
// 3. STATE — per-instance runtime. Changes on every keystroke.
// ─────────────────────────────────────────────────────────────
export interface EmrFieldState {
  readonly value: ClinicalFieldValue;
  readonly status?: ClinicalAssessmentStatus;   // not assessed / declined / unknown ...
  readonly enabled: boolean;                    // RESOLVED enableWhen — controller computes
  readonly touched?: boolean;
  readonly pending?: boolean;                   // async validation in flight
  readonly messages: readonly EmrValidationMessage[];
}

export interface EmrFieldDefinition {
  readonly contract: EmrFieldContract;
  readonly presentation: EmrFieldPresentation;
}
```

`EmrGeneratedFieldDefinition` and `ClinicalFieldDefinition` both collapse into
`EmrFieldDefinition`. Authoring produces it; capture consumes it; nothing converts, so
nothing is lost.

### Why the split earns its keep

- **FHIR mapping reads only `contract`.** No filtering of presentation fields; no risk of
  a label leaking into a `Questionnaire.item.code`.
- **Re-skinning touches only `presentation`.** The same contract renders as a dropdown on
  desktop and a radio list on mobile. Meaning is unchanged, so the captured data is
  comparable across both.
- **`unit` stops being ambiguous.** `unit: 'kg'` today is simultaneously a UCUM code and a
  display string. Splitting `contract.unit.code` from `presentation.unitDisplay` lets a
  deployment show "kilograms" or "किलोग्राम" while still writing `kg` to the record.
- **`cardinality` replaces two booleans that could contradict.** `required: false` with
  `repeats: true` and a minimum of one entry was previously unrepresentable.

---

## Addressing children

One mechanism for every nested surface.

```ts
export type EmrPathSegment = string | number;   // string = linkId, number = repeat index
export type EmrNodePath = readonly EmrPathSegment[];
```

```ts
['weight']                      // a plain field
['vitals', 'weight']            // a field inside a section
['medications', 2, 'dose']      // the 3rd medication's dose
['acuity', 'iop', 'od']         // a matrix cell: matrix -> row -> column
```

Canonical serialization for map keys and logs — `EmrNodePath` is the wire form, the string
is only ever a derived index key:

```ts
export function serializePath(path: EmrNodePath): string;   // 'medications[2].dose'
export function parsePath(key: string): EmrNodePath;
```

This mirrors FHIR `QuestionnaireResponse`'s nested `linkId` structure, which is the stated
primary template mapping — so the addressing model and the interop model agree by
construction rather than by adapter.

### What it replaces

Every intent gains `path: EmrNodePath` and loses its bespoke identifiers:

| Component | Was | Now |
|---|---|---|
| `EmrClinicalForm` | `fieldId: string` | `path` |
| `EmrRepeatableGroup` | `groupId` + `itemIndex` + `fieldId` | `path` |
| `EmrClinicalMatrix` | `rowId` + `columnId` | `path` |
| `EmrTemplateComposer` | `sectionId` + `placementId` | `path` |

`enableWhen.question` becomes an `EmrNodePath` rather than a flat id, so a rule may
reference a field inside a section or a specific repeat.

---

## Validation

**Rules live on the contract. Evaluation lives in the controller. The UI renders messages
and nothing else.**

```ts
export interface EmrValidationMessage {
  readonly path: EmrNodePath;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly ruleId?: string;          // which FieldValidationRule produced it
  readonly source?: 'mechanical' | 'clinical' | 'terminology' | 'server';
}

export interface EmrValidationPort {
  validate(
    definition: EmrFieldDefinition,
    value: ClinicalFieldValue,
    path: EmrNodePath,
    signal?: AbortSignal,
  ): Promise<readonly EmrValidationMessage[]>;
}
```

The UI does not evaluate a rule — **not even `required`**. It may render a required marker
derived from `cardinality.min > 0`, because that is a display affordance; but the verdict
"this is missing" is a controller message. Native HTML constraint attributes
(`min`, `max`, `maxlength`, `step`, `pattern`) are still emitted so the browser gives
normal input affordances, but they are never the source of a displayed verdict.

The reason is the standing constraint that the UI never infers completion, normality or
safety. Two evaluators would eventually disagree, and in a medical record the disagreement
would be silent.

This replaces the ad-hoc per-component error maps in use today —
`validationErrors: Readonly<Record<string, string>>` on `FieldGeneratorViewModel`, and
similar shapes on the matrix and form view models — with one path-keyed message list.

---

## Terminology binding

`terminology.models.ts` already models this well, with four deliberately separate roles.
The only change is that bindings move onto the shared `contract`, so they reach capture:

| Role | Answers | Typical system | Consumed by |
|---|---|---|---|
| `question-meaning` | what is being asked | LOINC | FHIR mapping, reporting |
| `answer-value-set` | what may be answered | SNOMED CT | **`EmrCodedInput`** |
| `unit` | what unit the value is in | UCUM | `EmrQuantityInput` |
| `classification-mapping` | how it is classified downstream | ICD-10 / ICD-11 | reporting adapters |

`EmrCodedInput` — the component that closes this gap — reads its search scope directly
off the contract:

```ts
const binding = contract.terminology.find(b => b.role === 'answer-value-set');
// binding.valueSetCanonical scopes the controller's TerminologySearchRequest
```

The UI still calls nothing. It emits a search intent carrying the value-set canonical; the
controller owns the endpoint, credentials, edition, version, paging and cancellation.

---

## Declaring what each component needs

The catalogue is where a component's *data* requirements are declared, alongside its
props. `EmrCatalogEntry` gains a `contract` block, machine-checked by `catalog.spec.ts`:

```ts
readonly contract?: {
  readonly valueTypes: readonly EmrValueType[];              // which it can render
  readonly terminologyRoles: readonly TerminologyBindingRole[];  // which it consumes
  readonly validationKinds: readonly FieldValidationRule['kind'][];  // which it displays
  readonly childAddressing: 'none' | 'flat' | 'nested' | 'matrix';
};
```

Worked examples:

```ts
{ id: 'EmrQuantityInputComponent',
  contract: { valueTypes: ['quantity'], terminologyRoles: ['unit'],
              validationKinds: ['minimum','maximum','precision'], childAddressing: 'none' } }

{ id: 'EmrCodedInputComponent',
  contract: { valueTypes: ['coded'], terminologyRoles: ['answer-value-set'],
              validationKinds: ['allowed-values'], childAddressing: 'none' } }

{ id: 'EmrClinicalFormComponent',
  contract: { valueTypes: [/* delegates to EmrTypedField */],
              terminologyRoles: [], validationKinds: [], childAddressing: 'nested' } }

{ id: 'EmrClinicalMatrixComponent',
  contract: { valueTypes: [/* delegates */], terminologyRoles: [],
              validationKinds: [], childAddressing: 'matrix' } }
```

Two assertions make this real rather than decorative:

1. **Coverage** — the union of `valueTypes` across all L1/L2 components must cover every
   member of `EmrValueType`. A value type nothing can render is a gap, and the test names
   it. This is precisely the check that would have caught `coded` and `scale` on the day
   they were authored.
2. **Delegation honesty** — a component declaring `childAddressing: 'nested'` must
   actually accept `EmrNodePath` in its intent union.

---

## Migration

Additive first, so nothing breaks mid-flight.

1. Add `EmrFieldContract` / `EmrFieldPresentation` / `EmrFieldState` / `EmrNodePath` /
   `EmrValidationMessage` to the controller package. Nothing consumes them yet.
2. Add `EmrFieldDefinition` with adapters from both legacy models, and a round-trip test
   proving no field is dropped — the test that `previewField()` would fail today.
3. Migrate `EmrTypedField` to `definition` + `model`, reading contract and presentation.
4. Migrate the containers (`EmrClinicalForm`, `EmrRepeatableGroup`, `EmrClinicalMatrix`)
   to `EmrNodePath` intents.
5. Migrate authoring (`EmrFieldGenerator`, `EmrTemplateComposer`) to emit
   `EmrFieldDefinition` directly; delete the adapters and `previewField()`'s conversion.
6. Delete `EmrGeneratedFieldDefinition` and `ClinicalFieldDefinition`.

Steps 1–2 are Wave 2. Steps 3–6 land with the Wave 2 build, after the Wave 3 restructure.
