import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

interface TokenGroup {
  label: string;
  tokens: readonly { name: string; value: string; description: string }[];
}

const groups: readonly TokenGroup[] = [
  {
    label: 'Brand and interaction',
    tokens: [
      { name: '--emr-primary', value: '#475F70', description: 'Active text, selected indicators' },
      { name: '--emr-primary-soft', value: '#E3EBEF', description: 'Primary button fill' },
      { name: '--emr-primary-hover', value: '#D4E0E6', description: 'Primary hover fill' },
      { name: '--emr-primary-border', value: '#B2C4CE', description: 'Primary action border' },
      { name: '--emr-primary-contrast', value: '#344B5A', description: 'Text on pale primary fills' },
      { name: '--emr-focus', value: '#5F7F92', description: 'Keyboard focus ring' }
    ]
  },
  {
    label: 'Surfaces',
    tokens: [
      { name: '--emr-background', value: '#F6F8F9', description: 'Application canvas' },
      { name: '--emr-surface', value: '#FFFEFA', description: 'Pearl content surface' },
      { name: '--emr-surface-raised', value: '#EFF3F5', description: 'Raised neutral surface' },
      { name: '--emr-surface-accent', value: '#E8EEF2', description: 'Selected and clinical section surface' },
      { name: '--emr-surface-blue', value: '#EDF3F7', description: 'Secondary action surface' },
      { name: '--emr-surface-soft', value: '#F1F4F5', description: 'Summary and supportive surface' },
      { name: '--emr-surface-slate', value: '#EDF1F3', description: 'Quiet grouped surface' }
    ]
  },
  {
    label: 'Content and structure',
    tokens: [
      { name: '--emr-text', value: '#263847', description: 'Primary readable text' },
      { name: '--emr-text-muted', value: '#5C6C78', description: 'Secondary text and hints' },
      { name: '--emr-border', value: '#C7D3DA', description: 'Controls, cards and separators' },
      { name: '--emr-neutral-soft', value: '#E8EEF1', description: 'Neutral chips and badges' }
    ]
  },
  {
    label: 'Clinical status',
    tokens: [
      { name: '--emr-info', value: '#486F86', description: 'Information text' },
      { name: '--emr-info-soft', value: '#E8F0F4', description: 'Information surface' },
      { name: '--emr-success', value: '#2B7650', description: 'Completed or confirmed text' },
      { name: '--emr-success-soft', value: '#E8F5EC', description: 'Completed or confirmed surface' },
      { name: '--emr-warning', value: '#8A651F', description: 'Review or caution text' },
      { name: '--emr-warning-soft', value: '#FBF4DE', description: 'Review or caution surface' },
      { name: '--emr-danger', value: '#A44949', description: 'Critical or destructive text' },
      { name: '--emr-danger-soft', value: '#FCECEC', description: 'Critical or destructive surface' },
      { name: '--emr-danger-hover', value: '#8f3434', description: 'Destructive action hover fill' },
      { name: '--emr-danger-hover-text', value: '#ffffff', description: 'Text on destructive hover fill' }
    ]
  }
];

/** Tokens that are not colours, so they are listed rather than swatched. */
interface ConstantToken { name: string; light: string; dark: string; description: string }

const constants: readonly ConstantToken[] = [
  { name: '--emr-shadow', light: '0 8px 24px rgb(15 23 42 / 0.09)', dark: '0 10px 28px rgb(0 0 0 / 0.35)', description: 'Raised surface elevation' },
  { name: '--emr-control-height', light: '44px', dark: '44px', description: 'Minimum interactive target (WCAG 2.2 AA)' },
  { name: '--emr-compact-height', light: '32px', dark: '32px', description: 'Dense control height inside tables and matrices' },
  { name: '--emr-paired-control-width', light: '132px', dark: '132px', description: 'Each half of a paired input' }
];

const darkValues: Readonly<Record<string, string>> = {
  '--emr-primary': '#C5D5DF', '--emr-primary-soft': '#334755', '--emr-primary-hover': '#435966',
  '--emr-primary-border': '#708998', '--emr-primary-contrast': '#E8EFF3', '--emr-focus': '#8FB0C2',
  '--emr-background': '#020617', '--emr-surface': '#0F172A', '--emr-surface-raised': '#1E293B',
  '--emr-surface-accent': '#263946', '--emr-surface-blue': '#283D4A', '--emr-surface-soft': '#24333C',
  '--emr-surface-slate': '#1E293B', '--emr-text': '#F8FAFC', '--emr-text-muted': '#CBD5E1',
  '--emr-border': '#475569', '--emr-neutral-soft': '#334155', '--emr-info': '#7DD3FC',
  '--emr-info-soft': '#0C4A6E', '--emr-success': '#86EFAC', '--emr-success-soft': '#14532D',
  '--emr-warning': '#FDE68A', '--emr-warning-soft': '#713F12', '--emr-danger': '#FCA5A5',
  '--emr-danger-soft': '#7F1D1D', '--emr-danger-hover': '#991b1b', '--emr-danger-hover-text': '#ffffff'
};

