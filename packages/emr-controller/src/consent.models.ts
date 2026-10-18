import type { AttestationViewModel } from './attestation.models.js';
import type { PatientIdentityViewModel } from './identity.models.js';
import type { EmrBadge, EmrTone } from './models.js';

/**
 * Consent capture, review and receipt (India DPDP Act 2023 shaped; usable for any notice-and-consent
 * regime). Every string — legal wording included — and every rule (who must consent, what is essential,
 * when a form may be submitted, what stops on withdrawal) is resolved by the app. Shared by emr-ui and
 * emr-react; components render and emit intents only.
 */
export type ConsentMethod = 'tap' | 'signature' | 'thumbprint' | 'verbal_attested';
export type ConsentDecision = 'granted' | 'refused';

export interface ConsentNoticeView {
  title: string;
  sections: { heading: string; body: string }[];
  version: string;
  languageLabel: string;
}

export interface ConsentPurposeView {
  id: string;
  label: string;
  description: string;
  /** Required for care: shown as such, never decided or refused. */
  essential: boolean;
  decision?: ConsentDecision;
  /** Decision shown read-only. */
  locked?: boolean;
}

/** A user-defined group of purposes: 'whole' = one decision for the group, 'per_purpose' = one each. */
export interface ConsentCategoryView {
  id: string;
  label: string;
  description?: string;
  mode: 'whole' | 'per_purpose';
  decision?: ConsentDecision;
  locked?: boolean;
  purposes: ConsentPurposeView[];
}

export interface ConsentCaptureViewModel {
  notice: ConsentNoticeView;
  languageOptions: { id: string; label: string }[];
  selectedLanguage: string;
  categories: ConsentCategoryView[];
  givenByOptions: { id: string; label: string }[];
  selectedGivenBy?: string;
  guardian?: { name?: string; relationship?: string; nameError?: string; relationshipError?: string; required: boolean };
  methodOptions: { id: ConsentMethod; label: string }[];
  selectedMethod?: ConsentMethod;
  /** Status text once the app has captured a signature or thumbprint, e.g. "Signature captured 10:42". */
  capture?: { signatureLabel?: string; thumbprintLabel?: string };
  /** Rendered when selectedMethod is verbal_attested. */
  attestation?: AttestationViewModel;
  canSubmit: boolean;
  submitError?: string;
}

export type ConsentCaptureIntent =
  | { type: 'languageSelected'; id: string }
  | { type: 'categoryDecided'; id: string; decision: ConsentDecision }
  | { type: 'purposeDecided'; id: string; decision: ConsentDecision }
  | { type: 'givenBySelected'; id: string }
  | { type: 'guardianChanged'; name?: string; relationship?: string }
  | { type: 'methodSelected'; id: ConsentMethod }
  | { type: 'signatureRequested' }
  | { type: 'thumbprintRequested' }
  | { type: 'attestationConfirmed' }
  | { type: 'submitRequested' }
  | { type: 'cancelled' };

/** A controlled confirm step (withdraw, revoke, discard): wording from the app, shown in a sheet/dialog. */
export interface PendingConfirmation {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
}

export interface ConsentReviewPurposeView {
  id: string;
  label: string;
  description?: string;
  essential: boolean;
  statusBadge: EmrBadge;
  decidedAtLabel?: string;
  methodLabel?: string;
  givenByLabel?: string;
  canWithdraw: boolean;
  canGrant: boolean;
  contact?: {
    channels: { id: string; label: string; selected: boolean }[];
    preferredNumber?: string;
    preferredNumberLabel: string;
    preferredNumberError?: string;
  };
}

export interface ConsentReviewViewModel {
  patient: PatientIdentityViewModel;
  noticeVersionLabel: string;
  categories: { id: string; label: string; description?: string; purposes: ConsentReviewPurposeView[] }[];
  pendingWithdrawal?: PendingConfirmation & { purposeId: string };
  message?: { tone: EmrTone; text: string };
}

export type ConsentReviewIntent =
  | { type: 'withdrawRequested'; purposeId: string }
  | { type: 'withdrawConfirmed'; purposeId: string }
  | { type: 'withdrawDismissed' }
  | { type: 'grantRequested'; purposeId: string }
  | { type: 'channelToggled'; purposeId: string; channelId: string }
  | { type: 'preferredNumberChanged'; purposeId: string; value: string }
  | { type: 'receiptRequested' }
  | { type: 'cancelled' };

/** Printable, read-only summary. */
export interface ConsentReceiptViewModel {
  title: string;
  patientName: string;
  identifiers: { label: string; display: string }[];
  dateLabel: string;
  noticeVersionLabel: string;
  categories: { label: string; purposes: { label: string; decisionLabel: string; statusBadge?: EmrBadge }[] }[];
  howToChange: string;
  footer?: string;
}

/** Compact consent state for banners: granted / partial / pending / withdrawn wording and tone from the app. */
export interface ConsentStatusViewModel {
  badge: EmrBadge;
  detail?: string;
}
