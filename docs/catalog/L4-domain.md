# L4 — Domain

L4 is the clinical-semantics layer: components here know they represent a *patient banner*, an *allergy list*, a *PAC checklist*, or an *order picker* — as opposed to L3's specialty-neutral containers. Every L4 component still receives an immutable, controller-supplied view model and emits a typed intent/output; none of them perform HTTP calls, routing, persistence, terminology lookups, or clinical interpretation (completion, normality, fitness, clearance, safety). Badge tones, labels, statuses, and even fallback vocabulary are controller-supplied wherever the architecture holds — the one documented exception is `EmrDocumentViewer`'s zoom/pan/rotate, which is transient presentation state the UI is explicitly allowed to own (see that entry), and `EmrClinicalAnnotationCanvas`'s built-in fallback templates/labels, flagged below as a soft boundary case.

Per the verified intra-UI import graph, L4 components mostly depend only on L1 primitives or nothing at all. Two same-layer edges exist (`EmrHierarchyOrderPicker → EmrOrderDetails`) and one L3 edge (`EmrPacChecklist → EmrClinicalForm`). No L4 component is imported by anything outside this layer in the verified graph.

Source directory: `packages/emr-ui/src/lib/domain/` (patient banner/list, timeline, app shell/left nav/right flyout, four clinical-list wrappers + annotation canvas + diagnostic result summary + spectacle prescription, staged/PAC checklists, family pedigree, documents, orders, favourites).

---

## Patient context

### EmrPatientBanner
**Layer** L4 · **Selector** `emr-patient-banner` · **Status** stable · **Story** `emr-patient-and-navigation--patient-card`, `--inpatient-ward`, `--inpatient-icu-isolation`

**Need** — Every clinical screen needs a persistent, glanceable identity strip: who the patient is, their care context, and any criticality/VIP/allergy signal. On a ward it must also show where the patient is (bed, ward), how long they have been in, their resuscitation status, isolation, and dosing weight, without every consuming screen re-deriving that layout.

**Purpose** — Renders a two-level banner: a compact primary row (name, primary identifier, age/sex, optional weight, criticality/VIP/care-setting badges, up to two allergy chips plus an overflow count) and a controller-toggled expandable second level (encounter details, full identifier list, chronic-disease chips, combined additional alerts). It does not decide whether to expand, does not compute badge tone/label, and does not interpret an empty `allergies`/`chronicDiseases` array as "none recorded" — `allergyStatus`/`chronicDiseaseStatus` carry that meaning explicitly, and the component falls back to the literal string "Additional alert status not supplied." only when the controller supplies zero combined alerts.

**Inpatient context.** All optional; each renders only when supplied, so outpatient output is unchanged. `bedLabel`, `wardLabel` and `lengthOfStayLabel` form a line under the demographics; `weightLabel` joins the demographics line; `codeStatus` and `isolation` badges lead the safety row (their `assistiveText` is read to screen readers); `admittedOnLabel` and `admittingClinicianLabel` appear in the expanded "Current encounter" group. The component computes none of them: no length-of-stay arithmetic, no code-status wording, no isolation inference.

**API**
```ts
export type EmrTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export interface EmrBadge { label: string; tone: EmrTone; assistiveText?: string; }
export interface PatientIdentifier { label: string; value: string; }
export interface PatientAlert { id: string; label: string; tone: EmrTone; detail?: string; }
export type CareSetting = 'opd' | 'ipd' | 'emergency' | 'other';

export interface PatientBannerViewModel {
  patientId: string;
  displayName: string;
  identifiers: readonly PatientIdentifier[];
  ageLabel: string;
  sexLabel: string;
  careSetting: CareSetting;
  careSettingLabel: string;
  locationLabel: string;
  encounterLabel?: string;
  criticality?: EmrBadge;
  vip?: EmrBadge;
  allergies: readonly PatientAlert[];
  allergyStatus?: EmrBadge;
  chronicDiseases: readonly PatientAlert[];
  chronicDiseaseStatus?: EmrBadge;
  alerts: readonly PatientAlert[];
  expanded: boolean;
  // Inpatient context, all controller-supplied labels or badges
  bedLabel?: string;
  wardLabel?: string;
  admittingClinicianLabel?: string;
  admittedOnLabel?: string;
  lengthOfStayLabel?: string;
  codeStatus?: EmrBadge;
  isolation?: EmrBadge;
  weightLabel?: string;
}

export type PatientBannerIntent = { type: 'expandedChangeRequested'; expanded: boolean };

export class EmrPatientBannerComponent {
  readonly model = input.required<PatientBannerViewModel>();
  readonly idPrefix = input('emr-patient-banner');
  readonly intent = output<PatientBannerIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `PatientBannerViewModel` (required) | — | full immutable snapshot |
| `idPrefix` | `string` | `'emr-patient-banner'` | the expandable region's id is `<idPrefix>-details`, used by `aria-controls` |
| `intent` (output) | `PatientBannerIntent` | — | `expandedChangeRequested` asks the controller to flip `model.expanded`; the component never mutates it |

**Example**
```html
<emr-patient-banner [model]="patientBanner" (intent)="onBannerIntent($event)" />
```

**Identity hierarchy — important divergence from `EmrPatientList`.** The design-QA record in `design-qa.md` ("Design QA — Patient identity hierarchy and foundations") documents a deliberate MRN-first, name-second, conditional-ABHA-third hierarchy for the *patient list* identity block. `EmrPatientBanner`'s own template does **not** implement that pattern: `patient.displayName` is rendered as the primary `<h2>` heading, and the primary identifier (`identifiers[0].value`) appears folded into the secondary demographics line (`{{ primaryIdentifier() }} · {{ patient.ageLabel }} · {{ patient.sexLabel }}`) rather than as a large, separate first line, and the banner renders no ABHA/identification-icon treatment at all. Only `EmrPatientList` (below) implements the MRN-dominant hierarchy that `design-qa.md` and `README.md` describe. Documented here as a verified source fact, not an assumption.

**Depends on** — `NgIcon` (decorative chevron only); no other UI-package component
**Used by** — not consumed internally (referenced only from Storybook compositions such as `ApplicationShellLight`/`Dark`)

---

### EmrPatientList
**Layer** L4 · **Selector** `emr-patient-list` · **Status** stable · **Story** `emr-patient-and-navigation--patient-list`

**Need** — Ward lists, OPD queues, and search results need a responsive, searchable roster where MRN/UHID — the number staff actually use to disambiguate patients — reads before the name, with an optional ABHA identifier shown only when the controller supplies one.

**Purpose** — Renders an accessible `<table>` on wide viewports and a card list on narrow ones, both showing the same identity block: `primaryIdentifier` in a large first line, `displayName` on a second line, and — only when `patient.abha` is present — a chip carrying the Heroicons `heroIdentification` icon plus the ABHA value. It emits `queryChanged`/`searchRequested`/`patientSelected`/`pageChanged`/`retryRequested` intents and renders loading/error/empty states verbatim from the model; it never filters, sorts, paginates, or decides which patient is "selected" on its own.

**API**
```ts
export interface PatientListRow {
  patientId: string;
  displayName: string;
  primaryIdentifier: string;
  abha?: { value: string; label?: string };
  ageLabel: string;
  sexLabel: string;
  careSettingLabel: string;
  locationLabel: string;
  queueLabel?: string;
  status?: EmrBadge;
  alerts?: readonly PatientAlert[];
}

export interface PatientListViewModel {
  query: string;
  rows: readonly PatientListRow[];
  selectedPatientId?: string;
  loading: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
}

export type PatientListIntent =
  | { type: 'queryChanged'; query: string }
  | { type: 'searchRequested' }
  | { type: 'patientSelected'; patientId: string }
  | { type: 'pageChanged'; page: number }
  | { type: 'sortChanged'; field: string; direction: 'asc' | 'desc' }
  | { type: 'retryRequested' };

export class EmrPatientListComponent {
  @Input({ required: true }) state!: PatientListViewModel;
  @Output() readonly intent = new EventEmitter<PatientListIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `state` | `PatientListViewModel` (required) | — | rows, query, paging, loading/error |
| `intent` (output) | `EventEmitter<PatientListIntent>` | — | one union covering query/search/select/page/retry |

**Example**
```html
<emr-patient-list [state]="patientListState" (intent)="onPatientListIntent($event)" />
```

**Identity hierarchy — confirmed.** Template markup: `<span class="emr-patient-list__mrn">{{ patient.primaryIdentifier }}</span><span class="emr-patient-list__name">{{ patient.displayName }}</span>@if (patient.abha; as abha) { <span class="emr-patient-list__abha"><ng-icon name="heroIdentification" ... />{{ abha.label || 'ABHA' }} {{ abha.value }}</span> }` — this is the exact "MRN/UHID dominant first line, patient name separate, conditional ABHA identifier with an identification icon" pattern recorded as durable design in `design-qa.md`, repeated identically in both the table row and the mobile card.

**Depends on** — `NgIcon` (`heroIdentification`); no other UI-package component
**Used by** — not consumed internally

---

### EmrTimeline
**Layer** L4 · **Selector** `emr-timeline` · **Status** stable · **Story** `emr-clinical-assessment--encounter-timeline-vertical`

**Need** — Encounters, orders, results, and notes need one chronological, keyboard-navigable view that can present either as a vertical list (side panel) or a horizontal strip (dashboard), with event styling driven entirely by controller-supplied kind definitions.

**Purpose** — Renders `events` as a roving-tabindex `role="list"` of buttons, arrow-key/Home/End navigable in the orientation-appropriate axis, coloring each event's dot by looking up its `kindId` in the supplied `kinds` array. It selects nothing itself — `eventSelected` only requests a selection; `selectedId` remains a plain input echoed back by the controller.

**API**
```ts
export interface TimelineKindDefinition { id: string; label: string; icon?: string; tone: EmrTone; }
export interface TimelineEvent {
  id: string;
  occurredAt: string;
  dateLabel: string;
  title: string;
  summary?: string;
  kindId: string;
  encounterId?: string;
  meta?: Readonly<Record<string, string>>;
}

export class EmrTimelineComponent {
  @Input() ariaLabel = 'Patient encounters';
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical';
  @Input() events: readonly TimelineEvent[] = [];
  @Input() kinds: readonly TimelineKindDefinition[] = [];
  @Input() selectedId = '';
  @Output() readonly eventSelected = new EventEmitter<string>();
}
```

Note: unlike every other component in this layer, `EmrTimeline` takes plain array/scalar `@Input()`s rather than a single `*ViewModel` object — there is no `TimelineViewModel`/`TimelineIntent` type in `packages/emr-controller`; the controller contract here is just the two readonly arrays plus `selectedId`.

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `ariaLabel` | `string` | `'Patient encounters'` | applied to the `role="list"` container |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | governs both CSS layout and Arrow-key axis |
| `events` | `readonly TimelineEvent[]` | `[]` | rendered in supplied order (no sorting) |
| `kinds` | `readonly TimelineKindDefinition[]` | `[]` | looked up by `kindId` for label/tone |
| `selectedId` | `string` | `''` | drives `aria-current` and default `tabindex="0"` target |
| `eventSelected` (output) | `EventEmitter<string>` | — | emits the clicked/activated event's `id` |

**Example**
```html
<emr-timeline orientation="vertical" [events]="events" [kinds]="kinds" [selectedId]="selectedId" (eventSelected)="onSelect($event)" />
```

**Depends on** — no other UI-package component
**Used by** — not consumed internally

---

## Shell and navigation

### EmrAppShell
**Layer** L4 · **Selector** `emr-app-shell` · **Status** stable · **Story** `emr-patient-and-navigation--application-shell-light`

**Need** — Every screen in the library needs the same root layout: a navigation slot, a main content slot, and an overlay slot, themed consistently without each application re-implementing the grid and theme class wiring.

**Purpose** — A pure content-projection shell: `<ng-content select="[emrShellNavigation]">` for the left nav, a default `<ng-content>` for the main region, and `<ng-content select="[emrShellOverlay]">` for flyouts/modals, wrapped in a root `div` that toggles `emr-theme-dark`/`emr-theme-light` off a single `theme` input. It contains no navigation logic, no routing, and no state beyond the theme string.

**API**
```ts
export class EmrAppShellComponent {
  @Input() theme: 'light' | 'dark' = 'light';
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `theme` | `'light' \| 'dark'` | `'light'` | toggles `.emr-theme-dark` / `.emr-theme-light` on the shell root |

**Example**
```html
<emr-app-shell theme="dark">
  <emr-left-nav emrShellNavigation [items]="navItems" activeId="patients" [expandedIds]="['clinical']" />
  <div class="emr-stack"><emr-patient-banner [model]="patient" /></div>
</emr-app-shell>
```

**Depends on** — no other UI-package component (a consumer projects `EmrLeftNav`/`EmrRightFlyout`/etc. into its slots, but the shell does not import them)
**Used by** — not consumed internally

---

### EmrLeftNav
**Layer** L4 · **Selector** `emr-left-nav` · **Status** stable · **Story** `emr-patient-and-navigation--collapsible-navigation`

**Need** — A collapsible, arbitrarily-nested primary navigation tree (desktop rail collapsing to icons, mobile overlay) that any workspace can drive from a single controller-owned menu structure.

**Purpose** — Recursively renders `items: readonly NavItem[]` via a self-referencing `<ng-template>`, expanding/collapsing branch nodes purely from the `expandedIds` input (not internal state) and requesting expansion/selection/collapse via three separate outputs. It performs zero routing — `itemSelected` emits only the item `id`.

**API**
```ts
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  badge?: EmrBadge;
  disabled?: boolean;
  children?: readonly NavItem[];
}

