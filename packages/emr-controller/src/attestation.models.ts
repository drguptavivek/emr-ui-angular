import type { CaptureSignatory } from './capture-status.models.js';

/**
 * One sign / witness / co-sign block. The controller decides who may sign (`canSign`, `canAmend`) and
 * supplies every label, badge and the attestation wording; the component only renders and emits intents.
 */
export interface AttestationViewModel {
  readonly id: string;
  /** For example "Administered by" or "Witnessed by". */
  readonly title?: string;
  readonly signatories: readonly CaptureSignatory[];
  readonly canSign: boolean;
  /** For example "Sign", "Witness", "Co-sign". */
  readonly signLabel?: string;
  readonly canAmend?: boolean;
  readonly amendLabel?: string;
  /** The wording the signer is agreeing to, shown verbatim. */
  readonly statement?: string;
  readonly readOnly?: boolean;
  readonly error?: string;
}

export type AttestationIntent =
  | { type: 'signRequested'; signatoryId?: string }
  | { type: 'amendRequested' }
  | { type: 'signatorySelected'; signatoryId: string };
