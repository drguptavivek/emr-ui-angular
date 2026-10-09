# Changelog

Current state and pending work live in `handoff.md`. Exact changes and authorship live in Git.

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

## Uncommitted documentation maintenance

- Converted `handoff.md` into a current-state document with explicit validation limits and pending work.
- Moved historical progress summaries into this changelog.
- Corrected the handoff to distinguish the planned recipes layer from existing folders and to identify teal defaults in the annotation component as well as stories.
- Removed machine-local `.trace-mcp/guard-mode` and `.trace-mcp/install-date` from Git tracking and ignored `.trace-mcp/`; retained the local files and shared `.claude/launch.json`.
