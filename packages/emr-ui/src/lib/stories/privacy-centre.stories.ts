import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  AccessLogEntryView, AccessLogViewModel, PrivacyCentreViewModel, RightsRequestsViewModel, SharingGrantView, SharingGrantsViewModel
} from '@drguptavivek/emr-controller';
import { EmrAccessLogComponent } from '../domain/emr-access-log.component';
import { EmrPrivacyCentreComponent } from '../domain/emr-privacy-centre.component';
import { EmrRightsRequestsComponent } from '../domain/emr-rights-requests.component';
import { EmrSharingGrantsComponent } from '../domain/emr-sharing-grants.component';

const meta: Meta<EmrPrivacyCentreComponent> = {
  title: 'EMR / Privacy / Centre',
  component: EmrPrivacyCentreComponent,
  decorators: [moduleMetadata({ imports: [EmrPrivacyCentreComponent, EmrSharingGrantsComponent, EmrAccessLogComponent, EmrRightsRequestsComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Patient self-service: data-sharing grants, access log, rights requests and a home that composes them. All text, badges, eligibility (canRevoke, canWithdraw, canSubmit) and deadlines come from the controller. Stories use synthetic data.'
      }
    }
  }
};
export default meta;
type Story = StoryObj<EmrPrivacyCentreComponent>;

const wrap = (inner: string, width = 720) => `<div class="emr-story-surface"><div style="max-width: ${width}px">${inner}</div></div>`;

// ---- Grants ----
const grant = (over: Partial<SharingGrantView> & { id: string }): SharingGrantView => ({
  recipientLabel: 'Test City Hospital',
  recipientTypeLabel: 'Hospital',
  purposeLabel: 'Care and treatment',
  dataScope: ['Prescriptions', 'Lab reports'],
  recordsPeriodLabel: 'Jan 2024 – Dec 2026',
  validFromLabel: '01-01-2026',
  validToLabel: '31-12-2026',
  statusBadge: { label: 'Active', tone: 'success' },
  grantedAtLabel: '01-01-2026',
  grantedByLabel: 'Test Patient A',
  canRevoke: true,
  ...over
});
const grants: SharingGrantsViewModel = {
  grants: [
    grant({ id: 'g1' }),
    grant({ id: 'g2', recipientLabel: 'Health locker app', recipientTypeLabel: 'Personal health record app', purposeLabel: 'Personal record keeping', dataScope: ['Eye examinations', 'Diagnostic reports', 'Discharge summaries'], validToLabel: undefined })
  ],
  filters: [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'ended', label: 'Expired or revoked' }],
  selectedFilter: 'all',
  state: 'ready'
};
const grantsMixed: SharingGrantsViewModel = {
  ...grants,
  grants: [
    ...grants.grants,
    grant({ id: 'g3', recipientLabel: 'Test City Hospital', purposeLabel: 'Second opinion', validFromLabel: '01-03-2025', validToLabel: '01-09-2025', statusBadge: { label: 'Expired', tone: 'neutral' }, canRevoke: false })
  ]
};
export const GrantsActive: Story = { render: () => ({ props: { m: grants }, template: wrap('<emr-sharing-grants [model]="m" />') }) };
export const GrantsExpiredAndNoExpiry: Story = { render: () => ({ props: { m: grantsMixed }, template: wrap('<emr-sharing-grants [model]="m" />') }) };
export const GrantsRevokeFlyoutOpen: Story = {
  render: () => ({
    props: {
      m: {
        ...grants,
        notice: { tone: 'info', text: 'Revoking stops new sharing. Records already shared stay with the recipient.' },
        pendingRevoke: {
          grantId: 'g1', title: 'Revoke sharing with Test City Hospital?',
          body: 'Test City Hospital will no longer be able to see your prescriptions and lab reports.',
          confirmLabel: 'Revoke sharing', cancelLabel: 'Keep sharing'
        }
      } satisfies SharingGrantsViewModel
    },
    template: wrap('<emr-sharing-grants [model]="m" />')
  })
};
export const GrantsEmpty: Story = { render: () => ({ props: { m: { grants: [], state: 'empty', message: 'You have not shared your records with anyone.' } satisfies SharingGrantsViewModel }, template: wrap('<emr-sharing-grants [model]="m" />') }) };
export const GrantsLoading: Story = { render: () => ({ props: { m: { grants: [], state: 'loading' } satisfies SharingGrantsViewModel }, template: wrap('<emr-sharing-grants [model]="m" />') }) };
export const GrantsError: Story = { render: () => ({ props: { m: { grants: [], state: 'error', message: 'The sharing service did not respond.' } satisfies SharingGrantsViewModel }, template: wrap('<emr-sharing-grants [model]="m" />') }) };

