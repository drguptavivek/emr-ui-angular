# L6 — Authoring

L6 is the meta-layer: unlike L1–L5, which *consume* controller-supplied clinical data, L6 components *produce* the definitions L2–L5 later consume — a reusable field's identity/type/validation/terminology bindings (`EmrGeneratedFieldDefinition`), and an ordered template of such fields (`EhrTemplateDefinition`). This inversion is why the layer rule ("import your own layer or lower, never upward") lets L6 components reach all the way down to L2 (`EmrFieldGenerator` imports `EmrTypedField` to live-preview a draft field) and to L3 (`EmrTemplatePreview` imports `EmrClinicalForm` to preview a whole template) — an authoring surface legitimately needs to render, read-only, exactly what its output will look like once it becomes real clinical UI. Every L6 component still obeys the controlled-component boundary: no HTTP calls, no persistence, no terminology-server queries, no FHIR construction, no clinical validation execution — those all live behind ports (`TerminologySearchPort`, `FieldDefinitionRepositoryPort`, `TemplateArtifactPort`, `EhrTemplateRepositoryPort`) that a consuming controller implements.

Source: `packages/emr-ui/src/lib/authoring/emr-field-generator.component.ts`, `emr-terminology-search.component.ts`, `emr-validation-rule-editor.component.ts`; `packages/emr-ui/src/lib/authoring/emr-field-library-picker.component.ts`, `emr-template-composer.component.ts`, `emr-template-preview.component.ts`.

---

### EmrFieldGenerator
**Layer** L6 · **Selector** `emr-field-generator` · **Status** stable · **Story** `emr-authoring-field-generator--blank`

**Need** — building a clinical form field-by-field in code (id, label, type, span, unit, validation rules, terminology bindings) is slow and error-prone; a form-based authoring surface that produces a single reusable, versioned field definition — with a live preview of how it will render — lets non-engineers define fields once and reuse them across templates.

**Purpose** — edits an `EmrGeneratedFieldDefinition` draft (identity/display, type/cardinality/layout, quantity unit fields when `type === 'quantity'`, option list when `type === 'select'|'multiselect'`), embeds `EmrValidationRuleEditor` for declarative rules and one `EmrTerminologySearch` per terminology role, and renders a read-only `EmrTypedField` live preview of the current draft. It emits `FieldGeneratorIntent` only. It does NOT save the field, does NOT resolve or call a terminology server itself (it only relays search/select intents), does NOT execute the validation rules it lets a user declare, and does NOT construct FHIR — `savedFieldId`, `validationErrors`, and terminology search results are all controller-supplied.

