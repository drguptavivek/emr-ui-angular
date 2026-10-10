import type { EmrScoreResult } from './scoring.models.js';
import type { ClinicalAssessmentStatus } from './models.js';

/**
 * Everything {@link EmrScoreResultCard} shows. `result` is computed by the controller (see
 * `scoring.models.ts`); the card never sums, bands or interprets it.
 */
export interface ScoreResultCardViewModel {
  /** Instrument id echoed back in `recomputeRequested` / `detailRequested`. */
  readonly id: string;
  readonly instrumentLabel: string;
  /** Null until a score exists. With a recorded/absent status the card says "Not supplied". */
  readonly result: EmrScoreResult | null;
  /** Any status other than `recorded` replaces the score with the status text. */
  readonly status?: ClinicalAssessmentStatus;
  /** The result predates its inputs; shown with an icon and `staleLabel`. */
  readonly stale?: boolean;
  readonly staleLabel?: string;
  readonly loading?: boolean;
  readonly error?: string;
  readonly canRecompute?: boolean;
  readonly canViewDetail?: boolean;
  /** Slim single-row banner: label, total, band and actions only. */
  readonly compact?: boolean;
}

export type ScoreResultCardIntent =
  | { readonly type: 'recomputeRequested'; readonly instrumentId: string }
  | { readonly type: 'detailRequested'; readonly instrumentId: string }
  | { readonly type: 'componentSelected'; readonly componentId: string };
