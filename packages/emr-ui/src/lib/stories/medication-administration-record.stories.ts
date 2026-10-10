import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { AttestationIntent, AttestationViewModel, CaptureSignatory, EmrBadge, TimeAxisIntent, TimeAxisViewModel } from '@drguptavivek/emr-controller';
import { EmrTimeAxisComponent } from '../structures/emr-time-axis.component';
import { EmrStatusCellComponent } from '../primitives/emr-status-cell.component';
import { EmrAttestationComponent } from '../fields/emr-attestation.component';

/**
 * Recipe, not a component: a medication administration record (MAR) assembled from existing pieces.
 * `EmrTimeAxis` is the shared time scale, one compact `EmrStatusCell` per scheduled dose is the grid, and
 * `EmrAttestation` collects the administering nurse, the witness and the co-sign for the selected dose.
 * The `Mar` class below stands in for the application controller: it owns every dose, words the outcome
 * badges, decides which sign-offs a dose needs (witness for a high-alert drug, co-sign for a dose that was
 * not given) and builds the attestation model. The UI components only render and emit.
 */
const meta: Meta = {
  title: 'EMR / Medications / Administration record',
  decorators: [moduleMetadata({ imports: [EmrTimeAxisComponent, EmrStatusCellComponent, EmrAttestationComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'MAR recipe composed only from existing components: a time axis with controller-supplied shift groups, a status cell per dose (given, held, refused, missed or due, each a controller-worded badge) and an attestation block for administered-by, witness and co-sign. The story is the controller. Select a dose to see its sign-offs; a due dose can be recorded as given.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

// ---- Synthetic controller data ------------------------------------------------------------------
type Outcome = 'due' | 'given' | 'held' | 'refused' | 'missed';
type Role = 'administered' | 'witness' | 'cosign';
interface MarOrder { id: string; drug: string; doseLabel: string; routeLabel: string; highAlert?: boolean }
interface MarDose { id: string; orderId: string; tickId: string; outcome: Outcome; reason?: string; signed: Partial<Record<Role, string>> }

const orders: MarOrder[] = [
  { id: 'para', drug: 'Paracetamol', doseLabel: '500 mg', routeLabel: 'Oral' },
  { id: 'enox', drug: 'Enoxaparin', doseLabel: '40 mg', routeLabel: 'Subcutaneous' },
  { id: 'ins', drug: 'Insulin (regular)', doseLabel: '6 units', routeLabel: 'Subcutaneous', highAlert: true },
  { id: 'moxi', drug: 'Moxifloxacin eye drops', doseLabel: '1 drop, right eye', routeLabel: 'Eye' }
];
const ticks = ['06', '08', '10', '12', '14', '16', '18', '20', '22'].map((h) => ({ id: `t${h}`, label: `${h}:00`, sublabel: 'Day 3', current: h === '14' }));
// Shift groups are controller data: the story never derives them from the clock.
const groups = [{ id: 'am', label: 'Morning shift', span: 4 }, { id: 'pm', label: 'Evening shift', span: 4 }, { id: 'nt', label: 'Night shift', span: 1 }];
const dose = (orderId: string, hour: string, outcome: Outcome, reason?: string, signed: MarDose['signed'] = {}): MarDose =>
  ({ id: `${orderId}-${hour}`, orderId, tickId: `t${hour}`, outcome, reason, signed });
const seedDoses = (): MarDose[] => [
  dose('para', '06', 'given', undefined, { administered: '06:10' }),
  dose('para', '12', 'held', 'Fever settled; prescriber advised hold', { administered: '12:05', cosign: '12:20' }),
  dose('para', '18', 'due'),
  dose('enox', '08', 'given', undefined, { administered: '08:02' }),
  dose('ins', '08', 'given', undefined, { administered: '08:15', witness: '08:16' }),
  dose('ins', '12', 'given', undefined, { administered: '12:10' }),
  dose('ins', '18', 'due'),
  dose('moxi', '08', 'given', undefined, { administered: '08:20' }),
  dose('moxi', '12', 'refused', 'Patient declined; says the drops sting', { administered: '12:25' }),
  dose('moxi', '16', 'due'),
  dose('moxi', '20', 'due'),
  dose('para', '22', 'missed', 'Patient in theatre at 22:00')
];

const outcomeBadge: Record<Outcome, EmrBadge> = {
  due: { label: 'Due', tone: 'info' },
  given: { label: 'Given', tone: 'success' },
  held: { label: 'Held', tone: 'warning', assistiveText: 'Dose deliberately not given' },
  refused: { label: 'Refused', tone: 'danger', assistiveText: 'Patient refused the dose' },
  missed: { label: 'Missed', tone: 'danger', assistiveText: 'Dose not given in the allowed window' }
};
const roleLabels: Record<Role, { name: string; role: string }> = {
  administered: { name: 'S. Menon', role: 'Administering nurse' },
  witness: { name: 'T. Kaur', role: 'Witness nurse' },
  cosign: { name: 'Dr P. Nair', role: 'Co-signing doctor' }
};

class Mar {
  doses = seedDoses();
  axis: TimeAxisViewModel = { id: 'mar-axis', title: 'Medication round', ticks, stepLabel: 'Two hourly', canShiftEarlier: false, canShiftLater: false };
  groups = groups;
  orders = orders;
  selectedId: string | null;
  readOnly: boolean;

  constructor(selectedId: string | null, readOnly = false) { this.selectedId = selectedId; this.readOnly = readOnly; }

  doseAt(orderId: string, tickId: string): MarDose | undefined { return this.doses.find((d) => d.orderId === orderId && d.tickId === tickId); }
  get selected(): MarDose | undefined { return this.doses.find((d) => d.id === this.selectedId); }
  orderOf(d: MarDose): MarOrder { return this.orders.find((o) => o.id === d.orderId)!; }
  badge(d: MarDose): EmrBadge { return outcomeBadge[d.outcome]; }
  timeLabel(d: MarDose): string { return ticks.find((t) => t.id === d.tickId)!.label; }

  /** Which sign-offs a dose needs is a controller policy, not a component decision. */
  rolesFor(d: MarDose): Role[] {
    if (d.outcome === 'due') return [];
    const roles: Role[] = ['administered'];
    if (d.outcome === 'given' && this.orderOf(d).highAlert) roles.push('witness');
    if (d.outcome !== 'given') roles.push('cosign');
    return roles;
  }

  attestation(d: MarDose): AttestationViewModel {
    const roles = this.rolesFor(d);
    const signatories: CaptureSignatory[] = roles.map((r) => ({
      id: r, displayName: roleLabels[r].name, roleLabel: roleLabels[r].role,
      status: d.signed[r] ? { label: 'Signed', tone: 'success' } : { label: 'Awaiting signature', tone: 'warning' },
      signedAtLabel: d.signed[r] ? `Today ${d.signed[r]}` : undefined
    }));
    return {
      id: `att-${d.id}`, title: 'Sign-off', signatories,
      statement: 'I confirm the right patient, drug, dose, route and time were checked.',
      canSign: roles.some((r) => !d.signed[r]), signLabel: 'Sign', readOnly: this.readOnly
    };
  }

  onAxis(e: TimeAxisIntent): void { if (e.type === 'tickSelected') this.axis = { ...this.axis, selectedTickId: e.tickId }; }
  select(d: MarDose): void { this.selectedId = d.id; }
  recordGiven(d: MarDose): void { this.doses = this.doses.map((x) => x === d ? { ...x, outcome: 'given' } : x); }
  onAttest(e: AttestationIntent): void {
    const d = this.selected;
    if (!d || e.type !== 'signRequested') return;
    const role = (e.signatoryId as Role | undefined) ?? this.rolesFor(d).find((r) => !d.signed[r]);
    if (!role) return;
    this.doses = this.doses.map((x) => x === d ? { ...x, signed: { ...x.signed, [role]: '14:30' } } : x);
  }
}

const template = `
<div class="emr-story-surface" style="overflow-x:auto">
  <div style="width:max-content;display:grid;gap:12px;--emr-time-axis-lead:12rem">
    <emr-time-axis [model]="mar.axis" (intent)="mar.onAxis($event)" />
    <table style="border-collapse:collapse;table-layout:fixed;width:calc(12rem + 9 * var(--emr-time-axis-col, 5.5rem));font-size:var(--emr-text-sm)">
      <caption class="emr-sr-only">Medication administration record, day 3</caption>
      <thead>
        <tr>
          <td></td>
          @for (g of mar.groups; track g.id) {
            <th scope="colgroup" [attr.colspan]="g.span" style="border:1px solid var(--emr-border);background:var(--emr-surface-soft);color:var(--emr-text-muted);font-size:var(--emr-text-xs);padding:4px">{{ g.label }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (o of mar.orders; track o.id) {
          <tr>
            <th scope="row" style="width:12rem;text-align:left;border:1px solid var(--emr-border);padding:6px;color:var(--emr-text)">
              {{ o.drug }}<br>
              <span style="color:var(--emr-text-muted);font-size:var(--emr-text-xs)">{{ o.doseLabel }} · {{ o.routeLabel }}</span>
              @if (o.highAlert) { <span class="emr-badge emr-tone-warning">High alert</span> }
            </th>
            @for (t of mar.axis.ticks; track t.id) {
              <td style="border:1px solid var(--emr-border);padding:4px;vertical-align:middle">
                @if (mar.doseAt(o.id, t.id); as d) {
                  <emr-status-cell [status]="mar.badge(d)" [compact]="true" [selectable]="true" (selected)="mar.select(d)" />
                } @else {
                  <span aria-hidden="true" style="color:var(--emr-text-muted)">—</span><span class="emr-sr-only">No dose scheduled</span>
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
    @if (mar.selected; as d) {
      <section class="emr-card" style="padding:12px;display:grid;gap:12px;max-width:40rem" aria-label="Selected dose">
        <h3 style="margin:0;font-size:var(--emr-text-md)">{{ mar.orderOf(d).drug }}, {{ mar.timeLabel(d) }}</h3>
        <emr-status-cell [status]="mar.badge(d)" [valueLabel]="mar.orderOf(d).doseLabel" [secondaryNote]="d.reason"
          [readOnly]="mar.readOnly" [action]="d.outcome === 'due' ? { label: 'Record as given' } : undefined" (actionClicked)="mar.recordGiven(d)" />
        @if (mar.rolesFor(d).length) { <emr-attestation [model]="mar.attestation(d)" (intent)="mar.onAttest($event)" /> }
      </section>
    }
  </div>
</div>`;

const render = (selectedId: string | null, readOnly = false) => ({ props: { mar: new Mar(selectedId, readOnly) }, template });

export const Overview: Story = { render: () => render(null) };
export const DueDose: Story = { name: 'Due dose', render: () => render('para-18') };
export const HighAlertWitnessPending: Story = { name: 'High-alert witness pending', render: () => render('ins-12') };
export const RefusedNeedsCoSign: Story = { name: 'Refused needs co-sign', render: () => render('moxi-12') };
export const HeldDose: Story = { name: 'Held dose', render: () => render('para-12') };
export const MissedDose: Story = { name: 'Missed dose', render: () => render('para-22') };
export const ReadOnly: Story = { render: () => render('ins-12', true) };
export const Mobile: Story = { render: () => render('ins-08'), parameters: { viewport: { defaultViewport: 'mobile1' } } };
