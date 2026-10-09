# L0 — Foundations

L0 is not a set of components. It is the design substrate every L1–L6 component is built on: CSS custom-property tokens, the light/dark theming contract, the standing accessibility and layout contract, and the BEM-ish class naming convention. Nothing in L0 renders Angular markup or carries clinical meaning; it is pure CSS plus the conventions that make the rest of the catalogue visually and behaviourally consistent. Every layer above L0 depends on it (directly, via class names in component templates) and never the reverse.

Source of truth: `packages/emr-ui/src/lib/foundations/emr.css`.

## Import contract

Consuming applications import the stylesheet once, globally:

```css
@import '@drguptavivek/emr-ui/styles/emr.css';
```

The stylesheet defines tokens twice — once under `:root, .emr-theme-light` (the default/light values, also active with no theme class present) and once under `.emr-theme-dark` (dark overrides). An application selects a theme by applying `emr-theme-light` or `emr-theme-dark` as a class on an ancestor element (commonly `<body>` or the app-shell root). `EmrAppShell` (L4) can apply this directly through its controlled `theme` input. There is no JS-driven theme switching in L0 itself — it is pure CSS cascade off the ancestor class.

`emr.css` defines 59 `--emr-*` custom-property declarations in total: 31 in the light block and 28 in the dark block. Three tokens (`--emr-control-height`, `--emr-compact-height`, `--emr-paired-control-width`) are layout constants defined only once, in the light block, and are inherited unchanged by the dark theme since they carry no colour information. The remaining 28 tokens are redefined with different values in both blocks.

## Design tokens

### Colour — brand / primary

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--emr-primary` | `#475f70` | `#c5d5df` | Primary brand colour: link/active text, primary control accents |
| `--emr-primary-hover` | `#d4e0e6` | `#435966` | Hover background for primary buttons/controls |
| `--emr-primary-contrast` | `#344b5a` | `#e8eff3` | Text colour placed on primary-soft backgrounds (e.g. primary button label) |
| `--emr-primary-soft` | `#e3ebef` | `#334755` | Primary button/background fill (soft tint) |
| `--emr-primary-border` | `#b2c4ce` | `#708998` | Border colour for primary-toned controls (buttons, outline variant) |

### Surface / background

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--emr-background` | `#f6f8f9` | `#020617` | Page/app background |
| `--emr-surface` | `#fffefa` | `#0f172a` | Default card/control surface (inputs, cards, panels) |
| `--emr-surface-raised` | `#eff3f5` | `#1e293b` | Slightly raised surface (hover rows, disabled control fill, headers) |
| `--emr-surface-accent` | `#e8eef2` | `#263946` | Accent surface for section headers, toolbars |
| `--emr-surface-blue` | `#edf3f7` | `#283d4a` | Blue-tinted surface (secondary button, ABHA badge fill) |
| `--emr-surface-soft` | `#f1f4f5` | `#24333c` | Soft neutral surface (annotation canvas background) |
| `--emr-surface-slate` | `#edf1f3` | `#1e293b` | Slate surface for field-value-row field cell |

### Border / structure

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--emr-border` | `#c7d3da` | `#475569` | Default hairline border for cards, controls, tables, dividers |

### Text

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--emr-text` | `#263847` | `#f8fafc` | Primary body/heading text colour |
| `--emr-text-muted` | `#5c6c78` | `#cbd5e1` | Secondary/muted text (hints, captions, metadata) |

### Focus

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--emr-focus` | `#5f7f92` | `#8fb0c2` | Visible focus-ring colour, used with `color-mix()` in `:focus-visible` outlines |

### Semantic status (info / success / warning / danger)

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--emr-info` | `#486f86` | `#7dd3fc` | Info tone text/icon colour |
| `--emr-info-soft` | `#e8f0f4` | `#0c4a6e` | Info tone background fill |
| `--emr-success` | `#2b7650` | `#86efac` | Success tone text/icon colour |
| `--emr-success-soft` | `#e8f5ec` | `#14532d` | Success tone background fill |
| `--emr-warning` | `#8a651f` | `#fde68a` | Warning tone text/icon colour |
| `--emr-warning-soft` | `#fbf4de` | `#713f12` | Warning tone background fill |
| `--emr-danger` | `#a44949` | `#fca5a5` | Danger tone text/icon colour, error text, required-marker asterisk |
| `--emr-danger-soft` | `#fcecec` | `#7f1d1d` | Danger tone background fill |
| `--emr-danger-hover` | `#8f3434` | `#991b1b` | Hover background for the danger button variant |
| `--emr-danger-hover-text` | `#ffffff` | `#ffffff` | Text colour on danger-hover background (identical in both themes) |
| `--emr-neutral-soft` | `#e8eef1` | `#334155` | Neutral tone background fill (badges/chips with `emr-tone-neutral`) |