**API**
```ts
// field-generator.models.ts — quoted verbatim
export type FieldValidationRule =
  | { id: string; kind: 'min-length'; value: number; message?: string }
  | { id: string; kind: 'max-length'; value: number; message?: string }
  | { id: string; kind: 'minimum'; value: number; message?: string }
  | { id: string; kind: 'maximum'; value: number; message?: string }
  | { id: string; kind: 'precision'; value: number; message?: string }
  | { id: string; kind: 'pattern'; value: string; message: string }
  | { id: string; kind: 'earliest-date'; value: string; message?: string }
  | { id: string; kind: 'latest-date'; value: string; message?: string }
  | { id: string; kind: 'allowed-values'; values: readonly string[]; message?: string }
  | { id: string; kind: 'custom'; customValidatorId: string; message: string };

export interface EmrGeneratedFieldDefinition {
  schemaVersion: '1.0';
  id: string;
  revision: number;
  label: string;
  description?: string;
  instructions?: string;
  type: ClinicalFieldType;
  required: boolean;
  repeats: boolean;
  readOnly?: boolean;
  defaultValue?: ClinicalFieldValue;
  placeholder?: string;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  rows?: number;
  precision?: number;
  unit?: string;
  unitSystem?: string;
  unitCode?: string;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  validationRules: readonly FieldValidationRule[];
  terminologyBindings: readonly TerminologyBinding[];
  tags?: readonly string[];
}

export interface FieldGeneratorViewModel {
  draft: EmrGeneratedFieldDefinition;
  sources: readonly TerminologySource[];
  terminologySearches: Readonly<Partial<Record<TerminologyBindingRole, TerminologySearchState>>>;
  validationErrors: Readonly<Record<string, string>>;
  saving: boolean;
  readOnly?: boolean;
  dirty?: boolean;
  error?: string;
  savedFieldId?: string;
}

export type FieldGeneratorIntent =
  | { type: 'draftPatched'; changes: Partial<EmrGeneratedFieldDefinition> }
  | { type: 'validationRuleAdded'; rule: FieldValidationRule }
  | { type: 'validationRuleRemoved'; ruleId: string }
  | { type: 'terminologySearchOpened'; role: TerminologyBindingRole; sourceId: string }
  | { type: 'terminologyQueryChanged'; role: TerminologyBindingRole; query: string }
  | { type: 'terminologySearchRequested'; role: TerminologyBindingRole }
  | { type: 'terminologyPageChanged'; role: TerminologyBindingRole; page: number }
  | { type: 'terminologyRetryRequested'; role: TerminologyBindingRole }
  | { type: 'terminologyConceptSelected'; role: TerminologyBindingRole; concept: TerminologyConcept; strength?: TerminologyBindingStrength; mappingRelationship?: TerminologyMappingRelationship }
  | { type: 'terminologyBindingRemoved'; bindingId: string }
  | { type: 'saveRequested' }
  | { type: 'resetRequested'; draft: EmrGeneratedFieldDefinition };

@Component({ selector: 'emr-field-generator', standalone: true })
export class EmrFieldGeneratorComponent {
  @Input({ required: true }) model!: FieldGeneratorViewModel;
  @Input() set readOnly(value: boolean); get readOnly(): boolean; // OR'd with model.readOnly
  @Input() headingId = 'emr-field-generator-heading';
  @Output() readonly intent = new EventEmitter<FieldGeneratorIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `FieldGeneratorViewModel` (required) | — | Draft field + terminology sources/search state + validation errors + save state |
| `readOnly` | `boolean` (setter) | `false` | Effective value is `explicitReadOnly \|\| model.readOnly` |
| `headingId` | `string` | `'emr-field-generator-heading'` | Prefixed onto every generated control id and terminology-search heading id |

**Example**
```html
<emr-field-generator [model]="fieldDraftViewModel" (intent)="onFieldGeneratorIntent($event)" />
```

**Composition** — renders `EmrTypedFieldComponent` (L2, read-only live preview of `previewField()`), `EmrTerminologySearchComponent` (L6, one instance per `TerminologyBindingRole`: `question-meaning`, `answer-value-set`, `unit`, `classification-mapping`), and `EmrValidationRuleEditorComponent` (L6, one instance for `draft.validationRules`). This is the deepest cross-layer reach in the catalogue: L6 → L2 for the preview, plus two L6 → L6 edges.

**Depends on** — `EmrTypedFieldComponent` (L2), `EmrTerminologySearchComponent` (L6), `EmrValidationRuleEditorComponent` (L6). Verified: `emr-field-generator -> emr-typed-field(L2), emr-terminology-search(L6), emr-validation-rule-editor(L6)`.
**Used by** — none in the verified intra-UI import graph (top-level authoring entry point).

---

### EmrTerminologySearch
**Layer** L6 · **Selector** `emr-terminology-search` · **Status** stable · **Story** none — coverage gap

**Need** — binding a field to LOINC/SNOMED CT/ICD-10/ICD-11/UCUM concepts requires searching a controller-chosen source, paging results, showing loading/error/empty states, and letting the user set binding strength (and, for classification mappings, a mapping relationship) — one reusable search-and-bind widget instead of one per terminology role.

**Purpose** — renders a source picker, a search box + button, paged results, and the currently attached `bindings` for one `TerminologyBindingRole`. Selecting a result or changing strength/relationship emits `terminologyConceptSelected`; it never calls a terminology API itself (`TerminologySearchPort` lives in the controller) and never interprets a concept's meaning.

**API**
```ts
// terminology.models.ts — quoted verbatim
export type TerminologyKind = 'loinc' | 'snomed-ct' | 'icd-10' | 'icd-11' | 'ucum' | 'custom';
export type TerminologyBindingRole = 'question-meaning' | 'answer-value-set' | 'unit' | 'classification-mapping';
export type TerminologyBindingStrength = 'required' | 'extensible' | 'preferred' | 'example';
export type TerminologyMappingRelationship = 'equivalent' | 'wider' | 'narrower' | 'related-to';

export interface TerminologySource {
  id: string; kind: TerminologyKind; label: string; available: boolean;
  supportsPagination?: boolean; versionLabel?: string; language?: string; jurisdiction?: string;
}

