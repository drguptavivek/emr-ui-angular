# Quick reference

Angular 22 EMR component library. Bring your own controller.

```bash
pnpm install && pnpm storybook      # browse the catalogue at :6006
```

```ts
import { EmrPatientBannerComponent } from '@drguptavivek/emr-ui';
```
```css
@import '@drguptavivek/emr-ui/styles/emr.css';   /* once, in your app */
```

Put `emr-theme-light` or `emr-theme-dark` on an ancestor, or let `EmrAppShell` do it.

## How every component works

You pass an immutable `model`. It hands back a typed `intent`. It never fetches, saves,
routes, or decides anything clinical — that is yours.

```html
<emr-patient-list [state]="vm" (intent)="onIntent($event)" />
```
```ts
onIntent(i: PatientListIntent) {
  if (i.type === 'patientSelected') this.controller.dispatch(i);
}
```

Primitives are plain controls and support two-way binding:

```html
<emr-quantity-input label="Weight" [(value)]="weight" [units]="units" />
```

Schema-driven components take the shape and the data separately:

```html
<emr-clinical-matrix [schema]="schema" [values]="values" (intent)="onIntent($event)" />
```

> **Renaming in progress.** The controlled input becomes `model` everywhere, and
> schema-driven pairs become `definition` + `model`. Ad-hoc outputs (`action`,
> `eventSelected`, `detailChanged`) fold into `intent`. Nothing is released, so these are
> clean breaks — see [`docs/api-conventions.md`](./api-conventions.md).

## Wiring a controller

Controllers are seeded with their initial view model and expose one contract —
`getSnapshot` / `subscribe` / `dispatch` / `destroy`.

```ts
const controller = new ClinicalFormController(initialViewModel);
const stop = controller.subscribe(state => (this.vm = state));

controller.dispatch({ type: 'fieldEditRequested', fieldId: 'weight', value: 72 });
```

> Field addressing is moving from a flat `fieldId` to an `EmrNodePath`
> (`['medications', 2, 'dose']` — strings are field ids, numbers are repeat indices) so that
> repeats and matrix cells are addressable. The types ship today in
> `@drguptavivek/emr-controller`; the intent unions switch over in the next release.
> See [`docs/field-contract.md`](./field-contract.md).

## What you own

Networking · storage · routing · clinical validation · terminology endpoints · scoring ·
whether something is complete, normal, or safe.

The library will not guess any of it. Badge labels and tones come from you. So do
validation messages — including "required".

## What you get

**Capture** forms, repeatable groups, matrices, typed fields, lists
**Context** patient banner, patient list, encounter timeline, shell, nav, flyout
**Safety** staged checklists, PAC checklist, family pedigree
**Specialty** annotation canvas, spectacle prescription, diagnostic summaries
**Documents** upload queue, library, viewer · **Orders** hierarchy picker, favourites
**Authoring** field generator, template composer, terminology binding

Full per-component reference with TypeScript signatures: [`docs/catalog/`](./catalog/).

## Conventions worth knowing

| | | today |
|---|---|---|
| `model` | the view model — every controlled component | `state` / `view` / `patient` … |
| `definition` | the schema, where one applies | `schema` / `field` / `group` |
| `intent` | the single output above the primitive layer | mostly `intent` already |
| `readOnly` | visible, not editable | stable |

Clinical states stay distinct and are never collapsed to empty or false:
`recorded` · `not-assessed` · `unable-to-assess` · `not-applicable` · `declined` · `unknown`

National identifiers are generic — supply the label (`ABHA`, `NHS number`); the component
never names a scheme.

Accessible by default: WCAG 2.2 AA, keyboard operable, 44px targets, light and dark.
**Synthetic data only** in stories and tests — never a real patient identifier.

## Printing

```css
@import '@drguptavivek/emr-ui/styles/emr-print.css';
```

Ctrl+P just works. For an on-screen preview or a deliberate print view, add a class:
`.emr-print` prints captured values; `.emr-print emr-print--form` prints ruled lines to
fill in by hand. A4 by default. See [`docs/print.md`](./print.md).

## More

[`AGENTS.md`](../AGENTS.md) · [`docs/api-conventions.md`](./api-conventions.md) ·
[`docs/field-contract.md`](./field-contract.md) · [`docs/print.md`](./print.md) ·
[`docs/catalog/`](./catalog/)
