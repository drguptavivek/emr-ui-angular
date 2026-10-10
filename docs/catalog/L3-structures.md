# L3 — Structures

L3 is the schema-driven container layer: it turns a controller-supplied schema (`ClinicalFormSchema`, `ClinicalMatrixSchema`, a plain `ClinicalListItem[]`) plus its matching state view model into a rendered, interactive surface, and emits typed intents rather than mutating anything. L3 components render L2 fields and L1 primitives; they never talk to each other except where explicitly noted below, and none of them perform HTTP calls, persistence, clinical validation, or completion/normality/safety inference. Clinical states (`not-assessed` / `unable-to-assess` / `not-applicable` / `declined` / `unknown`) are passed through verbatim from `ClinicalAssessmentStatus` — never collapsed to booleans or empty strings.

Source: `packages/emr-ui/src/lib/structures/emr-section-card.component.ts`, `emr-repeatable-group.component.ts`, `emr-clinical-form.component.ts`, `emr-clinical-list.component.ts`, `emr-clinical-matrix.component.ts`.

---

### EmrSectionCard
**Layer** L3 · **Selector** `emr-section-card` · **Status** stable · **Story** none — coverage gap

**Need** — every schema section (in a clinical form, a template preview, a domain form) needs the same collapsible-header treatment: heading, optional description, a controller-supplied status badge, and an optional show/hide toggle — without each caller re-implementing `aria-expanded`/`aria-controls` wiring.

**Purpose** — renders a `<section>` with a heading, optional description, an `EmrBadge`-driven status chip, and (when `collapsible()` is true) a toggle button that emits `toggleRequested`; content is projected via `<ng-content/>` and hidden entirely (not just visually) when `collapsed()` is true. It does NOT decide which sections exist, does NOT track collapsed state itself (state is a controller-supplied input, echoed back only as an intent request), and does NOT interpret the status badge's tone/label — those are opaque controller-supplied values.

**API**
```ts
import type { EmrBadge } from '@drguptavivek/emr-controller';
// EmrBadge = { label: string; tone: EmrTone; assistiveText?: string }

@Component({ selector: 'emr-section-card', standalone: true })
export class EmrSectionCardComponent {
  readonly sectionId = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly status = input<EmrBadge>();
  readonly collapsible = input(false);
  readonly collapsed = input(false);
  readonly toggleRequested = output<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `sectionId` | `string` (required) | — | Used to derive `headingId()`/`contentId()` for `aria-labelledby`/`aria-controls` |
| `label` | `string` (required) | — | Section heading text |
| `description` | `string?` | — | Optional subheading paragraph |
| `status` | `EmrBadge?` | — | Rendered as `<emr-badge [tone]>` next to the heading |
| `collapsible` | `boolean` | `false` | Shows the Show/Hide toggle button |
| `collapsed` | `boolean` | `false` | Controller-owned; the component only requests a toggle, never flips this itself |

**Example**
```html
<emr-section-card sectionId="hpi" label="History of present illness" [collapsible]="true"
  [collapsed]="isCollapsed" [status]="{ label: 'Complete', tone: 'success' }"
  (toggleRequested)="onToggle('hpi')">
  <!-- projected fields -->
</emr-section-card>
```

**Composition** — renders `EmrBadgeComponent` (L1) for the status chip; renders no other component. It is the smallest structural building block above L2.

**Depends on** — `EmrBadgeComponent` (L1, verified: `emr-section-card -> emr-feedback(Badge)`).
**Used by** — `EmrClinicalForm` (L3, same layer).

---

### EmrRepeatableGroup
**Layer** L3 · **Selector** `emr-repeatable-group` · **Status** stable · **Story** none — coverage gap

**Need** — repeating clinical entries (medications taken, prior surgeries, family conditions) need a controller-driven add/remove list of field-sets sharing one field schema, rendered and keyed by a stable item id — without the controller re-deriving per-item control ids or DOM structure.

**Purpose** — renders a heading + "Add" button for a `RepeatableGroupDefinition`, then one `<article>` per `RepeatableItemState` containing one `EmrTypedField` per `group.fields` entry, plus a per-item "Remove" button. It emits `repeatItemAddRequested` / `repeatItemRemoveRequested` / `repeatItemEditRequested` / `repeatItemStatusEditRequested` / `fieldFocused` — it never adds, removes, or edits an item itself; the controller supplies the next `items` array.

**API**
```ts
import type {
  ClinicalFieldDefinition, ClinicalFieldState, ClinicalFieldValue,
  RepeatableGroupDefinition, RepeatableItemState, ClinicalFormIntent,
} from '@drguptavivek/emr-controller';

