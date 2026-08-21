import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

interface TypeStep {
  name: string;
  light: string;
  dark: string;
  print: string;
  usage: string;
  sample: string;
}

/** Values mirror emr.css; `tokens.spec.ts` fails the build if they drift. */
const scale: readonly TypeStep[] = [
  { name: '--emr-text-2xs', light: '0.6875rem', dark: '0.6875rem', print: '0.60rem', usage: 'Dense table meta, badge text', sample: 'MRN-204881 · UHID AIIMS-008221' },
  { name: '--emr-text-xs', light: '0.75rem', dark: '0.75rem', print: '0.65rem', usage: 'Hints, captions, help text', sample: 'Measure in kilograms without shoes' },
  { name: '--emr-text-sm', light: '0.8125rem', dark: '0.8125rem', print: '0.70rem', usage: 'Secondary body, muted detail', sample: 'Follow-up for diabetic eye disease' },
  { name: '--emr-text-md', light: '0.875rem', dark: '0.875rem', print: '0.75rem', usage: 'Body text and form controls', sample: 'Right eye (OD) anterior segment clear' },
  { name: '--emr-text-lg', light: '1rem', dark: '1rem', print: '0.85rem', usage: 'Section headings', sample: 'Current encounter' },
  { name: '--emr-text-xl', light: '1.25rem', dark: '1.25rem', print: '1.00rem', usage: 'Panel titles', sample: 'Pre-anaesthesia assessment' },
  { name: '--emr-text-2xl', light: '1.5rem', dark: '1.5rem', print: '1.15rem', usage: 'Page titles', sample: 'Patient record' },
];

const families: readonly { name: string; value: string; usage: string }[] = [
  { name: '--emr-font-family', value: "'Inter Variable', Inter, ui-sans-serif, system-ui, …", usage: 'All interface and clinical text' },
  { name: '--emr-font-mono', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', usage: 'Codes, identifiers, serialized artifacts' },
];

const metrics: readonly { name: string; value: string; usage: string }[] = [
  { name: '--emr-leading-tight', value: '1.25', usage: 'Headings and dense table rows' },
  { name: '--emr-leading-normal', value: '1.45', usage: 'Body copy and form fields' },
  { name: '--emr-weight-regular', value: '400', usage: 'Body text' },
  { name: '--emr-weight-medium', value: '550', usage: 'Labels, emphasised values' },
  { name: '--emr-weight-bold', value: '700', usage: 'Headings, MRN, critical values' },
];

@Component({
  selector: 'emr-typography-catalogue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="emr-type" [class.emr-theme-dark]="dark" [class.emr-print]="print">
      <header>
        <p class="emr-type__eyebrow">EMR design tokens</p>
        <h1>Typography</h1>
        <p>One scale, seven steps. Components reference tokens rather than literal sizes, which is what lets print shift the entire scale from a single place.</p>
      </header>

      <section>
        <h2>Type scale</h2>
        <div class="emr-type__list">
          @for (step of steps; track step.name) {
            <article class="emr-type__row">
              <div class="emr-type__meta">
                <code>{{ step.name }}</code>
                <strong>{{ print ? step.print : step.light }}</strong>
                <p>{{ step.usage }}</p>
              </div>
              <p class="emr-type__sample" [style.font-size]="'var(' + step.name + ')'">{{ step.sample }}</p>
            </article>
          }
        </div>
      </section>

      <section>
        <h2>Families</h2>
        <table class="emr-type__table">
          <caption class="emr-sr-only">Font family tokens</caption>
          <thead><tr><th scope="col">Token</th><th scope="col">Stack</th><th scope="col">Usage</th></tr></thead>
          <tbody>@for (f of fontFamilies; track f.name) { <tr><td><code>{{ f.name }}</code></td><td>{{ f.value }}</td><td>{{ f.usage }}</td></tr> }</tbody>
        </table>
      </section>

      <section>
        <h2>Line height and weight</h2>
        <table class="emr-type__table">
          <caption class="emr-sr-only">Line-height and weight tokens</caption>
          <thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Usage</th></tr></thead>
          <tbody>@for (m of typeMetrics; track m.name) { <tr><td><code>{{ m.name }}</code></td><td>{{ m.value }}</td><td>{{ m.usage }}</td></tr> }</tbody>
        </table>
      </section>

      <section>
        <h2>Screen versus print</h2>
        <p class="emr-type__note">Print collapses 44px touch targets to natural height and steps the scale down roughly 15%. Toggle the <strong>Print</strong> control to preview.</p>
        <table class="emr-type__table">
          <caption class="emr-sr-only">Screen and print sizes compared</caption>
          <thead><tr><th scope="col">Token</th><th scope="col">Screen</th><th scope="col">Print</th></tr></thead>
          <tbody>@for (step of steps; track step.name) { <tr><td><code>{{ step.name }}</code></td><td>{{ step.light }}</td><td>{{ step.print }}</td></tr> }</tbody>
        </table>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block}
    .emr-type{min-height:100%;padding:24px;border-radius:12px;background:var(--emr-background);color:var(--emr-text);font-family:var(--emr-font-family)}
    header{max-width:720px;margin-bottom:28px}h1{margin:2px 0 8px;font-size:var(--emr-text-2xl)}header p{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .emr-type__eyebrow{color:var(--emr-primary);font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.08em;text-transform:uppercase}
    section+section{margin-top:28px}h2{margin:0 0 12px;font-size:var(--emr-text-lg)}
    .emr-type__list{display:grid;gap:10px}
    .emr-type__row{display:grid;grid-template-columns:minmax(190px,240px) minmax(0,1fr);gap:16px;align-items:center;padding:12px;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface)}
    .emr-type__meta code{display:block;color:var(--emr-primary);font-size:var(--emr-text-2xs);font-family:var(--emr-font-mono)}
    .emr-type__meta strong{display:block;margin-top:3px;font-size:var(--emr-text-sm)}
    .emr-type__meta p{margin:3px 0 0;color:var(--emr-text-muted);font-size:var(--emr-text-2xs)}
    .emr-type__sample{margin:0;overflow-wrap:anywhere;line-height:var(--emr-leading-tight)}
    .emr-type__table{width:100%;border-collapse:collapse;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface);overflow:hidden}
    .emr-type__table th,.emr-type__table td{padding:9px 12px;text-align:left;font-size:var(--emr-text-sm);border-bottom:1px solid var(--emr-border);overflow-wrap:anywhere}
    .emr-type__table tbody tr:last-child td{border-bottom:none}
    .emr-type__table th{color:var(--emr-text-muted);font-size:var(--emr-text-2xs);text-transform:uppercase;letter-spacing:.06em}
    .emr-type__table code{color:var(--emr-primary);font-family:var(--emr-font-mono)}
    .emr-type__note{margin:0 0 12px;color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    @media(max-width:640px){.emr-type{padding:14px}.emr-type__row{grid-template-columns:1fr;gap:8px}}
  `]
})
class EmrTypographyCatalogueComponent {
  @Input() dark = false;
  @Input() print = false;
  readonly steps = scale;
  readonly fontFamilies = families;
  readonly typeMetrics = metrics;
}

const meta: Meta<EmrTypographyCatalogueComponent> = {
  title: 'Foundations / Typography',
  component: EmrTypographyCatalogueComponent,
  parameters: { layout: 'fullscreen' }
};
export default meta;
type Story = StoryObj<EmrTypographyCatalogueComponent>;

export const LightTypeScale: Story = { args: { dark: false, print: false } };
export const DarkTypeScale: Story = { args: { dark: true, print: false } };
export const PrintTypeScale: Story = { args: { dark: false, print: true } };
