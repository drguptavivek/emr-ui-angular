# EMR UI Handoff Notes

## Scope covered so far

Angular-first EMR component system with controlled UI components and Storybook integration is in place and being actively developed in this workspace.

## What is done

- Core infrastructure and conventions are implemented
  - Controlled component architecture (controller ownership pattern preserved)
  - Storybook workspace with synthetic/demo stories
  - Theme system and color stories
  - Architecture tests and controlled-boundary checks
  - OpenNG/optimus usage as internal implementation detail (not exposed publicly)
- Clinical annotation card (newly added)
  - `EmrClinicalAnnotationCanvasComponent` added for anatomy/retina drawings:
    - background image selection
    - tools: text, line, curve, circle, polygon, freeform
    - independent drawing layers with show/hide/delete/reorder intent and per-layer management
    - undo/redo + save intent emission
    - browser-independent pointer drawing logic with normalized coordinates
    - exported from public API
  - Annotation styling added in shared CSS theme file (`emr.css`)
  - Fallback body/limb/scalp/body/retina templates included in component constants
- Patient + navigation components in place
  - `emr-app-shell`, `emr-left-nav`, `emr-right-flyout`
  - `emr-patient-banner`, `emr-patient-list`
- Timeline and safety/history components
  - `emr-timeline`
  - `emr-pac-checklist`, `emr-staged-checklist`, `emr-family-pedigree`
- Clinical components in place
  - `emr-clinical-list`
  - `emr-clinical-matrix`
  - `emr-section-card`, `emr-repeatable-group`, `emr-clinical-form`, `emr-field-frame`
  - spectacle-related prescription and diagnostics components
- Ordering + favourites
  - `emr-hierarchy-order-picker`, `emr-order-details`
  - `emr-favourites-panel`
- Authoring + terminology tools
  - `authoring` package (field generator, validation rule editor, terminology search)
  - `templates` package (template composer/preview/library picker)
  - associated template import/export/race-condition integrity work has been audited multiple times
- Documents
  - `emr-document-upload-queue`
  - `emr-document-viewer`
  - `emr-patient-documents` (including full-screen/zoom interactions scaffolded in component architecture)
- Primitives and feedback surfaces
  - button, input/typed fields, search-select, choice, tabs, feedback
- Existing component tree includes these component story files
  - foundations, safety/checklist, clinical-history, clinical-assessment, ophthalmology-assessment, pac/system examinations, documents, orders, field generator, templates, etc.

## Recently completed (previously pending)

- Re-usable annotation payload serialization contract in the controller layer: `annotation.models.ts` adds `AnnotationDocument` (versioned), `AnnotationLayerRecord`, an `AnnotationRepositoryPort` (Promise + `AbortSignal`), and `serialize/deserializeAnnotationDocument` helpers. Exported from `@drguptavivek/emr-controller`. UI still owns only transient drawing and emits the `saveRequested` intent.
- `EmrSeparatorComponent` primitive (horizontal / labelled / vertical), exported from the public API with styles and a Storybook story.
- Modular layout primitives in `layout/emr-card-layout.component.ts`, exported from the public API with styles and stories:
  - `EmrCard` single-card wrapper
  - `EmrColumns` configurable 2/3-column layout (`count` or explicit `widths`), stacks on mobile
  - `EmrFieldValueRow` full-width clinical field / value / remarks / notes row

## Still pending

- New PAC checklist and other domain-specific screen compositions asked in later turns should be reviewed for completion status against this handoff before closing the milestone
- Dedicated colour/utility catalogue sections, if not yet finalized

## Open quality notes to carry forward

- Keep everything browser-independent and non-portal global-state dependent
- Light-first slate direction with a fully supported dark theme from day 1: both `emr-theme-light` and `emr-theme-dark` are token sets in `emr.css`, exercised by the Storybook toolbar theme toggle and the Playwright dark-theme axe + visual baselines. Avoid strongly saturated primary palettes in either theme.
- Maintain strict vertical/horizontal alignment and equal row heights in tabular/card grid layouts
- Keep component APIs minimal and presentation-only; business logic remains in controller layer
- Any new component modules should use content-projection or explicit view models with strongly typed intents only at outer control boundaries

## Recommended next implementation steps

1. Wire `AnnotationRepositoryPort` into a concrete controller + save/load journey story when persistence is required.
2. Extend annotation use-cases in Storybook to cover surgery/dermatology/retina with per-class audit and optional restricted class dictionaries.
3. Add quick visual sanity stories for equal-height behavior across desktop/tablet/mobile using the new layout primitives.
4. Add Playwright visual baselines for the new `Foundations / Layout primitives` stories in both themes.
5. Continue keeping public exports and barrel exports in sync when adding any new primitives/components.

Completed: `EmrSeparatorComponent`, single / 2-col / 3-col configurable card layouts, full-width field/value/remarks/notes row, and the annotation serialization contract (see "Recently completed").

## Latest progress update

- Added photo-annotation support for specialty imaging workflows:
  - Upload support with per-annotation class/label assignment
  - Per-layer class visibility and re-labeling controls
  - Dedicated Storybook stories: `Dermatology`, `RetinaPairs`, `SurgeryPlanning`, and `DermatologyReadonly`
  - Reusable fallback label sets and clinical templates for skin/retina/surgical workflows
- Files changed:
  - `packages/emr-ui/src/lib/clinical/emr-clinical-annotation-canvas.component.ts`
  - `packages/emr-ui/src/lib/styles/emr.css`
  - `packages/emr-ui/src/lib/stories/photo-annotation.stories.ts`
- Validation run:
  - `pnpm build:controller`
  - `pnpm build:ui`
  - `pnpm build:storybook`

## Recent session notes

- UI is light-first slate, with dark mode supported from day 1 (`emr-theme-dark` tokens, Storybook toggle, and dark axe/visual coverage). Keep both themes in sync when adding tokens.
- Keep browser-independence as required: no routing/storage/window-dependent behaviour was introduced in the annotation component.
- Avoid adding heavy validation, networking or persistence in UI layer; keep annotation save as intent-driven with controller ownership of storage.
