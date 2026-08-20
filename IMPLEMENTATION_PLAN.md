# EMR Component System — Angular-First Plan

## Summary

Build a private, local Storybook workspace with:

- `@drguptavivek/emr-ui`: controlled Angular presentation components.
- `@drguptavivek/emr-controller`: framework-neutral TypeScript controllers and contracts.
- Storybook for discovering, testing, and selecting components.
- Angular first; React can later reuse the controller contracts through a separate React renderer.
- No Web Components, publishing, releases, deployment, or existing-application integration initially.

Use [OpenNG Optimus UI](https://github.com/openng-org/optimus-ui) selectively behind EMR wrappers. Do not expose Optimus, PrimeNG, or NG-ZORRO types through public APIs. Shadcn and Ant Design may provide design references but will not define the architecture.

## Architecture and Responsibility Boundary

- Components receive immutable view models and emit typed user intents.
- Controllers own searching, filtering, sorting, paging, selection, clinical validation, terminology lookup, API calls, persistence, routing, favourites, and order construction.
- UI may own only transient presentation behaviour such as focus management, keyboard navigation, scrolling, animation, and overlay positioning.
- Controller interface:

```ts
interface EmrController<State, Intent> {
  getSnapshot(): Readonly<State>;
  subscribe(listener: (state: Readonly<State>) => void): () => void;
  dispatch(intent: Intent): void;
  destroy(): void;
}
```

- Repository ports use promises and `AbortSignal`; they contain no Angular, RxJS, HTTP-library, or browser-storage dependency.
- Architecture tests will prohibit `HttpClient`, Router, local/session storage, repositories, and domain services inside the UI package.

## Design System and Component Catalogue

### Foundations

- Slate-led professional palette with light and dark themes and restrained semantic accents.
- Light: primary `#475F70`, background `#F6F8F9`, surface `#FFFEFA`, border `#C7D3DA`, text `#263847`.
- Dark: primary `#C5D5DF`, background `#020617`, surface `#0F172A`, raised surface `#1E293B`, border `#475569`, text `#F8FAFC`.
- System sans-serif typography, 8px control radius, soft shadows, and minimum 44px interactive targets.
- Soft rectangular primary, secondary, outline, ghost, danger, and icon buttons.
- WCAG 2.2 AA contrast, visible focus, keyboard operation, and no status communicated by colour alone.

### Core primitives

- Text, integer, decimal, date, quantity-with-unit, and paired-value inputs.
- Select and asynchronous searchable dropdowns with single and multiple selection.
- Radio group, checkbox, toggle, button, badge, chip, alert, tabs, and empty/loading/error states.
- Search components emit queries; controllers return options, selections, loading, pagination, and errors.
- Mechanical input handling belongs to primitives; clinical interpretation, normalization, and validation belong to controllers.

### Navigation and patient context

- Controlled application shell with collapsible left navigation.
- Desktop left menu: 272px expanded and 72px collapsed; mobile presentation becomes an overlay.
- Generic controlled right flyout: 440px on desktop and full-screen on mobile.
- `EmrPatientBanner`—the requested Patient Card in persistent banner form:
  - Name, MRN/UHID and other identifiers, age and sex.
  - OPD/IPD/Emergency context and location.
  - Controller-supplied criticality badge and VIP flag.
  - Allergy names, chronic-disease names, and additional safety alerts.
  - Criticality and allergy status remain visible on small screens.
  - Encounter details and longer clinical summaries occupy a controlled expandable second level.
  - Badge labels and tones are controller-supplied rather than clinically interpreted by the component.

### Patient and clinical components

- Responsive searchable patient list: accessible table on wide screens and patient cards on narrow screens.
- Configurable encounter timeline with horizontal and vertical orientations.
- Controller-defined event types, labels, icons, tones, and actions.
- Generic controlled clinical lists with thin domain views for:
  - Medications
  - Allergies
  - Chronic diseases
  - Significant personal history
- List components only render supplied records and emit add, edit, remove, select, or action intents.

### Schema-driven clinical assessment matrix

Create one specialty-neutral `EmrClinicalMatrix` rather than separate ophthalmology and neurology grids.

```ts
interface ClinicalMatrixSchema {
  id: string;
  label: string;
  columnGroups?: ClinicalColumnGroup[];
  columns: ClinicalColumn[];
  rows: ClinicalRow[];
}

interface ClinicalRow {
  id: string;
  label: string;
  type:
    | 'text'
    | 'integer'
    | 'decimal'
    | 'select'
    | 'boolean'
    | 'date'
    | 'quantity'
    | 'custom';
  applicableColumnIds?: string[];
  unit?: string;
  precision?: number;
  options?: ClinicalOption[];
  customRendererKey?: string;
}
```

- Ophthalmology schema: Right eye/OD, Left eye/OS, and one remarks field per row.
- Neurology schema: grouped right/left upper and lower limbs, with rows such as power, tone, and reflexes.
- A row has one controller-defined type across its applicable columns.
- Non-applicable cells render clearly as unavailable rather than editable.
- Core cell types have a custom-renderer extension point for future specialty controls.
- Values, read-only state, warnings, and errors are controller-supplied.
- Events include `cellEditRequested`, `remarkEditRequested`, `cellFocused`, and custom-cell intents.
- Wide layouts use a semantic table with sticky labels; narrow layouts convert each clinical row into a stacked card while preserving body-site group labels.
- Schema authoring, row addition, and reordering are outside the first UI catalogue; a controller can replace the schema dynamically.

### Orders and favourites

- Generic hierarchical order picker reused for laboratory and radiology catalogues.
- Controller manages remote search, hierarchy expansion, lazy loading, deduplication, selected orders, and errors.
- Users may select individual items or controller-marked selectable groups; group additions require a preview before confirmation.
- Laboratory order fields: urgency, fasting status, and notes.
- Radiology order fields: urgency, body site/laterality, contrast, and clinical indication.
- Generic right flyout remains independent of a dedicated `EmrFavouritesPanel`.
- Favourites tabs: medications, laboratory, radiology, and combinations.
- Full controlled management: search, create, rename, edit, reorder, delete, and apply.
- Favourite editing uses a stacked view within the flyout.
- Combinations contain non-nested typed order templates. The controller resolves current catalogue items and reports unavailable or conflicting entries when applied.

## Storybook and Delivery Sequence

Use [Storybook for Angular](https://storybook.js.org/docs/get-started/frameworks/angular) with synthetic patient data only.

1. Scaffold the private workspace, controller contracts, tokens, light/dark themes, icons, and Storybook.
2. Build buttons and core form primitives, including controlled asynchronous search/select.
3. Build the shell, left navigation, right flyout, patient banner, patient list, and timeline.
4. Build the clinical lists and schema-driven clinical matrix, including ophthalmology and neurology examples.
5. Build laboratory/radiology ordering and group-preview flows.
6. Build favourites management and controller-backed demonstration journeys.
7. Integrate with an application only after the contracts and visual behaviour are stable.

Each story group will include default, populated, empty, loading, error, disabled, read-only, long-content, light, dark, desktop, tablet, and mobile states.

## Test and Acceptance Criteria

- UI unit tests verify rendering, accessibility, intent emission, and absence of input mutation.
- Controller tests use fake repositories for search cancellation, stale responses, pagination, hierarchy expansion, validation, group previews, favourites CRUD, and combination resolution.
- Interaction tests cover keyboard-only search, multi-select, navigation, flyout focus restoration, timeline navigation, and matrix editing.
- Automated accessibility checks and visual regressions run at 360px, 768px, and 1280px in both themes.
- Angular SSR/hydration is tested for overlays, timelines, responsive layouts, and browser-global access.
- Acceptance examples:
  - Patient banner shows identity, care location, criticality, VIP, allergies, and chronic diseases without colour-only meaning.
  - The same matrix renders an OD/OS assessment and a four-limb neurological assessment from different schemas.
  - Laboratory and radiology groups cannot be bulk-added without controller-provided preview.
  - No workflow component performs network calls, persistence, routing, clinical validation, or hidden domain-state mutation.

## Assumptions

- Angular 22 is the first renderer, aligned with the existing Angular application; compatibility follows the [Angular version matrix](https://angular.dev/reference/versions).
- OpenNG components are replaceable internal implementation details.
- React support means a later React presentation package—not wrapping Angular or converting the UI into Web Components.
- No FHIR, terminology-server, or backend wire format is imposed by the UI package; controller adapters perform those mappings.
- Existing EMR code is reference material only and will not be edited during the initial library build.
- All packages remain private and locally linked; no npm release is part of this plan.

The first implementation action is to scaffold the contracts, themes, Storybook, and one vertical slice comprising Button, Text/Decimal input, Patient Banner, and the controlled Clinical Matrix.

## Clinical Catalogue Expansion

The next catalogue increment uses reusable controlled patterns rather than a separate Angular class for every specialty form:

- `EmrClinicalForm` and `EmrRepeatableGroup` cover chief complaints, history of present illness, past medical and surgical history, family history, general physical examination, and cardiovascular, respiratory, abdominal, dermatology, genitourinary, and narrative neurology examinations.
- `EmrStagedChecklist` supports controller-defined phased safety workflows. The synthetic surgical-safety story is illustrative and based on the WHO three-phase structure; local wording and governance remain application responsibilities.
- `EmrFamilyPedigree` renders controller-supplied family people and relationships with an equivalent accessible relationship list. It does not infer inheritance or genetic risk.
- The existing `EmrClinicalMatrix` supplies ophthalmic recipes for external eye, anterior segment, retina, visual acuity, IOP, and refraction. A dedicated controlled `EmrSpectaclePrescription` presents prescription fields as columns with Right eye (OD) and Left eye (OS) as rows.
- `EmrDiagnosticResultSummary` supplies perimetry and future diagnostic summaries without deriving clinical classifications.
- `EmrDocumentUploadQueue` and `EmrPatientDocuments` provide controlled file intake and document-library views without upload, storage, preview authorization, or network ownership.

The default presentation is light-first, using pearl white, mist grey, pale blue-slate, and soft neutral surfaces. Dark mode remains an opt-in theme. Shared field frames, section cards, twelve-column grids, help/error geometry, 44px targets, and responsive breakpoints govern alignment across all catalogue components.

Browser independence is an acceptance requirement: standards-based HTML/CSS and file input APIs, no vendor-prefixed workflow APIs, no browser globals during initial render, Angular SSR/hydration safety, and automated Chromium, Firefox, and WebKit coverage at mobile, tablet, and desktop widths.

Clinical states such as not assessed, unable to assess, not applicable, declined, and unknown remain distinct controller values. Components never collapse them into empty strings or booleans, and never infer validation, completion, normality, progression, prescription correctness, or safety status.

## Reusable Field and EHR Template Authoring

The catalogue now includes two modular, controlled authoring layers:

- `EmrFieldGenerator` defines reusable field identity, type, presentation metadata, units, cardinality, and declarative validation rules. It exposes separate terminology roles for question meaning, answer value set, UCUM unit, and classification mapping.
- `EmrTemplateComposer` searches a controller-supplied field library and assembles revision-pinned field snapshots into ordered sections, with live clinical-form preview and controlled artifact import/export.

Terminology services are accessed only through framework-neutral promise ports using `AbortSignal`. Consumer adapters configure endpoints, authentication, licenses, editions, jurisdictions, versions, and pagination for LOINC, SNOMED CT, ICD-10, ICD-11, UCUM, or other sources. Angular components neither call these APIs nor interpret their codes.

The internal versioned JSON definition remains the authoring source of truth. FHIR `Questionnaire` is the primary interoperable template mapping; a FHIR `Bundle` is exchange packaging, not the field-definition model. Exact R4, R4B, or R5 mappings and implementation-guide constraints are supplied through the artifact controller port. Invalid imports do not mutate the template, and warning-bearing imports require explicit acceptance.

The first authoring increment intentionally excludes conditional enablement, calculated fields, scoring, signatures, workflow routing, and terminology-service authentication UI. These remain future controller and adapter capabilities after the base contracts are stable.
