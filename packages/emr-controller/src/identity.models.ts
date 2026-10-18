import type { EmrBadge, EmrTone } from './models.js';

/**
 * A patient as shown on identity cards, banners and confirm prompts. Every string is pre-resolved by the
 * app; the first identifier is the primary one. Shared by emr-ui and emr-react.
 */
export interface PatientIdentityViewModel {
  identifiers: { system: string; label: string; display: string; statusBadge?: EmrBadge }[];
  name: string;
  ageLabel: string;
  sexLabel: string;
  phone?: string;
  centreName?: string;
  lastVisitDate?: string;
  aliases?: string[];
  /** Identifier types staff may add now (controller-decided). Omitted or empty: no Add action. */
  addableSystems?: { system: string; label: string }[];
  /** Pre-resolved notices under the identity block, e.g. "Phone number needs correcting" / "Merge pending". */
  alerts?: { id: string; text: string; tone: EmrTone; actionLabel?: string }[];
}

export type PatientIdentityIntent =
  | { type: 'confirmRequested' }
  | { type: 'notThisPatientRequested' }
  | { type: 'addIdentifierRequested'; system: string }
  | { type: 'alertActionRequested'; id: string };

// ---- Identifier entry (scan or type) -------------------------------------------------------------------

/**
 * A barcode / ID entry field. Validator-agnostic: the app's normaliser supplies normalisedValue, error and
 * warning; the camera is the app's (scanRequested). `typeOptions` appear only when the type is ambiguous.
 */
export interface IdentifierEntryView {
  label: string;
  value: string;
  normalisedValue?: string;
  error?: string;
  warning?: string;
  hint?: string;
  readOnly?: boolean;
  typeOptions?: { id: string; label: string }[];
  selectedType?: string;
}

export type IdentifierEntryIntent = { type: 'scanRequested' } | { type: 'typeSelected'; id: string };

// ---- Identifier duplicate check ---------------------------------------------------------------------------

export type IdentifierFindingKind = 'on_other_patient' | 'demographic_mismatch' | 'same_type_exists' | 'possible_duplicate';

export interface IdentifierFindingView {
  id: string;
  kind: IdentifierFindingKind;
  message: string;
  evidence: { label: string; value: string }[];
  candidate?: PatientIdentityViewModel & { id: string };
  acknowledged?: boolean;
}

export interface IdentifierCheckViewModel {
  identifier: { label: string; display: string };
  outcome: 'blocked' | 'warnings' | 'ok';
  findings: IdentifierFindingView[];
  canConfirm: boolean;
  canAddAsAdditional?: boolean;
  canReplaceExisting?: boolean;
}

export type IdentifierCheckIntent =
  | { type: 'findingAcknowledged'; findingId: string }
  | { type: 'confirmRequested' }
  | { type: 'mergeRequested'; candidateId: string }
  | { type: 'reenterRequested' }
  | { type: 'addAsAdditional' }
  | { type: 'replaceExisting' }
  | { type: 'cancelled' };

// ---- Link several cards to one patient ("I have three PEC cards") ----------------------------------------

export type LinkCardState = 'unused' | 'on_other_patient' | 'invalid' | 'checking';

export interface LinkCardView {
  id: string;
  display: string;
  state: LinkCardState;
  statusBadge: EmrBadge;
  message?: string;
  /** Present when the card already belongs to another record: the user says same person or not. */
  candidate?: PatientIdentityViewModel & { id: string };
  warnings?: string[];
}

export interface LinkCardsViewModel {
  patient: PatientIdentityViewModel;
  /** Entry for the next card (typed or scanned). */
  entry: IdentifierEntryView;
  cards: LinkCardView[];
  primaryCardId?: string;
  canSubmit: boolean;
  submitError?: string;
}

export type LinkCardsIntent =
  | { type: 'entryChanged'; raw: string }
  | { type: 'cardEntered' }
  | { type: 'scanRequested' }
  | { type: 'typeSelected'; id: string }
  | { type: 'cardRemoved'; id: string }
  | { type: 'primarySelected'; id: string }
  | { type: 'sameConfirmed'; id: string }
  | { type: 'notSameConfirmed'; id: string }
  | { type: 'submitRequested' }
  | { type: 'cancelled' };
