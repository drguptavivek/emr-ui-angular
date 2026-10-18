import type { PendingConfirmation } from './consent.models.js';
import type { EmrBadge, EmrTone } from './models.js';

/**
 * Patient self-service ("privacy centre"): data-sharing grants, the access log and data-principal rights
 * requests. Pre-resolved strings only; the app decides eligibility (canRevoke, canWithdraw, canSubmit),
 * deadlines and wording. Shared by emr-ui and emr-react.
 */

export type ListState = 'ready' | 'loading' | 'empty' | 'error';

// ---- Sharing grants (e.g. ABDM consent artefacts, other providers, apps) ----------------------------------

export interface SharingGrantView {
  id: string;
  /** Who receives the data, e.g. "Test City Hospital" or "Health locker app". */
  recipientLabel: string;
  recipientTypeLabel?: string;
  purposeLabel: string;
  /** What is shared, e.g. ["Prescriptions", "Lab reports"]. */
  dataScope: string[];
  /** Period of records covered, e.g. "Jan 2024 – Dec 2026". */
  recordsPeriodLabel?: string;
  validFromLabel: string;
  /** Absent = no expiry. */
  validToLabel?: string;
  statusBadge: EmrBadge;
  grantedAtLabel?: string;
  grantedByLabel?: string;
  canRevoke: boolean;
}

export interface SharingGrantsViewModel {
  grants: SharingGrantView[];
  filters?: { id: string; label: string }[];
  selectedFilter?: string;
  state: ListState;
  message?: string;
  pendingRevoke?: PendingConfirmation & { grantId: string };
  notice?: { tone: EmrTone; text: string };
}

export type SharingGrantsIntent =
  | { type: 'filterSelected'; id: string }
  | { type: 'grantSelected'; id: string }
  | { type: 'revokeRequested'; grantId: string }
  | { type: 'revokeConfirmed'; grantId: string }
  | { type: 'revokeDismissed' }
  | { type: 'retryRequested' };

// ---- Access log ------------------------------------------------------------------------------------------

export interface AccessLogEntryView {
  id: string;
  atLabel: string;
  actorLabel: string;
  actorRoleLabel?: string;
  organisationLabel?: string;
  /** e.g. "Viewed", "Updated", "Shared". */
  actionLabel: string;
  /** What was accessed, e.g. "Eye examination, 12-10-2026". */
  dataLabel: string;
  purposeLabel?: string;
  badge?: EmrBadge;
  /** The patient may raise a concern about this entry (grievance pre-filled by the app). */
  canReportConcern?: boolean;
}

export interface AccessLogViewModel {
  entries: AccessLogEntryView[];
  periodOptions?: { id: string; label: string }[];
  selectedPeriod?: string;
  state: ListState;
  message?: string;
  canLoadMore: boolean;
}

export type AccessLogIntent =
  | { type: 'periodSelected'; id: string }
  | { type: 'entrySelected'; id: string }
  | { type: 'concernRequested'; entryId: string }
  | { type: 'loadMoreRequested' }
  | { type: 'retryRequested' };

// ---- Rights requests (access, correction, erasure, nominee, grievance) -------------------------------------

export type RightsRequestKind = 'access' | 'correction' | 'erasure' | 'nominee' | 'grievance';

export interface RightsRequestView {
  id: string;
  kind: RightsRequestKind;
  kindLabel: string;
  submittedAtLabel: string;
  statusBadge: EmrBadge;
  /** Statutory or service deadline as display text, e.g. "Reply due by 20-10-2026". */
  dueLabel?: string;
  summary?: string;
  /** The organisation's reply once available. */
  responseText?: string;
  canWithdraw: boolean;
}

export interface RightsRequestDraft {
  kindOptions: { id: RightsRequestKind; label: string; description?: string }[];
  kind?: RightsRequestKind;
  /** Kind-specific guidance from the app, e.g. what erasure cannot remove (records kept by law). */
  guidance?: string;
  description?: string;
  descriptionLabel: string;
  descriptionError?: string;
  nominee?: {
    name?: string;
    relationship?: string;
    contact?: string;
    nameError?: string;
    relationshipError?: string;
    contactError?: string;
  };
  /** Status text of supporting documents the app attached, e.g. "1 document attached". */
  attachmentsLabel?: string;
  canAttach: boolean;
  canSubmit: boolean;
  submitError?: string;
}

export interface RightsRequestsViewModel {
  requests: RightsRequestView[];
  state: ListState;
  message?: string;
  /** Present while a new request is being written. */
  draft?: RightsRequestDraft;
  pendingWithdrawal?: PendingConfirmation & { requestId: string };
  notice?: { tone: EmrTone; text: string };
}

export type RightsRequestsIntent =
  | { type: 'newRequestStarted' }
  | { type: 'kindSelected'; kind: RightsRequestKind }
  | { type: 'descriptionChanged'; value: string }
  | { type: 'nomineeChanged'; name?: string; relationship?: string; contact?: string }
  | { type: 'attachRequested' }
  | { type: 'draftSubmitted' }
  | { type: 'draftCancelled' }
  | { type: 'requestSelected'; id: string }
  | { type: 'withdrawRequested'; requestId: string }
  | { type: 'withdrawConfirmed'; requestId: string }
  | { type: 'withdrawDismissed' }
  | { type: 'retryRequested' };

// ---- Privacy centre (self-service home) ------------------------------------------------------------------

export interface PrivacyCentreViewModel {
  title: string;
  /** Summary tiles: key opens that section (same shape as the stat tile). */
  tiles: { key: string; label: string; value: string; sub?: string; status?: EmrBadge }[];
  sections: { id: 'consents' | 'grants' | 'access' | 'requests'; label: string }[];
  activeSection: 'consents' | 'grants' | 'access' | 'requests';
  /** How to reach a person, e.g. helpline and grievance officer; pre-resolved. */
  contactText?: string;
}

export type PrivacyCentreIntent =
  | { type: 'sectionSelected'; id: PrivacyCentreViewModel['activeSection'] }
  | { type: 'tileSelected'; key: string };