export interface RepeatableGroupDefinition {
  kind: 'repeatable';
  id: string;
  label: string;
  description?: string;
  addLabel?: string;
  fields: readonly ClinicalFieldDefinition[];
}

export interface RepeatableItemState {
  id: string;
  label?: string;
  fields: Readonly<Record<string, ClinicalFieldState>>;
  readOnly?: boolean;
}

@Component({ selector: 'emr-repeatable-group', standalone: true })
export class EmrRepeatableGroupComponent {
  @Input({ required: true }) group!: RepeatableGroupDefinition;
  @Input() items: readonly RepeatableItemState[] = [];
  @Input() readOnly = false;
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly intent = new EventEmitter<ClinicalFormIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `group` | `RepeatableGroupDefinition` (required) | — | Field schema shared by every item |
| `items` | `readonly RepeatableItemState[]` | `[]` | One rendered `<article>` per item; `@empty` shows "No entries recorded." |
| `readOnly` | `boolean` | `false` | Disables Add/Remove and passes `readOnly` into every `emr-typed-field` |
| `customTemplates` | `Record<string, TemplateRef<EmrCustomFieldContext>>` | `{}` | Forwarded to each `emr-typed-field` for `type: 'custom'` fields |

**Example**
```html
<emr-repeatable-group [group]="pastSurgeriesGroup" [items]="pastSurgeryItems"
  (intent)="onFormIntent($event)" />
```

**Composition** — renders one `EmrTypedFieldComponent` (L2) per field per item; owns no lower-layer container of its own.

**Known gap** — `EmrClinicalForm` (below) implements repeatable-block rendering **inline**, duplicating this component's add/remove/field-loop logic, rather than delegating to `EmrRepeatableGroup`. The verified import graph confirms `emr-clinical-form -> emr-typed-field` directly, with no edge to `emr-repeatable-group`. `EmrRepeatableGroup` therefore has no current consumer in this catalogue's component graph even though it is public API — a duplication/consolidation opportunity, not a bug.

**Depends on** — `EmrTypedFieldComponent` (L2, verified: `emr-repeatable-group -> emr-typed-field`).
**Used by** — none in the verified component graph (public API only; see gap note above).

---

### EmrClinicalForm
**Layer** L3 · **Selector** `emr-clinical-form` · **Status** stable · **Story** `emr-clinical-forms-history--history`

**Need** — most clinical documentation (history, system examinations, PAC checklist forms, EHR template previews) is a set of labelled sections, each containing simple fields and/or repeatable field-sets, defined once as data and rendered/edited generically rather than as bespoke Angular classes per specialty form.

**Purpose** — renders `model.schema.sections` as `EmrSectionCard`s, and within each section renders `section.blocks` — either a plain `ClinicalFieldDefinition` (via `EmrTypedField`) or a `RepeatableGroupDefinition` block (rendered inline, see gap note above) — on a 12-column grid keyed by each block's `span`. It emits the full `ClinicalFormIntent` union and never calls HTTP, persists, clinically validates, or infers completion/normality/safety; section collapse state, section status badges, and every field's `assessmentStatus` are controller-supplied and echoed back untouched.

**API**
```ts
// clinical-form.models.ts — quoted verbatim
export interface RepeatableGroupDefinition {
  kind: 'repeatable';
  id: string;
  label: string;
  description?: string;
  addLabel?: string;
  fields: readonly ClinicalFieldDefinition[];
}

export type ClinicalFormBlock = ClinicalFieldDefinition | RepeatableGroupDefinition;

export interface ClinicalFormSection {
  id: string;
  label: string;
  description?: string;
  collapsible?: boolean;
  blocks: readonly ClinicalFormBlock[];
}

export interface ClinicalFormSchema {
  id: string;
  label: string;
  description?: string;
  sections: readonly ClinicalFormSection[];
}

export interface ClinicalFormViewModel {
  schema: ClinicalFormSchema;
  fields: Readonly<Record<string, ClinicalFieldState>>;
  repeatableGroups: Readonly<Record<string, readonly RepeatableItemState[]>>;
  collapsedSectionIds?: readonly string[];
  sectionStatuses?: Readonly<Record<string, EmrBadge>>;
  readOnly?: boolean;
}

export type ClinicalFormIntent =
  | { type: 'fieldEditRequested'; fieldId: string; value: ClinicalFieldValue }
  | { type: 'fieldStatusEditRequested'; fieldId: string; status: ClinicalAssessmentStatus | undefined }
  | { type: 'fieldFocused'; fieldId: string }
  | { type: 'repeatItemAddRequested'; groupId: string }
  | { type: 'repeatItemEditRequested'; groupId: string; itemId: string; fieldId: string; value: ClinicalFieldValue }
  | { type: 'repeatItemStatusEditRequested'; groupId: string; itemId: string; fieldId: string; status: ClinicalAssessmentStatus | undefined }
  | { type: 'repeatItemRemoveRequested'; groupId: string; itemId: string }
  | { type: 'sectionToggleRequested'; sectionId: string };

@Component({ selector: 'emr-clinical-form', standalone: true })
export class EmrClinicalFormComponent {
  @Input({ required: true }) model!: ClinicalFormViewModel;
  @Input() idPrefix = '';
  @Input() customTemplates: Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>> = {};
  @Output() readonly intent = new EventEmitter<ClinicalFormIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ClinicalFormViewModel` (required) | — | Schema + field state + repeatable-item state + collapse/status/readOnly |
| `idPrefix` | `string` | `''` | Prefixed onto every generated DOM control id; needed when two `emr-clinical-form` instances render on one page |
| `customTemplates` | `Record<string, TemplateRef<EmrCustomFieldContext>>` | `{}` | Forwarded to every `emr-typed-field` for `type: 'custom'` fields |

**Example**
```html
<emr-clinical-form [model]="historyViewModel" idPrefix="history" (intent)="onIntent($event)" />
```

**Composition** — renders `EmrSectionCardComponent` (L3, same layer) per `schema.sections` entry, and `EmrTypedFieldComponent` (L2) per plain field block; for `kind: 'repeatable'` blocks it renders the add/item/remove/field-grid structure **inline** rather than delegating to `EmrRepeatableGroupComponent`, even though the two implementations are structurally near-identical. This is a verified, current duplication, not a documentation error.

**Depends on** — `EmrSectionCardComponent` (L3, same layer), `EmrTypedFieldComponent` (L2). Verified: `emr-clinical-form -> emr-section-card(L3), emr-typed-field(L2)`.
**Used by** — `EmrPacChecklist` (L4, verified: `emr-pac-checklist -> emr-clinical-form`), `EmrTemplatePreview` (L6, verified: `emr-template-preview -> emr-clinical-form`).

---

### EmrClinicalList
**Layer** L3 · **Selector** `emr-clinical-list` · **Status** stable · **Story** `emr-patient-and-navigation--clinical-lists`

**Need** — medications, allergies, chronic diseases, and significant personal history are all "a titled list of records with add/select/edit/remove actions and badges" — one generic list renderer plus thin, differently-labelled domain wrappers avoids four near-identical Angular classes.

**Purpose** — renders a heading, an optional "Add" button, and either an empty-state message or one `<article>` per `ClinicalListItem` (title/subtitle/detail/badges, plus Edit/Remove buttons unless the item is `readOnly`). It emits `ClinicalListAction` only; it does NOT fetch, sort, filter, or page the list, and an empty list carries no implied clinical meaning — the empty-state wording (`emptyMessage`) is controller-supplied precisely because "no allergies recorded" and "allergy status not yet assessed" are different clinical facts.

**API**
```ts
import type { ClinicalListItem } from '@drguptavivek/emr-controller';
// ClinicalListItem = { id: string; title: string; subtitle?: string; detail?: string;
//                       badges?: readonly EmrBadge[]; readOnly?: boolean }

export type ClinicalListAction =
  | { type: 'addRequested' }
  | { type: 'selected'; id: string }
  | { type: 'editRequested'; id: string }
  | { type: 'removeRequested'; id: string };

@Component({ selector: 'emr-clinical-list', standalone: true })
export class EmrClinicalListComponent {
  @Input() headingId = 'emr-clinical-list-title';
  @Input() title = 'Clinical information';
  @Input() emptyMessage = 'Status not supplied.';
  @Input() items: readonly ClinicalListItem[] = [];
  @Input() allowAdd = true;
  @Output() readonly action = new EventEmitter<ClinicalListAction>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `headingId` | `string` | `'emr-clinical-list-title'` | Drives `aria-labelledby` |
| `title` | `string` | `'Clinical information'` | Section heading |
| `emptyMessage` | `string` | `'Status not supplied.'` | Shown when `items.length === 0`; deliberately controller-owned wording |
| `items` | `readonly ClinicalListItem[]` | `[]` | Rendered rows |
| `allowAdd` | `boolean` | `true` | Shows/hides the Add button |

**Example**
```html
<emr-medication-list [items]="medications" [allowAdd]="!readOnly" (action)="onListAction($event)" />
```

**Composition** — none; renders only native markup and `NgIcon`. `EmrMedicationListComponent`, `EmrAllergyListComponent`, `EmrChronicDiseaseListComponent`, and `EmrPersonalHistoryListComponent` (all L4 domain components declared in the same file) are thin wrappers that fix `headingId`/`title` and delegate straight to `<emr-clinical-list>` — this is the file's only intra-file composition edge, and it crosses from L4 down to L3 as the layer rule requires.

**Depends on** — none.
**Used by** — `EmrMedicationList`, `EmrAllergyList`, `EmrChronicDiseaseList`, `EmrPersonalHistoryList` (all L4, same file).

---

### EmrClinicalMatrix
**Layer** L3 · **Selector** `emr-clinical-matrix` · **Status** stable · **Story** `emr-clinical-assessment--ophthalmology-o-d-o-s`

**Need** — specialty assessment grids (ophthalmology OD/OS, four-limb neurology) share the same shape — a fixed row list crossed with a fixed column list, one cell type per row, some cells not applicable to some columns, an optional free-text remark per row — and should be driven by one specialty-neutral component and a data schema rather than a bespoke grid per specialty.

**Purpose** — renders `schema` as a semantic `<table>` (wide layouts, with sticky/grouped column headers when `columnGroups` is present) and as a stacked-card list (`emr-matrix-cards`, narrow layouts) from the *same* cell template, so both presentations stay in sync. Non-applicable cells (`row.applicableColumnIds` excludes the column) render as a `—` with an `emr-sr-only "Not applicable"` label instead of an editable control. It does NOT add/reorder rows or columns, does NOT infer a cell's applicability beyond the schema's explicit `applicableColumnIds`, and does NOT interpret `ClinicalAssessmentStatus` values — they are rendered as opaque controller-supplied badges/options.

**API**
```ts
// models.ts — the full ClinicalMatrixSchema family, quoted verbatim
export interface ClinicalColumn {
  id: string;
  label: string;
  shortLabel?: string;
}

export interface ClinicalColumnGroup {
  id: string;
  label: string;
  columnIds: readonly string[];
}

export type ClinicalCellType =
  | 'text' | 'integer' | 'decimal' | 'select' | 'boolean' | 'date' | 'quantity' | 'custom';

export interface ClinicalRow {
  id: string;
  label: string;
  type: ClinicalCellType;
  applicableColumnIds?: readonly string[];
  unit?: string;
  precision?: number;
  options?: readonly ClinicalOption[];
  assessmentStatusOptions?: readonly ClinicalAssessmentPresentation[];
  customRendererKey?: string;
  helpText?: string;
}

export interface ClinicalMatrixSchema {
  id: string;
  label: string;
  columnGroups?: readonly ClinicalColumnGroup[];
  columns: readonly ClinicalColumn[];
  rows: readonly ClinicalRow[];
}

export type ClinicalCellValue = string | number | boolean | null;
export interface ClinicalQuantityValue { value: number | null; unit: string; }

export interface ClinicalCellState {
  value: ClinicalCellValue | ClinicalQuantityValue;
  assessmentStatus?: ClinicalAssessmentPresentation;
  readOnly?: boolean;
  disabled?: boolean;
  warning?: string;
  error?: string;
}

export interface ClinicalMatrixRowValue {
  cells: Readonly<Record<string, ClinicalCellState>>;
  remark: string;
  remarkError?: string;
  remarkReadOnly?: boolean;
  remarkDisabled?: boolean;
}

export type ClinicalMatrixValues = Readonly<Record<string, ClinicalMatrixRowValue>>;

export type ClinicalMatrixIntent =
  | { type: 'cellEditRequested'; rowId: string; columnId: string; value: ClinicalCellValue | ClinicalQuantityValue }
  | { type: 'remarkEditRequested'; rowId: string; remark: string }
  | { type: 'cellAssessmentStatusEditRequested'; rowId: string; columnId: string; status: ClinicalAssessmentStatus }
  | { type: 'cellFocused'; rowId: string; columnId: string }
  | { type: 'customCellIntent'; rowId: string; columnId: string; action: string; payload?: unknown };

@Component({ selector: 'emr-clinical-matrix', standalone: true })
export class EmrClinicalMatrixComponent {
  @Input({ required: true }) schema!: ClinicalMatrixSchema;
  @Input() values: ClinicalMatrixValues = {};
  @Input() readOnly = false;
  @Output() readonly intent = new EventEmitter<ClinicalMatrixIntent>();
  @ContentChildren(EmrClinicalCellRendererDirective) private renderers!: QueryList<EmrClinicalCellRendererDirective>;
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `schema` | `ClinicalMatrixSchema` (required) | — | Rows/columns/column-groups; one `type` per row applies to every applicable column |
| `values` | `ClinicalMatrixValues` | `{}` | Cell state + remark state, keyed by `rowId` |
| `readOnly` | `boolean` | `false` | Forces every cell/remark to its read-only rendering |

**`ClinicalCellType` vs `ClinicalFieldType` drift** — the matrix's per-row type union (`ClinicalCellType`, 8 members: `text | integer | decimal | select | boolean | date | quantity | custom`) is a strict subset of `ClinicalFieldType` (10 members, `clinical-form.models.ts`). **`multiline` and `multiselect` have no `ClinicalCellType` equivalent and no case in the matrix's `@switch (row.type)`** (`emr-clinical-matrix.component.ts`, the `cellTemplate` `ng-template`) — a matrix schema cannot declare a free-text-paragraph row or a multi-select row the way a clinical-form field can. Any specialty grid that needs either must fall back to `type: 'custom'` and a caller-supplied cell renderer template.

**Example**
```html
<emr-clinical-matrix [schema]="ophthalmologySchema" [values]="ophthalmologyValues"
  (intent)="onMatrixIntent($event)" />
```

**Composition** — renders no other catalogued component; it is a self-contained table/card renderer. It accepts custom cell renderers via content projection (`ContentChildren(EmrClinicalCellRendererDirective)`), which is the matrix's only extension seam.

**Depends on** — none.
**Used by** — none in the verified intra-UI import graph (consumed directly by ophthalmology/neurology recipe stories, not by another catalogued component).

---

### EmrClinicalCellRenderer
**Layer** L3 (directive) · **Selector** `ng-template[emrClinicalCellRenderer]` · **Status** stable · **Story** none — coverage gap (exercised implicitly inside `EmrClinicalMatrix` custom-cell stories, no dedicated story of its own)

**Need** — `EmrClinicalMatrix`'s built-in cell types (`text`/`integer`/`decimal`/`select`/`boolean`/`date`/`quantity`) cannot cover every specialty's cell (e.g. a pupil-reaction picker, a perimetry thumbnail). Rows declaring `type: 'custom'` need a way for the consuming app to register a keyed template the matrix can look up and project.

**Purpose** — a structural-style attribute directive placed on an `ng-template`, tagging it with a `key` so `EmrClinicalMatrixComponent.rendererFor(row.customRendererKey)` can find it among its `@ContentChildren`. It carries no rendering logic itself — it only captures the `TemplateRef` and its key.

**API**
```ts
export interface ClinicalCellRendererContext {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  emit: (action: string, payload?: unknown) => void;
}

@Directive({ selector: 'ng-template[emrClinicalCellRenderer]', standalone: true })
export class EmrClinicalCellRendererDirective {
  @Input('emrClinicalCellRenderer') key = '';
  constructor(readonly template: TemplateRef<{ $implicit: ClinicalCellRendererContext }>) {}
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `emrClinicalCellRenderer` (aliased to `key`) | `string` | `''` | Must match the row's `customRendererKey` for the matrix to select this template |

**Example**
```html
<emr-clinical-matrix [schema]="perimetrySchema" [values]="perimetryValues">
  <ng-template emrClinicalCellRenderer="pupil-reaction" let-ctx>
    <button (click)="ctx.emit('open-picker')">{{ ctx.cell?.value ?? 'Set' }}</button>
  </ng-template>
</emr-clinical-matrix>
```

**Composition** — not applicable (directive, no template of its own).

**Depends on** — none.
**Used by** — `EmrClinicalMatrix` (L3, same file; content-projected, not imported as a component).

---

### EmrAnnotationToolbar
**Layer** L3 · **Selector** `emr-annotation-toolbar` · **Status** stable · **Story** `emr-annotation-toolbar--all-tools`

**Need** — Any annotation surface needs the same small set of controls (tools, colour, line width, undo/redo, zoom, save) without each canvas rebuilding them or spending a screen row per control.

**Purpose** — One dense, wrapping row of icon-only buttons. Each has a 44px hit area around a 34px face, a `title` tooltip and an `aria-label`; the active tool, colour and width carry `aria-pressed` and a shape cue (filled face plus underline, check on the swatch), never colour alone. Tools come from a generic `tools[]` list (id, label, heroicon name, optional shortcut hint); an icon name outside the fixed registered set shows the label's first letter. The toolbar is a single Tab stop with arrow-key roving (Home/End supported) and `role="group"` per cluster. It never knows what a tool does and holds no geometry, history, zoom or colour state; `readOnly` disables everything except zoom.

**API**
```ts
export interface ToolbarTool { readonly id: string; readonly label: string; readonly icon: string; readonly disabled?: boolean; readonly shortcutLabel?: string }
export interface ToolbarColour { readonly id: string; readonly label: string; readonly hex: string }
export interface ToolbarWidth { readonly id: string; readonly label: string; readonly px: number }
export interface AnnotationToolbarViewModel {
  readonly tools: readonly ToolbarTool[]; readonly selectedToolId?: string;
  readonly colours: readonly ToolbarColour[]; readonly selectedColourId?: string;
  readonly widths: readonly ToolbarWidth[]; readonly selectedWidthId?: string;
  readonly canUndo: boolean; readonly canRedo: boolean; readonly zoomLabel: string;
  readonly canSave: boolean; readonly saveLabel?: string; readonly readOnly?: boolean;
}
export type AnnotationToolbarIntent =
  | { type: 'toolSelected'; toolId: string } | { type: 'colourSelected'; colourId: string } | { type: 'widthSelected'; widthId: string }
  | { type: 'undoRequested' } | { type: 'redoRequested' } | { type: 'zoomInRequested' } | { type: 'zoomOutRequested' }
  | { type: 'zoomFitRequested' } | { type: 'zoomResetRequested' } | { type: 'saveRequested' };

export class EmrAnnotationToolbarComponent {
  @Input({ required: true }) model!: AnnotationToolbarViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<AnnotationToolbarIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `AnnotationToolbarViewModel` (required) | — | tools, colours, widths, enabled flags and zoom text, all supplied |
| `headingId` | `string` | none | id of a visible label; otherwise the toolbar is named "Annotation tools" |
| `intent` (output) | `EventEmitter<AnnotationToolbarIntent>` | — | one intent per button |

**Example**
```html
<emr-annotation-toolbar [model]="toolbarModel" (intent)="onToolbarIntent($event)" />
```

**Known gaps**
- Registered icons: `heroCursorArrowRays`, `heroArrowsPointingOut`, `heroHandRaised`, `heroBackspace`, `heroPencil`, `heroPencilSquare`, `heroMinus`, `heroArrowLongRight`, `heroArrowTrendingUp`, `heroSquare2Stack`, `heroStop`, `heroCircleStack`, `heroBars3BottomLeft`. Anything else falls back to the label initial.
- Group names ("Tools", "Colour", "Line width", "History", "Zoom", "Save") and the Undo/Redo/Zoom labels are English UI text.
- Colour swatches are rendered from supplied `hex` data; light swatches rely on the swatch ring for contrast.
- At 44px per button the full 11-tool, 6-colour set needs about 1210px and wraps below that.
- Hidden in print.

**Depends on** — `NgIcon` (heroicons outline).

**Used by** — none yet (the clinical annotation canvas will adopt it).

---

### EmrAnnotationList
**Layer** L3 · **Selector** `emr-annotation-list` · **Status** stable · **Story** `emr-annotation-list--populated`

**Need** — A drawing with many marks needs a compact way to see, select and manage each one by number, without opening a large layer panel.

**Purpose** — A tight numbered `<ol>` of annotation layers (`AnnotationLayerRecord`). Each row, 44px high, shows the number, colour swatch, label, optional class and description, tool glyph and a lock marker, with icon buttons to hide/show, lock, move up/down and delete. The selected row follows `selectedLayerId` and carries `aria-current`, a side bar and bold text; hidden rows are italic with a dashed swatch and an eye-slash icon. Visibility and lock buttons use `aria-pressed`. Rows are arrow-key navigable and only the active row's buttons are in the Tab order, so 50 rows are not 300 tab stops. The list holds no order, numbering, visibility or lock state; it only emits intents. Up is disabled on the first row and down on the last. In `readOnly` mode lock, reorder and delete are hidden and selecting and hiding stay available.

**API**
```ts
export interface AnnotationListItem { readonly layer: AnnotationLayerRecord; readonly number: number; readonly classLabel?: string; readonly locked?: boolean; readonly description?: string }
export interface AnnotationListViewModel { readonly items: readonly AnnotationListItem[]; readonly selectedLayerId?: string; readonly emptyMessage: string; readonly readOnly?: boolean }
export type AnnotationListIntent =
  | { type: 'layerSelected'; layerId: string } | { type: 'layerVisibilityToggleRequested'; layerId: string }
  | { type: 'layerLockToggleRequested'; layerId: string } | { type: 'layerMoveRequested'; layerId: string; direction: 'up' | 'down' }
  | { type: 'layerRemoveRequested'; layerId: string } | { type: 'layerRenameRequested'; layerId: string; label: string };

export class EmrAnnotationListComponent {
  @Input({ required: true }) model!: AnnotationListViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<AnnotationListIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `AnnotationListViewModel` (required) | — | items, selection, empty text, read-only flag |
| `headingId` | `string` | none | id of a visible label; otherwise the list is named "Annotations" |
| `intent` (output) | `EventEmitter<AnnotationListIntent>` | — | select, visibility, lock, move, remove |

**Example**
```html
<emr-annotation-list [model]="listModel" (intent)="onListIntent($event)" />
```

**Known gaps**
- `layerRenameRequested` is in the intent contract but the list has no rename control yet.
- Delete emits immediately; the controller owns any confirmation. Lock does not disable reorder or delete in the UI; the controller decides what a locked layer allows.
- Long labels clamp to two lines on screen (full text in the tooltip) and show in full in print.
- Row actions are hidden in print.
- The list does not scroll itself; constrain its container for long lists.

**Depends on** — `NgIcon` (heroicons outline).

**Used by** — none yet (the clinical annotation canvas will adopt it).
