import type { ClinicalAssessmentStatus, EmrBadge } from './models.js';

export type GazePosition =
  | 'up-right' | 'up' | 'up-left'
  | 'right' | 'primary' | 'left'
  | 'down-right' | 'down' | 'down-left';

export interface MotilityCell {
  /** Supplied text such as '-2', 'Full', 'N'. Null when `status` is not 'recorded'. */
  readonly valueLabel: string | null;
  readonly status: ClinicalAssessmentStatus;
  readonly badge?: EmrBadge;
  readonly note?: string;
}

export interface MotilityEye {
  readonly eyeId: string;
  readonly label: string;
  readonly shortLabel: string;
  /** A missing position renders as "Not supplied", never as one of the six states. */
  readonly cells: Readonly<Partial<Record<GazePosition, MotilityCell>>>;
}

export interface OcularMotilityViewModel {
  readonly id: string;
  readonly title: string;
  /** 'per-eye': one 3x3 grid per eye, side by side. 'binocular': one grid, using the first eye's cells. */
  readonly layout: 'per-eye' | 'binocular';
  readonly eyes: readonly MotilityEye[];
  /** Header text for each gaze position, e.g. 'Up and right'. */
  readonly positionLabels: Readonly<Record<GazePosition, string>>;
  readonly selected?: { readonly eyeId: string; readonly position: GazePosition };
  readonly readOnly?: boolean;
  readonly summaryText: string;
}

export type OcularMotilityIntent =
  | { readonly type: 'cellSelected'; readonly eyeId: string; readonly position: GazePosition }
  | { readonly type: 'cellEditRequested'; readonly eyeId: string; readonly position: GazePosition };
