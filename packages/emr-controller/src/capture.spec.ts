import { describe, expect, it } from 'vitest';
import {
  EmrCaptureConflictError,
  initialCaptureSessionState,
} from './capture.models';
import type {
  EmrAuthorAttribution,
  EmrCaptureConflict,
  EmrCaptureIntent,
  EmrCaptureLoadResult,
  EmrCaptureRepositoryPort,
  EmrCaptureSaveRequest,
  EmrCaptureSaveResult,
  EmrCaptureSessionState,
} from './capture.models';
import type { EmrNodePath } from './node-path';

interface Fixture {
  weight: number;
}

/** A minimal in-memory port, exercising the shape a real adapter would fill in. */
class InMemoryCaptureRepository implements EmrCaptureRepositoryPort<Fixture> {
  private revision = 0;
  private data: Fixture = { weight: 70 };
  private attribution: EmrAuthorAttribution = {
    recordedBy: 'dr-gupta',
    recordedAt: '2026-08-01T09:00:00.000Z',
  };

  async save(
    request: EmrCaptureSaveRequest<Fixture>,
    options?: { signal?: AbortSignal },
  ): Promise<EmrCaptureSaveResult> {
    options?.signal?.throwIfAborted();
    if (request.baseRevision !== this.revision) {
      throw new EmrCaptureConflictError({
        remoteRevision: this.revision,
        localRevision: request.baseRevision,
        conflictingPaths: [['weight']],
        remoteAuthor: this.attribution.recordedBy,
      });
    }
    this.revision += 1;
    this.data = request.data;
    this.attribution = request.attribution;
    return { revision: this.revision, savedAt: '2026-08-20T10:00:00.000Z' };
  }

  async load(
    _instanceId: string,
    options?: { signal?: AbortSignal },
  ): Promise<EmrCaptureLoadResult<Fixture>> {
    options?.signal?.throwIfAborted();
    return { data: this.data, revision: this.revision, attribution: this.attribution };
  }
}

describe('capture.models', () => {
  it('provides an idle initial session state', () => {
    const state: EmrCaptureSessionState = initialCaptureSessionState;
    expect(state).toEqual({
      dirty: false,
      saving: false,
      savedAt: null,
      conflict: null,
      error: null,
    });
  });

  it('round-trips a save/load cycle against a repository port', async () => {
    const repo = new InMemoryCaptureRepository();
    const loaded = await repo.load('encounter-1');
    expect(loaded.revision).toBe(0);
    expect(loaded.data.weight).toBe(70);

    const result = await repo.save({
      instanceId: 'encounter-1',
      baseRevision: loaded.revision,
      data: { weight: 72 },
      attribution: { recordedBy: 'dr-gupta', recordedAt: '2026-08-20T10:00:00.000Z' },
    });
    expect(result.revision).toBe(1);

    const reloaded = await repo.load('encounter-1');
    expect(reloaded.data.weight).toBe(72);
    expect(reloaded.revision).toBe(1);
  });

  it('throws EmrCaptureConflictError on a stale baseRevision, carrying conflicting paths', async () => {
    const repo = new InMemoryCaptureRepository();
    await repo.save({
      instanceId: 'encounter-1',
      baseRevision: 0,
      data: { weight: 72 },
      attribution: { recordedBy: 'dr-gupta', recordedAt: '2026-08-20T10:00:00.000Z' },
    });

    await expect(
      repo.save({
        instanceId: 'encounter-1',
        baseRevision: 0, // stale — repo is already at revision 1
        data: { weight: 75 },
        attribution: { recordedBy: 'dr-other', recordedAt: '2026-08-20T10:05:00.000Z' },
      }),
    ).rejects.toBeInstanceOf(EmrCaptureConflictError);

    try {
      await repo.save({
        instanceId: 'encounter-1',
        baseRevision: 0,
        data: { weight: 75 },
        attribution: { recordedBy: 'dr-other', recordedAt: '2026-08-20T10:05:00.000Z' },
      });
      expect.unreachable('expected EmrCaptureConflictError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EmrCaptureConflictError);
      const conflictError = error as EmrCaptureConflictError;
      expect(conflictError.remoteRevision).toBe(1);
      expect(conflictError.localRevision).toBe(0);
      expect(conflictError.conflictingPaths).toEqual([['weight']]);
    }
  });

  it('rejects with an AbortError when the signal is already aborted', async () => {
    const repo = new InMemoryCaptureRepository();
    const controller = new AbortController();
    controller.abort();
    await expect(repo.load('encounter-1', { signal: controller.signal })).rejects.toThrow();
  });

  it('constructs a well-formed EmrCaptureConflict for the UI', () => {
    const conflict: EmrCaptureConflict = {
      detectedAt: '2026-08-20T10:05:00.000Z',
      remoteRevision: 2,
      localRevision: 1,
      conflictingPaths: [['vitals', 'weight'], ['medications', 0, 'dose']] as EmrNodePath[],
      remoteAuthor: 'dr-other',
    };
    expect(conflict.conflictingPaths).toHaveLength(2);
  });

  it('exercises the EmrAuthorAttribution and EmrCaptureIntent shapes', () => {
    const attribution: EmrAuthorAttribution = {
      recordedBy: 'dr-gupta',
      recordedAt: '2026-08-20T10:00:00.000Z',
      amendedBy: 'dr-other',
      amendedAt: '2026-08-20T11:00:00.000Z',
      role: 'attending',
    };
    expect(attribution.amendedBy).toBe('dr-other');

    const intents: EmrCaptureIntent[] = [
      { type: 'saveRequested' },
      { type: 'discardRequested' },
      { type: 'conflictResolutionRequested', resolution: 'keepRemote' },
    ];
    expect(intents.map(intent => intent.type)).toEqual([
      'saveRequested',
      'discardRequested',
      'conflictResolutionRequested',
    ]);
  });
});
