# Print

Printed records matter in an EMR — discharge summaries, prescriptions, consent forms,
referral letters, OPD slips, medico-legal copies. Paper costs money and clinicians scan
rather than read, so density is a feature.

## Print is a context, not a component API

Print works exactly like theming. It is an ancestor class, not an input:

```html
<div class="emr-theme-light">…</div>     <!-- colour context -->
<div class="emr-print">…</div>            <!-- paper context -->
```

No component takes a `print` input. No component has a print-only twin. This is deliberate:
a `density` or `print` input would mean 57 API changes and a catalogue that doubles in
size, and print is a property of the *rendering context*, not of component state.

Two entry points, one behaviour:

| | |
|---|---|
| `@media print` | Ctrl+P works with no application code at all |
| `.emr-print` | on-screen preview, and controller-rendered print-only views |

The structural rules are authored twice — scoped and unscoped — and
`emr-print.spec.ts` asserts the two are identical modulo the scope prefix, so the
preview never lies about what comes out of the printer.

## Setup

```css
@import '@drguptavivek/emr-ui/styles/emr.css';
@import '@drguptavivek/emr-ui/styles/emr-print.css';
```

Preview it in Storybook with the **Print** toolbar control: *Screen* · *Print — record* ·
*Print — blank form*.

## Two documents, one component tree

A printed **record** and a printed **form** are different artifacts:

```html
<div class="emr-print">…</div>                    <!-- captured values -->
<div class="emr-print emr-print--form">…</div>    <!-- ruled lines to fill in by hand -->
```

- **Record** (default) — every field prints its captured value. An unanswered field prints
  its actual clinical state: `Not assessed`, `Declined`, `Unknown`. It never prints blank,
  because a blank on paper is medico-legally ambiguous — unclear whether the question was
  not asked, not answered, or answered as normal. This is the same invariant the UI
  enforces on screen: those six states are distinct and never collapsed.
- **Form** — empty fields print as ruled lines and checkboxes stay tickable, so the sheet
  can be completed by hand.

## Where the paper savings come from

| Change | Why it helps |
|---|---|
| `--emr-control-height: 44px → auto` | The single biggest win. A 44px touch target is meaningless on paper; across a long form that is most of a wasted page. |
| Type scale steps down ~15% | One place, because components reference tokens rather than literal sizes. See [`docs/catalog/L0-foundations.md`](./catalog/L0-foundations.md). |
| Inputs render as values | No empty boxes, borders, or control padding. |
| Interactive chrome removed | Buttons, tabs, nav, flyouts, focus rings carry no information on paper. |
| Badges lose fills, keep borders | Saves ink. Safe **only** because the "never colour alone" rule guarantees every badge already carries a text label — so it survives greyscale intact. |

## What print must never do

Two rules, both enforced by tests, both clinical-safety issues rather than aesthetics:

1. **Never leave collapsed content collapsed.** A collapsed section on paper is silently
   omitted clinical data. Print expands `[hidden]`, `details`, and collapsed section cards.
2. **Never leave scrollable overflow clipped.** Same reason — a scrolled-away table row
   simply does not exist on the printed page. Print sets `overflow: visible` and
   `max-height: none`.

Escape hatches for application content, if you need them:

```html
<div data-emr-print="hide">…</div>      <!-- omit from paper -->
<div data-emr-print="expand">…</div>    <!-- force an overflow region open -->
```

## Pagination

`@page { size: A4; margin: 12mm }`. A4 is standard in India and most of the world.

US deployments add `@page { size: letter }` in the host application — browsers do not
honour a class-scoped `@page` rule, so `.emr-print--letter` only adjusts the content-width
assumption and cannot set the sheet size on its own.

Records are kept whole: cards, section cards, panels, field rows and table rows all carry
`break-inside: avoid`, headings carry `break-after: avoid`, and `thead` repeats across
pages so a long flowsheet stays readable.

## Testing

Playwright can emulate print media, so print output is testable like anything else:

```ts
await page.emulateMedia({ media: 'print' });
await expect(page).toHaveScreenshot('discharge-summary-print.png');
```

`emr-print.spec.ts` covers the invariants that do not need a browser: scoped/unscoped
parity, collapsed content expansion, overflow expansion, control-height collapse, badge
legibility, page-break avoidance, header repetition, and page geometry.

## Known limitation

Repeating the patient identity banner on every printed page is a medico-legal expectation
and is **not yet implemented** — `position: fixed` repetition interacts badly with
`break-inside: avoid` across browsers. Until it lands, applications that need per-page
identity should render it into a running header themselves.
