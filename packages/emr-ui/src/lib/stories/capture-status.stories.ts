import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { CaptureSignatory, CaptureStatusBarViewModel, EmrNodePath } from '@drguptavivek/emr-controller';
import { EmrCaptureStatusBarComponent } from '../domain/emr-capture-status-bar.component';

const meta: Meta<EmrCaptureStatusBarComponent> = {
  title: 'EMR / Capture / Status bar',
  component: EmrCaptureStatusBarComponent,
  decorators: [moduleMetadata({ imports: [EmrCaptureStatusBarComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Compact record-lifecycle strip for any capture form: save state, author, signature status and the actions that follow. The controller supplies every label, badge and permission; the component renders the session snapshot and emits intents (save, discard, conflict resolution, sign, amend). Signatories appear underneath only when supplied. It never formats timestamps, decides who may sign, or merges conflicts.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrCaptureStatusBarComponent>;

const idle = { dirty: false, saving: false, savedAt: null, conflict: null, error: null };
const SAVED_AT = '2026-10-10T09:14:00Z';
const author = 'Recorded by Dr A. Rao (Ophthalmologist), 10 Oct 2026 09:02';
const path = (p: string) => p as unknown as EmrNodePath;
const signed = { label: 'Signed', tone: 'success' as const };
const unsigned = { label: 'Unsigned', tone: 'neutral' as const };

const base = (extra: Partial<CaptureStatusBarViewModel> = {}): CaptureStatusBarViewModel => ({
  session: idle,
  attributionLabel: author,
  ...extra
});

const render = (model: CaptureStatusBarViewModel, width = '960px') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: ${width}"><emr-capture-status-bar [model]="model" /></div></div>`
});

const signer = (id: string, displayName: string, roleLabel: string, status: CaptureSignatory['status'], signedAtLabel?: string): CaptureSignatory => ({ id, displayName, roleLabel, status, signedAtLabel });

export const Clean: Story = { render: () => render(base({ signature: { status: unsigned, signatories: [], canSign: true, canAmend: false } })) };

export const Dirty: Story = { render: () => render(base({ session: { ...idle, dirty: true, savedAt: SAVED_AT }, savedAtLabel: '09:14' })) };

export const Saving: Story = { render: () => render(base({ session: { ...idle, dirty: true, saving: true, savedAt: SAVED_AT }, savedAtLabel: '09:14' })) };

export const Saved: Story = { render: () => render(base({ session: { ...idle, savedAt: SAVED_AT }, savedAtLabel: '10 Oct 2026, 09:14' })) };

export const Conflict: Story = {
  render: () => render(base({
    session: {
      ...idle,
      dirty: true,
      conflict: { detectedAt: SAVED_AT, remoteRevision: 7, localRevision: 5, conflictingPaths: [path('iop.od'), path('iop.os')], remoteAuthor: 'Nurse P. Menon' }
    },
    conflictLabels: ['Intraocular pressure, right eye (OD)', 'Intraocular pressure, left eye (OS)']
  }))
};

export const SaveError: Story = {
  render: () => render(base({ session: { ...idle, dirty: true, error: 'The server could not be reached. Your changes are kept on this screen.' } }))
};

export const Signed: Story = {
  render: () => render(base({
    session: { ...idle, savedAt: SAVED_AT },
    savedAtLabel: '09:14',
    signature: {
      status: signed,
      signatories: [signer('s1', 'Dr A. Rao', 'Treating ophthalmologist', signed, '10 Oct 2026, 09:20')],
      canSign: false,
      canAmend: true
    }
  }))
};

export const CoSignPending: Story = {
  render: () => render(base({
    session: { ...idle, savedAt: SAVED_AT },
    savedAtLabel: '09:14',
    signature: {
      status: { label: 'Co-sign pending', tone: 'warning', assistiveText: 'A second signature is still needed' },
      signatories: [
        signer('s1', 'Dr A. Rao', 'Registrar', signed, '10 Oct 2026, 09:20'),
        signer('s2', 'Dr S. Iyer', 'Consultant', { label: 'Awaiting signature', tone: 'warning' })
      ],
      canSign: true,
      canAmend: false
    }
  }))
};

export const ConsentSignatories: Story = {
  render: () => render(base({
    attributionLabel: 'Consent recorded by Nurse P. Menon, 10 Oct 2026 08:40',
    session: { ...idle, savedAt: SAVED_AT },
    savedAtLabel: '08:55',
    signature: {
      status: { label: 'Partly signed', tone: 'warning' },
      signatories: [
        signer('c1', 'Synthetic Patient', 'Patient', signed, '10 Oct 2026, 08:50'),
        signer('c2', 'Synthetic Guardian', 'Witness', { label: 'Declined to sign', tone: 'danger' }),
        signer('c3', 'Dr S. Iyer', 'Operating surgeon', { label: 'Awaiting signature', tone: 'warning' })
      ],
      canSign: true,
      canAmend: false
    }
  }))
};

export const ReadOnly: Story = {
  render: () => render(base({
    readOnly: true,
    session: { ...idle, savedAt: SAVED_AT },
    savedAtLabel: '09:14',
    signature: { status: signed, signatories: [signer('s1', 'Dr A. Rao', 'Treating ophthalmologist', signed, '10 Oct 2026, 09:20')], canSign: true, canAmend: true }
  }))
};

export const Mobile: Story = {
  render: () => render(base({
    session: {
      ...idle,
      dirty: true,
      conflict: { detectedAt: SAVED_AT, remoteRevision: 7, localRevision: 5, conflictingPaths: [path('iop.od')], remoteAuthor: 'Nurse P. Menon' }
    },
    conflictLabels: ['Intraocular pressure, right eye (OD)'],
    signature: {
      status: { label: 'Co-sign pending', tone: 'warning' },
      signatories: [signer('s2', 'Dr S. Iyer', 'Consultant', { label: 'Awaiting signature', tone: 'warning' })],
      canSign: true,
      canAmend: false
    }
  }), '360px')
};
