# Design QA — Patient identity hierarchy and foundations

## Evidence

- Source visual truth: `design-qa-artifacts/source-patient-list.png`
- Rendered desktop patient list: `design-qa-artifacts/patient-list-desktop.png`
- Rendered mobile patient list: `design-qa-artifacts/patient-list-mobile.png`
- Full-view side-by-side comparison: `design-qa-artifacts/patient-list-comparison.png`
- Focused identity comparison: `design-qa-artifacts/patient-list-focused-comparison.png`
- Foundations controls: `design-qa-artifacts/foundations-controls.png`
- Light color catalogue: `design-qa-artifacts/colors-light.png`

## Viewports and normalization

- Source screenshot: 2219 x 746 pixels; source CSS size and device density are unknown.
- Desktop implementation: 1280 x 900 CSS pixels at device scale factor 1; capture is 1280 x 900 pixels.
- Mobile implementation: 360 x 900 CSS pixels at device scale factor 1; capture is 360 x 900 pixels.
- Full-view comparison placed both sources in equal-width, top-aligned regions using `object-fit: contain` so composition and hierarchy could be judged without stretching.
- Focused comparison used source and implementation crops of the first two patient identity rows because the MRN/name/ABHA hierarchy was too small to judge reliably in the full-view comparison.
- State: populated patient list, light theme, first patient selected; ABHA present for two patients and absent for two patients.

## Findings and comparison history

### Iteration 1 — blocked

- [P1] Patient identity hierarchy did not reflect the requested priority. The source placed name and MRN on one line, while the requested revision required MRN to become the large, separate identifier. The initial implementation also had no ABHA presentation.
- [P1] At 360 px, inline spans caused the patient name, ABHA, demographics, and care location to collapse into visually merged lines.
- [P2] Quantity and paired inputs used nested visible labels, creating a third row and misaligning adjacent clinical fields.
- [P2] The color system was visually weak and lacked a dedicated token catalogue.

Fixes made:

- Reordered each patient identity block to show a large MRN first, patient name second, and a conditional ABHA chip with the Heroicons identification icon third.
- Changed mobile patient cards to a grid with explicit block-level identity and metadata rows.
- Reduced quantity and paired inputs to one label row plus one entry row while retaining distinct accessible names for value, unit, OD, and OS controls.
- Replaced the foundation palette with restrained slate tokens, pale button fills, and a dedicated `Foundations / Colors` catalogue.
- Removed prohibited ARIA labels from decorative swatches and increased muted-text contrast after axe testing.

Post-fix evidence:

- Desktop: `design-qa-artifacts/patient-list-desktop.png`
- Mobile: `design-qa-artifacts/patient-list-mobile.png`
- Focused source/render comparison: `design-qa-artifacts/patient-list-focused-comparison.png`

### Iteration 2 — passed

- Fonts and typography: system sans-serif is consistent; MRN has the strongest weight and size, name is a distinct second line, and secondary text remains readable.
- Spacing and layout rhythm: table columns remain aligned; mobile cards preserve separate rows without page-level horizontal overflow; quantity controls use the requested two-row structure.
- Colors and visual tokens: slate is the sole foundation hue, pale surfaces remain distinguishable, and semantic states include text labels rather than relying on color alone.
- Image and icon fidelity: no raster imagery is required; ABHA uses the vector Heroicons identification asset rather than a text glyph or handcrafted icon.
- Copy and content: MRN and ABHA are explicitly named; ABHA is rendered only when controller-supplied data exists.
- Responsive evidence: the populated list was visually inspected at 1280 x 900 and 360 x 800, then smoke-tested at 360, 768, and 1280 px in Chromium, Firefox, and WebKit.
- Accessibility evidence: WCAG-tagged axe checks passed for representative stories in light and dark themes across Chromium, Firefox, and WebKit.

## Residual gaps

- The source screenshot predates the requested hierarchy change, so exact identity typography is intentionally not a pixel clone: MRN now leads, as requested.
- The source screenshot does not include an ABHA treatment or a mobile state; those were evaluated against the written requirements and the component system's established spacing and icon rules.

## Final result

passed

---

# Design QA — Equal primitive heights

## Evidence

- Source visual truth: `/var/folders/sn/xw1rcp8d5fxbnqw1hmvmjkd00000gn/T/codex-clipboard-7004b795-09f1-4a63-a117-8806da66b6b2.png`
- Rendered implementation: `.codex-artifacts/equal-heights-after.png`
- Combined comparison evidence: `.codex-artifacts/equal-heights-comparison.png`
- Story: `Foundations / Primitives / Controls`, light theme.

## Viewport and normalization

- Source image: 1860 x 412 pixels; its browser zoom and device density are unknown.
- Implementation capture: 1820 x 193 pixels, cropped from an 1860 x 1000 CSS-pixel Chromium viewport at device scale factor 1.
- The images were compared together without stretching. Typography scale differs because the source zoom is unknown, so the QA judgment uses component proportions plus browser-measured CSS heights.
- Focused-region comparison was sufficient because the request concerns only the tabs, status badge/chip row and button row shown in the supplied crop.

## Comparison history

### Iteration 1 — blocked

- [P1] Compact peers were visibly and structurally inconsistent: `.emr-badge` used 26px while `.emr-chip` used 32px. This produced the taller Diabetes chip shown in the source.
- [P2] Buttons and tabs specified only minimum heights, allowing content or browser text layout to enlarge individual variants.

Fixes made:

- Added shared `--emr-control-height: 44px` and `--emr-compact-height: 32px` tokens.
- Applied exact shared height, single-line layout and consistent line-height to every button variant and tab.
- Applied the same exact compact height to badges and chips while retaining their distinct semantic roles and font weights.
- Added a rendered regression test that measures all peer variants in every configured Chromium, Firefox and WebKit viewport.

### Iteration 2 — passed

- Fonts and typography: labels remain unchanged; consistent one-line line-height prevents variant-specific vertical growth.
- Spacing and layout rhythm: all badges/chips measure 32px; all buttons and tabs measure 44px. Nine cross-browser/viewport checks passed.
- Colors and visual tokens: the existing slate and semantic palette is unchanged.
- Image quality and asset fidelity: this region contains no image or icon assets.
- Copy and content: all source labels and states are preserved.
- Responsive behavior: wrapping may change the number of items per row, but every peer retains the same component height.

## Final result

passed