export interface TerminologyConcept {
  sourceId: string; system: string; code: string; display: string; version?: string;
  canonicalUri?: string; releaseUri?: string; language?: string;
  designations?: readonly string[]; active?: boolean; providerMetadata?: Readonly<Record<string, string>>;
}

export interface TerminologyBinding {
  id: string; role: TerminologyBindingRole; concept?: TerminologyConcept;
  valueSetCanonical?: string; strength?: TerminologyBindingStrength;
  mappingRelationship?: TerminologyMappingRelationship; note?: string;
}

export interface TerminologySearchState {
  sourceId: string; role: TerminologyBindingRole; query: string;
  options: readonly TerminologyConcept[]; page: number; pageSize: number; total: number;
  loading: boolean; error?: string;
}

@Component({ selector: 'emr-terminology-search', standalone: true })
export class EmrTerminologySearchComponent {
  @Input({ required: true }) role!: TerminologyBindingRole;
  @Input() sources: readonly TerminologySource[] = [];
  @Input() state?: TerminologySearchState;
  @Input() bindings: readonly TerminologyBinding[] = [];
  @Input() readOnly = false;
  @Input() headingId = 'emr-terminology-heading';
  @Output() readonly intent = new EventEmitter<FieldGeneratorIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `role` | `TerminologyBindingRole` (required) | — | Which of the four binding roles this instance edits |
| `sources` | `readonly TerminologySource[]` | `[]` | Options for the source `<select>`; unavailable sources render disabled |
| `state` | `TerminologySearchState?` | — | Current query/results/paging/loading/error for this role |
| `bindings` | `readonly TerminologyBinding[]` | `[]` | Already-attached bindings for this role, rendered below the results |
| `readOnly` | `boolean` | `false` | Disables search, selection, and binding controls |
| `headingId` | `string` | `'emr-terminology-heading'` | Prefixes generated control ids |

**Example**
```html
<emr-terminology-search role="question-meaning" [sources]="loincAndSnomedSources"
  [state]="model.terminologySearches['question-meaning']" [bindings]="questionMeaningBindings"
  (intent)="onFieldGeneratorIntent($event)" />
```

**Known structural limitation** — `@Output() readonly intent = new EventEmitter<FieldGeneratorIntent>()`. Every event this component emits is typed as a `FieldGeneratorIntent`, a union defined in `field-generator.models.ts` specifically for `EmrFieldGenerator`'s draft-editing workflow. That makes `EmrTerminologySearchComponent` structurally unusable as a standalone terminology-binding widget outside `EmrFieldGenerator` — any other consumer wanting a generic "search and bind a concept" component (e.g. binding terminology directly onto a `ClinicalMatrixSchema` row, or onto an `EhrTemplateSection`) would have to either adopt `FieldGeneratorIntent` regardless of relevance, or the component would need a generic intent type extracted. This is a real architectural coupling, not a naming quirk.

**Composition** — renders no other catalogued component; pure template + native controls.

**Depends on** — none.
**Used by** — `EmrFieldGenerator` (L6, verified: `emr-field-generator -> emr-terminology-search`).

---

### EmrValidationRuleEditor
**Layer** L6 · **Selector** `emr-validation-rule-editor` · **Status** stable · **Story** none — coverage gap

**Need** — a field's declarative validation (min/max length, numeric bounds, precision, regex pattern, date bounds, allowed values, or a named custom validator) needs one small, reusable add/remove editor rather than ten separate ad-hoc inputs wherever validation rules are authored.

**Purpose** — lets the user pick a `FieldValidationRule['kind']`, fill in the kind-appropriate value control (number, date, regex text, comma-separated list, or a custom-validator id + required message), and add or remove rules from the list. It emits `validationRuleAdded` / `validationRuleRemoved` only, and explicitly does not execute any rule — the in-template note for `kind: 'custom'` states this directly: "The controller resolves this validator ID. The UI does not execute clinical validation."

**API**
```ts
// field-generator.models.ts
export type FieldValidationRule =
  | { id: string; kind: 'min-length'; value: number; message?: string }
  | { id: string; kind: 'max-length'; value: number; message?: string }
  | { id: string; kind: 'minimum'; value: number; message?: string }
  | { id: string; kind: 'maximum'; value: number; message?: string }
  | { id: string; kind: 'precision'; value: number; message?: string }
  | { id: string; kind: 'pattern'; value: string; message: string }
  | { id: string; kind: 'earliest-date'; value: string; message?: string }
  | { id: string; kind: 'latest-date'; value: string; message?: string }
  | { id: string; kind: 'allowed-values'; values: readonly string[]; message?: string }
  | { id: string; kind: 'custom'; customValidatorId: string; message: string };

@Component({ selector: 'emr-validation-rule-editor', standalone: true })
export class EmrValidationRuleEditorComponent {
  @Input() rules: readonly FieldValidationRule[] = [];
  @Input() readOnly = false;
  @Input() idPrefix = 'emr-validation';
  @Output() readonly intent = new EventEmitter<FieldGeneratorIntent>();
  readonly ruleKinds: readonly RuleKind[] =
    ['min-length', 'max-length', 'minimum', 'maximum', 'precision', 'pattern', 'earliest-date', 'latest-date', 'allowed-values', 'custom'];
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `rules` | `readonly FieldValidationRule[]` | `[]` | Currently attached rules, rendered below the add form |
| `readOnly` | `boolean` | `false` | Disables the add form and every Remove button |
| `idPrefix` | `string` | `'emr-validation'` | Prefixes generated control ids |

**Example**
```html
<emr-validation-rule-editor [rules]="draft.validationRules" [idPrefix]="'field-a-validation'"
  (intent)="onFieldGeneratorIntent($event)" />
```

**Note** — like `EmrTerminologySearch`, this component's `intent` output is typed as `FieldGeneratorIntent`, the same coupling to `EmrFieldGenerator`'s workflow (it only ever emits the two `validationRule*` members of that union, but the declared type is the whole union).

**Composition** — renders no other catalogued component; pure template + native controls.

**Depends on** — none.
**Used by** — `EmrFieldGenerator` (L6, verified: `emr-field-generator -> emr-validation-rule-editor`).

---

### EmrFieldLibraryPicker
**Layer** L6 · **Selector** `emr-field-library-picker` · **Status** stable · **Story** none — coverage gap

**Need** — composing an EHR template means repeatedly finding an already-authored, revision-pinned field (produced by `EmrFieldGenerator`) and dropping it into the currently selected template section — a searchable catalogue browser is the natural UI for that, distinct from authoring a new field.

**Purpose** — renders a search box over `fields` (the controller-filtered field library) and a scrollable list of `EmrGeneratedFieldDefinition` summaries (label, type, required/repeatable flags, description, terminology-binding summary); clicking "Add" on an item emits `fieldAdded` for `selectedSectionId`. It does NOT filter the list itself (the `query` input and `fieldLibraryQueryChanged` output round-trip through the controller), does NOT choose a section, and does NOT mint a placement id — `placementId: ''` is emitted and the controller assigns the real id.

**API**
```ts
import type { EhrTemplateIntent, EmrGeneratedFieldDefinition } from '@drguptavivek/emr-controller';

@Component({ selector: 'emr-field-library-picker', standalone: true })
export class EmrFieldLibraryPickerComponent {
  @Input() fields: readonly EmrGeneratedFieldDefinition[] = [];
  @Input() query = '';
  @Input() selectedSectionId?: string;
  @Input() readOnly = false;
  @Input() headingId = 'emr-field-library-heading';
  @Output() readonly intent = new EventEmitter<EhrTemplateIntent>();