// ---- Access log ----
const entry = (n: number, over: Partial<AccessLogEntryView> = {}): AccessLogEntryView => ({
  id: `a${n}`,
  atLabel: `1${n}-10-2026 09:${10 + n}`,
  actorLabel: 'Test Clinician B',
  actorRoleLabel: 'Ophthalmologist',
  organisationLabel: 'Test City Hospital',
  actionLabel: 'Viewed',
  dataLabel: 'Eye examination, 12-10-2026',
  purposeLabel: 'Care and treatment',
  canReportConcern: true,
  ...over
});
const logPage1: AccessLogEntryView[] = [
  entry(1), entry(2, { actionLabel: 'Shared', dataLabel: 'Lab reports', badge: { label: 'Outside your usual care', tone: 'warning' }, actorLabel: 'Health locker app', actorRoleLabel: undefined, organisationLabel: undefined }),
  entry(3, { actionLabel: 'Updated', dataLabel: 'Prescription, 11-10-2026', canReportConcern: false })
];
const log: AccessLogViewModel = {
  entries: logPage1,
  periodOptions: [{ id: '30d', label: 'Last 30 days' }, { id: '12m', label: 'Last 12 months' }],
  selectedPeriod: '30d',
  state: 'ready',
  canLoadMore: true
};
export const AccessLogDefault: Story = { render: () => ({ props: { m: log }, template: wrap('<emr-access-log [model]="m" />') }) };
export const AccessLogPeriodSwitchAndLoadMore: Story = {
  render: () => ({
    props: {
      m: log,
      on(i: { type: string; id?: string }) {
        if (i.type === 'periodSelected') this['m'] = { ...this['m'], selectedPeriod: i.id, canLoadMore: true, entries: logPage1 };
        if (i.type === 'loadMoreRequested') this['m'] = { ...this['m'], canLoadMore: false, entries: [...this['m'].entries, entry(4), entry(5, { actionLabel: 'Downloaded' })] };
      }
    },
    template: wrap('<emr-access-log [model]="m" (intent)="on($event)" />')
  })
};
export const AccessLogEmpty: Story = { render: () => ({ props: { m: { ...log, entries: [], state: 'empty', canLoadMore: false, message: 'Nobody accessed your records in this period.' } satisfies AccessLogViewModel }, template: wrap('<emr-access-log [model]="m" />') }) };
export const AccessLogLoading: Story = { render: () => ({ props: { m: { ...log, entries: [], state: 'loading', canLoadMore: false } satisfies AccessLogViewModel }, template: wrap('<emr-access-log [model]="m" />') }) };
export const AccessLogError: Story = { render: () => ({ props: { m: { ...log, entries: [], state: 'error', canLoadMore: false, message: 'The access log service did not respond.' } satisfies AccessLogViewModel }, template: wrap('<emr-access-log [model]="m" />') }) };

