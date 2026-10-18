import type { PendingConfirmation } from './consent.models.js';
import type { PatientIdentityViewModel } from './identity.models.js';
import type { ListState } from './privacy.models.js';
import type { EmrBadge } from './models.js';

/** Record merge, contact attempts and offline drafts. Pre-resolved strings; every rule is the app's. */

// ---- Merge 2–4 patient records -----------------------------------------------------------------------------

export interface MergeSourceView extends PatientIdentityViewModel {
  id: string;
  /** Short column heading, e.g. "Record A". */
  label?: string;
}

export interface MergeRowView {
  id: string;
  label: string;
  /** Display value per source id. */
  values: Readonly<Record<string, string>>;
  /** Domain-computed; the component never compares values. */
  differs: boolean;
  chosenSourceId?: string;
}

export interface MergeCompareViewModel {
  /** 2–4 records; two render side by side as before. */
  sources: MergeSourceView[];
  rows: MergeRowView[];
  survivorSourceId?: string;
  canConfirm: boolean;
}

export type MergeCompareIntent =
  | { type: 'fieldChosen'; rowId: string; sourceId: string }
  | { type: 'survivorChosen'; sourceId: string }
  | { type: 'mergeConfirmed' }
  | { type: 'rejected' }
  | { type: 'cancelled' };

// ---- Contact attempts ------------------------------------------------------------------------------------

export interface ContactAttemptViewModel {
  reasonLabel: string;
  numberOptions: { id: string; label: string }[];
  selectedNumber?: string;
  channelOptions: { id: string; label: string }[];
  selectedChannel?: string;
  reached?: boolean;
  outcomeOptions: { id: string; label: string }[];
  selectedOutcome?: string;
  /** What the chosen outcome will cause, e.g. "Reminders to this number will stop". Shown as an info alert. */
  consequence?: string;
  /** ISO YYYY-MM-DD. */
  nextActionDate?: string;
  nextActionDateError?: string;
  note?: string;
  canSubmit: boolean;
  submitError?: string;
}

export type ContactAttemptIntent =
  | { type: 'numberSelected'; id: string }
  | { type: 'channelSelected'; id: string }
  | { type: 'reachedChanged'; reached: boolean }
  | { type: 'outcomeSelected'; id: string }
  | { type: 'nextActionDateChanged'; date: string | null }
  | { type: 'noteChanged'; note: string }
  | { type: 'callRequested'; numberId: string }
  | { type: 'submitRequested' }
  | { type: 'cancelled' };

export interface ContactAttemptSummaryView {
  /** e.g. "Last call 12-10-2026 · not reachable · 3 attempts · next 15-10-2026". */
  text: string;
  statusBadge?: EmrBadge;
}

export type ContactAttemptSummaryIntent = { type: 'logAttemptRequested' };

// ---- Offline drafts and sent records ---------------------------------------------------------------------

export interface DraftRecordRowView {
  id: string;
  title: string;
  subtitle?: string;
  patientLabel?: string;
  updatedAtLabel: string;
  /** draft / queued / synced / conflict — wording and tone from the app. */
  stateBadge: EmrBadge;
  canOpen: boolean;
  /** Unsynced record filed under the wrong patient (wrong barcode scanned). */
  canMove: boolean;
  canDiscard: boolean;
}

export interface DraftRecordListViewModel {
  rows: DraftRecordRowView[];
  state: ListState;
  message?: string;
  pendingDiscard?: PendingConfirmation & { id: string };
}

export type DraftRecordListIntent =
  | { type: 'rowOpened'; id: string }
  | { type: 'moveToPatientRequested'; id: string }
  | { type: 'discardRequested'; id: string }
  | { type: 'discardConfirmed'; id: string }
  | { type: 'discardDismissed' }
  | { type: 'retryRequested' };
