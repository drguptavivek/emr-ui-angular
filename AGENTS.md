# AGENTS.md

Angular 22 EMR component library. Two packages, no app. **Not released — break APIs freely.**

- `@drguptavivek/emr-ui` — standalone Angular presentation components
- `@drguptavivek/emr-controller` — framework-neutral models, ports, headless controllers

## The one rule

Components render an immutable view model and emit typed intents. **They own nothing else.**

Never put in `emr-ui`: HTTP, routing, storage, `window`/`document`/`navigator`, services,
repositories, `@Inject()`, clinical validation, terminology lookup, scoring, or any
inference about completion, normality, fitness, or safety.

May live in `emr-ui`: focus movement, overlay placement, animation, scrolling, zoom/pan.

`architecture.spec.ts` enforces this by scanning source text. It will fail you.

## Layers — import your own layer or lower, never upward

| | Dir | Holds |
|---|---|---|
| L0 | `foundations/` | `emr.css` — all tokens, both themes |
| L1 | `primitives/` | inputs, feedback, layout. **No clinical meaning.** |
| L2 | `fields/` | binds a field definition to a primitive |
| L3 | `structures/` | schema-driven containers: form, matrix, list, section |
| L4 | `domain/` | clinical surfaces: banner, checklists, documents, orders |
| L5 | `recipes/` | **data only, zero Angular** — exported schemas |
| L6 | `authoring/` | produces L2–L5 definitions |

`catalog.spec.ts` enforces the direction. Adding a component means adding an entry to
`packages/emr-ui/catalog.manifest.ts` **and** a `### Name` section in `docs/catalog/L<n>-*.md`,
or the suite fails.

## API shape — non-negotiable

```ts
// L3 / L4 / L6 — a controlled surface
@Input({ required: true }) model!: TViewModel;
@Input() headingId?: string;
@Output() readonly intent = new EventEmitter<TIntent>();   // exactly ONE output

// L3 — schema-driven: definition is the shape, model is the data
@Input({ required: true }) definition!: TDefinition;
@Input() model?: TValues;

// L1 / L2 — a mechanical control
@Input() controlId?: string;
@Input() value: T | null = null;
@Input() readOnly = false;
@Output() readonly valueChange = new EventEmitter<T | null>();   // [(banana-box)] partner
```

Names are fixed: `model`, `definition`, `controlId`, `headingId`, `idPrefix`, `readOnly`.
`disabled` is **forbidden above L2**. New interaction = new intent union member, not a new
output. Full rules: `docs/api-conventions.md`.

> **Migration status.** Inputs are done — every controlled component takes `model`, and
> schema-driven ones take `definition` + `model`. Two passes remain: folding the ad-hoc
> outputs (`action`, `eventSelected`, `detailChanged`, nav/flyout events) into each
> component's `intent` union, and moving decorator `@Input`/`@Output` to signal
> `input()`/`output()`. Write **new** code to the target above; when you touch an old
> component, migrate it rather than matching its current style.

## Field contract — meaning ≠ display ≠ state

```ts
EmrFieldContract      // linkId, valueType, cardinality, terminology, validation, enableWhen, unit
EmrFieldPresentation  // label, hint, span, widget, unitDisplay
EmrFieldState         // value, enabled (resolved), messages
```

Address every node with `EmrNodePath` (`['medications', 2, 'dose']`) — strings are linkIds,
numbers are repeat indices. Covers sections, repeats and matrix cells alike.

Validation rules live on the contract; **the controller evaluates, the UI only renders
messages** — including `required`. Full design: `docs/field-contract.md`.

## Tokens, type, and print

All 45 tokens live in `foundations/emr.css` and are documented on two Storybook pages
(`Foundations / Colors`, `Foundations / Typography`). `tokens.spec.ts` fails the build if a
token is undocumented, phantom, or drifts from the CSS — so add the token AND the page entry.

Never hardcode a font size. Use the scale: `--emr-text-2xs` … `--emr-text-2xl`. Exactly one
literal remains (a 48px SVG annotation label) and it is deliberate.

Print is a presentation CONTEXT, not a component input — `.emr-print`, like `emr-theme-dark`.
Never add a `print` or `density` input to a component. Print must never leave collapsed
sections collapsed or overflow clipped; both silently omit clinical data. See `docs/print.md`.

## Clinical invariants

- These are six distinct values, never collapsed to `''`/`false`/`null`:
  `recorded` · `not-assessed` · `unable-to-assess` · `not-applicable` · `declined` · `unknown`
- Badge labels and tones are controller-supplied. Never derive severity from a number.
- `national-health-id` is generic — ABHA in India, NHS number in England. The component
  never names a scheme; the controller supplies the label.
- **Synthetic data only.** Never a real patient identifier in source, stories, or tests.

## Commands

```bash
pnpm check          # test + build controller + node ESM import + build ui + SSR. The gate.
pnpm test           # vitest
pnpm storybook      # catalogue at :6006
pnpm test:visual    # playwright; baselines are darwin-only
```

Accessibility is a hard gate: WCAG 2.2 AA, zero axe violations in **both** themes, visible
focus, keyboard operable, 44px targets, never colour-alone status. Both `emr-theme-light`
and `emr-theme-dark` token sets stay in sync in `emr.css`.

## Gotchas

- `storybook-static/` is a **stale committed build** — never read it as truth. Derive story
  ids from `stories/*.stories.ts`.
- Controller is ESM: relative imports need the `.js` extension.
- Spec files are excluded from `tsc`, so tests are not typechecked.
- Anything serialized must be an enumerable own property. A symbol-keyed or non-enumerable
  field survives an in-memory round trip and vanishes through `JSON.stringify`.
