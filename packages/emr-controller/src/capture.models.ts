import type { EmrNodePath } from './node-path.js';

// ─────────────────────────────────────────────────────────────
// The save/dirty/conflict lifecycle (finding F10). Clinical data capture
// without a save-state contract silently loses work — this is the shape a
// UI needs to render "unsaved changes", "saving…", "saved", and a conflict
// resolution surface, and nothing more. The controller owns transitions;
// the UI only ever renders a snapshot of this state.
// ─────────────────────────────────────────────────────────────

export interface EmrCaptureSessionState {
  readonly dirty: boolean;
  readonly saving: boolean;
  readonly savedAt: string | null; // ISO-8601
  readonly conflict: EmrCaptureConflict | null;
  readonly error: string | null;
}

/** The idle, never-touched starting point for a capture session. */
export const initialCaptureSessionState: EmrCaptureSessionState = {
  dirty: false,
  saving: false,
  savedAt: null,
  conflict: null,
  error: null,
};

export interface EmrCaptureConflict {
  readonly detectedAt: string; // ISO-8601
  readonly remoteRevision: number;
  readonly localRevision: number;
  readonly conflictingPaths: readonly EmrNodePath[];
  readonly remoteAuthor?: string;
}

export type EmrCaptureIntent =
  | { type: 'saveRequested' }
  | { type: 'discardRequested' }
  | {
      type: 'conflictResolutionRequested';
      resolution: 'keepLocal' | 'keepRemote' | 'merge';
    };

// ─────────────────────────────────────────────────────────────
// Provenance. A medical record entry without an author is not a record.
// ─────────────────────────────────────────────────────────────

export interface EmrAuthorAttribution {
  readonly recordedBy: string;
  readonly recordedAt: string; // ISO-8601
  readonly amendedBy?: string;
  readonly amendedAt?: string; // ISO-8601
  readonly role?: string;
}

// ─────────────────────────────────────────────────────────────
// Capture repository port. Framework-neutral: Promise-returning, an
// optional AbortSignal, no Angular/RxJS/HTTP dependency. `revision` is
// carried on every read and write so the caller can detect a conflicting
// remote write before it silently overwrites clinical data (optimistic
// concurrency) — see {@link EmrCaptureConflictError}.
// ─────────────────────────────────────────────────────────────

export interface EmrCaptureRequestOptions {
  readonly signal?: AbortSignal;
}

export interface EmrCaptureSaveRequest<Data> {
  readonly instanceId: string;
  /** The revision this save was based on; the server rejects a stale one. */
  readonly baseRevision: number;
  readonly data: Data;
  readonly attribution: EmrAuthorAttribution;
}

export interface EmrCaptureSaveResult {
  readonly revision: number;
  readonly savedAt: string; // ISO-8601
}

export interface EmrCaptureLoadResult<Data> {
  readonly data: Data;
  readonly revision: number;
  readonly attribution: EmrAuthorAttribution;
}

export interface EmrCaptureRepositoryPort<Data> {
  save(
    request: EmrCaptureSaveRequest<Data>,
    options?: EmrCaptureRequestOptions,
  ): Promise<EmrCaptureSaveResult>;
  load(
    instanceId: string,
    options?: EmrCaptureRequestOptions,
  ): Promise<EmrCaptureLoadResult<Data>>;
}

/**
 * Thrown by an {@link EmrCaptureRepositoryPort} `save()` implementation when
 * `baseRevision` no longer matches the stored revision — i.e. someone else
 * saved in between. Carries what the controller needs to populate
 * {@link EmrCaptureConflict}.
 */
export class EmrCaptureConflictError extends Error {
  readonly remoteRevision: number;
  readonly localRevision: number;
  readonly conflictingPaths: readonly EmrNodePath[];
  readonly remoteAuthor?: string;

  constructor(options: {
    remoteRevision: number;
    localRevision: number;
    conflictingPaths: readonly EmrNodePath[];
    remoteAuthor?: string;
    message?: string;
  }) {
    super(
      options.message ??
        `Save conflict: local revision ${options.localRevision} is stale; remote is at revision ${options.remoteRevision}.`,
    );
    this.name = 'EmrCaptureConflictError';
    this.remoteRevision = options.remoteRevision;
    this.localRevision = options.localRevision;
    this.conflictingPaths = options.conflictingPaths;
    this.remoteAuthor = options.remoteAuthor;
  }
}