export class EmrLeftNavComponent {
  @Input() title = 'EMR';
  @Input() items: readonly NavItem[] = [];
  @Input() activeId = '';
  @Input() expandedIds: readonly string[] = [];
  @Input() collapsed = false;
  @Output() readonly collapseToggled = new EventEmitter<boolean>();
  @Output() readonly itemSelected = new EventEmitter<string>();
  @Output() readonly itemExpansionRequested = new EventEmitter<{ id: string; expanded: boolean }>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `title` | `string` | `'EMR'` | header label, hidden when `collapsed` |
| `items` | `readonly NavItem[]` | `[]` | root-level menu items, recursively nested via `children` |
| `activeId` | `string` | `''` | drives `aria-current="page"` on the matching button |
| `expandedIds` | `readonly string[]` | `[]` | controller-owned expanded-branch set |
| `collapsed` | `boolean` | `false` | 272px expanded / 72px collapsed per `IMPLEMENTATION_PLAN.md` |
| `collapseToggled` (output) | `EventEmitter<boolean>` | — | requests the next `collapsed` value |
| `itemSelected` (output) | `EventEmitter<string>` | — | leaf-item activation, emits `item.id` |
| `itemExpansionRequested` (output) | `EventEmitter<{id;expanded}>` | — | branch-item activation |

**Example**
```html
<emr-left-nav title="Care workspace" [items]="navItems" activeId="patients" [expandedIds]="['clinical']"
  (itemSelected)="onNavSelect($event)" (itemExpansionRequested)="onNavExpand($event)" />
```

**Depends on** — `NgTemplateOutlet` only; no other UI-package component
**Used by** — not consumed internally (projected into `EmrAppShell` by consumers/stories, not imported by it)

---

### EmrRightFlyout
**Layer** L4 · **Selector** `emr-right-flyout` · **Status** stable · **Story** `emr-patient-and-navigation--right-flyout`

**Need** — A single, reusable slide-over surface (favourites editor, order details, filters) that is properly a modal dialog — focus-trapped, Escape-dismissible, backdrop-dismissible — rather than each feature building its own.

**Purpose** — A generic, content-agnostic `role="dialog"` panel (440px desktop / full-screen mobile per `IMPLEMENTATION_PLAN.md`) using Angular CDK's `cdkTrapFocus` with auto-capture; projects arbitrary body content via `<ng-content>` and an optional footer via `<ng-content select="[emrFlyoutFooter]">`. It owns no domain state — `EmrFavouritesPanel` is explicitly a *separate* component projected into it, not a sub-part of it.

**API**
```ts
export class EmrRightFlyoutComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() titleId = 'emr-flyout-title';
  @Input() showBack = false;
  @Input() showFooter = false;
  @Output() readonly closeRequested = new EventEmitter<void>();
  @Output() readonly backRequested = new EventEmitter<void>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `open` | `boolean` | `false` | mounts/unmounts the panel and backdrop |
| `title` | `string` | `''` | optional header heading |
| `titleId` | `string` | `'emr-flyout-title'` | `aria-labelledby` target when `title` is set |
| `showBack` | `boolean` | `false` | renders a Back button in the header |
| `showFooter` | `boolean` | `false` | renders the projected `[emrFlyoutFooter]` region |
| `closeRequested` (output) | `EventEmitter<void>` | — | backdrop click, Close button, or Escape |
| `backRequested` (output) | `EventEmitter<void>` | — | Back button, when `showBack` |

**Example**
```html
<emr-right-flyout [open]="true" title="My favourites" [showFooter]="true">
  <emr-favourites-panel [state]="favouritesState" (intent)="onFavIntent($event)" />
  <div emrFlyoutFooter class="emr-button-row"><emr-button>Apply selected</emr-button></div>
</emr-right-flyout>
```

**Depends on** — `A11yModule` (`cdkTrapFocus`); no other UI-package component
**Used by** — not consumed internally (`EmrFavouritesPanel` is projected by consumers/stories, not imported by the flyout)

---

## Clinical lists

Source: `packages/emr-ui/src/lib/structures/emr-clinical-list.component.ts` — all four domain components below, plus the L3 `EmrClinicalListComponent` itself, live in this one file (known deviation: the four L4 wrappers have not yet been split into `domain/`; see the note in that file).

`EmrMedicationList`, `EmrAllergyList`, `EmrChronicDiseaseList`, and `EmrPersonalHistoryList` are thin domain wrappers over the L3 `EmrClinicalListComponent`. They share a single, **non-exported** base class:

```ts
export type ClinicalListAction =
  | { type: 'addRequested' }
  | { type: 'selected'; id: string }
  | { type: 'editRequested'; id: string }
  | { type: 'removeRequested'; id: string };

@Directive()
abstract class DomainListBase {
  @Input() items: readonly ClinicalListItem[] = [];
  @Input() allowAdd = true;
  /** Empty collections have no clinical meaning; the controller supplies the status wording. */
  @Input() emptyMessage = 'Status not supplied.';
  @Output() readonly action = new EventEmitter<ClinicalListAction>();
}
```

Each domain component's *entire* body is a fixed `headingId`/`title` string handed to `<emr-clinical-list>`; there is no additional behavior, no additional input, and no domain-specific rendering logic:

```ts
@Component({
  selector: 'emr-medication-list', standalone: true, imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list headingId="emr-medication-list-title" title="Medications"
    [emptyMessage]="emptyMessage" [items]="items" [allowAdd]="allowAdd" (action)="action.emit($event)" />`
})
export class EmrMedicationListComponent extends DomainListBase {}
```

| Component | Selector | `headingId` | `title` |
|---|---|---|---|
| `EmrMedicationListComponent` | `emr-medication-list` | `emr-medication-list-title` | "Medications" |
| `EmrAllergyListComponent` | `emr-allergy-list` | `emr-allergy-list-title` | "Allergies" |
| `EmrChronicDiseaseListComponent` | `emr-chronic-disease-list` | `emr-chronic-list-title` | "Chronic diseases" |
| `EmrPersonalHistoryListComponent` | `emr-personal-history-list` | `emr-history-list-title` | "Significant personal history" |

**Known gap.** These four are *display* lists only — they render supplied `ClinicalListItem[]` and forward `addRequested`/`selected`/`editRequested`/`removeRequested` intents. There is no corresponding medication-entry or allergy-entry *capture* component anywhere in the catalogue (no dosage/frequency/route form, no reaction-severity picker); building a new medication or allergy record is entirely outside this layer's current scope.

### EmrMedicationList
**Layer** L4 · **Selector** `emr-medication-list` · **Status** stable · **Story** `emr-patient-and-navigation--clinical-lists`

**Need** — A current-medications panel needs the same list chrome (heading, Add button, item badges, per-item Edit/Remove) as every other domain list, labelled specifically "Medications".

**Purpose/API/Attributes** — see the shared `DomainListBase` above; adds nothing beyond the fixed heading/title.

**Example**
```html
<emr-medication-list [items]="medications" (action)="onMedicationAction($event)" />
```

**Depends on** — `EmrClinicalListComponent` (L3)
**Used by** — not consumed internally

---

### EmrAllergyList
**Layer** L4 · **Selector** `emr-allergy-list` · **Status** stable · **Story** `emr-patient-and-navigation--clinical-lists`

**Need** — Allergy panels need the identical list chrome, labelled "Allergies", so allergy badges/severity tones stay controller-supplied and visually consistent with the rest of the catalogue.

**Purpose/API/Attributes** — see the shared `DomainListBase` above.

**Example**
```html
<emr-allergy-list [items]="allergies" [allowAdd]="false" (action)="onAllergyAction($event)" />
```

**Depends on** — `EmrClinicalListComponent` (L3)
**Used by** — not consumed internally

---

### EmrChronicDiseaseList
**Layer** L4 · **Selector** `emr-chronic-disease-list` · **Status** stable · **Story** `emr-patient-and-navigation--clinical-lists`

**Need** — Chronic-disease/problem-list panels need the same shared list chrome, labelled "Chronic diseases".

**Purpose/API/Attributes** — see the shared `DomainListBase` above.

**Example**
```html
<emr-chronic-disease-list [items]="diseases" (action)="onDiseaseAction($event)" />
```

**Depends on** — `EmrClinicalListComponent` (L3)
**Used by** — not consumed internally

---

### EmrPersonalHistoryList
**Layer** L4 · **Selector** `emr-personal-history-list` · **Status** stable · **Story** `emr-patient-and-navigation--clinical-lists`

**Need** — Significant personal/social history (smoking, prior surgeries) needs the same shared list chrome, labelled "Significant personal history".

**Purpose/API/Attributes** — see the shared `DomainListBase` above.

**Example**
```html
<emr-personal-history-list [items]="history" (action)="onHistoryAction($event)" />
```

**Depends on** — `EmrClinicalListComponent` (L3)
**Used by** — not consumed internally

---

## Safety and history

### EmrStagedChecklist
**Layer** L4 · **Selector** `emr-staged-checklist` · **Status** stable · **Story** `emr-safety-staged-checklist--incomplete`

**Need** — Phased safety workflows (sign-in / time-out / sign-out style checklists) need a controller-defined, multi-phase form with per-item checkbox/yes-no/yes-no-NA/text/select controls, conditional note capture, phase sign-off display, and per-phase status — without the UI encoding any particular workflow's wording or governance.

**Purpose** — Renders `schema.phases` as a tab strip and the active phase's `items` as controls whose type (`checkbox | yes-no | yes-no-na | text | select`) is entirely schema-driven; emits `phaseSelected`, `itemResponseRequested`, `itemNoteRequested`, `phaseCompletionRequested`, and `phaseSignoffRequested` intents. It never marks a phase complete, computes a signoff, or decides which items require a note — `requiresNoteWhen` and `phaseStatuses`/`signoffs` are all controller-supplied; when `view.readOnly` is true the component still allows `phaseSelected` (pure navigation) but suppresses every other intent.

**API**
```ts
export type ChecklistItemType = 'checkbox' | 'yes-no' | 'yes-no-na' | 'text' | 'select';
export interface ChecklistItemDefinition {
  id: string; label: string; description?: string; type: ChecklistItemType;
  options?: readonly EmrOption[]; required?: boolean; requiresNoteWhen?: readonly string[];
}
export interface ChecklistPhaseDefinition {
  id: string; label: string; description?: string; items: readonly ChecklistItemDefinition[];
}
export interface StagedChecklistSchema {
  id: string; label: string; description?: string; phases: readonly ChecklistPhaseDefinition[];
}
export interface ChecklistItemState {
  value: string | boolean | null; note?: string; readOnly?: boolean; disabled?: boolean; error?: string;
}
export interface ChecklistSignoff { displayName: string; roleLabel: string; signedAtLabel: string; }
export interface StagedChecklistViewModel {
  /** Stable, controller-supplied identifier used to namespace native form controls. */
  instanceId: string;
  schema: StagedChecklistSchema;
  items: Readonly<Record<string, ChecklistItemState>>;
  activePhaseId: string;
  phaseStatuses?: Readonly<Record<string, EmrBadge>>;
  signoffs?: Readonly<Record<string, ChecklistSignoff>>;
  readOnly?: boolean;
  error?: string;
}
export type StagedChecklistIntent =
  | { type: 'phaseSelected'; phaseId: string }
  | { type: 'itemResponseRequested'; itemId: string; value: string | boolean | null }
  | { type: 'itemNoteRequested'; itemId: string; note: string }
  | { type: 'phaseCompletionRequested'; phaseId: string }
  | { type: 'phaseSignoffRequested'; phaseId: string };

export class EmrStagedChecklistComponent {
  @Input({ required: true }) view!: StagedChecklistViewModel;
  @Output() readonly intent = new EventEmitter<StagedChecklistIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `view` | `StagedChecklistViewModel` (required) | — | schema, per-item state, active phase, statuses, signoffs |
| `intent` (output) | `EventEmitter<StagedChecklistIntent>` | — | see union above |

**Example**
```html
<emr-staged-checklist [view]="checklistView" (intent)="onChecklistIntent($event)" />
```

**Illustrative-only confirmation.** The `Foundations`-level Storybook fixture is explicit that the built-in surgical-safety content is a synthetic example, not a shipped standard: `schema.label = 'Illustrative surgical safety checklist'`, `schema.description = 'Synthetic Storybook content based on the WHO Surgical Safety Checklist. Adapt locally with the responsible clinical team.'`, and the story's own docs block states: *"Controlled, illustrative checklist presentation. It does not claim compliance, infer completion, or carry a WHO logo."* Per `IMPLEMENTATION_PLAN.md`: local wording and governance of any such checklist remain application responsibilities.

**Depends on** — `NgIcon` only; no other UI-package component
**Used by** — not consumed internally

---

### EmrPacChecklist
**Layer** L4 · **Selector** `emr-pac-checklist` · **Status** stable · **Story** `emr-safety-pac-checklist--default`

**Need** — Pre-anaesthesia/pre-operative assessment needs a bounded, contextualized wrapper around an ordinary clinical form — with a title, patient/case context strip, overall status badge, review-issues panel, and a row of controller-defined actions (e.g. "Save", "Complete") — reusing form rendering rather than duplicating it.

**Purpose** — Composes the L3 `EmrClinicalForm` for its actual field content (`<emr-clinical-form [model]="scopedForm()" (intent)="formIntent($event)" />`), adding only: a context `<dl>`, a review-issues alert, and an action-button footer. It does not compute `overallStatus`, does not validate the form, and does not decide fitness/clearance/ASA class — every one of those is controller-supplied on `PacChecklistViewModel`.

**API**
```ts
export interface PacContextItem { id: string; label: string; value: string; }
export interface PacChecklistAction {
  id: string; label: string; tone?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean; loading?: boolean; assistiveText?: string;
}
export interface PacChecklistError { id: string; message: string; severity?: 'error' | 'warning' | 'information'; fieldId?: string; }
export interface PacChecklistViewModel {
  instanceId: string; title: string; description?: string;
  context: readonly PacContextItem[]; form: ClinicalFormViewModel;
  actions: readonly PacChecklistAction[]; errors?: readonly PacChecklistError[];
  overallStatus?: EmrBadge; readOnly?: boolean;
}
export type PacChecklistIntent =
  | { type: 'formIntent'; intent: ClinicalFormIntent }
  | { type: 'actionRequested'; actionId: string };

export class EmrPacChecklistComponent {
  @Input({ required: true }) view!: PacChecklistViewModel;
  @Input() readOnly = false;
  @Output() readonly intent = new EventEmitter<PacChecklistIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `view` | `PacChecklistViewModel` (required) | — | title/context/form/actions/errors/status |
| `readOnly` | `boolean` | `false` | forced-read-only mode, ORed with `view.readOnly`/`view.form.readOnly` |
| `intent` (output) | `EventEmitter<PacChecklistIntent>` | — | wraps the composed form's intents plus action requests |

**Example**
```html
<emr-pac-checklist [view]="pacView" (intent)="onPacIntent($event)" />
```

**Composition.** Renders `EmrClinicalFormComponent` (L3) for the assessment form itself via `scopedForm()`, which re-namespaces the form schema's `id` to `emr-pac-${instanceId}-${form.schema.id}` (DOM-id collision avoidance across multiple PAC instances) and forces `form.readOnly` when either the component's own `readOnly` input or `view.readOnly` is set. All `ClinicalFormIntent`s bubble up wrapped as `{ type: 'formIntent'; intent }`.

**Controller-responsibility confirmation.** The story fixture's own description states: *"A reusable, controller-backed PAC assessment surface. It records supplied information without deriving fitness or clearance."* The Storybook docs block is more explicit still: *"Controlled PAC checklist wrapper. The controller supplies context, form state, errors and actions; the UI does not infer fitness, clearance, ASA class or clinical validation."* This matches `IMPLEMENTATION_PLAN.md`'s statement that PAC completion, fitness, clearance, and clinical validation remain controller responsibilities.

**Depends on** — `EmrClinicalFormComponent` (L3), `NgIcon`
**Used by** — not consumed internally

---

### EmrFamilyPedigree
**Layer** L4 · **Selector** `emr-family-pedigree` · **Status** stable · **Story** `emr-history-family-history--populated`

**Need** — Family/genetic history needs a generation-grouped, symbol-legend pedigree view (who, relationship, alive/deceased, affected/unaffected) plus an equivalent accessible relationship list, without the component drawing any inheritance conclusion.

**Purpose** — Groups `model.people` by `generation` (sorted, with a "Patient generation" / "N generations above/below" label derived purely from the integer), renders a pedigree-style glyph per person (♂/♀/⚬/⌖ for sex, a diagonal strike for deceased, colored border for affected/unaffected) plus a plain-text status pill row, and renders `model.relationships` as an equivalent `<ul>` beneath. `sexKind()` and `lifeState()` derive their *display symbol* from explicit controller fields only — `person.sex` directly, or a regex match against the controller-authored `sexLabel`/`lifeStatusLabel` strings (e.g. `/\b(deceased|died|dead|expired)\b/i`) purely to pick a glyph, never to infer or record a new clinical fact. It emits `personSelected`/`personAddRequested`/`personEditRequested`/`personRemoveRequested`/`relationshipAddRequested`/`relationshipEditRequested` intents and adds no member or relationship itself. `IMPLEMENTATION_PLAN.md` states directly: it does not infer inheritance or genetic risk.

**API**
```ts
export interface FamilyPersonNode {
  id: string; displayName: string; relationshipLabel: string; generation: number; order: number;
  age?: string | number; sexLabel?: string; sex?: 'male' | 'female' | 'other' | 'unknown';
  lifeStatusLabel?: string; proband?: boolean; deceased?: boolean;
  phenotype?: 'affected' | 'unaffected' | 'unknown'; conditions?: readonly EmrBadge[]; summary?: string; readOnly?: boolean;
}
export interface FamilyRelationship {
  id: string; fromPersonId: string; toPersonId: string; relationshipLabel: string;
  kind: 'partner' | 'parent-child' | 'sibling' | 'other';
}
export interface FamilyPedigreeViewModel {
  label: string; people: readonly FamilyPersonNode[]; relationships: readonly FamilyRelationship[];
  selectedPersonId?: string; readOnly?: boolean; emptyMessage?: string;
}
export type FamilyPedigreeIntent =
  | { type: 'personSelected'; personId: string }
  | { type: 'personAddRequested'; relatedPersonId?: string }
  | { type: 'personEditRequested'; personId: string }
  | { type: 'personRemoveRequested'; personId: string }
  | { type: 'relationshipAddRequested'; personId: string }
  | { type: 'relationshipEditRequested'; relationshipId: string };

export class EmrFamilyPedigreeComponent {
  @Input({ required: true }) model!: FamilyPedigreeViewModel;
  @Input() headingId = 'emr-family-pedigree-heading';
  @Output() readonly intent = new EventEmitter<FamilyPedigreeIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `FamilyPedigreeViewModel` (required) | — | people, relationships, selection, read-only, empty message |
| `headingId` | `string` | `'emr-family-pedigree-heading'` | root `aria-labelledby` target; also seeds each generation section's id |
| `intent` (output) | `EventEmitter<FamilyPedigreeIntent>` | — | six-member union above |

**Example**
```html
<emr-family-pedigree [model]="pedigreeModel" (intent)="onPedigreeIntent($event)" />
```

**Depends on** — `NgIcon` only; no other UI-package component
**Used by** — not consumed internally

---

## Diagnostics and specialty

### EmrClinicalAnnotationCanvas
**Layer** L4 · **Selector** `emr-clinical-annotation-canvas` · **Status** stable · **Story** `emr-clinical-photo-annotation--dermatology` (also `--retina-pairs`, `--retina-symbols`, `--surgery-planning`, `--dermatology-readonly`, `--draw-mode`; and `clinical-drawing-anatomy-outlines--draw-on-outlines`, `--draw-mode-portrait`, `--surgical-symbols`, `--wound-and-skin-findings`, `--full-screen-pan-and-lock`)

**Need** — Dermatology, retina and surgical-planning documentation needs a drawing surface over a clinical image: mark lesions, incisions and measurement lines, label them from a controller-defined vocabulary, and hand the resulting layers back as immutable state. The same surface has to be readable inside a record and large enough to draw on.

**Purpose** — A nine-tool annotation surface (Pan, Text, Line, Arrow, Callout, Curve, Circle, Polygon, Freehand) over one controller-supplied background image, in two presentations chosen by `layout`. **Compact** (default) is for reading: a slim header (icon, title, mark count, a numbers toggle, a marks show/hide toggle and a Draw button), the capped image with its marks, and the marks legend. **Draw** is the large editing surface: header with a pan-and-zoom lock, a full-screen toggle and Done, one row of `emr-annotation-toolbar` plus compact Class, Symbol (when `symbolPresets` is supplied) and Background selects and an Add photo icon button, the zoomable stage, and the editable `emr-annotation-list` as a side panel (it drops below the stage under about 900px of container width). Every mutation goes through `applyState()`, which emits a `stateChanged` intent carrying the whole next state plus a `reason`; undo/redo emit `undoRequested`/`redoRequested` and save emits `saveRequested`. It never persists, never reads or uploads files, never supplies images, classes or pen palettes, and never assigns clinical meaning to a shape beyond the class a user attaches.

**Contract** — All types live in `@drguptavivek/emr-controller` (`annotation.models.ts`); the component declares none of its own. Layers are the durable `AnnotationLayerRecord` union (`text` · `line`/`arrow` (`AnnotationLineRecord`) · `callout` · `circle` · `AnnotationPathRecord` for `curve`/`polygon`/`freeform`), so a saved `AnnotationDocument` holds exactly what the canvas draws. Schema stays v2: arrow, callout, `strokeStyle` and `fillPattern` are additive and `isValidLayer` accepts them and rejects unknown style or fill values. `pan` is a UI-only selected tool; no layer ever has it.

```ts
export interface EmrClinicalImageTemplate {
  id: string; label: string; imageUrl: string;
  width: number; height: number;          // intrinsic pixels — sizes the drawing surface
  altText?: string;
  group?: string;                         // optional <optgroup> heading in the Background select
}
export interface EmrAnnotationLabel { id: string; label: string; description?: string; color?: string; }
export interface EmrAnnotationColourOption { id: string; label: string; hex: string }   // pen colour, supplied by the controller
export interface EmrAnnotationWidthOption { id: string; label: string; px: number }     // pen width
export type EmrAnnotationCanvasLayout = 'compact' | 'draw';
export interface EmrClinicalAnnotationCanvasState {
  instanceId: string; title: string; description?: string;
  imageTemplates: readonly EmrClinicalImageTemplate[]; availableLabels: readonly EmrAnnotationLabel[];
  selectedImageId?: string; selectedLabelId?: string; selectedTool?: EmrAnnotationSelectedTool;   // AnnotationTool | 'pan'
  brushColor: string;                      // required: a mark's colour is saved data
  brushWidth?: number; layers: readonly AnnotationLayerRecord[]; selectedLayerId?: string;
  textContent?: string; showLayerPanel?: boolean; photoUploadHint?: string; readOnly?: boolean; photoAccept?: string;
  layout?: EmrAnnotationCanvasLayout;      // default 'compact'
  showMarkerNumbers?: boolean;             // default true
  colourOptions?: readonly EmrAnnotationColourOption[];
  widthOptions?: readonly EmrAnnotationWidthOption[];
  symbolPresets?: readonly AnnotationSymbolPreset[];   // controller / L5 symbol set; shows the Symbol select
  selectedSymbolId?: string;
  brushStrokeStyle?: AnnotationStrokeStyle;            // copied onto new marks
  brushFillPattern?: AnnotationFillPattern;            // copied onto new closed marks
}
export type AnnotationStrokeStyle = 'solid' | 'dashed' | 'sutured' | 'stapled';
export type AnnotationFillPattern = 'none' | 'hatch' | 'crosshatch' | 'lattice';
export interface AnnotationLineRecord    { tool: 'line' | 'arrow'; points: readonly [AnnotationPoint, AnnotationPoint]; /* head at points[1] */ }
export interface AnnotationCalloutRecord { tool: 'callout'; points: readonly [AnnotationPoint, AnnotationPoint]; text: string; fontSize: number; /* text at the tail points[0], head at points[1] */ }
export interface AnnotationSymbolPreset {
  id: string; label: string; description?: string; tool: AnnotationTool;
  strokeStyle?: AnnotationStrokeStyle; fillPattern?: AnnotationFillPattern;
  colour?: string; width?: number; classId?: string;   // hex data; classId must be in availableLabels to apply
}
export interface EmrClinicalAnnotationCanvasIntent {
  type: 'stateChanged' | 'undoRequested' | 'redoRequested' | 'saveRequested';
  state: EmrClinicalAnnotationCanvasState; reason: string;
}

export class EmrClinicalAnnotationCanvasComponent implements OnChanges {
  @Input({ required: true }) model!: EmrClinicalAnnotationCanvasState;
  @Input() headingId = 'emr-clinical-annotation-canvas-heading';
  @Output() readonly intent = new EventEmitter<EmrClinicalAnnotationCanvasIntent>();
  @Output() readonly nativeFilesSelected = new EventEmitter<readonly File[]>();
}
```

**Composition.** The draw row is an `EmrAnnotationToolbar` fed the nine tools (`pan`→`heroHandRaised`, `text`→`shape-text`, `line`→`shape-line`, `arrow`→`shape-arrow`, `callout`→`shape-callout`, `curve`→`shape-curve`, `circle`→`shape-ellipse`, `polygon`→`shape-polygon`, `freeform`→`shape-freehand`), the controller's `colourOptions`/`widthOptions` (selected by matching `brushColor` hex and `brushWidth` px), undo/redo availability from the component's own stacks, save and zoom. With no `colourOptions` and no `widthOptions` the toolbar shows no pen. The marks panel is an `EmrAnnotationList` (editable in draw, `readOnly` legend in compact) with `canLock` false, because lock means nothing until marks can be moved. A new mark is labelled with the selected class's label (fallback "Annotation"); a text mark is labelled with its typed text. The tool name is never used as a label; with a symbol selected and no class, the symbol's label is used, and a callout is labelled with its text.

**Arrows, callouts and symbols.** *Arrow:* press at the tail, drag to the head, release; the head is a filled triangle polygon (not an SVG `<marker>`, which colours and scales inconsistently under `non-scaling-stroke`) computed from the segment direction at about 3% of the image width, filled with the mark colour, and the shaft stops inside it. *Callout:* the same gesture, plus the text from the existing text field at draw time, set at the tail on the side away from the head; its size is the record's `fontSize` in image pixels (new callouts get 3% of the image width). A click without a drag creates neither. Arrow and callout are numbered at their head. *Stroke styles:* `dashed` is a `stroke-dasharray`; `sutured` draws short perpendicular ticks and `stapled` draws small ⊓ brackets straddling the line at fixed arc-length intervals along the mark's points (presentation maths, nothing stored). *Fills:* `hatch`, `crosshatch` and `lattice` (a `#` grid) are one SVG `<pattern patternUnits="userSpaceOnUse">` per filled layer in the component's own `<defs>`, drawn in the layer colour through `currentColor`, applied to polygon, circle and freeform. *Symbol select:* choosing a preset applies its tool, stroke style, fill, colour, width and class in one `symbol-selected` change (one Undo). New marks copy the active stroke style and fill; choosing a different tool clears the symbol, style and fill. Presets are controller or L5 data (`recipes/annotation-symbols`).

**View-only state.** `layout` and `showMarkerNumbers` change through `applyState()` with reasons `layout-changed` and `marker-numbers-toggled`. Neither arms Undo, and undo/redo preserve the current `layout` and `showMarkerNumbers`. Zoom and the marks show/hide toggle are transient UI state, like scroll: they are not in the model and are not emitted.

**Coordinates and layout.** Points are normalized to the background image's intrinsic rectangle: (0,0) top-left, (1,1) bottom-right, with x and y scaled separately. The stage's box is the image rectangle (`aspect-ratio`, never `max-height`), the SVG overlay uses the image's pixel size as its `viewBox`, and the pointer maths uses the stage's `getBoundingClientRect()`, so marks stay registered at every size and zoom. Height is capped by constraining **width**: `--ac-ratio` (W/H) is bound as a custom property and the figure is `min(100%, cap × ratio / (1 − 2·gutter))` wide, with `--ac-cap` about 560px in compact and 72vh in draw (component-local, not tokens).

**Zoom (draw only).** Zoom is a multiplier of the fitted width (50 / 75 / 100 / 150 / 200 / 300%); 100% is the image fitted to the height cap. Reset returns to 100%. Fit also returns to 100% but sizes the image to the whole visible height (the cap grows from 72vh to the viewport height minus the controls, so the image visibly gets larger, and is already that size in full screen, where Fit only undoes a zoom) and scrolls to the corner. It changes the figure's **width** inside an `overflow: auto` viewport, never `transform: scale()`, so the layout box grows, the viewport scrolls and pointer mapping stays exact. The viewport becomes a focusable, labelled scroll region while zoomed.

**Pan, lock and full screen (draw only; all transient UI state, never in the model or history).** *Pan* is the first tool: dragging the stage scrolls the zoomed viewport by the drag delta (grab and grabbing cursors), makes no marks, and with the viewport focused the arrow keys scroll it. *Lock* (header toggle, `aria-pressed`, "Lock pan and zoom") sets the viewport to `overflow: hidden` so wheel and trackpad cannot shift it, keeps `touch-action: none` on the stage, disables the four zoom buttons (`AnnotationToolbarViewModel.zoomLocked`) and stops Pan from moving the view; it never changes the stage size or scroll offset, so marks stay registered. Choosing any drawing tool or symbol locks automatically and choosing Pan unlocks; the toggle overrides either way. The canvas opens locked unless its `selectedTool` is `pan`. *Full screen* (header toggle, "Full screen" / "Exit full screen", `aria-pressed`) turns the host into a fixed CSS overlay (no Fullscreen API, no `document` access) that holds only a slim header, the toolbar row with its selects, the stage and the marks list; the description is hidden. The stage cap becomes the viewport height minus the controls and is still constrained by width. Escape exits and returns focus to the toggle. Print and compact mode ignore it.

**Number labels.** Each visible mark gets a small neutral label (`--emr-surface-raised`, `--emr-text-muted`, `--emr-border`; never the mark colour) in a gutter beside the image, joined to the mark's anchor by a thin leader line and a dot. Nothing sits on the image. The figure has percentage gutters (7% each) so every position is a percentage of the figure: anchor x = gutter + x·(100 − 2·gutter). A mark goes to the left gutter when its anchor is in the left half (text marks always go left so the leader meets the start of the text); each gutter is sorted by height and spread to a minimum gap (larger for short, wide images) so labels never overlap. The number is the mark's position in `layers` and matches the legend. Labels and leaders scale with the figure at every zoom, are `aria-hidden` (the list carries the accessible text), and are hidden by the numbers toggle, and always shown in print. A hidden layer (`visible: false`) is not drawn and gets no label.

**Print.** Print is a presentation context (`.emr-print` or `@media print`), not an input. It forces the compact presentation whatever `layout` says: toolbar, selects, upload, header buttons and text field are hidden, zoom is off, the viewport does not clip, the cap becomes 140mm, the marks and numbers are shown (regardless of the toggles) and the legend lists every mark in full.

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `EmrClinicalAnnotationCanvasState` (required) | — | image templates, labels, layers, tool/brush selection, layout, pen palettes |
| `headingId` | `string` | `'emr-clinical-annotation-canvas-heading'` | root `aria-labelledby` target |
| `intent` (output) | `EventEmitter<EmrClinicalAnnotationCanvasIntent>` | — | `stateChanged` / `undoRequested` / `redoRequested` / `saveRequested`, always carrying full state |
| `nativeFilesSelected` (output) | `EventEmitter<readonly File[]>` | — | sanctioned escape hatch (api-conventions §2.4), emitted by the Add photo icon button (a label around a visually hidden file input). The controller reads the file, registers it, and answers with a new template (stable id, URL, intrinsic size) in the next `model`. |

The controller must supply each template's **true** intrinsic `width`/`height`. Wrong dimensions make `object-fit: contain` letterbox the image inside the surface, and marks misregister; nothing flags this.

**Example**
```html
<emr-clinical-annotation-canvas [model]="annotationState" (intent)="onAnnotationIntent($event)" (nativeFilesSelected)="onPhotoSelected($event)" />
```

**Known gaps.**

0. **Pan, lock and full screen are not remembered**; a host that wants them restored must reapply them (they are not in the view model).
1. **One layer list for all backgrounds.** `layers` is not keyed by image, so switching or uploading a background keeps marks drawn on the previous one. The durable document ties layers to one `background`; multi-view records are drawing-plan Phase 4.
2. **Text-tool size ignores `fontSize`.** `.ac__text-mark { font-size: 48px }` (a deliberate literal, now component-local) overrides the SVG attribute, and is in image pixels, so text labels shrink with the image. Callouts do honour their `fontSize`. A callout's text cannot be edited after placement, and text near an image edge is clipped by the surface.
3. **Undo/redo history is component-owned** and is reset whenever `model` changes, so a host that feeds every `stateChanged` straight back loses history. Controlled revision history is drawing-plan Phase 4.
4. **A mark's class cannot be changed after it is drawn.** The per-row class select is gone; Class applies to the next mark. Needs a list or toolbar affordance and a selected-mark edit intent.
5. **Marks cannot be moved or edited**, so Lock is hidden (`canLock` false) and there is no select/move/eraser tool.
6. **Reorder is offered on the selected row only** (the list's rule), so rows are not reachable for reordering until selected.
7. **A mark near the image edge has its leader cross the image** to the nearest gutter; a very crowded gutter relaxes the label gap rather than dropping labels.

**Select styling.** The Class, Symbol and Background selects use `appearance: none` with a CSS-gradient chevron in `currentColor`, because WebKit ignores padding on a native select and the prefix icon overlapped the text.

**Depends on** — `NgIcon`; `EmrAnnotationToolbar`, `EmrAnnotationList`; types from `@drguptavivek/emr-controller`
**Used by** — not consumed internally

---

### EmrDiagnosticResultSummary
**Layer** L4 · **Selector** `emr-diagnostic-result-summary` · **Status** stable · **Story** `emr-clinical-assessment-ophthalmology--perimetry-result` *(see note below — corrects the ground-truth coverage list)*

**Need** — Diagnostic-device output (perimetry today; other devices later) needs a consistent summary card: metadata, a metrics table with reference ranges and status badges, free-text interpretation/trend notes, and downloadable attachments — without the UI computing normality, trend direction, or any clinical classification.

**Purpose** — Renders `result.metadata` as a definition list, `result.metrics` as a semantic `<table>` (desktop) mirrored by an accessible stacked list (mobile, CSS-toggled), `result.interpretation`/`result.trendSummary` as plain controller-supplied notes, and `result.attachments` as action buttons; shows loading/error states with a `retryRequested` retry action. Every `status`/label/value is a pre-formatted string or `EmrBadge` from the model — the component performs no computation on measurement values.

**API**
```ts
export interface DiagnosticMetric {
  id: string; label: string; valueLabel: string; referenceLabel?: string; status?: EmrBadge; helpText?: string;
}
export interface DiagnosticAttachmentAction {
  id: string; label: string; kind: 'report' | 'plot' | 'image' | 'data';
  assistiveDescription?: string; disabled?: boolean;
}
export interface DiagnosticResultViewModel {
  id: string; title: string; subtitle?: string; status?: EmrBadge;
  metadata: readonly { label: string; value: string }[];
  metrics: readonly DiagnosticMetric[];
  interpretation?: string; trendSummary?: string;
  attachments?: readonly DiagnosticAttachmentAction[];
  loading?: boolean; error?: string;
}
export type DiagnosticResultIntent =
  | { type: 'attachmentRequested'; resultId: string; attachmentId: string }
  | { type: 'resultSelected'; resultId: string }
  | { type: 'retryRequested'; resultId: string };

export class EmrDiagnosticResultSummaryComponent {
  @Input({ required: true }) result!: DiagnosticResultViewModel;
  @Input() headingId = 'emr-diagnostic-result-heading';
  @Output() readonly intent = new EventEmitter<DiagnosticResultIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `result` | `DiagnosticResultViewModel` (required) | — | metadata, metrics, notes, attachments, loading/error |
| `headingId` | `string` | `'emr-diagnostic-result-heading'` | root `aria-labelledby`; also seeds the attachments-section heading id |
| `intent` (output) | `EventEmitter<DiagnosticResultIntent>` | — | attachment request / result selection / retry |

**Example**
```html
<emr-diagnostic-result-summary [result]="perimetryResult" (intent)="onResultIntent($event)" />
```

**Coverage-gap correction.** The layer-assignment ground truth lists `EmrDiagnosticResultSummary` among components with no dedicated story. That is not what the source shows: `packages/emr-ui/src/lib/stories/ophthalmology-assessments.stories.ts` (title `'EMR / Clinical assessment / Ophthalmology'`) exports three stories that render `<emr-diagnostic-result-summary>` directly — `PerimetryResult`, `PerimetryLoading`, `PerimetryError`. Documented here with the real story id; flagged as a factual correction rather than silently reproducing the (incorrect) "coverage gap" claim.

**Depends on** — no other UI-package component
**Used by** — not consumed internally

---

### EmrSpectaclePrescription
**Layer** L4 · **Selector** `emr-spectacle-prescription` · **Status** stable · **Story** `emr-clinical-assessment-ophthalmology--spectacle-prescription`

**Need** — Spectacle Rx (sphere, cylinder, axis, add, etc.) reads naturally as a compact eye × field grid — right/left eye as rows, prescription fields as columns — a shape the specialty-neutral `EmrClinicalMatrix` (row-typed, one type per row) does not fit well, so `IMPLEMENTATION_PLAN.md` calls for "a dedicated controlled `EmrSpectaclePrescription`."

**Purpose** — Renders a horizontal `<table>` (eyes as rows, controller-defined `fields` as columns, plus a Notes column) on wide viewports, collapsing to one `<fieldset>` card per eye below 720px; every cell's read-only/disabled/error/warning state and `inputMode` (`decimal`/`integer`/`text`→ virtual-keyboard hint) come from the model. It performs no unit conversion, no Rx validity check, and no derivation of a final prescription — `cellEditRequested`/`notesEditRequested` simply forward the raw string typed.

**API**
```ts
export type SpectaclePrescriptionFieldType = 'text' | 'decimal' | 'integer' | 'select';
export interface SpectaclePrescriptionField {
  id: string; label: string; type: SpectaclePrescriptionFieldType; unit?: string; placeholder?: string;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  readOnly?: boolean; disabled?: boolean;
}
export interface SpectaclePrescriptionEye { id: string; label: string; shortLabel?: string; }
export interface SpectaclePrescriptionViewModel {
  id: string; label: string; description?: string;
  fields: readonly SpectaclePrescriptionField[]; eyes: readonly SpectaclePrescriptionEye[];
  values: Readonly<Record<string, Readonly<Record<string, string | undefined>>>>;
  notes?: Readonly<Record<string, string | undefined>>;
  errors?: Readonly<Record<string, string | undefined>>;
  warnings?: Readonly<Record<string, string | undefined>>;
  readOnly?: boolean;
}
export type SpectaclePrescriptionIntent =
  | { type: 'cellFocused'; eyeId: string; fieldId: string }
  | { type: 'cellEditRequested'; eyeId: string; fieldId: string; value: string }
  | { type: 'notesEditRequested'; eyeId: string; value: string };

export class EmrSpectaclePrescriptionComponent {
  @Input({ required: true }) model!: SpectaclePrescriptionViewModel;
  @Input() readOnly = false;
  @Input() idPrefix = '';
  @Output() readonly intent = new EventEmitter<SpectaclePrescriptionIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `SpectaclePrescriptionViewModel` (required) | — | eyes, fields, values, notes, errors, warnings |
| `readOnly` | `boolean` | `false` | ORed with `model.readOnly`/per-field `readOnly` |
| `idPrefix` | `string` | `''` | DOM id namespace; falls back to `model.id` |
| `intent` (output) | `EventEmitter<SpectaclePrescriptionIntent>` | — | focus / cell edit / notes edit |

**Example**
```html
<emr-spectacle-prescription [model]="spectacleModel" (intent)="onSpectacleIntent($event)" />
```

**Depends on** — `NgTemplateOutlet` only; no other UI-package component
**Used by** — not consumed internally


---

### EmrDoseSchedule
**Layer** L4 · **Selector** `emr-dose-schedule` · **Status** stable · **Story** `emr-medications-dose-schedule--tablet-twice-daily`

**Need** — A prescription line such as "BD", "1-0-1" or "OD" is ambiguous on paper and on screen: "OD" means once daily for a tablet but right eye for eye drops, and "AS"/"AD" (ear) are easily confused with "OS"/"OD" (eye). A patient or nurse needs one unambiguous card stating how much, how often, where, and for how long.

**Purpose** — Renders one medicine as a card: name and strength, frequency in words (code only in parentheses after the words), a "1 - 0 - 1" pattern row, an equal-size grid of dose slots (Morning / Afternoon / Evening / Night) with large amounts, icons per dosage form (tablet in full/half/quarter shapes, capsule, drop, tube, spoon, spray, inhaler, syringe, patch, sachet, suppository), a highlighted site line ("Right eye (OD)"), route / food / duration / start, as-needed limits, a reducing (taper) table, a separation note and instructions. Quarter amounts of countable forms read as ¼ ½ ¾ plus words ("one and a half"). The controller supplies every label and amount; the component only formats them. It never maps a code to a schedule, never totals doses, never computes durations or tapers, and never shows a bare abbreviation. Edit and instructions buttons appear only when the model enables them and it is not read-only.

**API**
```ts
export type DoseForm = 'tablet' | 'capsule' | 'drop' | 'liquid' | 'ointment' | 'cream' | 'gel' | 'spray' | 'inhaler' | 'injection' | 'patch' | 'sachet' | 'suppository' | 'other';
export interface DoseLabelled { code?: string; label: string }
export interface DoseUnit { one: string; other: string }
export interface DoseSlot { id: string; label: string; timeHint?: string; amount: number | null; amountLabel?: string; householdLabel?: string }
export interface DoseTaperStep { id: string; periodLabel: string; frequencyLabel: string; slots?: readonly DoseSlot[] }
export interface DoseScheduleViewModel {
  medication: { label: string; strength?: string; formLabel: string; form: DoseForm };
  unit?: DoseUnit; frequency: DoseLabelled; slots: readonly DoseSlot[]; site?: DoseLabelled;
  route?: string; foodRelation?: string; duration?: string; startLabel?: string;
  instructions?: readonly string[]; prn?: { label: string; maxLabel?: string };
  separationNote?: string; taper?: readonly DoseTaperStep[];
  status?: EmrBadge; readOnly?: boolean; canEdit?: boolean; canShowInstructions?: boolean;
}
export type DoseScheduleIntent = { type: 'editRequested' } | { type: 'instructionsRequested' };

export class EmrDoseScheduleComponent {
  @Input({ required: true }) model!: DoseScheduleViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<DoseScheduleIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `DoseScheduleViewModel` (required) | — | everything displayed, all labels controller-supplied |
| `headingId` | `string` | generated | id of the medicine heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<DoseScheduleIntent>` | — | `editRequested`, `instructionsRequested` |

**Example**
```html
<emr-dose-schedule [model]="doseModel" (intent)="onDoseIntent($event)" />
```

**Known gaps**
- Fractions are written as glyphs only for countable forms (tablet, capsule, suppository, sachet, patch) and only for quarter steps; any other amount prints as a plain number (so 2.5 mL stays "2.5").
- Words for fractions ("one and a half") are English only and are shown only for fractional amounts.
- The pattern row is omitted when fewer than two slots exist or when any slot is described only in words (`amountLabel` with `amount: null`).
- No dose-range or interaction checking; no drug-name lookup.

**Abbreviation guard.** When `frequency.code` equals `site.code` (e.g. eye drops "Once daily (OD)" beside "Right eye (OD)"), the frequency code is hidden and only the words show, so one abbreviation never carries two meanings on a card.

**Depends on** — `EmrBadgeComponent`, `EmrButtonComponent`.

**Used by** — no component. The `EMR / Medications / Order composer` stories (`emr-medications-order-composer--*`) use it as the live preview of a drug order. That recipe composes `EmrCodedInput`, `EmrQuantityInput`, `EmrSelect`, `EmrScheduleSlotPicker`, `EmrTypedField` and `EmrAttestation`. Its story-side controller maps the picker's `DoseSlot[]` into a `DoseScheduleViewModel`, words the frequency, and validates on sign. There is deliberately no composer component.

---

## Documents

### EmrDocumentUploadQueue
**Layer** L4 · **Selector** `emr-document-upload-queue` · **Status** stable · **Story** `emr-documents--upload-queue`

**Need** — Attaching documents (discharge summaries, consent forms, clinical photos) needs a queue view — selected file, size, media type, per-file progress/status, retry/cancel/remove — while the actual transfer, storage, and authorization stay entirely outside the UI package.

**Purpose** — Renders a native `<input type="file">` dropzone plus a status list driven by `state.candidates: DocumentCandidate[]`; on file selection it always emits the raw `File[]` via `nativeFilesSelected`, and — only if the consumer supplies a `sourceTokenFactory` — additionally emits a `filesSelected` intent carrying `SelectedDocumentSource[]` (filename/size/mediaType plus an opaque `sourceToken` the factory produced). The component itself never reads file bytes, never uploads, and never invents a `sourceToken`.

**API**
```ts
export interface DocumentCandidate {
  id: string; fileName: string; sizeLabel: string; mediaTypeLabel: string; sourceToken: string;
  progress?: number; status: 'ready' | 'processing' | 'complete' | 'error' | 'cancelled'; statusLabel: string; error?: string;
}
export interface SelectedDocumentSource { fileName: string; size: number; mediaType: string; sourceToken: string; }
export interface DocumentUploadQueueViewModel {
  label: string; acceptDescription?: string; candidates: readonly DocumentCandidate[];
  disabled?: boolean; multiple?: boolean; error?: string;
}
export type DocumentUploadIntent =
  | { type: 'filesSelected'; files: readonly SelectedDocumentSource[] }
  | { type: 'candidateRetryRequested'; candidateId: string }
  | { type: 'candidateCancelRequested'; candidateId: string }
  | { type: 'candidateRemoveRequested'; candidateId: string };

export class EmrDocumentUploadQueueComponent {
  @Input({ required: true }) state!: DocumentUploadQueueViewModel;
  @Input() headingId = 'emr-document-upload-heading';
  @Input() sourceTokenFactory?: (file: File) => string;
  @Output() readonly intent = new EventEmitter<DocumentUploadIntent>();
  @Output() readonly nativeFilesSelected = new EventEmitter<readonly File[]>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `state` | `DocumentUploadQueueViewModel` (required) | — | label, candidates, disabled/multiple, error |
| `headingId` | `string` | `'emr-document-upload-heading'` | root `aria-labelledby` target |
| `sourceTokenFactory` | `((file: File) => string) \| undefined` | `undefined` | when supplied, also emits `filesSelected` with a `sourceToken` per file |
| `intent` (output) | `EventEmitter<DocumentUploadIntent>` | — | `filesSelected` / retry / cancel / remove |
| `nativeFilesSelected` (output) | `EventEmitter<readonly File[]>` | — | raw browser `File[]`, always emitted on selection |

**Example**
```html
<emr-document-upload-queue [state]="uploadState" [sourceTokenFactory]="tokenize" (intent)="onUploadIntent($event)" (nativeFilesSelected)="onFilesPicked($event)" />
```

**Depends on** — `NgIcon` only; no other UI-package component
**Used by** — not consumed internally

---

### EmrPatientDocuments
**Layer** L4 · **Selector** `emr-patient-documents` · **Status** stable · **Story** `emr-documents--patient-documents`

**Need** — A patient's document library needs search, category/folder filtering, sorting, pagination, and per-document preview/download/delete affordances, in both a wide table and a narrow card layout, without owning the underlying files.

**Purpose** — Renders `state.documents: PatientDocumentRecord[]` in a responsive table/card pair driven by `query`/`category`/`folder`/`sort`/`page`, and emits the matching intents for every toolbar and per-row action; `canPreview`/`canDownload`/`canDelete` gate which action buttons render per document, entirely controller-decided. A `previewTrigger` output additionally passes the clicked `HTMLElement` back — explicitly documented in source as *"UI-only focus origin; never forwarded to controller contracts"* — so a consumer can return focus to the trigger when a preview viewer closes, without that DOM reference ever crossing into the typed intent contract.

**API**
```ts
export interface PatientDocumentRecord {
  id: string; title: string; categoryId: string; categoryLabel: string; folderId: string; folderLabel: string;
  fileName: string; mediaTypeLabel: string; sizeLabel: string;
  /** ISO-8601 timestamp used for deterministic chronological sorting. */
  createdAt: string; createdAtLabel: string; authorLabel?: string; status?: EmrBadge; tags?: readonly string[];
  canPreview?: boolean; canDownload?: boolean; canDelete?: boolean; previewKind?: 'image' | 'pdf';
}
export type PatientDocumentSortField = 'createdAt' | 'title' | 'category' | 'folder';
export interface PatientDocumentsViewModel {
  /** Stable, controller-supplied DOM identity for pages with multiple libraries. */
  instanceId: string; label: string; query: string;
  category?: string; categoryOptions?: readonly EmrOption[];
  folder?: string; folderOptions?: readonly EmrOption[];
  documents: readonly PatientDocumentRecord[]; selectedDocumentId?: string;
  loading?: boolean; error?: string; page: number; pageSize: number; total: number;
  sort?: { field: PatientDocumentSortField; direction: 'asc' | 'desc' };
  lastEffect?: PatientDocumentsEffect;
}
export type PatientDocumentsIntent =
  | { type: 'queryChanged'; query: string } | { type: 'categoryChanged'; category: string }
  | { type: 'folderChanged'; folder: string }
  | { type: 'sortChanged'; field: PatientDocumentSortField; direction: 'asc' | 'desc' }
  | { type: 'pageChanged'; page: number } | { type: 'documentSelected'; documentId: string }
  | { type: 'previewRequested'; documentId: string } | { type: 'downloadRequested'; documentId: string }
  | { type: 'deleteRequested'; documentId: string } | { type: 'retryRequested' };

export class EmrPatientDocumentsComponent {
  @Input({ required: true }) state!: PatientDocumentsViewModel;
  @Output() readonly intent = new EventEmitter<PatientDocumentsIntent>();
  /** UI-only focus origin; never forwarded to controller contracts. */
  @Output() readonly previewTrigger = new EventEmitter<HTMLElement>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `state` | `PatientDocumentsViewModel` (required) | — | query/filter/sort/page state plus the document rows |
| `intent` (output) | `EventEmitter<PatientDocumentsIntent>` | — | ten-member union covering toolbar + row actions |
| `previewTrigger` (output) | `EventEmitter<HTMLElement>` | — | the clicked trigger element, for focus restoration only |

**Example**
```html
<emr-patient-documents [state]="documentsState" (intent)="onDocumentsIntent($event)" (previewTrigger)="rememberTrigger($event)" />
```

**Depends on** — `NgIcon` only; no other UI-package component
**Used by** — not consumed internally

---

### EmrDocumentViewer
**Layer** L4 · **Selector** `emr-document-viewer` · **Status** stable · **Story** `emr-documents--image-viewer`

**Need** — Reviewing an uploaded image or a controller-pre-rasterized PDF page needs a full-screen carousel across documents and, for PDFs, pages within a document — with zoom/pan/rotate for legibility — while file transfer, authorization, and PDF rasterization stay entirely outside the UI (the viewer only ever receives an already-authorized `rasterUrl` per page; source comment: *"The UI never receives a raw PDF."*).

**Purpose** — A modal (`role="dialog"`, `aria-modal="true"`, CDK-free hand-rolled focus trap) that renders one `DocumentPreviewPage` at a time, navigable by Previous/Next document, Previous/Next page (PDF only), a page `<select>`, and full keyboard support (arrows for documents, Page Up/Down for pages, `+`/`-`/`0` for zoom, `R`/Shift+R for rotate, Escape to close, Tab-trapped focus cycling). Every navigation action (`previousDocumentRequested`, `pageRequested`, etc.) is emitted as an intent and fulfilled by the controller supplying a new `page`/`currentDocument` — the component holds no document data of its own.

**Zoom/pan/rotate as sanctioned transient UI state.** Unlike everything else the intent contracts govern, zoom/rotation/pan are private component fields, never inputs and never emitted as intents:
```ts
export class EmrDocumentViewerComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) view!: DocumentViewerViewModel;
  @Input() headingId = 'emr-document-viewer-heading';
  @Input() returnFocusTo?: HTMLElement;
  @Output() readonly intent = new EventEmitter<DocumentViewerIntent>();

  private zoom = 1;
  private rotation = 0;
  private panX = 0;
  private panY = 0;
  private dragging = false;

  transform(): string { return `translate(${this.panX}px, ${this.panY}px) rotate(${this.rotation}deg) scale(${this.zoom})`; }
  zoomIn(): void { this.zoom = Math.min(4, this.zoom + .25); }
  zoomOut(): void { this.zoom = Math.max(.5, this.zoom - .25); if (this.zoom === 1) this.resetPan(); }
  rotate(degrees: number): void { this.rotation = (this.rotation + degrees + 360) % 360; }
  resetView(): void { this.zoom = 1; this.rotation = 0; this.resetPan(); }
  pointerDown(event: PointerEvent): void { /* pan drag start, only when zoom > 1 */ }
  pointerMove(event: PointerEvent): void { /* updates panX/panY while dragging */ }
}
```
`ngOnChanges` calls `resetView()` whenever `view.page.assetId` changes — i.e. every navigation to a new page/document resets zoom/rotation/pan to defaults. This qualifies as one of the library's few sanctioned exceptions to the controlled-component rule (documented in `README.md`: "Components may manage transient presentation behaviour such as focus movement, overlay placement, animation, and scrolling") because: (1) it is pure browser-viewport presentation with no clinical meaning — a raster image displayed larger or rotated 90° is not a different clinical fact; (2) it is intentionally *not* persisted or round-tripped through the controller — resetting on every navigation is the correct behavior, and a controller round-trip would only add latency to a purely visual action; (3) nothing about zoom/rotation/pan is written back into `DocumentViewerIntent`, so the controller's state never drifts from what's on screen.

**API**
```ts
export interface DocumentPreviewManifest {
  documentId: string; title: string; fileName: string; categoryLabel: string; folderLabel: string;
  createdAtLabel: string; kind: 'image' | 'pdf';
  /** Images have one page; PDFs expose the controller-authorized raster page count. */
  pageCount: number;
}
export interface DocumentPreviewPage {
  assetId: string; documentId: string;
  /** Zero-based page index. */
  pageIndex: number; pageLabel: string;
  /** Controller/adapter-authorized image source. The UI never receives a raw PDF. */
  rasterUrl: string; altText: string; intrinsicWidth?: number; intrinsicHeight?: number;
}
export interface DocumentViewerViewModel {
  instanceId: string; open: boolean; currentDocument?: DocumentPreviewManifest; documentIndex: number;
  documentCount: number; pageIndex: number; page?: DocumentPreviewPage; loading: boolean; error?: string;
  canPreviousDocument: boolean; canNextDocument: boolean; canPreviousPage: boolean; canNextPage: boolean;
}
export type DocumentViewerIntent =
  | { type: 'openRequested'; documentId: string; carouselDocumentIds: readonly string[] }
  | { type: 'closeRequested' } | { type: 'previousDocumentRequested' } | { type: 'nextDocumentRequested' }
  | { type: 'previousPageRequested' } | { type: 'nextPageRequested' } | { type: 'pageRequested'; pageIndex: number }
  | { type: 'retryRequested' } | { type: 'rasterLoadFailed'; assetId: string };
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `view` | `DocumentViewerViewModel` (required) | — | open state, current document manifest, current page, nav flags |
| `headingId` | `string` | `'emr-document-viewer-heading'` | combined with `view.instanceId` for the dialog's `aria-labelledby` |
| `returnFocusTo` | `HTMLElement \| undefined` | `undefined` | element to refocus on close; falls back to `document.activeElement` at open time |
| `intent` (output) | `EventEmitter<DocumentViewerIntent>` | — | nine-member union covering nav, retry, and raster-load failure |

**Example**
```html
<emr-document-viewer [view]="viewerState" (intent)="onViewerIntent($event)" />
```

**Depends on** — `A11yModule`/CDK `DOCUMENT`/`PLATFORM_ID` tokens (SSR-safe browser checks); no other UI-package component
**Used by** — not consumed internally

---

## Orders and favourites

### EmrHierarchyOrderPicker
**Layer** L4 · **Selector** `emr-hierarchy-order-picker` · **Status** stable · **Story** `emr-orders-and-favourites--laboratory-hierarchy`

**Need** — Laboratory and radiology catalogues share the same shape — a searchable group/item hierarchy with lazy-loaded children and controller-marked "selectable" groups — so one generic picker serves both, rather than two near-duplicate components.

**Purpose** — Renders `state.roots: HierarchyNode[]` as a recursive expand/collapse tree (search box, per-node expand/Add/​Preview-group buttons) and a "Selected orders" panel that renders one `EmrOrderDetails` per `state.selected` entry. Group additions are never applied directly: `groupPreviewRequested` only asks the controller for a `GroupAddPreview`; the picker renders that preview (with its `duplicateIds` count) and requires an explicit `groupAddConfirmed` before the controller resolves it into `SelectedOrder`s. The component performs no search, hierarchy expansion, lazy loading, deduplication, or catalogue resolution itself.

**API**
```ts
export interface HierarchyNode {
  id: string; label: string; code?: string; kind: 'group' | 'item'; selectable: boolean;
  expanded?: boolean; loading?: boolean; disabled?: boolean; children?: readonly HierarchyNode[];
}
export interface SelectedOrder {
  id: string; catalogueId: string; label: string; code?: string; kind: 'laboratory' | 'radiology' | 'medication';
  details?: Readonly<Record<string, string | boolean | null>>; errors?: Readonly<Record<string, string>>;
}
export interface GroupAddPreview {
  groupId: string; groupLabel: string;
  items: readonly Pick<SelectedOrder, 'catalogueId' | 'label' | 'code'>[];
  duplicateIds: readonly string[];
}
export interface HierarchyOrderViewModel {
  title: string; query: string; roots: readonly HierarchyNode[]; selected: readonly SelectedOrder[];
  preview?: GroupAddPreview; loading: boolean; error?: string;
}
export type HierarchyOrderIntent =
  | { type: 'queryChanged'; query: string } | { type: 'searchRequested' }
  | { type: 'nodeExpansionRequested'; nodeId: string; expanded: boolean }
  | { type: 'itemAddRequested'; nodeId: string } | { type: 'groupPreviewRequested'; nodeId: string }
  | { type: 'groupAddConfirmed'; groupId: string } | { type: 'groupPreviewDismissed' }
  | { type: 'orderRemoveRequested'; orderId: string }
  | { type: 'orderDetailChanged'; orderId: string; field: string; value: string | boolean | null }
  | { type: 'retryRequested' };

export class EmrHierarchyOrderPickerComponent {
  @Input({ required: true }) state!: HierarchyOrderViewModel;
  @Output() readonly intent = new EventEmitter<HierarchyOrderIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `state` | `HierarchyOrderViewModel` (required) | — | search query, tree roots, selected orders, group preview |
| `intent` (output) | `EventEmitter<HierarchyOrderIntent>` | — | ten-member union; `orderDetailChanged` is forwarded from the composed `EmrOrderDetails` |

**Example**
```html
<emr-hierarchy-order-picker [state]="labCatalogueState" (intent)="onOrderPickerIntent($event)" />
```

**Composition.** Renders `EmrOrderDetailsComponent` (same L4 layer) once per `state.selected` entry, wiring its `removeRequested`/`detailChanged` outputs into `orderRemoveRequested`/`orderDetailChanged` picker intents — this is the one verified same-layer L4→L4 edge in the catalogue.

**Depends on** — `EmrOrderDetailsComponent` (L4, same layer), `NgTemplateOutlet`, `NgIcon`
**Used by** — not consumed internally

---

### EmrOrderDetails
**Layer** L4 · **Selector** `emr-order-details` · **Status** stable · **Story** none — coverage gap (rendered only inside `EmrHierarchyOrderPicker`'s stories; no standalone story exports it directly)

**Need** — Once an order is selected, laboratory and radiology orders need their own kind-specific detail fields (urgency always; fasting/notes for labs; body site/laterality/contrast/indication for radiology) captured against the one `SelectedOrder`.

**Purpose** — Renders `order` (kind-tagged `'laboratory' | 'radiology' | 'medication'`) with an always-present Urgency select plus conditionally-rendered fields keyed on `order.kind`, forwarding every change as a generic `{ orderId, field, value }` `OrderDetailChange` — it does not itself validate urgency/laterality combinations or interpret `details`/`errors` beyond reading/writing them by field name.

**API**
```ts
export interface OrderDetailChange { orderId: string; field: string; value: string | boolean | null; }

export class EmrOrderDetailsComponent {
  @Input({ required: true }) order!: SelectedOrder;
  @Input() urgencyOptions: readonly EmrOption[] = [
    { value: 'routine', label: 'Routine' }, { value: 'urgent', label: 'Urgent' }, { value: 'stat', label: 'STAT' }
  ];
  @Input() lateralityOptions: readonly EmrOption[] = [
    { value: 'not-applicable', label: 'Not applicable' }, { value: 'right', label: 'Right' },
    { value: 'left', label: 'Left' }, { value: 'bilateral', label: 'Bilateral' }
  ];
  @Output() readonly detailChanged = new EventEmitter<OrderDetailChange>();
  @Output() readonly removeRequested = new EventEmitter<string>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `order` | `SelectedOrder` (required) | — | `kind` drives which fields render |
| `urgencyOptions` | `readonly EmrOption[]` | Routine/Urgent/STAT | always rendered, regardless of `kind` |
| `lateralityOptions` | `readonly EmrOption[]` | Not applicable/Right/Left/Bilateral | rendered only when `order.kind === 'radiology'` |
| `detailChanged` (output) | `EventEmitter<OrderDetailChange>` | — | `{ orderId, field, value }` for any field edit |
| `removeRequested` (output) | `EventEmitter<string>` | — | emits `order.id` |

Field set by kind: `laboratory` → Urgency, Fasting required (checkbox), Notes (text). `radiology` → Urgency, Body site (text), Laterality (select), Contrast requested (checkbox), Clinical indication (text) — matching `README.md`'s "Laboratory order fields: urgency, fasting status, and notes. Radiology order fields: urgency, body site/laterality, contrast, and clinical indication."

**Example**
```html
<emr-order-details [order]="order" (detailChanged)="onDetailChanged($event)" (removeRequested)="onRemove($event)" />
```

**Depends on** — `EmrCheckboxComponent`, `EmrSelectComponent`, `EmrTextInputComponent` (all L1), `NgIcon`
**Used by** — `EmrHierarchyOrderPickerComponent` (L4, same layer) — the one verified L4→L4 edge in this layer

---

### EmrFavouritesPanel
**Layer** L4 · **Selector** `emr-favourites-panel` · **Status** stable · **Story** `emr-orders-and-favourites--favourites-list`

**Need** — Clinicians need a saved, reusable set of order templates per category (medications, laboratory, radiology, and non-nested combinations of the three) that can be searched, created, edited, reordered, applied, and deleted from one panel — typically projected into `EmrRightFlyout`.

**Purpose** — A three-mode panel switched purely by `state.mode`: `'list'` (tabbed search + favourite cards with Apply/Edit/Move up/Move down/Delete), `'editor'` (name field plus per-item-removable list of included order templates), and `'apply-result'` (a success alert, or — when the controller reports `applyIssues` — a warning list of unavailable/conflicting catalogue entries). Applying a favourite, resolving its templates against the live catalogue, and detecting `'unavailable' | 'conflict'` issues are entirely controller responsibilities — the panel only renders `state.applyIssues` verbatim.

**API**
```ts
export type FavouriteKind = 'medication' | 'laboratory' | 'radiology' | 'combination';
export interface FavouriteEntry {
  id: string; name: string; kind: FavouriteKind; summary?: string;
  orderTemplates: readonly SelectedOrder[]; updatedAt: string;
}
export interface FavouriteApplyIssue { catalogueId: string; label: string; reason: 'unavailable' | 'conflict'; detail?: string; }
export interface FavouritesViewModel {
  open: boolean; mode: 'list' | 'editor' | 'apply-result'; activeKind: FavouriteKind; query: string;
  items: readonly FavouriteEntry[]; selectedId?: string; editor?: FavouriteEntry;
  applyIssues?: readonly FavouriteApplyIssue[]; loading: boolean; error?: string;
}
export type FavouritesIntent =
  | { type: 'opened' } | { type: 'closed' } | { type: 'tabChanged'; kind: FavouriteKind }
  | { type: 'queryChanged'; query: string } | { type: 'createRequested'; kind: FavouriteKind }
  | { type: 'editRequested'; id: string } | { type: 'editorNameChanged'; name: string }
  | { type: 'editorOrdersChanged'; orders: readonly SelectedOrder[] } | { type: 'saveRequested' }
  | { type: 'deleteRequested'; id: string } | { type: 'moveRequested'; id: string; direction: 'up' | 'down' }
  | { type: 'applyRequested'; id: string } | { type: 'backRequested' } | { type: 'retryRequested' };

export class EmrFavouritesPanelComponent {
  @Input({ required: true }) state!: FavouritesViewModel;
  @Output() readonly intent = new EventEmitter<FavouritesIntent>();
  readonly tabs: readonly EmrOption[] = [
    { value: 'medication', label: 'Medications' }, { value: 'laboratory', label: 'Laboratory' },
    { value: 'radiology', label: 'Radiology' }, { value: 'combination', label: 'Combinations' }
  ];
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `state` | `FavouritesViewModel` (required) | — | mode, active tab, items, editor draft, apply issues |
| `intent` (output) | `EventEmitter<FavouritesIntent>` | — | fourteen-member union covering all list/editor/apply-result actions |

**Example**
```html
<emr-right-flyout [open]="true" title="My favourites" [showFooter]="true">
  <emr-favourites-panel [state]="favouritesState" (intent)="onFavIntent($event)" />
</emr-right-flyout>
```

**Depends on** — `EmrTabsComponent`, `EmrTextInputComponent` (both L1), `NgIcon`
**Used by** — not consumed internally (projected into `EmrRightFlyout` by consumers/stories, not imported by it)

---

### EmrOctFindingRecord
**Layer** L4 · **Selector** `emr-oct-finding-record` · **Status** stable · **Story** `emr-ophthalmology-oct-record--macular-both-eyes`

**Need** — An OCT result is read per eye: scan details, the key frames, a few supplied thickness numbers and a short list of coded findings with where they are. Reviewers need OD and OS side by side with rows lined up, and need absent data to read as absent, never as "normal".

**Purpose** — Renders one record with an equal-width panel per eye (two columns when the host is at least 720px wide, stacked below that), using subgrid so scan details, frames, measurements, findings and interpretation line up across eyes. Each panel shows supplied scan metadata, selectable frame thumbnails (a missing thumbnail shows "No image supplied"), a measurements table of `DiagnosticMetric` rows, a findings list with location, status, supplied badge, note and edit/remove buttons, and the supplied interpretation. An eye whose status is not `recorded` shows that status instead of a body. Validation messages, loading (aria-live) and error with Retry are supported. The controller supplies every value and verdict; the component never measures, grades, compares to norms, draws, windows images or derives laterality. Absent sections read "Not supplied".

**API**
```ts
export interface OctFrameRef { readonly frameId: string; readonly seriesId?: string; readonly label: string; readonly kind: 'b-scan' | 'en-face' | 'thickness-map' | 'report'; readonly thumbnailUrl?: string; readonly altText: string; readonly width?: number; readonly height?: number }
export interface OctFinding { readonly id: string; readonly path: EmrNodePath; readonly code?: EmrCodedValue; readonly label: string; readonly locationLabel?: string; readonly status: ClinicalAssessmentStatus; readonly badge?: EmrBadge; readonly note?: string; readonly frameId?: string; readonly readOnly?: boolean }
export interface OctEyeRecord { readonly eyeId: string; readonly label: string; readonly shortLabel: string; readonly status: ClinicalAssessmentStatus; readonly metadata: readonly { label: string; value: string }[]; readonly frames: readonly OctFrameRef[]; readonly selectedFrameId?: string; readonly metrics: readonly DiagnosticMetric[]; readonly findings: readonly OctFinding[]; readonly interpretation?: string }
export interface OctFindingRecordViewModel { readonly id: string; readonly title: string; readonly eyes: readonly OctEyeRecord[]; readonly messages: readonly EmrValidationMessage[]; readonly readOnly?: boolean; readonly loading?: boolean; readonly error?: string }
export type OctFindingRecordIntent =
  | { type: 'frameSelected'; eyeId: string; frameId: string } | { type: 'frameOpenRequested'; eyeId: string; frameId: string }
  | { type: 'findingAddRequested'; eyeId: string } | { type: 'findingEditRequested'; eyeId: string; path: EmrNodePath }
  | { type: 'findingRemoveRequested'; eyeId: string; path: EmrNodePath } | { type: 'findingSelected'; eyeId: string; path: EmrNodePath }
  | { type: 'retryRequested' };

export class EmrOctFindingRecordComponent {
  @Input({ required: true }) model!: OctFindingRecordViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<OctFindingRecordIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `OctFindingRecordViewModel` (required) | — | everything displayed, all labels and badges controller-supplied |
| `headingId` | `string` | generated | id of the title heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<OctFindingRecordIntent>` | — | frame select/open, finding add/edit/remove/select, retry |

**Example**
```html
<emr-oct-finding-record [model]="octModel" (intent)="onOctIntent($event)" />
```

**Known gaps**
- Thumbnails are transient URLs supplied per frame; there is no image viewer, windowing, zoom or segmentation overlay (use `frameOpenRequested` to open one elsewhere).
- Validation messages are listed together above the eyes; they are not attached to the finding with the matching path.
- Status words for the six no-value states ("Not assessed", "Unable to assess" ...) are a fixed English vocabulary in the component; all clinical badges come from the model.
- At 360px the measurements table scrolls horizontally inside its own region, so the Status column may need a swipe.
- No normative comparison, thickness-map colouring or drawing.

**Depends on** — `NgIcon` (heroicons outline). No other Emr* components.

**Used by** — none yet (intended for ophthalmology visit and imaging review pages).

---

### EmrMeridianCross
**Layer** L4 · **Selector** `emr-meridian-cross` · **Status** stable · **Story** `emr-ophthalmology-meridian-cross--optical-cross-both-eyes`

**Need** — A spectacle or retinoscopy result is read as two powers on two axes. A table of "-1.00 x 180" strings is slow to scan and easy to mis-transcribe; a drawn power cross shows each meridian where it lies, and the eye it belongs to must never be in doubt.

**Purpose** — Renders one equal panel per eye (the first eye on the viewer's left, so supply OD first) with a persistent text label ("OD" chip plus "Right eye"). Each recorded eye is an inline `<svg role="img">`: two meridians drawn through a centre point at the controller-supplied `axisDeg`, using the TABO convention as the examiner sees the eye (0 degrees on the viewer's right, counter-clockwise, 90 degrees up), each with its supplied `powerLabel` at the line end. `kind` ('optical' | 'retinoscopy') changes only the eyebrow and footnote wording; the geometry is the same. `captionLines` (working distance, gross or net) print under the drawing. Any status other than `recorded` shows its plain words in place of the drawing; `recorded` with no `meridians` shows "Not supplied". Edit and select buttons appear per eye unless `readOnly`. The component never sums powers, transposes, normalises or converts an axis, or adjusts for working distance; rotating the drawing to the supplied angle is presentation only.

**API**
```ts
export interface CrossMeridian { readonly axisDeg: number; readonly powerLabel: string; readonly assistiveLabel: string }
export interface MeridianCrossEye { readonly eyeId: string; readonly label: string; readonly shortLabel: string; readonly status: ClinicalAssessmentStatus;
  readonly meridians?: readonly [CrossMeridian, CrossMeridian]; readonly captionLines?: readonly string[]; readonly flag?: EmrBadge }
export interface MeridianCrossViewModel { readonly id: string; readonly kind: 'optical' | 'retinoscopy'; readonly title: string;
  readonly eyes: readonly MeridianCrossEye[]; readonly summaryText: string; readonly readOnly?: boolean }
export type MeridianCrossIntent = { type: 'eyeSelected'; eyeId: string } | { type: 'editRequested'; eyeId: string };

export class EmrMeridianCrossComponent {
  @Input({ required: true }) model!: MeridianCrossViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<MeridianCrossIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `MeridianCrossViewModel` (required) | — | all labels, axes and powers controller-supplied |
| `headingId` | `string` | generated | id of the title heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<MeridianCrossIntent>` | — | `eyeSelected`, `editRequested` |

**Example**
```html
<emr-meridian-cross [model]="crossModel" (intent)="onCrossIntent($event)" />
```

**Known gaps**
- Each meridian's label sits at the end of the line at its supplied angle (for axis 180 that is the viewer's left end); the opposite end is unlabelled.
- Panel order is the supplied order; the component cannot know which eye is OD, so the controller must put the right eye first.
- No sphero-cylinder or transposed form, no vertex or working-distance adjustment, no axis validation (an axis of 0 and 180 are drawn identically).
- Two panels per row from 560 px wide; narrower viewports stack the eyes (OD above OS) so the labels stay legible.

**Depends on** — `EmrBadgeComponent`.

**Used by** — none yet (intended for refraction, retinoscopy and spectacle prescription views).

---

### EmrOcularMotilityChart
**Layer** L4 · **Selector** `emr-ocular-motility-chart` · **Status** stable · **Story** `emr-ophthalmology-motility-chart--per-eye-normal`

**Need** — Ocular motility and ductions are charted over nine gaze positions per eye. Free text hides which positions were tested and what was found in each; a 3x3 grid lets a clinician see at a glance where a limitation lies, provided the position of every cell is stated in words rather than inferred from layout.

**Purpose** — Renders a 3x3 `<table>` per eye (or one binocular grid, taken from the first supplied eye). Each cell is a 44px-minimum button with the supplied position label printed inside, the supplied value ("-2", "Full", "N") in large type, an optional badge and note, and an accessible name "<eye> <position>: <value>". The selected cell has a thick border, a check icon and `aria-pressed="true"`. A cell with a status other than `recorded` shows its plain words ("Not assessed", "Unable to assess", "Not applicable", "Declined", "Unknown"); a missing cell or a `recorded` cell without a value shows "Not supplied". An "Edit <eye>, <position>" button appears under the grids when a cell is selected. `readOnly` renders the same grid without buttons. The cells sit in the declared position order (up-right, up, up-left, then right, primary, left, then down-right, down, down-left); the component never mirrors, grades, judges normality or decides which positions apply.

**API**
```ts
export type GazePosition = 'up-right' | 'up' | 'up-left' | 'right' | 'primary' | 'left' | 'down-right' | 'down' | 'down-left';
export interface MotilityCell { readonly valueLabel: string | null; readonly status: ClinicalAssessmentStatus; readonly badge?: EmrBadge; readonly note?: string }
export interface MotilityEye { readonly eyeId: string; readonly label: string; readonly shortLabel: string; readonly cells: Readonly<Partial<Record<GazePosition, MotilityCell>>> }
export interface OcularMotilityViewModel { readonly id: string; readonly title: string; readonly layout: 'per-eye' | 'binocular'; readonly eyes: readonly MotilityEye[];
  readonly positionLabels: Readonly<Record<GazePosition, string>>; readonly selected?: { readonly eyeId: string; readonly position: GazePosition };
  readonly readOnly?: boolean; readonly summaryText: string }
export type OcularMotilityIntent = { type: 'cellSelected'; eyeId: string; position: GazePosition } | { type: 'cellEditRequested'; eyeId: string; position: GazePosition };

export class EmrOcularMotilityChartComponent {
  @Input({ required: true }) model!: OcularMotilityViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<OcularMotilityIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `OcularMotilityViewModel` (required) | — | all labels, values, statuses and badges controller-supplied |
| `headingId` | `string` | generated | id of the title heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<OcularMotilityIntent>` | — | `cellSelected`, `cellEditRequested` |

**Example**
```html
<emr-ocular-motility-chart [model]="motilityModel" (intent)="onMotilityIntent($event)" />
```

**Known gaps**
- Position text sits inside each cell instead of in separate row and column header cells, because the position labels are per cell ("Up and right"), not per row or column.
- Layout follows the declared position order with no left-right mirroring; the controller chooses the wording of `positionLabels` so the patient's or the examiner's side is explicit.
- `selected` is controlled: the component does not move the selection itself, it emits `cellSelected` and waits for a new model.
- Values longer than six characters use a smaller proportional font so they wrap by word; very long values still wrap inside narrow cells.
- Binocular layout uses only the first entry of `eyes`.

**Depends on** — none (uses `NgIcon` and the shared `.emr-badge` and `.emr-button` styles).

**Used by** — none yet (intended for strabismus and neuro-ophthalmology examinations).

---

### EmrObservationFlowsheet
**Layer** L4 · **Selector** `emr-observation-flowsheet` · **Status** stable · **Story** `emr-observations-flowsheet--vital-signs`

**Need** — Inpatient care reads observations as rows against time: vitals over a shift, cumulative labs beside a reference range, intake and output with totals, and a medication administration record. Clinicians scan across a row for a trend and down a column for one moment, so both headers must stay visible while the grid scrolls sideways.

**Purpose** — Renders a real `<table>` (caption, `scope="col|row|rowgroup"`) with a sticky header row and sticky first column, scrolling horizontally inside a focusable region so the page never overflows. Optional row groups, an optional reference-range column (shown only when a row supplies `referenceLabel`), a sticky footer for controller-computed totals and balances, a "Current" column marker (text, not colour alone), per-cell flag badges (badge text plus assistive text), and cell notes. A cell with no value shows the wording for its `status` (Not assessed, Unable to assess, Not applicable, Declined, Unknown), and an absent value shows "Not supplied", so the six no-value states never collapse. Editable cells (supplied `editable`, ignored when `readOnly`) are 44px buttons that emit `cellSelected`; column and row headers become buttons that emit `columnSelected` / `rowSelected`; an "Add column" button emits `columnAddRequested`. The component never totals, flags, converts units, draws trend arrows or decides what is editable.

**API**
```ts
export interface FlowsheetColumn { readonly id: string; readonly label: string; readonly sublabel?: string; readonly current?: boolean }
export interface FlowsheetRow { readonly id: string; readonly label: string; readonly unitLabel?: string; readonly referenceLabel?: string; readonly groupId?: string; readonly path?: EmrNodePath }
export interface FlowsheetCell { readonly valueLabel: string | null; readonly status?: ClinicalAssessmentStatus; readonly flag?: EmrBadge; readonly note?: string; readonly editable?: boolean }
export type FlowsheetCellMap = Readonly<Record<string, Readonly<Record<string, FlowsheetCell>>>>; // rowId -> columnId -> cell
export interface FlowsheetViewModel {
  readonly id: string; readonly title: string; readonly groups?: readonly { id: string; label: string }[];
  readonly rows: readonly FlowsheetRow[]; readonly columns: readonly FlowsheetColumn[]; readonly cells: FlowsheetCellMap;
  readonly footerRows?: readonly FlowsheetRow[]; readonly footerCells?: FlowsheetCellMap;
  readonly selectedCell?: { rowId: string; columnId: string }; readonly emptyMessage: string;
  readonly loading?: boolean; readonly error?: string; readonly readOnly?: boolean;
}
export type FlowsheetIntent =
  | { type: 'cellSelected'; rowId: string; columnId: string } | { type: 'columnSelected'; columnId: string }
  | { type: 'columnAddRequested' } | { type: 'rowSelected'; rowId: string } | { type: 'retryRequested' };

export class EmrObservationFlowsheetComponent {
  @Input({ required: true }) model!: FlowsheetViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<FlowsheetIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `FlowsheetViewModel` (required) | — | rows, columns, cells, optional footer totals; all labels controller-supplied |
| `headingId` | `string` | generated | id of the visible title, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<FlowsheetIntent>` | — | `cellSelected`, `columnSelected`, `rowSelected`, `columnAddRequested`, `retryRequested` |

**Example**
```html
<emr-observation-flowsheet [model]="vitalsSheet" (intent)="onSheetIntent($event)" />
```

**Known gaps**
- The selected cell is marked with `aria-current="true"` on its button plus an outline, not `aria-selected`: `aria-selected` is not valid on a plain table cell, and switching to `role="grid"` would promise arrow-key grid navigation this component does not implement. Every editable cell is a Tab stop instead.
- Only editable cells are buttons; read-only cells cannot be selected. Wide sheets therefore add one Tab stop per column header, per row header and per editable cell; there is no roving tabindex or virtualisation yet (40 columns render fine).
- Column selection has no selected state in the model, so the host decides how to show it.
- The no-value wording ("Not assessed" and so on) is fixed English text keyed by `status`; the other labels come from the controller.
- No frozen footer for print, no column resize, no cell edit surface (the host opens its own editor on `cellSelected`).

**Depends on** — `EmrStateMessageComponent`.

**Used by** — none yet (intended for inpatient observation charts, lab review and the MAR).

---

---

### EmrObservationTrend
**Layer** L4 · **Selector** `emr-observation-trend` · **Status** stable · **Story** `emr-observations-trend--blood-pressure`

**Need** — A trend is quicker to read as a line than as a column of numbers: blood pressure over a week, intraocular pressure in the right and left eye across visits, HbA1c, a child's weight against growth reference curves, and on the ward serum potassium against safe and danger ranges, SpO2 against a lower target, creatinine against an upper limit, or two measures on two scales (heart rate with blood pressure, glucose with insulin rate). The chart must still work without a mouse, without colour vision, and with a screen reader.

**Purpose** — Draws one or more series as an inline SVG line-and-marker chart with no chart library. The controller supplies the axes (`xMin`/`xMax`/`yMin`/`yMax`, ticks and labels, an optional right-hand `secondaryAxis`, optional unlabelled `xMinorTicks`), reference bands (closed or open-ended), growth `referenceCurves`, flagged points, an optional granularity caption and selector, and a plain-language `summaryText`; the component only maps those numbers to pixels for the measured width. A band without `yFrom` runs to the bottom of the plot and one without `yTo` to the top; bands are clipped to the plot, get a dashed line at each supplied bound and an optional `edgeLabel` at that line. Bands differ without colour by `pattern` (`solid` or `hatched`, an SVG pattern unique per instance), by their legend swatch (an edge is drawn only on bounded sides) and by their supplied `label`, which must name an open-ended band as such ("Target 94 % and above"); the component never composes band wording. Series and bands with `axis: 'secondary'` scale against `secondaryAxis` (falling back to primary when it is absent), and on a dual-axis chart the legend says "(left axis)" or "(right axis)". Colour comes from the existing `emr-tone-*` classes via `currentColor`, never hex. Series also differ by marker shape (circle, square, diamond, triangle) and dash, flagged points get an extra ring, and the legend is text. Accessibility: the picture is `<svg role="img">` titled from `title` and described only by `summaryText`, a visually hidden table lists every point with its unit and axis, and the points form one keyboard listbox (a single Tab stop): left and right move along a series, up and down switch series, Home and End jump, Enter or Space emits `pointSelected`. The granularity selector is a group of `aria-pressed` buttons emitting `granularityChangeRequested`. It never computes percentiles, smooths, finds outliers, converts units, chooses the y range, decides which values are abnormal, picks ticks for a granularity, or parses dates. Bound clipping and axis resolution live in the controller package as pure helpers (`clipTrendBand`, `resolveTrendAxis`).

**API**
```ts
export type TrendAxis = 'primary' | 'secondary';
export interface TrendPoint { readonly id: string; readonly x: number; readonly y: number; readonly xLabel: string; readonly valueLabel: string; readonly flag?: EmrBadge }
export interface TrendSeries {
  readonly id: string; readonly label: string; readonly tone: EmrTone; readonly points: readonly TrendPoint[]; readonly dashed?: boolean;
  readonly axis?: TrendAxis; readonly unitLabel?: string;
}
export interface TrendBand {
  readonly id: string; readonly label: string; readonly yFrom?: number; readonly yTo?: number; readonly tone: EmrTone;
  readonly axis?: TrendAxis; readonly pattern?: 'solid' | 'hatched'; readonly edgeLabel?: string;
}
export interface TrendCurve { readonly id: string; readonly label: string; readonly points: readonly { x: number; y: number }[] }
export interface TrendSecondaryAxis { readonly yLabel: string; readonly yMin: number; readonly yMax: number; readonly yTicks: readonly { y: number; label: string }[] }
export interface ObservationTrendViewModel {
  readonly id: string; readonly title: string; readonly yLabel: string; readonly yMin: number; readonly yMax: number; readonly xMin: number; readonly xMax: number;
  readonly xTicks: readonly { x: number; label: string }[]; readonly yTicks: readonly { y: number; label: string }[];
  readonly secondaryAxis?: TrendSecondaryAxis; readonly xGranularityLabel?: string; readonly xMinorTicks?: readonly { x: number }[];
  readonly granularityOptions?: readonly { id: string; label: string; selected?: boolean }[];
  readonly series: readonly TrendSeries[]; readonly bands?: readonly TrendBand[]; readonly referenceCurves?: readonly TrendCurve[];
  readonly selectedPointId?: string; readonly summaryText: string; readonly emptyMessage: string; readonly readOnly?: boolean;
}
export type ObservationTrendIntent =
  | { type: 'pointSelected'; seriesId: string; pointId: string }
  | { type: 'rangeChangeRequested'; xMin: number; xMax: number }
  | { type: 'granularityChangeRequested'; granularityId: string };

// Pure helpers (controller package)
export function resolveTrendAxis(item: { axis?: TrendAxis }, model: Pick<ObservationTrendViewModel, 'yLabel' | 'yMin' | 'yMax' | 'secondaryAxis'>): TrendScale;
export function clipTrendBand(band: Pick<TrendBand, 'yFrom' | 'yTo'>, scale: Pick<TrendScale, 'yMin' | 'yMax'>): TrendBandExtent | null;

export class EmrObservationTrendComponent {
  @Input({ required: true }) model!: ObservationTrendViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<ObservationTrendIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ObservationTrendViewModel` (required) | — | axes, secondary axis, series, bands, reference curves, granularity, summary; all labels controller-supplied |
| `headingId` | `string` | generated | id of the visible title, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<ObservationTrendIntent>` | — | `pointSelected` (not emitted when `readOnly`), `granularityChangeRequested` (from the segmented control) |

**Example**
```html
<emr-observation-trend [model]="potassiumTrend" (intent)="onTrendIntent($event)" />
```

**Known gaps**
- `rangeChangeRequested` is part of the intent union for hosts that add range controls, but this component has no zoom or pan control and never emits it.
- `granularityChangeRequested` is emitted for every press, including the already-selected option; the controller re-supplies ticks, points and `selected`. The segmented control's group name is the title plus the fixed text ", time scale".
- `readOnly` is an addition to the spec'd model: it keeps the points inspectable (tooltip, keyboard) but stops them emitting `pointSelected`. It does not affect the granularity control.
- The axis words in the legend suffix and SR table ("left axis", "right axis") are fixed English text.
- An `edgeLabel` sits at the band's upper bound on a closed band and at its only bound on an open-ended one; it is omitted when that bound is off the plot. Edge labels of adjacent bands can collide; the controller should supply them sparingly.
- The legend swatch draws its top edge when `yTo` is supplied and its bottom edge when `yFrom` is, so it assumes `yFrom <= yTo` (the plot itself accepts either order).
- Gridlines follow the primary axis only; the secondary axis draws ticks but no gridlines. Reference curves always use the primary axis.
- The chart redraws to the measured width with a `ResizeObserver` (skipped on the server, which renders a 640px layout until the browser measures it).
- Tick labels are placed exactly where supplied; the controller must choose ticks that do not collide at narrow widths. Band labels live in the legend only.
- Very dense series (200 points renders fine) draw every marker; no decimation.
- Reference curves are drawn as supplied, with no percentile logic. All story data is synthetic.

**Depends on** — none (uses the shared `emr-tone-*`, `emr-badge`, `emr-empty` and `emr-sr-only` classes).

**Used by** — none yet (intended for vitals, inpatient laboratory trends, ophthalmic follow-up and paediatric growth).

---

### EmrClinicalTranscript
**Layer** L4 · **Selector** `emr-clinical-transcript` · **Status** stable · **Story** `emr-notes-transcript--with-evidence-spans`

**Need** — A dictated or typed consultation is only useful in a structured note if the clinician can see where each filled value came from. Without a visible link, summarised values have to be trusted or re-read against a wall of text.

**Purpose** — The left half of evidence-linked note capture. Shows a dictation status chip with Start and Stop buttons, a typed-note box that appends a segment, a summarise button, and the transcript as a list of segments (time label, speaker, spoken or typed). Evidence spans are inline buttons inside the text. Each carries the numbers of the fields it feeds (the same numbers the suggestion list shows), and a highlighted span gets a stronger style (solid thick underline, outline ring, filled number) plus a "Feeds N fields" strip naming those fields. Selecting a span emits `spanSelected`; the controller then sets the highlight lists. The component owns only the draft being typed and the segment being edited; every highlight and every status comes from the model. Editable segments get an edit button that emits `segmentEditRequested`. The first highlighted passage is scrolled into view inside the transcript's own scroll area, never the page. It never touches a microphone or speech API, never decides what is evidence and never summarises.

**API**
```ts
export interface TranscriptSegment { id: string; text: string; startMs: number | null; endMs: number | null; source: 'spoken' | 'typed'; speakerLabel?: string; timeLabel: string; editable?: boolean }
export interface EvidenceSpan { id: string; segmentId: string; start: number; end: number; suggestionIds: readonly string[] } // char offsets within segment.text
export interface NoteCaptureViewModel {
  id: string; title: string;
  dictation: { status: 'idle' | 'listening' | 'processing' | 'error'; label: string; canStart: boolean; canStop: boolean; error?: string };
  segments: readonly TranscriptSegment[]; spans: readonly EvidenceSpan[]; suggestions: readonly FieldSuggestion[];
  highlightedSpanIds: readonly string[]; highlightedSuggestionIds: readonly string[];
  focusedPath?: EmrNodePath; summarising?: boolean; summariseError?: string; canSummarise: boolean; readOnly?: boolean;
}
export type NoteCaptureIntent = /* shared with EmrEvidenceSuggestionList; this component emits: */
  | { type: 'dictationStartRequested' } | { type: 'dictationStopRequested' } | { type: 'textAppendRequested'; text: string }
  | { type: 'segmentEditRequested'; segmentId: string; text: string } | { type: 'summariseRequested' } | { type: 'spanSelected'; spanId: string };

export class EmrClinicalTranscriptComponent {
  @Input({ required: true }) model!: NoteCaptureViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<NoteCaptureIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `NoteCaptureViewModel` (required) | — | the same model object feeds `EmrEvidenceSuggestionList` |
| `headingId` | `string` | generated | id of the "Transcript" heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<NoteCaptureIntent>` | — | `dictationStartRequested`, `dictationStopRequested`, `textAppendRequested`, `segmentEditRequested`, `summariseRequested`, `spanSelected` |

The transcript scroll area is capped at `30rem` by default; set the CSS variable `--ct-max` on a parent to change it. Read-only hides every control (dictation, typed box, summarise, edit) and keeps span selection.

**Example**
```html
<emr-clinical-transcript [model]="note" (intent)="capture.dispatch($event)" />
<emr-evidence-suggestion-list [model]="note" (intent)="capture.dispatch($event)" />
```

**Known gaps**
- Spans that overlap an earlier span, or whose offsets fall outside the text, are skipped; only the first of two overlapping spans is a button.
- A highlighted span is made visible but several highlighted spans in different segments are not paired visually beyond their shared numbers.
- Typed entries have no clock time: `timeLabel` is empty and the "Typed" pill identifies them.
- A span is a native `<button>`, which wraps as one unit, so a long span moves to its own line on a narrow screen. Inline spans stay under 44px tall (text-flow exception); the matching field row provides the 44px target.
- Editing a segment does not re-link it; the controller drops that segment's spans.
- English UI strings (Transcript, Start dictation, Type a note, and so on) are fixed in the template.

**Depends on** — `NgIcon` (heroicons) only; no other `Emr*` component.

**Used by** — none yet (pairs with `EmrEvidenceSuggestionList`; both are driven by `NoteCaptureController`).

---

### EmrEvidenceSuggestionList
**Layer** L4 · **Selector** `emr-evidence-suggestion-list` · **Status** stable · **Story** `emr-notes-suggestions--pending`

**Need** — A summariser proposes values for form fields from a transcript. A clinician must review each one against the words that produced it, and accept, correct or refuse it, without losing track of which passage backs which field.

**Purpose** — The right half of evidence-linked note capture. Lists suggestions grouped by section. Each row shows a field number (the same number the transcript shows beside the matching passage), the field label, the proposed value, a controller-supplied confidence badge, a status badge (Needs review, Accepted, Edited, Rejected), any validation messages, an "Evidence: N passages" line and the quoted passages themselves with their time labels. The whole row is selectable (`suggestionSelected`), and a selected row is emphasised with a thick left bar, outline, filled number and a "Highlighted" status line. Pending rows offer Accept, Edit and Reject; reviewed rows offer Reopen. Edit opens an inline control chosen by `valueType`: select from `options`, number, date, multiline text or text; it emits `suggestionEdited`. An edited row shows the suggested and the edited value side by side. The header has "Accept all pending (N)" and "Clear highlight". Nothing is applied to a form: the controller applies accepted suggestions. The component does no validation, re-ranking or path lookup.

**API**
```ts
export type SuggestionStatus = 'pending' | 'accepted' | 'edited' | 'rejected';
export interface FieldSuggestion {
  id: string; path: EmrNodePath; fieldLabel: string; sectionLabel?: string;
  value: ClinicalFieldValue; valueLabel: string; editedValue?: ClinicalFieldValue; editedValueLabel?: string;
  spanIds: readonly string[]; status: SuggestionStatus; confidence?: EmrBadge; valueType: EmrValueType;
  options?: readonly EmrOption[]; messages?: readonly EmrValidationMessage[];
}
/** NoteCaptureViewModel and NoteCaptureIntent are shared with EmrClinicalTranscript. This component emits: */
export type SuggestionIntents =
  | { type: 'suggestionSelected'; suggestionId: string } | { type: 'suggestionAccepted'; suggestionId: string }
  | { type: 'suggestionEdited'; suggestionId: string; value: ClinicalFieldValue } | { type: 'suggestionRejected'; suggestionId: string }
  | { type: 'suggestionReopened'; suggestionId: string } | { type: 'acceptAllPendingRequested' } | { type: 'highlightClearRequested' };

export class EmrEvidenceSuggestionListComponent {
  @Input({ required: true }) model!: NoteCaptureViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<NoteCaptureIntent>();
}
```
There is deliberately no `fieldEditRequested`.

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `NoteCaptureViewModel` (required) | — | the same model object feeds `EmrClinicalTranscript` |
| `headingId` | `string` | generated | id of the "Suggested fields" heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<NoteCaptureIntent>` | — | the seven suggestion intents above |

The list scroll area is capped at `34rem` by default; set the CSS variable `--sl-max` on a parent to change it. Read-only hides Accept, Edit, Reject, Reopen and Accept-all, and keeps selection and Clear highlight.

**Example**
```html
<emr-evidence-suggestion-list [model]="note" (intent)="capture.dispatch($event)" />
```

**Known gaps**
- Inline edit supports text, multiline, integer and decimal, date and select. Other value types (quantity, coded, partial-date) fall back to a plain text box and emit a string.
- The edited value's label is supplied by the controller (`editedValueLabel`); the component never formats it.
- Edit state (which row is open, the draft) is local to the component and is lost if the row is removed.
- The field number is the suggestion's position in `model.suggestions`; grouping by section can therefore show non-consecutive numbers if the list is not ordered by section.
- English UI strings (Accept, Edit, Reject, Reopen, Needs review, and so on) are fixed in the template; the empty message is fixed text because the model has no empty-message field.

**Depends on** — `NgIcon` (heroicons) only; no other `Emr*` component.

**Used by** — none yet (pairs with `EmrClinicalTranscript`; both are driven by `NoteCaptureController`).

---

### EmrCaptureStatusBar
**Layer** L4 · **Selector** `emr-capture-status-bar` · **Status** stable · **Story** `emr-capture-status-bar--clean`

**Need** — A clinician filling in a form needs to know at a glance whether their work is safe: unsaved, saving, saved, failed, or in conflict with someone else's edit. They also need to see who authored the record and whether it is signed, co-sign pending or amended, and for consent forms who has signed. Without this strip, work is silently lost and unsigned records look final.

**Purpose** — A compact single strip that sits above or below any capture form. It renders an `EmrCaptureSessionState` snapshot as one status line (Saving…, Not saved, Not saved: conflict, Unsaved changes, Saved, No changes) in a `role="status"` region with `aria-busy` while saving. It shows the author line, a read-only chip, the signature badge with Sign and Amend buttons, and Save/Discard buttons. A save error and a conflict each appear in their own `role="alert"` block; the conflict block lists the supplied field labels and offers Keep my version, Keep their version, Merge and Show differences. Signatories are listed underneath only when present. Every state is stated in words as well as colour and icon. The controller supplies all labels, badges and permissions; the component never formats timestamps, decides who may sign, merges conflicts or runs autosave. An absent author line or signed-at label reads "Not supplied".

**API**
```ts
export interface CaptureSignatory { readonly id: string; readonly displayName: string; readonly roleLabel: string; readonly status: EmrBadge; readonly signedAtLabel?: string }
export interface CaptureStatusBarViewModel {
  readonly session: EmrCaptureSessionState; readonly savedAtLabel?: string;
  readonly attribution?: EmrAuthorAttribution; readonly attributionLabel?: string;
  readonly signature?: { readonly status: EmrBadge; readonly signatories: readonly CaptureSignatory[]; readonly canSign: boolean; readonly canAmend: boolean };
  readonly conflictLabels?: readonly string[]; readonly readOnly?: boolean;
}
export type CaptureStatusBarIntent = EmrCaptureIntent | { type: 'signRequested' } | { type: 'amendRequested' } | { type: 'conflictDetailRequested' };

export class EmrCaptureStatusBarComponent {
  @Input({ required: true }) model!: CaptureStatusBarViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<CaptureStatusBarIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `CaptureStatusBarViewModel` (required) | — | session snapshot plus every label, badge and permission |
| `headingId` | `string` | generated | id of the visually hidden "Record status" heading used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<CaptureStatusBarIntent>` | — | `saveRequested`, `discardRequested`, `conflictResolutionRequested` (`keepLocal` / `keepRemote` / `merge`), `signRequested`, `amendRequested`, `conflictDetailRequested` |

**Example**
```html
<emr-capture-status-bar [model]="statusModel" (intent)="onCaptureIntent($event)" />
```

**Known gaps**
- Timestamps are never formatted here: with no `savedAtLabel` the strip says "time not supplied", and `attribution.recordedAt` / `amendedAt` / `conflict.detectedAt` are not shown. Supply `attributionLabel` to show times.
- Without `attributionLabel`, the author line is built from `attribution.recordedBy`, `role` and `amendedBy` only.
- Save and Discard show only when there is something to save (`dirty` or `error`), not while saving or in conflict, and never when `readOnly`. Resolution buttons are hidden when `readOnly`; Show differences stays.
- The component does not confirm Discard. The controller should ask before discarding.
- Status precedence (saving, error, conflict, unsaved, saved, no changes) is display order only.
- No inline diff of conflicting values; `conflictDetailRequested` is the hook for the host to show one.

**Depends on** — none (uses the shared `.emr-button`, `.emr-badge` and `.emr-tone-*` classes and `NgIcon`).

**Used by** — none yet (intended for the top or bottom of any capture form, and consent forms via signatories).

---

### EmrScoreResultCard
**Layer** L4 · **Selector** `emr-score-result-card` · **Status** stable · **Story** `emr-scores-result-card--early-warning-score`

**Need** — A total such as "7" or "12" means nothing without its band, its parts and how fresh it is. Clinicians need NEWS2, MEWS, PEWS, PHQ-9, GCS, ASA, OSDI and VF-14 results to look the same, and the UI must never add up answers or pick the severity itself.

**Purpose** — Renders one controller-computed `EmrScoreResult` (see `scoring.models.ts`): total, band badge (label and tone exactly as supplied; "Band not supplied" when the label is empty), interpretation, component breakdown as a table whose labels are buttons (`componentSelected`), and the computed-at time. A stale result stays visible with a warning icon and text. Loading, error and any non-`recorded` assessment status (not assessed, unable to assess, not applicable, declined, unknown) replace the score; an absent result with no status reads "Not supplied". Optional Recompute / Try again and Details buttons emit intents. The `compact` variant is a slim banner (about 54px): label, total, band, stale text and icon-only action buttons; it omits interpretation and breakdown. The card never sums, bands, trends or escalates.

**API**
```ts
export interface ScoreResultCardViewModel {
  readonly id: string; readonly instrumentLabel: string; readonly result: EmrScoreResult | null;
  readonly status?: ClinicalAssessmentStatus; readonly stale?: boolean; readonly staleLabel?: string;
  readonly loading?: boolean; readonly error?: string;
  readonly canRecompute?: boolean; readonly canViewDetail?: boolean; readonly compact?: boolean;
}
export type ScoreResultCardIntent =
  | { type: 'recomputeRequested'; instrumentId: string }
  | { type: 'detailRequested'; instrumentId: string }
  | { type: 'componentSelected'; componentId: string };

export class EmrScoreResultCardComponent {
  @Input({ required: true }) model!: ScoreResultCardViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<ScoreResultCardIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `ScoreResultCardViewModel` (required) | — | everything displayed; band label and tone come from `result` |
| `headingId` | `string` | generated | id of the instrument heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<ScoreResultCardIntent>` | — | `recomputeRequested`, `detailRequested`, `componentSelected` |

**Example**
```html
<emr-score-result-card [model]="phq9Card" (intent)="onScoreIntent($event)" />
```

**Known gaps**
- `canViewDetail` is an addition to the spec view model so the Details button only appears when the controller can handle it.
- `computedAt` is printed as the supplied ISO string; the card does no date formatting or time-zone conversion.
- `EmrScoreResult` carries no assistive text for the band, so the badge shows its label with a hidden "Band:" prefix only.
- Component rows always render as buttons; the controller decides whether `componentSelected` does anything.
- Compact mode wraps to two rows at 480px and narrower.

**Depends on** — none (uses shared `.emr-badge`, `.emr-button` and `.emr-icon-button` classes and `@ng-icons/heroicons`).

**Used by** — none yet (intended for observation charts, screening forms and pre-operative assessment).

---

### EmrMedicationReconciliation
**Layer** L4 · **Selector** `emr-medication-reconciliation` · **Status** stable · **Story** `emr-medications-reconciliation--admission-twenty-rows`

**Need** — At admission, transfer and discharge a clinician must compare two medicine lists (what the patient takes at home against what is currently ordered) and record one decision per medicine: continue, modify, stop, new or unmatched. Skipped or undocumented decisions are a known source of medication errors, so each row needs its two sources side by side, a visible decision, and a reason where one is required.

**Purpose** — Renders controller-paired rows. Each side shows the medicine name (a button that requests detail), a words-first dose summary such as "1 tablet twice daily (BD), after food", optional last-taken text and source badges. A medicine present on only one list shows "Not on <list label>". Each row has a decision select labelled "Decision for <medicine>", and a reason textarea when `reasonRequired` is set. Controller messages render under the row (errors with `role="alert"`, with a text prefix so severity is never colour-alone). On containers wider than 720px it is a table with column and row headers; on narrower containers each row becomes a card that keeps both side labels visible. Summary badges, the "Complete reconciliation" button state, and the empty, loading and error states are all supplied. The component never matches medicines, counts, checks interactions or duplicates, validates a decision, or invents a dose. Dose text is shown exactly as supplied, so the controller must write the words first and never a bare abbreviation.

**API**
```ts
export interface ReconMedication { readonly id: string; readonly nameLabel: string; readonly doseSummary: string; readonly code?: EmrCodedValue; readonly badges?: readonly EmrBadge[]; readonly lastTakenLabel?: string }
export interface ReconRow {
  readonly id: string; readonly path: EmrNodePath; readonly left?: ReconMedication; readonly right?: ReconMedication;
  readonly decision?: string; readonly decisionOptions: readonly EmrOption[];
  readonly reason?: string; readonly reasonRequired?: boolean;
  readonly messages?: readonly EmrValidationMessage[]; readonly readOnly?: boolean;
}
export interface MedicationReconciliationViewModel {
  readonly id: string; readonly title: string; readonly leftLabel: string; readonly rightLabel: string;
  readonly rows: readonly ReconRow[]; readonly summary?: readonly EmrBadge[]; readonly selectedRowId?: string;
  readonly emptyMessage: string; readonly canComplete: boolean;
  readonly readOnly?: boolean; readonly loading?: boolean; readonly error?: string;
}
export type MedicationReconciliationIntent =
  | { type: 'decisionChangeRequested'; path: EmrNodePath; decision: string }
  | { type: 'reasonChangeRequested'; path: EmrNodePath; reason: string }
  | { type: 'rowSelected'; rowId: string }
  | { type: 'medicationDetailRequested'; medicationId: string }
  | { type: 'addMedicationRequested'; side: 'left' | 'right' }
  | { type: 'completeRequested' }
  | { type: 'retryRequested' };

export class EmrMedicationReconciliationComponent {
  @Input({ required: true }) model!: MedicationReconciliationViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<MedicationReconciliationIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `MedicationReconciliationViewModel` (required) | — | everything displayed; all labels, dose text, counts and badges are controller-supplied |
| `headingId` | `string` | generated | id of the title heading, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<MedicationReconciliationIntent>` | — | decision and reason changes (both carry `row.path`), row selection (on click or focus within a row), medicine detail, add medicine per side, complete, retry |

**Example**
```html
<emr-medication-reconciliation [model]="reconModel" (intent)="onReconIntent($event)" />
```

**Known gaps**
- The decision control is a native `<select>` styled with `.emr-select`, not `EmrSelectComponent`: that primitive binds `[value]` before its options render, so a pre-selected value shows as the placeholder. Switch back once the primitive marks the matching option `selected`.
- Choosing the "Not decided" placeholder is ignored (no intent); the decision stays whatever the model says.
- The reason textarea emits on every keystroke; the controller debounces or batches if needed.
- A reason textarea is marked invalid only when a message path ends in `'reason'`.
- Both `decisionChangeRequested` and `reasonChangeRequested` use the row's `path`; the controller distinguishes them by intent type.
- In print the reason shows as plain text and the add and complete buttons are hidden.
- Table and card layouts switch on the component's own width (container query), not the viewport.

**Depends on** — `EmrBadgeComponent`, `EmrButtonComponent`, `EmrStateMessageComponent`.

**Used by** — none yet (intended for admission, transfer and discharge workflows).

---

### EmrWorkQueue
**Layer** L4 · **Selector** `emr-work-queue` · **Status** stable · **Story** `emr-scheduling-work-queue--ophthalmology-opd`

**Need** — An ophthalmology OPD runs each patient through stations (Registration, Vision, Refraction, Dilation, Doctor, Counselling). Staff need to see at a glance who is where, who has waited longest, who is urgent and what happens next, and to call the next patient or move one on, without a drag-and-drop interaction that fails on touch and keyboard.

**Purpose** — Renders a board of station columns. Each station is a labelled section with a count, a "Call next" button and equal-height patient cards. A card is one 44px+ button: MRN first (never truncated), then name with age/sex, token and wait (with a clock icon), next step, then a badge row (priority first, then flags). Priority and flags are text badges. Selecting a card shows a tray with a labelled native "Move to" select and an "Open patient" button. A filter box narrows the displayed cards by name, MRN or token. Below 768px one station is shown at a time with a station switcher built on `EmrTabs`. A single station works as a "my list". The controller supplies all labels, counts, ordering, wait text and priority; the component computes nothing clinical and only emits intents. A polite live region announces `updatedLabel`. Print shows every station expanded.

**API**
```ts
export interface QueueCard { readonly id: string; readonly patientId: string; readonly tokenLabel: string; readonly displayName: string; readonly primaryIdentifier: string; readonly ageSexLabel?: string; readonly waitLabel: string; readonly priority?: EmrBadge; readonly flags?: readonly EmrBadge[]; readonly nextStepLabel?: string; readonly readOnly?: boolean }
export interface QueueStation { readonly id: string; readonly label: string; readonly countLabel: string; readonly cards: readonly QueueCard[]; readonly canCallNext: boolean }
export interface WorkQueueViewModel { readonly id: string; readonly title: string; readonly stations: readonly QueueStation[]; readonly selectedCardId?: string; readonly moveTargets: readonly EmrOption[]; readonly updatedLabel?: string; readonly emptyMessage: string; readonly loading?: boolean; readonly error?: string; readonly readOnly?: boolean }
export type WorkQueueIntent =
  | { type: 'cardSelected'; cardId: string } | { type: 'callNextRequested'; stationId: string }
  | { type: 'moveRequested'; cardId: string; stationId: string } | { type: 'patientOpenRequested'; patientId: string }
  | { type: 'refreshRequested' } | { type: 'retryRequested' };

export class EmrWorkQueueComponent {
  @Input({ required: true }) model!: WorkQueueViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<WorkQueueIntent>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `WorkQueueViewModel` (required) | — | stations, cards, move targets and every label |
| `headingId` | `string` | generated | id of the board title, used for `aria-labelledby` |
| `intent` (output) | `EventEmitter<WorkQueueIntent>` | — | select, call next, move, open patient, refresh, retry |

**Example**
```html
<emr-work-queue [model]="queueModel" (intent)="onQueueIntent($event)" />
```

**Known gaps**
- The filter and the narrow-screen station tab are view-only state kept in the component; the filter has no intent, and `countLabel` is not recomputed while filtering (a "Showing n of N" status is shown instead).
- Names, next steps and wait text are truncated with an ellipsis on a card (full text is in the accessible name and a tooltip); MRN and token never truncate. More than one line of badges makes that card taller.
- `waitLabel` should be short ("15 min"); the accessible name reads it as "waiting 15 min".
- No drag and drop, polling, wait computation, ordering or priority rules. The "Move to" select disables the card's own station.

**Depends on** — `EmrBadgeComponent`, `EmrButtonComponent`, `EmrTabsComponent`.

**Used by** — none yet (intended for OPD flow boards and clinician "my list" screens).
