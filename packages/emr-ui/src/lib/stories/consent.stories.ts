import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  ConsentCaptureViewModel, ConsentCategoryView, ConsentReceiptViewModel, ConsentReviewViewModel, ConsentStatusViewModel
} from '@drguptavivek/emr-controller';
import { EmrConsentCaptureComponent } from '../domain/emr-consent-capture.component';
import { EmrConsentReceiptComponent } from '../domain/emr-consent-receipt.component';
import { EmrConsentReviewComponent } from '../domain/emr-consent-review.component';
import { EmrConsentStatusBadgeComponent } from '../domain/emr-consent-status-badge.component';

const meta: Meta = {
  title: 'EMR / Consent',
  decorators: [moduleMetadata({ imports: [EmrConsentCaptureComponent, EmrConsentReviewComponent, EmrConsentReceiptComponent, EmrConsentStatusBadgeComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Notice-and-consent surfaces (capture, review with a withdraw confirmation sheet, printable receipt, status badge). The app supplies every string, including legal wording, and every rule: who must consent, which purposes are essential, whether a form may be submitted. Components render and emit one intent stream; the receipt is read-only and has no intent. All wording here is synthetic placeholder text.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

const NOTICE_SECTIONS = Array.from({ length: 6 }, (_, i) => ({
  heading: `Placeholder section ${i + 1}`,
  body: 'Placeholder notice wording. The real text is supplied by the application and reviewed by the organisation; it is not part of this library. '.repeat(3)
}));
const notice = (title = 'Placeholder consent notice', languageLabel = 'English') => ({ title, sections: NOTICE_SECTIONS, version: 'v0-sample', languageLabel });

const categories: ConsentCategoryView[] = [
  { id: 'care', label: 'Care', mode: 'whole', purposes: [{ id: 'treatment', label: 'Treatment records', description: 'Sample purpose description.', essential: true }] },
  {
    id: 'sharing', label: 'Sharing', description: 'Sample category description.', mode: 'whole',
    purposes: [
      { id: 'referral', label: 'Referral letters', description: 'Sample purpose description.', essential: false },
      { id: 'insurer', label: 'Insurer claims', description: 'Sample purpose description.', essential: false }
    ]
  },
  {
    id: 'optional', label: 'Optional', mode: 'per_purpose',
    purposes: [
      { id: 'reminders', label: 'Visit reminders', description: 'Sample purpose description.', essential: false },
      { id: 'research', label: 'Research use', description: 'Sample purpose description.', essential: false },
      { id: 'audit', label: 'Quality audit', description: 'Sample purpose description.', essential: true }
    ]
  }
];

const capture = (extra: Partial<ConsentCaptureViewModel> = {}): ConsentCaptureViewModel => ({
  notice: notice(),
  languageOptions: [{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }],
  selectedLanguage: 'en',
  categories,
  givenByOptions: [{ id: 'self', label: 'The patient' }, { id: 'guardian', label: 'A guardian' }],
  methodOptions: [
    { id: 'tap', label: 'Tap to agree' }, { id: 'signature', label: 'Signature' },
    { id: 'thumbprint', label: 'Thumbprint' }, { id: 'verbal_attested', label: 'Verbal, witnessed' }
  ],
  canSubmit: false,
  submitError: 'Choose Agree or Do not agree for every purpose before submitting.',
  ...extra
});

const renderCapture = (model: ConsentCaptureViewModel, wrap = '') => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: 640px" class="${wrap}"><emr-consent-capture [model]="model" /></div></div>`
});

export const CaptureAdultSelfTap: Story = {
  render: () => renderCapture(capture({
    selectedGivenBy: 'self', selectedMethod: 'tap', canSubmit: true, submitError: undefined,
    categories: categories.map((c) => c.id === 'sharing' ? { ...c, decision: 'granted' as const } : c)
  }))
};

export const CaptureMinorGuardianErrors: Story = {
  render: () => renderCapture(capture({
    selectedGivenBy: 'guardian', selectedMethod: 'signature',
    guardian: { name: '', relationship: '', nameError: 'Enter the guardian name.', relationshipError: 'Enter the relationship to the patient.', required: true },
    capture: { signatureLabel: 'Signature captured 10:42' }
  }))
};

export const CaptureVerbalAttested: Story = {
  render: () => renderCapture(capture({
    selectedGivenBy: 'self', selectedMethod: 'verbal_attested',
    attestation: {
      id: 'att-consent', title: 'Witnessed by', statement: 'Placeholder: I confirm the patient heard the notice and agreed aloud.',
      signatories: [{ id: 'w1', displayName: 'A. Rao', roleLabel: 'Staff Nurse', status: { label: 'Pending', tone: 'warning' } }],
      canSign: true, signLabel: 'Witness'
    }
  }))
};

export const CaptureHindiNoticePlaceholder: Story = {
  render: () => renderCapture(capture({
    selectedLanguage: 'hi',
    notice: { ...notice('नमूना सहमति सूचना (प्लेसहोल्डर)', 'हिन्दी'), sections: [{ heading: 'नमूना अनुभाग', body: 'यह केवल प्लेसहोल्डर पाठ है। वास्तविक पाठ एप्लिकेशन देगा।'.repeat(8) }] }
  }))
};

export const CapturePrintContext: Story = { render: () => renderCapture(capture({ selectedGivenBy: 'self' }), 'emr-print') };

const patient = {
  name: 'Asha Verma (synthetic)', ageLabel: '34 y', sexLabel: 'Female',
  identifiers: [{ system: 'mrn', label: 'MRN', display: 'MRN-000123' }]
};
const review = (extra: Partial<ConsentReviewViewModel> = {}): ConsentReviewViewModel => ({
  patient,
  noticeVersionLabel: 'Notice v0-sample, 10 Oct 2026',
  categories: [
    {
      id: 'care', label: 'Care', purposes: [{
        id: 'treatment', label: 'Treatment records', description: 'Sample purpose description.', essential: true,
        statusBadge: { label: 'Required', tone: 'info' }, canWithdraw: true, canGrant: false
      }]
    },
    {
      id: 'optional', label: 'Optional', purposes: [
        {
          id: 'reminders', label: 'Visit reminders', essential: false, statusBadge: { label: 'Agreed', tone: 'success' },
          decidedAtLabel: '10 Oct 2026, 10:42', methodLabel: 'Tap to agree', givenByLabel: 'The patient', canWithdraw: true, canGrant: false,
          contact: {
            channels: [{ id: 'sms', label: 'Text message', selected: true }, { id: 'call', label: 'Phone call', selected: false }],
            preferredNumber: '+00 00000 00000', preferredNumberLabel: 'Preferred number'
          }
        },
        { id: 'research', label: 'Research use', essential: false, statusBadge: { label: 'Withdrawn', tone: 'danger' }, decidedAtLabel: '12 Oct 2026', canWithdraw: false, canGrant: true }
      ]
    }
  ],
  ...extra
});
const renderReview = (model: ConsentReviewViewModel) => ({
  props: { model },
  template: `<div class="emr-story-surface"><div style="max-width: 640px"><emr-consent-review [model]="model" /></div></div>`
});

export const ReviewDefault: Story = { render: () => renderReview(review()) };

export const ReviewWithdrawSheetOpen: Story = {
  render: () => renderReview(review({
    pendingWithdrawal: {
      purposeId: 'reminders', title: 'Withdraw visit reminders?',
      body: 'Placeholder wording: reminders will stop. Care already given is not affected.',
      confirmLabel: 'Withdraw', cancelLabel: 'Keep'
    }
  }))
};

const receipt: ConsentReceiptViewModel = {
  title: 'Consent receipt (placeholder)', patientName: 'Asha Verma (synthetic)',
  identifiers: [{ label: 'MRN', display: 'MRN-000123' }], dateLabel: '10 Oct 2026', noticeVersionLabel: 'Notice v0-sample',
  categories: [
    { label: 'Care', purposes: [{ label: 'Treatment records', decisionLabel: 'Required for care' }] },
    { label: 'Optional', purposes: [
      { label: 'Visit reminders', decisionLabel: 'Agreed', statusBadge: { label: 'Active', tone: 'success' } },
      { label: 'Research use', decisionLabel: 'Not agreed', statusBadge: { label: 'Refused', tone: 'danger' } }
    ] }
  ],
  howToChange: 'Placeholder: ask at the registration desk to change a decision at any time.',
  footer: 'Synthetic sample, not a legal document.'
};
const renderReceipt = (wrap = '') => ({
  props: { receipt },
  template: `<div class="emr-story-surface"><div style="max-width: 640px" class="${wrap}"><emr-consent-receipt [model]="receipt" /></div></div>`
});

export const Receipt: Story = { render: () => renderReceipt() };
export const ReceiptPrintContext: Story = { render: () => renderReceipt('emr-print') };

const badges: ConsentStatusViewModel[] = [
  { badge: { label: 'Consent given', tone: 'success' }, detail: 'All purposes' },
  { badge: { label: 'Consent partial', tone: 'warning' }, detail: '2 of 3 optional purposes' },
  { badge: { label: 'Consent pending', tone: 'info' } },
  { badge: { label: 'Consent withdrawn', tone: 'danger', assistiveText: 'Optional processing has stopped' }, detail: 'Since 12 Oct 2026' }
];
export const StatusBadges: Story = {
  render: () => ({
    props: { badges },
    template: `<div class="emr-story-surface" style="display:grid;gap:8px">
      @for (b of badges; track b.badge.label) { <div><emr-consent-status-badge [model]="b" /></div> }
      <div><emr-consent-status-badge [model]="badges[1]" [interactive]="true" /></div>
    </div>`
  })
};