// ---- Rights requests ----
const kindOptions: NonNullable<RightsRequestsViewModel['draft']>['kindOptions'] = [
  { id: 'access', label: 'Get a copy of my data', description: 'We reply with a summary of what we hold about you.' },
  { id: 'correction', label: 'Correct my data', description: 'Tell us what is wrong and how to fix it.' },
  { id: 'erasure', label: 'Erase my data', description: 'Some records must be kept by law.' },
  { id: 'nominee', label: 'Nominate someone', description: 'Choose a person to act for you if you cannot.' },
  { id: 'grievance', label: 'Raise a grievance' }
];
const requests: RightsRequestsViewModel = {
  state: 'ready',
  requests: [
    { id: 'r1', kind: 'access', kindLabel: 'Copy of my data', submittedAtLabel: '10-10-2026', statusBadge: { label: 'In progress', tone: 'info' }, dueLabel: 'Reply due by 20-10-2026', summary: 'All records from Test City Hospital.', canWithdraw: true },
    { id: 'r2', kind: 'correction', kindLabel: 'Correction', submittedAtLabel: '01-09-2026', statusBadge: { label: 'Completed', tone: 'success' }, summary: 'Date of birth was wrong.', responseText: 'The date of birth has been corrected.', canWithdraw: false }
  ]
};
const draftBase = { kindOptions, descriptionLabel: 'What would you like us to do?', canAttach: true, canSubmit: true };
export const RequestsList: Story = { render: () => ({ props: { m: requests }, template: wrap('<emr-rights-requests [model]="m" />') }) };
export const RequestsErasureDraftWithGuidance: Story = {
  render: () => ({
    props: { m: { ...requests, draft: { ...draftBase, kind: 'erasure', guidance: 'Records we must keep by law, such as prescriptions, cannot be erased. We will tell you which ones.', description: 'Please erase my contact details.', attachmentsLabel: '1 document attached' } } satisfies RightsRequestsViewModel },
    template: wrap('<emr-rights-requests [model]="m" />')
  })
};
export const RequestsNomineeDraftWithErrors: Story = {
  render: () => ({
    props: {
      m: {
        ...requests,
        draft: {
          ...draftBase, kind: 'nominee', canSubmit: false, descriptionError: 'Say why you are nominating this person.',
          nominee: { name: '', nameError: 'Enter the nominee name.', relationship: 'Sibling', contact: '12', contactError: 'Enter a valid phone number.' },
          submitError: 'Fix the highlighted fields to continue.'
        }
      } satisfies RightsRequestsViewModel
    },
    template: wrap('<emr-rights-requests [model]="m" />')
  })
};
export const RequestsWithdrawFlyoutOpen: Story = {
  render: () => ({
    props: { m: { ...requests, pendingWithdrawal: { requestId: 'r1', title: 'Withdraw this request?', body: 'We will stop working on your request for a copy of your data.', confirmLabel: 'Withdraw request', cancelLabel: 'Keep request' } } satisfies RightsRequestsViewModel },
    template: wrap('<emr-rights-requests [model]="m" />')
  })
};
export const RequestsEmpty: Story = { render: () => ({ props: { m: { requests: [], state: 'empty', message: 'Start a request when you want a copy of, or a change to, your data.' } satisfies RightsRequestsViewModel }, template: wrap('<emr-rights-requests [model]="m" />') }) };
export const RequestsLoading: Story = { render: () => ({ props: { m: { requests: [], state: 'loading' } satisfies RightsRequestsViewModel }, template: wrap('<emr-rights-requests [model]="m" />') }) };
export const RequestsError: Story = { render: () => ({ props: { m: { requests: [], state: 'error', message: 'The requests service did not respond.' } satisfies RightsRequestsViewModel }, template: wrap('<emr-rights-requests [model]="m" />') }) };

// ---- Privacy centre composition ----
const centre: PrivacyCentreViewModel = {
  title: 'Your privacy',
  tiles: [
    { key: 'consents', label: 'Consents', value: '3 of 4 given', status: { label: 'Review', tone: 'warning' } },
    { key: 'grants', label: 'Sharing', value: '2', sub: 'active grants' },
    { key: 'access', label: 'Access log', value: '12', sub: 'in the last 30 days' },
    { key: 'requests', label: 'Requests', value: '1', sub: 'awaiting reply' }
  ],
  sections: [{ id: 'consents', label: 'Consents' }, { id: 'grants', label: 'Sharing' }, { id: 'access', label: 'Access log' }, { id: 'requests', label: 'Requests' }],
  activeSection: 'grants',
  contactText: 'Call the Test City Hospital helpline on 000-000-0000 or write to the grievance officer.'
};
export const CentreWithProjectedSection: Story = {
  render: () => ({
    props: { c: centre, m: grants },
    template: wrap('<emr-privacy-centre [model]="c"><emr-sharing-grants [model]="m" /></emr-privacy-centre>', 880)
  })
};
export const CentreMobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => ({
    props: { c: { ...centre, activeSection: 'requests' } satisfies PrivacyCentreViewModel, m: requests },
    template: wrap('<emr-privacy-centre [model]="c"><emr-rights-requests [model]="m" /></emr-privacy-centre>', 360)
  })
};