  add(field: EmrGeneratedFieldDefinition): void {
    if (this.readOnly || !this.selectedSectionId) return;
    this.intent.emit({ type: 'fieldAdded', sectionId: this.selectedSectionId, field, placementId: '' });
  }
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `fields` | `readonly EmrGeneratedFieldDefinition[]` | `[]` | Controller-filtered/searched field library |
| `query` | `string` | `''` | Current search text (round-trips via `fieldLibraryQueryChanged`) |
| `selectedSectionId` | `string?` | — | When unset, an inline note asks the user to select a section first; Add buttons stay disabled |
| `readOnly` | `boolean` | `false` | Disables search input and every Add button |
| `headingId` | `string` | `'emr-field-library-heading'` | Prefixes generated control ids |

**Example**
```html
<emr-field-library-picker [fields]="model.fieldLibrary" [query]="model.fieldLibraryQuery"
  [selectedSectionId]="model.selectedSectionId" (intent)="onTemplateIntent($event)" />
```

**Composition** — renders no other catalogued component; pure template + native controls.

**Depends on** — none.
**Used by** — `EmrTemplateComposer` (L6, verified: `emr-template-composer -> emr-field-library-picker`).

---

### EmrTemplateComposer
**Layer** L6 · **Selector** `emr-template-composer` · **Status** stable · **Story** `emr-templates-composer--multi-section-general-examination`

**Need** — assembling a reusable EHR template (e.g. "General physical examination") means naming/ordering sections and, within each section, adding/ordering/removing field placements pulled from the field library — with a live preview and FHIR/JSON export/import alongside, all without the UI owning persistence or FHIR mapping.

**Purpose** — edits `EhrTemplateDefinition` metadata (title/description/locale/status), manages the section list (add/select/reorder/remove) and, for the selected section, its field placements (reorder/remove; adding happens through the embedded field-library picker), and hosts the live preview + artifact import/export panel. It emits `EhrTemplateIntent` only; it never persists the template, never serializes/deserializes FHIR itself, and treats an import as inert until the controller returns `importIssues` and the user explicitly emits `importAccepted` — "Invalid imports do not mutate the template" per the architecture docs.

**API**
```ts
// ehr-template.models.ts — quoted verbatim
export type EhrTemplateStatus = 'draft' | 'active' | 'retired';
export type TemplateArtifactFormat =
  | 'internal-json' | 'fhir-r4-questionnaire' | 'fhir-r4-bundle' | 'fhir-r4b-questionnaire' | 'fhir-r5-questionnaire';

export interface EhrTemplateFieldPlacement {
  id: string;
  sourceFieldId: string;
  sourceFieldRevision: number;
  field: EmrGeneratedFieldDefinition;
}

export interface EhrTemplateSection {
  id: string;
  label: string;
  description?: string;
  fields: readonly EhrTemplateFieldPlacement[];
}

export interface EhrTemplateDefinition {
  schemaVersion: '1.0';
  id: string;
  revision: number;
  title: string;
  description?: string;
  locale: string;
  status: EhrTemplateStatus;
  sections: readonly EhrTemplateSection[];
}

export interface EhrTemplateViewModel {
  template: EhrTemplateDefinition;
  fieldLibrary: readonly EmrGeneratedFieldDefinition[];
  fieldLibraryQuery: string;
  selectedSectionId?: string;
  selectedPlacementId?: string;
  preview: ClinicalFormViewModel;
  artifact?: TemplateArtifactResult;
  importIssues?: readonly TemplateArtifactIssue[];
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  readOnly?: boolean;
  error?: string;
  concurrencyToken?: string;
}

export type EhrTemplateIntent =
  | { type: 'templatePatched'; changes: Pick<Partial<EhrTemplateDefinition>, 'title' | 'description' | 'locale' | 'status'> }
  | { type: 'fieldLibraryQueryChanged'; query: string }
  | { type: 'sectionSelected'; sectionId: string }
  | { type: 'sectionAdded'; section: EhrTemplateSection }
  | { type: 'sectionPatched'; sectionId: string; changes: Pick<Partial<EhrTemplateSection>, 'label' | 'description'> }
  | { type: 'sectionMoved'; sectionId: string; direction: 'up' | 'down' }
  | { type: 'sectionRemoved'; sectionId: string }
  | { type: 'fieldAdded'; sectionId: string; field: EmrGeneratedFieldDefinition; placementId: string }
  | { type: 'fieldMoved'; sectionId: string; placementId: string; direction: 'up' | 'down' }
  | { type: 'fieldRemoved'; sectionId: string; placementId: string }
  | { type: 'artifactExportRequested'; format: TemplateArtifactFormat }
  | { type: 'artifactImportRequested'; format: TemplateArtifactFormat; serialized: string }
  | { type: 'importAccepted' }
  | { type: 'saveRequested' };

@Component({ selector: 'emr-template-composer', standalone: true })
export class EmrTemplateComposerComponent {
  @Input({ required: true }) model!: EhrTemplateViewModel;
  @Input() set readOnly(value: boolean); get readOnly(): boolean;
  @Input() headingId = 'emr-template-composer-heading';
  @Output() readonly intent = new EventEmitter<EhrTemplateIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `EhrTemplateViewModel` (required) | — | Template + field library + selection + live preview + artifact/import state |
| `readOnly` | `boolean` (setter) | `false` | Effective value is `explicitReadOnly \|\| model.readOnly`; `sectionSelected` intents still pass through even when read-only |
| `headingId` | `string` | `'emr-template-composer-heading'` | Prefixes every generated control id, including those of its two child components |

**Example**
```html
<emr-template-composer [model]="templateViewModel" (intent)="onTemplateIntent($event)" />
```

**Composition** — renders `EmrFieldLibraryPickerComponent` (L6) in its sidebar and `EmrTemplatePreviewComponent` (L6) at the bottom of its main column; both receive `(intent)="emit($event)"`, so all three components share one intent stream typed as `EhrTemplateIntent`.

**Depends on** — `EmrFieldLibraryPickerComponent` (L6), `EmrTemplatePreviewComponent` (L6). Verified: `emr-template-composer -> emr-field-library-picker(L6), emr-template-preview(L6)`.
**Used by** — none in the verified intra-UI import graph (top-level authoring entry point).

---

### EmrTemplatePreview
**Layer** L6 · **Selector** `emr-template-preview` · **Status** stable · **Story** `emr-templates-composer--preview`

**Need** — while composing a template, authors need to see it rendered exactly as a real clinical form would (an actual `EmrClinicalForm` with empty/default values), plus a way to trigger and review controller-produced FHIR/JSON export and paste-in import — kept as a distinct concern from section/field editing so `EmrTemplateComposer` can also be used headless (e.g. `Preview` story renders it standalone).

**Purpose** — builds a value-empty `ClinicalFormViewModel` preview (`model.preview`, supplied by the controller) and renders it through `EmrClinicalForm`; separately renders a format picker, an Export button, a serialized-payload textarea usable for both showing export output and pasting import input, an Import button, and — only once `model.importIssues` exist with no `error`-severity issue — an explicit "Accept import" button. It never performs the FHIR conversion itself; `artifactExportRequested`/`artifactImportRequested` are dispatched to the controller-supplied `TemplateArtifactPort`, and the resulting `model.artifact`/`model.importIssues` are rendered as-is, including any `warning`/`error`-severity issues.

**API**
```ts
// ehr-template.models.ts
export interface TemplateArtifactIssue {
  severity: 'information' | 'warning' | 'error';
  code: string;
  message: string;
  path?: string;
}

export interface TemplateArtifactResult {
  format: TemplateArtifactFormat;
  fhirVersion?: '4.0.1' | '4.3.0' | '5.0.0';
  serialized: string;
  issues: readonly TemplateArtifactIssue[];
}

@Component({ selector: 'emr-template-preview', standalone: true })
export class EmrTemplatePreviewComponent {
  @Input({ required: true }) model!: EhrTemplateViewModel;
  @Input() set readOnly(value: boolean); get readOnly(): boolean;
  @Input() headingId = 'emr-template-preview-heading';
  @Output() readonly intent = new EventEmitter<EhrTemplateIntent>();
  format: TemplateArtifactFormat = 'fhir-r4-questionnaire';
  serialized = '';
  canAcceptImport(): boolean {
    return !!this.model.importIssues?.length && !this.model.importIssues.some(issue => issue.severity === 'error');
  }
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `EhrTemplateViewModel` (required) | — | Same view model as `EmrTemplateComposer`; only `template`, `preview`, `artifact`, `importIssues`, `loading`, `error` are read here |
| `readOnly` | `boolean` (setter) | `false` | Effective value is `explicitReadOnly \|\| model.readOnly` |
| `headingId` | `string` | `'emr-template-preview-heading'` | Prefixes `artifactHeadingId()`/`formatId()`/`serializedId()` and the forwarded `idPrefix` on `emr-clinical-form` |

**Example**
```html
<emr-template-preview [model]="templateViewModel" (intent)="onTemplateIntent($event)" />
```

**Composition** — renders `EmrClinicalFormComponent` (L3) against `model.preview`, with `idPrefix` set to its own `headingId` so control ids stay unique from any sibling `emr-clinical-form` on the page. This is the L6 → L3 edge that lets an author see the real capture-layer rendering of an in-progress template.

**Depends on** — `EmrClinicalFormComponent` (L3). Verified: `emr-template-preview -> emr-clinical-form(L3)`.
**Used by** — `EmrTemplateComposer` (L6, verified: `emr-template-composer -> emr-template-preview`).
