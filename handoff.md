# EMR — Current Handoff

Updated: 9 October 2026. Code baseline: `8baf858` on `main`.

This file describes current state, outstanding work and how to resume. Replace outdated state rather than appending session history. Historical changes belong in `CHANGELOG.md`; exact commits belong in Git. Source and executable checks take precedence if documentation disagrees.

## Current project

Private, unreleased Angular 22 EMR component library with Storybook; no application integration or published release. APIs may change. Workspace: `/Users/vivekgupta/workspace/EMR`.

- `packages/emr-controller/src`: framework-neutral TypeScript models, typed intents, promise/AbortSignal ports and headless controllers. Relative ESM imports use `.js`.
- `packages/emr-ui/src/lib`: standalone Angular presentation components organised into foundations, primitives, fields, structures, domain and authoring. L5 recipes is a planned architectural layer; no `recipes/` folder exists yet. Imports target the same or lower layer.
- Source catalogue: `packages/emr-ui/catalog.manifest.ts`. Contracts: `docs/api-conventions.md`, `docs/field-contract.md`. Component documentation: `docs/catalog/`.
- Available surfaces include primitives (Likert/VAS included), forms/matrices/lists, patient context, navigation, timelines, safety checklists, pedigree, orders/favourites, documents, annotation, ophthalmic recording and field/template authoring. Catalogue presence does not establish production readiness for every interaction.

## Required boundaries

- Immutable `model` or `definition` plus `model`; target one typed `intent` output for controlled surfaces. Fields use `value`/`valueChange`.
- Controllers own networking, routing, persistence, validation, terminology, scoring and clinical interpretation. UI may own transient focus, gestures and viewport behaviour.
- Keep `recorded`, `not-assessed`, `unable-to-assess`, `not-applicable`, `declined` and `unknown` distinct. Synthetic data only.
- Own the design system: light slate, soothing accents, no teal, equal control heights and strict alignment. Existing light/dark themes remain supported; light is the primary requested appearance. Hard-coded teal remains in both annotation stories and the annotation component's brush defaults/fallbacks; cleanup must cover both.
- Follow `AGENTS.md` and the API/field contracts.

## Verification state

`pnpm check` passed for code committed as `8baf858`: 232 tests in 16 files, controller build, Node ESM import, Angular UI build and SSR smoke check. Only trailing CSS blank lines were removed after that run; staged whitespace checks passed before commit.

Visual snapshots were committed, but Playwright visual/accessibility checks and a fresh Storybook production build were not rerun during that commit. No comprehensive browser or clinical-asset review is claimed.

Storybook responded at `http://localhost:6006` during this session; recheck process availability when resuming. `storybook-static/` is generated output, not evidence of current behaviour. Use source stories and rebuild when needed.

## Outstanding work

1. Complete migrations recorded in `AGENTS.md`: consolidate remaining ad-hoc outputs into intent unions and migrate decorators to signal inputs/outputs. Verify each component before marking it migrated.
2. Drawing catalogue remains **Planned** in `docs/clinical-drawing-annotation-plan.md`; implementation has not been authorised. React was discussed, but no renderer migration was authorised.
3. Recheck annotation gaps before implementation: duplicate contracts; background/frame/orientation metadata; letterboxed-image overlay registration; placeholder anatomy assets; component-owned fallback clinical labels; file-selection output consistency; focused interaction coverage.
4. Establish the L5 data-recipe catalogue during anatomy/specialty implementation. The layer is defined but has no current catalogue entries.
5. Verify representative visual/accessibility behaviour and fresh Storybook output for recent changes.

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
