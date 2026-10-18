import type { EmrAuthorAttribution, EmrCaptureIntent, EmrCaptureSessionState } from './capture.models.js';
import type { EmrBadge, EmrTone } from './models.js';

/** One person (or consent party) on a signature. The controller supplies every label and the status badge. */
export interface CaptureSignatory {
  readonly id: string;
  readonly displayName: string;
  readonly roleLabel: string;
  readonly status: EmrBadge;
  readonly signedAtLabel?: string;
}

/**
 * Everything the record-lifecycle strip shows. The component renders `session` and emits intents; it
 * never formats timestamps, decides who may sign, or merges conflicts. Absent labels read "Not supplied".
 */
export interface CaptureStatusBarViewModel {
  readonly session: EmrCaptureSessionState;
  /** Controller-formatted `session.savedAt`. */
  readonly savedAtLabel?: string;
  readonly attribution?: EmrAuthorAttribution;
  /** Controller-formatted author line, for example "Recorded by A. Rao, 10 Oct 2026 09:14". Preferred over `attribution`. */
  readonly attributionLabel?: string;
  readonly signature?: {
    readonly status: EmrBadge;
    readonly signatories: readonly CaptureSignatory[];
    readonly canSign: boolean;
    readonly canAmend: boolean;
  };
  /** Controller-formatted names of the fields in conflict (from `session.conflict.conflictingPaths`). */
  readonly conflictLabels?: readonly string[];
  readonly readOnly?: boolean;
  // Offline-sync state for the Expo app. Text and tone are controller-supplied; the component
  // never derives a tone from `outbox.count`. Rendered only when present (React only so far).
  /** For example { label: 'Offline', tone: 'warning' }. */
  readonly connection?: { readonly label: string; readonly tone: EmrTone };
  /** Queued writes, for example { count: 3, label: '3 waiting to sync', tone: 'warning' }. */
  readonly outbox?: { readonly count: number; readonly label: string; readonly tone: EmrTone };
  /** Controller-formatted last successful sync time. */
  readonly lastSync?: string;
}

export type CaptureStatusBarIntent =
  | EmrCaptureIntent
  | { type: 'signRequested' }
  | { type: 'amendRequested' }
  | { type: 'conflictDetailRequested' };