@Component({
  selector: 'emr-color-token-catalogue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="emr-color-catalogue" [class.emr-theme-dark]="dark">
      <header><p class="emr-color-catalogue__eyebrow">EMR design tokens</p><h1>Semantic color system</h1><p>Light, soothing surfaces with readable text and status meaning that is never carried by color alone.</p></header>
      @for (group of tokenGroups; track group.label) {
        <section><h2>{{ group.label }}</h2><div class="emr-color-grid">
          @for (token of group.tokens; track token.name) {
            <article class="emr-color-card">
              <div class="emr-color-card__swatch" [style.background]="'var(' + token.name + ')'" aria-hidden="true"></div>
              <div><code>{{ token.name }}</code><strong>{{ displayValue(token) }}</strong><p>{{ token.description }}</p></div>
            </article>
          }
        </div></section>
      }
      <section><h2>Elevation and layout constants</h2><table class="emr-token-table"><caption class="emr-sr-only">Non-colour design tokens</caption><thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Purpose</th></tr></thead><tbody>@for (token of constantTokens; track token.name) { <tr><td><code>{{ token.name }}</code></td><td>{{ dark ? token.dark : token.light }}</td><td>{{ token.description }}</td></tr> }</tbody></table></section>
      <section><h2>Action hierarchy</h2><div class="emr-color-actions"><button class="emr-button" type="button">Save assessment</button><button class="emr-button emr-button--secondary" type="button">Secondary</button><button class="emr-button emr-button--outline" type="button">Outline</button><button class="emr-button emr-button--ghost" type="button">Ghost</button><button class="emr-button emr-button--danger" type="button">Delete</button></div></section>
    </main>
  `,
  styles: [`
    :host{display:block}.emr-color-catalogue{min-height:100%;padding:24px;border-radius:12px;background:var(--emr-background);color:var(--emr-text)}
    header{max-width:720px;margin-bottom:28px}h1{margin:2px 0 8px;font-size:1.8rem}header p{margin:0;color:var(--emr-text-muted)}
    .emr-color-catalogue__eyebrow{color:var(--emr-primary);font-size:.78rem;font-weight:750;letter-spacing:.08em;text-transform:uppercase}
    section+section{margin-top:28px}h2{margin:0 0 12px;font-size:1rem}.emr-color-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
    .emr-color-card{display:grid;grid-template-columns:68px minmax(0,1fr);gap:12px;min-height:96px;padding:12px;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface)}
    .emr-color-card__swatch{min-height:68px;border:1px solid color-mix(in srgb,var(--emr-text) 12%,transparent);border-radius:8px}.emr-color-card code,.emr-color-card strong,.emr-color-card p{display:block}.emr-color-card code{overflow-wrap:anywhere;color:var(--emr-primary);font-size:.76rem}.emr-color-card strong{margin-top:3px;font-size:.82rem}.emr-color-card p{margin:4px 0 0;color:var(--emr-text-muted);font-size:.78rem}
    .emr-token-table{width:100%;border-collapse:collapse;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface);overflow:hidden}
    .emr-token-table th,.emr-token-table td{padding:10px 12px;text-align:left;font-size:.82rem;border-bottom:1px solid var(--emr-border)}
    .emr-token-table tbody tr:last-child td{border-bottom:none}.emr-token-table th{color:var(--emr-text-muted);font-size:.76rem;text-transform:uppercase;letter-spacing:.06em}
    .emr-token-table code{color:var(--emr-primary);overflow-wrap:anywhere}
    .emr-color-actions{display:flex;flex-wrap:wrap;gap:10px;padding:16px;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface)}
    @media(max-width:560px){.emr-color-catalogue{padding:14px}.emr-color-grid{grid-template-columns:1fr}}
  `]
})
class EmrColorTokenCatalogueComponent {
  @Input() dark = false;
  readonly tokenGroups = groups;
  readonly constantTokens = constants;
  displayValue(token: TokenGroup['tokens'][number]): string { return this.dark ? darkValues[token.name] ?? token.value : token.value; }
}

const meta: Meta<EmrColorTokenCatalogueComponent> = {
  title: 'Foundations / Colors',
  component: EmrColorTokenCatalogueComponent,
  parameters: { layout: 'fullscreen' }
};
export default meta;
type Story = StoryObj<EmrColorTokenCatalogueComponent>;

export const LightSemanticPalette: Story = { args: { dark: false } };
export const DarkSemanticPalette: Story = { args: { dark: true } };
