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
