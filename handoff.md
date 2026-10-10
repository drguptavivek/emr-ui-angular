# EMR — Current Handoff

Updated: 10 October 2026. Code baseline: branch `feat/anatomy-outlines-and-components` (four commits on top of `b7a2ecf`; see CHANGELOG). Not yet merged to `main`.

This file describes current state, outstanding work and how to resume. Replace outdated state rather than appending session history. Historical changes belong in `CHANGELOG.md`; exact commits belong in Git. Source and executable checks take precedence if documentation disagrees.

## Current project

Private, unreleased Angular 22 EMR component library with Storybook; no application integration or published release. APIs may change. Workspace: `/Users/vivekgupta/workspace/EMR`.

- `packages/emr-controller/src`: framework-neutral TypeScript models, typed intents, promise/AbortSignal ports and headless controllers. Relative ESM imports use `.js`.
- `packages/emr-ui/src/lib`: standalone Angular presentation components organised into foundations, primitives, fields, structures, domain, recipes (L5, data only: anatomy outline SVGs and their recipe entries) and authoring. Imports target the same or lower layer.
- Source catalogue: `packages/emr-ui/catalog.manifest.ts`. Contracts: `docs/api-conventions.md`, `docs/field-contract.md`. Component documentation: `docs/catalog/`.
- Available surfaces include primitives (Likert/VAS included), dose schedules, evidence-linked note capture, flowsheets and trends, coded entry, score and capture-status cards, medication reconciliation, OPD work queue, optical/retinoscopy cross, motility, OCT records, annotation toolbar/list, forms/matrices/lists, patient context, navigation, timelines, safety checklists, pedigree, orders/favourites, documents, annotation, ophthalmic recording and field/template authoring. Catalogue presence does not establish production readiness for every interaction.

## Required boundaries

- Immutable `model` or `definition` plus `model`; target one typed `intent` output for controlled surfaces. Fields use `value`/`valueChange`.
- Controllers own networking, routing, persistence, validation, terminology, scoring and clinical interpretation. UI may own transient focus, gestures and viewport behaviour.
- Keep `recorded`, `not-assessed`, `unable-to-assess`, `not-applicable`, `declined` and `unknown` distinct. Synthetic data only.
- Own the design system: light slate, soothing accents, no teal, equal control heights and strict alignment. Existing light/dark themes remain supported; light is the primary requested appearance. Annotation colours are controller-supplied data; UI styling uses `emr.css` tokens only.
- Follow `AGENTS.md` and the API/field contracts.

## Verification state

Branch `feat/anatomy-outlines-and-components` as of 10 October 2026:
- `pnpm check` passed: 511 tests in 19 files, controller build, Node ESM import, UI build and SSR smoke check.
- The full Playwright suite (`pnpm test:visual`) passed: 75 tests across chromium/firefox/webkit at 360/768/1280, plus 6 skipped (visual baselines are chromium-only). This includes the new annotation-registration and select pre-selection tests.
- An independent axe pass over all 151 stories of the 15 new components found zero WCAG 2.2 A/AA violations in light and dark. Allow a 600ms settle after toggling the theme: button transitions otherwise give false contrast failures.
- No new visual baselines were added, and no fresh `build:storybook` was run.

Earlier states:

Phase 1 annotation work (uncommitted on top of `b7a2ecf`): `pnpm check` passed with 237 tests in 17 files, plus the controller build, Node import, UI build and SSR smoke check. The new Playwright test `annotation marks stay registered to the image at every width` passed on all nine projects (chromium, firefox and webkit at 360/768/1280) against the dev Storybook. The Dermatology story's upload path was checked with a scripted file selection. The rest of the Playwright suite was not rerun. The annotation stories are not in its axe or visual-baseline sets.

`pnpm check` passed for code committed as `8baf858`: 232 tests in 16 files, controller build, Node ESM import, Angular UI build and SSR smoke check. Only trailing CSS blank lines were removed after that run; staged whitespace checks passed before commit.

Visual snapshots were committed, but Playwright visual/accessibility checks and a fresh Storybook production build were not rerun during that commit. No comprehensive browser or clinical-asset review is claimed.

Storybook responded at `http://localhost:6006` during this session; recheck process availability when resuming. `storybook-static/` is generated output, not evidence of current behaviour. Use source stories and rebuild when needed.

## Outstanding work

1. **Merge.** The work is committed on `feat/anatomy-outlines-and-components` and not yet merged to `main`.
2. **Migrations recorded in `AGENTS.md`.**
   - Fold the remaining ad-hoc outputs into intent unions, and move decorators to signal `input()`/`output()`.
   - `controlled-components.spec.ts` matches `@Input`/`@Output` text, so a signal migration must update those assertions in the same change.
   - Migrate `EmrClinicalList` (and its four L4 wrappers) to `model` + `intent`, with a richer `ClinicalListItem`: reaction, severity, verification, onset, status, code.
3. **Clinical review.** All 105 anatomy outlines are `reviewStatus: 'unreviewed'`. Conventions the drawing agents flagged for review:
   - tympanic membrane landmarks;
   - dermatome scheme (classic layout, not the ASIA key-point map);
   - breast and lithotomy clock orientation;
   - supraclavicular fossa boundary;
   - simplified hands and feet on whole-body views;
   - retina arcade shapes.
4. **Annotation canvas migration** (drawing plan Phase 4):
   - adopt `EmrAnnotationToolbar` and `EmrAnnotationList`;
   - replace the `stateChanged` full-state intent with discrete intents;
   - controlled undo/redo;
   - layers keyed per background;
   - select/move/eraser geometry edits.
5. **Drawing plan Phases 3–4:** specialty structured controls (e.g. tooth-surface selection), linked findings across views, serial comparison.
6. **Fixed English status words.** Several new components print "Not assessed", "Not supplied" and similar for the six no-value states. Decide whether those labels move to the controller (for localisation).
7. **Shared primitives:**
   - `EmrBadge` is `white-space: nowrap`, so long band labels overflow at 360px (the score card works around it).
   - Four grandfathered components combine `ViewEncapsulation.None` with local styles (see architecture.spec).
8. **Visual baselines.** No new component is in the Playwright axe or visual-baseline story sets yet. Add representative ids and regenerate the darwin baselines.
9. **Remaining review findings (Fable architecture review, 10 October 2026):**
   - `spectacle-prescription.models.ts` uses string-keyed `errors`/`warnings` maps instead of `EmrValidationMessage[]`.
   - `emr-staged-checklist` evaluates `requiresNoteWhen` in the UI and hard-codes its Yes/No/Not applicable labels.
   - The select pre-selection fix in `emr-spectacle-prescription` has no story with a pre-selected value, so the regression test does not cover it.

## Resume

```bash
git status --short
git log -5 --oneline
pnpm check
pnpm storybook        # development catalogue, port 6006
pnpm build:storybook  # regenerate static catalogue
pnpm test:visual      # Playwright; current visual baselines are macOS-specific
```

Preserve concurrent work. Use this handoff for current state, `CHANGELOG.md` for change summaries and `git log`/`git show` for exact history.
