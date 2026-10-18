# Changelog

Current state and pending work live in `handoff.md`. Exact changes and authorship live in Git.

## 18 October 2026 — emr-react and form matrix blocks

- **New package `@drguptavivek/emr-react`**: React Native components (Expo, and web through react-native-web) rendering the same view models and intents as emr-ui. Tokens are generated from `emr.css`; theming is a provider with token overrides; built-in strings come from a labels provider. Verified on web in a Next.js 16 harness; native verification is pending.
- **Form matrix blocks.** `ClinicalFormBlock` gains `kind: 'matrix'`: a rows × columns grid (e.g. IOP / CDR × OD / OS) whose cells are ordinary fields stored under their own ids, so intents stay `fieldEditRequested`. Rendered by both the Angular and React forms. Story: `EMR / Clinical forms / History / Per Eye Matrix`.
- **Engine-resolved visibility.** `ClinicalFieldState` gains `hidden` and `required`. Both forms skip a hidden field only while it is empty; a hidden field holding a value stays visible.
- `pnpm check` now also typechecks emr-react and the Angular stories.
- **emr-react L1 primitives (24)**: inputs (text, number, day-first date with ISO value and 8-digit keypad entry, time, date-time, quantity, OD/OS pair, checkbox, toggle, radio group), display (chip, alert, state message, separator, card, columns, field-value row, status cell) and interactive (tabs, search-select, Likert, VAS, stage stepper, time axis). Web gallery at `/gallery` in the Next harness.
- **emr-react wave 2**: L3 clinical list (+ medication, allergy, chronic disease, personal history), standalone clinical matrix (table when wide, row cards when narrow; read-only cells stay focusable); L4 patient banner (+ compact phone header), capture status bar with optional sync state (`connection`, `outbox`, `lastSync` on `CaptureStatusBarViewModel`; React renders them, Angular does not yet), attestation, `EmrSheet` (bottom sheet / side panel, confirm dialog), patient list, work queue, timeline; `EmrStatTile` for counts and KPIs.
- **`EMR_ENGINE_VERSION` / `requiredEngineFor(schema)`** in emr-controller: the feature level server-supplied definitions are stamped with.

## 10 October 2026 — anatomy outline redraws

- **19 anatomy outlines redrawn** (neonate, Mallampati, knee AP and lateral pairs, stomach, brain pair, thyroid, tracheobronchial tree, shoulder pair, pelvis and hips, great vessels, colon, hand pair, ETT airway) in a Renaissance-anatomist style: stroke widths 6 and 3 only, honest proportions and contacts, short labels, open space to annotate. Recipe descriptions updated to match.
- **Two new heart recipes** (`heart-anterior-cutaway`, `heart-anterior-cutaway-chordae`): a vector trace of a supplied AI-generated illustration, unlabelled, smoothed and recoloured to the outline palette. Provenance records that origin; confirm the generator's output terms before release.
- **Retired** `heart-four-chamber-section` (replaced by the cutaway recipes).

## 10 October 2026 — inpatient banner and drug order composer

- **Medication administration record recipe** (`EMR / Medications / Administration record`) composes `EmrTimeAxis`, `EmrStatusCell` and `EmrAttestation` with the story as controller (outcome badges, witness and co-sign policy, attestation model). Eight stories. No new component was needed.

- **Banner allergy wording is controller-supplied.** `PatientBannerViewModel` gains `allergyChipPrefix` and `allergyOverflow` (a badge). The UI no longer adds "Allergy:" or derives the "+N allergies" danger tone.

- **`EmrPatientBanner`** now takes optional inpatient context: bed, ward, length of stay, admitted on, admitting clinician, weight, and code-status and isolation badges. Each value is a controller-supplied label or badge and renders only when present, so outpatient output is unchanged. New stories are `InpatientWard` and `InpatientIcuIsolation`.
- The banner moved to signal `input()`/`output()` with one `intent` output. The `expandedChangeRequested` output is now an intent member. The architecture test now accepts signal outputs.
- **Drug order composer recipe** (`EMR / Medications / Order composer`) composes existing components only, with the story acting as the controller. It has seven stories: Blank, TabletBd, EyeDropTaper, PrnAnalgesia, ReadOnly, WithValidationMessages and Mobile. No new component was needed.

## 10 October 2026 — `10732c3`, `d89b4ef` — annotation foundation and fixes to existing components

- The annotation canvas now uses the controller's types; its duplicate UI type system is deleted.
- `AnnotationDocument` schema v2 adds a required `background` (image id and intrinsic size). Deserialization now validates layers; v1 is rejected.
- Fixed letterboxed-image misregistration: the canvas takes the image's aspect ratio and the overlay uses image-pixel units. A Playwright registration test covers it.
- Removed teal and every UI-owned colour; `brushColor` is controller-supplied.
- Moved the placeholder anatomy outlines from the component into story fixtures. The component now shows an empty state.
- File reading moved out of the component; the Dermatology story host plays the controller's part.
- Updated the L4 catalogue entry, the drawing plan (status, gap list, one-SVG-per-view rule, optical/retinoscopy cross) and the handoff.

