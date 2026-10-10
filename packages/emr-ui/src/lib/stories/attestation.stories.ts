import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { CaptureSignatory } from '@drguptavivek/emr-controller';
import type { AttestationViewModel } from '@drguptavivek/emr-controller';
import { EmrAttestationComponent } from '../fields/emr-attestation.component';

const meta: Meta<EmrAttestationComponent> = {
  title: 'EMR / Capture / Attestation',
  component: EmrAttestationComponent,
  decorators: [moduleMetadata({ imports: [EmrAttestationComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Reusable sign, witness and co-sign block for inpatient records. The controller supplies the title, attestation wording, signatories, badges, button labels and who may sign or amend; the component renders them and emits one intent stream. It never decides who may sign, formats timestamps or evaluates completeness. Compact enough for a popover or a checklist footer, and readable in print.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrAttestationComponent>;

const signer = (id: string, displayName: string, roleLabel: string, status: CaptureSignatory['status'], signedAtLabel?: string): CaptureSignatory => ({ id, displayName, roleLabel, status, signedAtLabel });
const signed = { label: 'Signed', tone: 'success' as const };
const pending = { label: 'Pending', tone: 'warning' as const };
const required = { label: 'Co-sign required', tone: 'danger' as const };

const render = (model: AttestationViewModel, width = '480px') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: ${width}"><emr-attestation [model]="model" /></div></div>`
});

const WORDING = 'I confirm the dose, route and patient identity were checked at the bedside.';
const base = (extra: Partial<AttestationViewModel> = {}): AttestationViewModel => ({
  id: 'att-1', title: 'Administered by', statement: WORDING, signatories: [], canSign: true, ...extra
});
const rao = signer('rao', 'A. Rao', 'Staff Nurse', signed, '10 Oct 2026, 09:14');

export const Unsigned: Story = { render: () => render(base({ signatories: [signer('rao', 'A. Rao', 'Staff Nurse', pending)] })) };

export const SignedSingle: Story = { render: () => render(base({ signatories: [rao], canSign: false })) };

export const WitnessPending: Story = {
  render: () => render(base({
    title: 'Witnessed by', signLabel: 'Witness',
    signatories: [rao, signer('menon', 'P. Menon', 'Witness nurse', pending)]
  }))
};

export const TwoPersonComplete: Story = {
  render: () => render(base({
    title: 'Two-person check', canSign: false,
    signatories: [rao, signer('menon', 'P. Menon', 'Witness nurse', signed, '10 Oct 2026, 09:16')]
  }))
};

export const CoSignRequired: Story = {
  render: () => render(base({
    title: 'Co-signature', signLabel: 'Co-sign', statement: 'I have reviewed this entry and agree with it.',
    signatories: [signer('iyer', 'S. Iyer', 'Resident', signed, '10 Oct 2026, 08:50'), signer('rao2', 'Dr A. Rao', 'Attending', required)]
  }))
};

export const Amendable: Story = { render: () => render(base({ signatories: [rao], canSign: false, canAmend: true, amendLabel: 'Amend signed entry' })) };

export const WithError: Story = {
  render: () => render(base({ signatories: [signer('rao', 'A. Rao', 'Staff Nurse', pending)], error: 'The signature could not be recorded. Try again.' }))
};

export const ReadOnly: Story = { render: () => render(base({ signatories: [rao], canSign: true, canAmend: true, readOnly: true })) };

export const LongNames: Story = {
  render: () => render(base({
    signatories: [signer('long', 'Dr Alexandrina Wolfeschlegelsteinhausenbergerdorff-Montgomery', 'Senior Consultant Vitreoretinal Surgeon and Clinical Governance Lead', signed, 'Saturday 10 October 2026 at 09:14 local time')]
  }), '320px')
};

export const Mobile: Story = {
  render: () => render(base({ signLabel: 'Witness', signatories: [rao, signer('menon', 'P. Menon', 'Witness nurse', pending)], canAmend: true }), '320px'),
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};
