# L4 — Domain

L4 is the clinical-semantics layer: components here know they represent a *patient banner*, an *allergy list*, a *PAC checklist*, or an *order picker* — as opposed to L3's specialty-neutral containers. Every L4 component still receives an immutable, controller-supplied view model and emits a typed intent/output; none of them perform HTTP calls, routing, persistence, terminology lookups, or clinical interpretation (completion, normality, fitness, clearance, safety). Badge tones, labels, statuses, and even fallback vocabulary are controller-supplied wherever the architecture holds — the one documented exception is `EmrDocumentViewer`'s zoom/pan/rotate, which is transient presentation state the UI is explicitly allowed to own (see that entry), and `EmrClinicalAnnotationCanvas`'s built-in fallback templates/labels, flagged below as a soft boundary case.

Per the verified intra-UI import graph, L4 components mostly depend only on L1 primitives or nothing at all. Two same-layer edges exist (`EmrHierarchyOrderPicker → EmrOrderDetails`) and one L3 edge (`EmrPacChecklist → EmrClinicalForm`). No L4 component is imported by anything outside this layer in the verified graph.

Source directory: `packages/emr-ui/src/lib/domain/` (patient banner/list, timeline, app shell/left nav/right flyout, four clinical-list wrappers + annotation canvas + diagnostic result summary + spectacle prescription, staged/PAC checklists, family pedigree, documents, orders, favourites).

---

## Patient context

### EmrPatientBanner
**Layer** L4 · **Selector** `emr-patient-banner` · **Status** stable · **Story** `emr-patient-and-navigation--patient-card`

**Need** — Every clinical screen needs a persistent, glanceable identity strip: who the patient is, their care context, and any criticality/VIP/allergy signal, without forcing every consuming screen to re-derive that layout.

**Purpose** — Renders a two-level banner: a compact primary row (name, primary identifier, age/sex, criticality/VIP/care-setting badges, up to two allergy chips plus an overflow count) and a controller-toggled expandable second level (encounter details, full identifier list, chronic-disease chips, combined additional alerts). It does not decide whether to expand, does not compute badge tone/label, and does not interpret an empty `allergies`/`chronicDiseases` array as "none recorded" — `allergyStatus`/`chronicDiseaseStatus` carry that meaning explicitly, and the component falls back to the literal string "Additional alert status not supplied." only when the controller supplies zero combined alerts.

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
  /** Explicitly supplied allergy status; an empty allergy list has no semantic meaning by itself. */
  allergyStatus?: EmrBadge;
  chronicDiseases: readonly PatientAlert[];
  /** Explicitly supplied chronic-disease status; an empty list has no semantic meaning by itself. */
  chronicDiseaseStatus?: EmrBadge;
  alerts: readonly PatientAlert[];
  expanded: boolean;
}

export class EmrPatientBannerComponent {
  @Input({ required: true }) patient!: PatientBannerViewModel;
  @Input() detailsId = 'emr-patient-banner-details';
  @Output() readonly expandedChangeRequested = new EventEmitter<boolean>();
}
```

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `patient` | `PatientBannerViewModel` (required) | — | full immutable snapshot |
| `detailsId` | `string` | `'emr-patient-banner-details'` | DOM id for the `aria-controls`/expandable region |
| `expandedChangeRequested` (output) | `EventEmitter<boolean>` | — | requests the controller flip `patient.expanded`; the component never mutates it itself |

**Example**
```html
<emr-patient-banner [patient]="patientBanner" (expandedChangeRequested)="onExpandToggle($event)" />
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
  <div class="emr-stack"><emr-patient-banner [patient]="patient" /></div>
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
**Layer** L4 · **Selector** `emr-clinical-annotation-canvas` · **Status** stable · **Story** `emr-clinical-photo-annotation--dermatology` (also `--retina-pairs`, `--surgery-planning`, `--dermatology-readonly`)

**Need** — Dermatology, retina and surgical-planning documentation needs a drawing surface over a clinical image: mark lesions, incisions and measurement lines, label them from a controller-defined vocabulary, and hand the resulting layers back as immutable state.