## 10 October 2026 — `6064652` and the following commit — L5 anatomy outlines and 15 new components

Built by parallel subagents from one architecture review, then integrated and checked centrally.

- **L5 recipes.** Added the `AnatomyTemplateRecipe` contract and `anatomyTemplateToImage` (controller), plus 105 standalone outline SVGs in 24 sets: whole body, head/scalp, face, neck, thorax, back, pelvis, genital/perineal, upper and lower limbs, hands, feet, ENT, dental/oral, neurological, vascular, wound/procedure, abdomen and six ophthalmic sets.
  - `recipes.spec.ts` enforces the drawing standard: size, palette, no scripts or external references, one recipe per SVG, documented groups.
  - The SVGs ship at `dist/emr-ui/assets/anatomy`. Storybook has a gallery and a draw-on-outline story.
  - Every outline is `unreviewed`.
- **New components:**
  - `EmrDoseSchedule`: every dosage form, words before codes, and an OD frequency/site guard.
  - `EmrClinicalTranscript` + `EmrEvidenceSuggestionList` + `NoteCaptureController`: evidence-linked dictation/typed note capture.
  - `EmrMeridianCross`: optical and retinoscopy cross with axis labels.
  - `EmrOcularMotilityChart`.
  - `EmrOctFindingRecord`.
  - `EmrAnnotationToolbar` (compact, shape glyphs, one pen button) and `EmrAnnotationList`.
  - `EmrObservationFlowsheet` and `EmrObservationTrend`.
  - `EmrCodedInput` (L2).
  - `EmrScoreResultCard`.
  - `EmrCaptureStatusBar`.
  - `EmrMedicationReconciliation`.
  - `EmrWorkQueue`.
- **Fixes to existing components:**
  - The typed field and clinical matrix no longer present "status not set" as "recorded"; the matrix intent takes `null` to clear.
  - `EmrSelect` now shows a pre-selected value: options bind `[selected]`, because `[value]` was applied before @for options existed. Other selects are tracked in the handoff.
  - `EmrSearchSelect` gains `labelHidden`.
  - The staged checklist's disabled items use muted text instead of opacity, which failed contrast.
  - 51 hex colour fallbacks were removed from five components.
- **New architecture rules:** no colour literals in components; no `::ng-deep` and no unencapsulated local styles (four older components grandfathered).

## 9 October 2026 — `8baf858`

- Added VAS primitive, stories, catalogue/public exports, documentation and visual baselines.
- Updated Likert presentation/baselines, design and print styles, and print checks.
- Fixed controller ID collisions, stale search responses and malformed node-path parsing, with regression tests.
- Updated pedigree vital-status modelling/rendering, annotation canvas, typed fields, inputs and section cards.
- Added the drawing/annotation implementation plan; implementation remains planned.
- Committed 112 files, including source, docs, snapshots, `.claude/launch.json` and two machine-local trace files (`.trace-mcp/guard-mode`, `.trace-mcp/install-date`). The trace files were included inadvertently; their tracking is corrected below.
- `pnpm check` passed: 232 tests, controller/UI builds, Node import and SSR smoke check. Playwright visual tests were not rerun.

## Earlier work — history migrated from the former handoff

These are historical summaries, not fresh verification or claims that every workflow is complete. Consult Git for exact dates and changes.

- Established private Angular/controller workspace, Storybook, themes and controlled-architecture checks.
- Added primitives, clinical forms/matrices/lists, patient context/navigation, timeline, checklists and pedigree.
- Added orders/favourites, documents/upload/viewer, ophthalmic prescription/diagnostics, field generation and template authoring.
- Added separator and configurable card/column/field-value layouts.
- Added annotation canvas tools, independent layer management, undo/redo and save intents; versioned serialization and repository contracts.
- Added dermatology, paired-retina, surgery-planning and read-only photo stories with class labels. Former notes reported controller/UI/Storybook builds for that work; these do not establish current validation.
- Reorganised components into layers and added field-contract documentation (`a95d1ec`).

## 9 October 2026 — `b7a2ecf` (documentation maintenance)

- Converted `handoff.md` into a current-state document with explicit validation limits and pending work.
- Moved historical progress summaries into this changelog.
- Corrected the handoff to distinguish the planned recipes layer from existing folders and to identify teal defaults in the annotation component as well as stories.
- Removed machine-local `.trace-mcp/guard-mode` and `.trace-mcp/install-date` from Git tracking and ignored `.trace-mcp/`; retained the local files and shared `.claude/launch.json`.
