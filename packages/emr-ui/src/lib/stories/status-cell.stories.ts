import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrBadge } from '@drguptavivek/emr-controller';
import { EmrStatusCellComponent } from '../primitives/emr-status-cell.component';

const meta: Meta<EmrStatusCellComponent> = {
  title: 'EMR / Primitives / Status cell',
  component: EmrStatusCellComponent,
  decorators: [moduleMetadata({ imports: [EmrStatusCellComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Mechanical cell: a caller-supplied state badge, optional value, attribution line and one action. Labels and tones are never derived. All data on this page is synthetic.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrStatusCellComponent>;

const tones: EmrBadge['tone'][] = ['neutral', 'info', 'success', 'warning', 'danger'];
const badges = tones.map((tone) => ({ tone, label: `State ${tone}` }));
const attribution = { nameLabel: 'Test Nurse A', roleLabel: 'RN', timeLabel: '08:05' };
const row = 'display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start';

const allTones = `<div style="${row}">@for (b of badges; track b.tone) { <emr-status-cell [status]="b" /> }</div>`;

export const AllTones: Story = { render: () => ({ template: allTones, props: { badges } }) };

export const AllTonesDark: Story = {
  render: () => ({
    template: `<div class="emr-theme-dark" style="padding:16px;background:var(--emr-surface)">${allTones}</div>`,
    props: { badges }
  })
};

export const WithValue: Story = {
  render: () => ({
    template: `<emr-status-cell [status]="s" valueLabel="500 mg" />`,
    props: { s: { tone: 'success', label: 'Given' } satisfies EmrBadge }
  })
};

export const WithAttribution: Story = {
  render: () => ({
    template: `<emr-status-cell [status]="s" valueLabel="500 mg" [attribution]="a" secondaryNote="Synthetic note" />`,
    props: { s: { tone: 'success', label: 'Given' } satisfies EmrBadge, a: attribution }
  })
};

export const WithAction: Story = {
  render: () => ({
    template: `<emr-status-cell [status]="s" [action]="act" (actionClicked)="clicks = clicks + 1" /> <p>Action clicked: {{ clicks }}</p>`,
    props: { s: { tone: 'warning', label: 'Due' } satisfies EmrBadge, act: { label: 'Record', icon: '+' }, clicks: 0 }
  })
};

export const Compact: Story = {
  render: () => ({
    template: `<div style="${row}">@for (b of badges; track b.tone) { <emr-status-cell [status]="b" [compact]="true" valueLabel="500 mg" [attribution]="a" /> }</div>`,
    props: { badges, a: attribution }
  })
};

const cols = ['06:00', '10:00', '14:00', '18:00', '22:00'];
const grid = Array.from({ length: 6 }, (_, r) => ({
  drug: `Test drug ${r + 1}`,
  cells: cols.map((_c, c) => ({ status: badges[(r + c) % badges.length], value: `${(r + 1) * 100} mg` }))
}));

export const InTableGrid: Story = {
  render: () => ({
    template: `
      <div class="emr-table-wrap"><table class="emr-table">
        <thead><tr><th scope="col">Item</th>@for (c of cols; track c) { <th scope="col">{{ c }}</th> }</tr></thead>
        <tbody>@for (r of grid; track r.drug) {
          <tr><th scope="row">{{ r.drug }}</th>@for (c of r.cells; track $index) {
            <td><emr-status-cell [status]="c.status" [valueLabel]="c.value" [selectable]="true" (selected)="picked = r.drug" /></td>
          }</tr>
        }</tbody>
      </table></div>
      <p>Selected row: {{ picked }}</p>`,
    props: { cols, grid, picked: '' }
  })
};

export const ReadOnly: Story = {
  render: () => ({
    template: `<emr-status-cell [status]="s" [action]="act" [readOnly]="true" />`,
    props: { s: { tone: 'warning', label: 'Due' } satisfies EmrBadge, act: { label: 'Record' } }
  })
};

export const LongLabels: Story = {
  render: () => ({
    template: `<div style="max-width:220px"><emr-status-cell [status]="s" valueLabel="Synthetic long value label that wraps across lines" [attribution]="a" secondaryNote="A long synthetic secondary note that should wrap rather than overflow" [action]="act" /></div>`,
    props: {
      s: { tone: 'info', label: 'A very long synthetic state label that must wrap' } satisfies EmrBadge,
      a: { nameLabel: 'Synthetic Long Name Test-Person', roleLabel: 'Staff role', timeLabel: '08:05' },
      act: { label: 'Record administration' }
    }
  })
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => ({
    template: `<div style="max-width:360px;display:flex;flex-direction:column;gap:12px">@for (b of badges; track b.tone) { <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>Test item</span><emr-status-cell [status]="b" valueLabel="500 mg" [selectable]="true" /></div> }</div>`,
    props: { badges }
  })
};