**Purpose** — A six-tool annotation surface over one controller-supplied background image. It has a togglable layer panel (visibility, reorder, delete, class per layer), local undo/redo (up to 40 snapshots) and a save action. Every mutation goes through `applyState()`, which emits a `stateChanged` intent carrying the whole next state plus a `reason` string; undo/redo emit `undoRequested`/`redoRequested`. It never persists, never reads or uploads files, never supplies background images or class vocabularies, and never assigns clinical meaning to a shape beyond the `availableLabels` a user attaches to a layer.

**Contract** — All types live in `@drguptavivek/emr-controller` (`annotation.models.ts`); the component declares none of its own. Layers are the durable `AnnotationLayerRecord` union (`text` · `line` · `circle` · `AnnotationPathRecord` for `curve`/`polygon`/`freeform`), so a saved `AnnotationDocument` (schema v2) holds exactly what the canvas draws.

```ts
export interface EmrClinicalImageTemplate {
  id: string; label: string; imageUrl: string;
  width: number; height: number;          // intrinsic pixels — sizes the drawing surface
  altText?: string;
}
export interface EmrAnnotationLabel { id: string; label: string; description?: string; color?: string; }
export interface EmrClinicalAnnotationCanvasState {
  instanceId: string; title: string; description?: string;
  imageTemplates: readonly EmrClinicalImageTemplate[]; availableLabels: readonly EmrAnnotationLabel[];
  selectedImageId?: string; selectedLabelId?: string; selectedTool?: AnnotationTool;
  brushColor: string;                      // required: a mark's colour is saved data
  brushWidth?: number; layers: readonly AnnotationLayerRecord[]; selectedLayerId?: string;
  textContent?: string; showLayerPanel?: boolean; photoUploadHint?: string; readOnly?: boolean; photoAccept?: string;
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

**Coordinates.** Points are normalized to the background image's intrinsic rectangle: (0,0) top-left, (1,1) bottom-right, with x and y scaled separately. The canvas takes the image's own aspect ratio (`width / height`) and the SVG overlay uses the image's pixel size as its `viewBox`. The pointer, the painted image and the overlay therefore share one rectangle at every rendered size, so there is no letterboxing and marks stay registered on resize. Strokes use `vector-effect: non-scaling-stroke`.

**Attributes**

| name | type | default | notes |
|---|---|---|---|
| `model` | `EmrClinicalAnnotationCanvasState` (required) | — | image templates, labels, layers, tool/brush selection |
| `headingId` | `string` | `'emr-clinical-annotation-canvas-heading'` | root `aria-labelledby` target |
| `intent` (output) | `EventEmitter<EmrClinicalAnnotationCanvasIntent>` | — | `stateChanged` / `undoRequested` / `redoRequested` / `saveRequested`, always carrying full state |
| `nativeFilesSelected` (output) | `EventEmitter<readonly File[]>` | — | sanctioned escape hatch (api-conventions §2.4). The controller reads the file, registers it, and answers with a new template (stable id, URL, intrinsic size) in the next `model`. |

The controller must supply each template's **true** intrinsic `width`/`height`. Wrong dimensions make `object-fit: contain` letterbox the image inside the surface, and marks misregister again; nothing flags this.

**Example**
```html
<emr-clinical-annotation-canvas [model]="annotationState" (intent)="onAnnotationIntent($event)" (nativeFilesSelected)="onPhotoSelected($event)" />
```

**Known gaps.**

1. **One layer list for all backgrounds.** `layers` is not keyed by image, so switching or uploading a background keeps marks drawn on the previous one. The durable document ties layers to one `background`; multi-view records are drawing-plan Phase 4.
2. **Text size ignores `fontSize`.** `.emr-annotation-canvas__text { font-size: 48px }` (the one deliberate literal) overrides the SVG attribute, and is in image pixels, so labels shrink with the image.
3. **Undo/redo history is component-owned** and is reset whenever `model` changes. Controlled revision history is drawing-plan Phase 4.
4. **Tall images are not height-capped.** A portrait template renders at full column width, so the page may scroll.
5. **Icon-only layer buttons** (➕, 👁, 🗑) use emoji glyphs rather than the shared icon set. The canvas is not yet in the Playwright axe set.

**Depends on** — `NgIcon`; types from `@drguptavivek/emr-controller`
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
