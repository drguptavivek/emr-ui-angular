import type { EmrBadge, EmrOption } from './models.js';

/**
 * One patient card on a station. Every string is controller-supplied and shown as written, so the
 * controller decides the wording of `tokenLabel` ("Token 42") and `waitLabel` ("15 min").
 * The component never computes waits, orders cards or derives priority.
 */
export interface QueueCard {
  readonly id: string;
  readonly patientId: string;
  /** Complete token text, e.g. 'Token 42'. Also used in the card's accessible name. */
  readonly tokenLabel: string;
  readonly displayName: string;
  /** MRN or other primary identifier. Shown first on the card. */
  readonly primaryIdentifier: string;
  readonly ageSexLabel?: string;
  /** Short wait text, e.g. '15 min'. Shown beside a clock icon; the accessible name reads it as "waiting 15 min". */
  readonly waitLabel: string;
  /** Priority is a badge with text; absent means the controller supplied none. */
  readonly priority?: EmrBadge;
  readonly flags?: readonly EmrBadge[];
  readonly nextStepLabel?: string;
  readonly readOnly?: boolean;
}

export interface QueueStation {
  readonly id: string;
  readonly label: string;
  /** e.g. '4 waiting'. */
  readonly countLabel: string;
  readonly cards: readonly QueueCard[];
  readonly canCallNext: boolean;
}

export interface WorkQueueViewModel {
  readonly id: string;
  readonly title: string;
  readonly stations: readonly QueueStation[];
  readonly selectedCardId?: string;
  /** Stations a card can be moved to, shown in the "Move to" select. */
  readonly moveTargets: readonly EmrOption[];
  readonly updatedLabel?: string;
  /** Shown for a station with no cards, and when there are no stations. */
  readonly emptyMessage: string;
  readonly loading?: boolean;
  readonly error?: string;
  readonly readOnly?: boolean;
}

export type WorkQueueIntent =
  | { type: 'cardSelected'; cardId: string }
  | { type: 'callNextRequested'; stationId: string }
  | { type: 'moveRequested'; cardId: string; stationId: string }
  | { type: 'patientOpenRequested'; patientId: string }
  | { type: 'refreshRequested' }
  | { type: 'retryRequested' };