### Shadow

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--emr-shadow` | `0 8px 24px rgb(15 23 42 / 0.09)` | `0 10px 28px rgb(0 0 0 / 0.35)` | Elevation shadow for flyouts, search-select panels |

### Layout (light-block only, not redefined in dark)

| Token | Value | Purpose |
|---|---|---|
| `--emr-control-height` | `44px` | The WCAG 2.2 AA minimum interactive-target height; applied to buttons, inputs, selects, tabs, nav buttons, list rows, matrix cells |
| `--emr-compact-height` | `32px` | Reduced height for compact chrome (badges, chips) |
| `--emr-paired-control-width` | `132px` | Fixed track width for paired-input cells (e.g. OD/OS acuity pairs) |

## Accessibility + layout contract

Sourced from `README.md` and `IMPLEMENTATION_PLAN.md`, this is a standing, cross-cutting contract every component in every layer must honour — it is not optional per-component behaviour:

- **WCAG 2.2 AA** contrast is the baseline for every token pairing (text-on-surface, tone-on-tone-soft, etc.).
- **Visible focus** — every interactive class is covered by the shared focus-visible rule:
  `:where(.emr-button, .emr-icon-button, .emr-control, .emr-select, .emr-search-input, .emr-nav-button, .emr-tab):focus-visible { outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent); outline-offset: 2px; }`
  (Some components, e.g. the toggle and Likert pip, define their own focus-visible rule using `var(--emr-focus)` directly rather than joining the shared `:where()` selector.)
- **Keyboard operation** — every control must be fully operable without a mouse (e.g. `EmrTabsComponent` implements roving-tabindex arrow-key navigation; `EmrSearchSelectComponent` implements arrow/home/end/escape listbox navigation).
- **Status is never colour-alone** — tone (`emr-tone-info/success/warning/danger/neutral`) always pairs colour with text/icon content (badge labels, alert titles, ARIA roles such as `role="status"`/`role="alert"`), never colour by itself.
- **44px minimum interactive targets** — enforced via `--emr-control-height: 44px`, applied to `.emr-button`, `.emr-icon-button`, `.emr-control`/`.emr-select`/`.emr-search-input`, `.emr-tab`, `.emr-nav-button`, `.emr-checkbox`/`.emr-radio`/`.emr-toggle`, `.emr-search-select__option`, `.emr-timeline__button` (via min-height), `.emr-tree__row`, `.emr-likert__pip` (via `min-width`/`min-height`), and matrix/table cell affordances.
- **8px control radius** — the standard corner radius for buttons and controls (`border-radius: 8px` on `.emr-button`, `.emr-control`, `.emr-select`); larger surfaces (cards, section cards, panels) use 10px, and the field-value-row uses 8px on its outer top/bottom corners.
- **The 12-column responsive grid** — `.emr-form-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px 16px; }` paired with span helpers `.emr-form-span-3`, `.emr-form-span-4`, `.emr-form-span-6`, `.emr-form-span-8`, `.emr-form-span-9`, `.emr-form-span-12`. At `max-width: 767px` the grid collapses to a single column and every span class is forced to `grid-column: 1`. At `768–1023px`, spans 3/4 become span-6 and spans 8/9 become span-12 (a two-tier responsive collapse, not just one breakpoint).
- **`.emr-sr-only`** — the standard visually-hidden-but-screen-reader-accessible utility (`position: absolute; width: 1px; height: 1px; ... clip: rect(0,0,0,0);`), used for supplementary labels such as the Likert "Required" announcement and the native radio input under each Likert pip.
- Automated accessibility checks and visual regressions run at 360px, 768px, and 1280px in both themes (per `IMPLEMENTATION_PLAN.md`), covering keyboard-only search, multi-select, navigation, flyout focus restoration, timeline navigation, and matrix editing as explicit interaction-test scenarios.

## BEM-ish class naming convention

Classes follow a `.emr-block__element--modifier` pattern, loosely BEM (not strict — some "elements" are compound, and a handful of state selectors use attribute selectors instead of `--modifier`). Real examples from `emr.css`:

- **Block**: `.emr-button`, `.emr-card`, `.emr-section-card`, `.emr-timeline`, `.emr-likert`
- **Block + element** (`__`): `.emr-field__label`, `.emr-field__hint`, `.emr-field__error`, `.emr-card__title`, `.emr-card__body`, `.emr-section-card__header`, `.emr-section-card__content`, `.emr-timeline__dot`, `.emr-timeline__title`, `.emr-likert__pip`, `.emr-likert__anchors`
- **Block + modifier** (`--`): `.emr-button--secondary`, `.emr-button--outline`, `.emr-button--ghost`, `.emr-button--danger`, `.emr-button--small`, `.emr-button--block`, `.emr-card--flush`, `.emr-timeline--horizontal`, `.emr-timeline--vertical`, `.emr-separator--vertical`, `.emr-separator--labelled`, `.emr-patient-card--selected`
- **Element + modifier combined**: `.emr-likert__option--selected` (element `option` on block `likert`, modifier `selected`), `.emr-field-value-row--heading` (block-level modifier), `.emr-annotation-canvas__layer-row--active`
- **State via ARIA/data attribute rather than a class modifier**: `[aria-selected="true"]` (`.emr-tab[aria-selected="true"]`, `.emr-search-select__option[aria-selected="true"]`), `[aria-current="page"]` (`.emr-nav-button[aria-current="page"]`), `[aria-invalid="true"]` (`.emr-control[aria-invalid="true"]`), and `[data-tone="..."]` for the controller-supplied Likert selection tone (`.emr-likert__option[data-tone="danger"].emr-likert__option--selected .emr-likert__pip`)
- **Utility classes** (outside the block/element/modifier scheme, single-purpose): `.emr-sr-only`, `.emr-stack`, `.emr-chip-row`, `.emr-form-grid`, `.emr-form-span-*`

Tone/status is expressed as a separate, orthogonal modifier family rather than nested under each block: `.emr-tone-neutral`, `.emr-tone-info`, `.emr-tone-success`, `.emr-tone-warning`, `.emr-tone-danger`, applied alongside `.emr-badge`, `.emr-chip`, or `.emr-alert` (e.g. `<span class="emr-badge emr-tone-success">`).
