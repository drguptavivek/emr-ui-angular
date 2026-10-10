import type { DiagnosticMetric } from './diagnostic-result.models.js';
import type { EmrCodedValue } from './field-contract.models.js';
import type { ClinicalAssessmentStatus, EmrBadge } from './models.js';
import type { EmrNodePath } from './node-path.js';
import type { EmrValidationMessage } from './validation.models.js';

/** One image in an OCT study. `thumbnailUrl` is transient (data/blob URL): never persisted, never a scan identifier. */
export interface OctFrameRef {
  readonly frameId: string;
  readonly seriesId?: string;
  /** Includes orientation, e.g. 'Horizontal B-scan through fovea'. */
  readonly label: string;
  readonly kind: 'b-scan' | 'en-face' | 'thickness-map' | 'report';
  readonly thumbnailUrl?: string;
  readonly altText: string;
  readonly width?: number;
  readonly height?: number;
}

export interface OctFinding {
  readonly id: string;
  readonly path: EmrNodePath;
  readonly code?: EmrCodedValue;
  readonly label: string;
  /** 'Subfoveal', 'Superotemporal arcade'. */
  readonly locationLabel?: string;
  readonly status: ClinicalAssessmentStatus;
  readonly badge?: EmrBadge;
  readonly note?: string;
  readonly frameId?: string;
  readonly readOnly?: boolean;
}

export interface OctEyeRecord {
  readonly eyeId: string;
  /** 'Right eye'. */
  readonly label: string;
  /** 'OD'. Shown in brackets after `label`, never alone. */
  readonly shortLabel: string;
  /** Anything but 'recorded' replaces the body of this eye with a statement of why there is no record. */
  readonly status: ClinicalAssessmentStatus;
  /** Device, protocol, date, signal quality: label/value text supplied by the controller. */
  readonly metadata: readonly { label: string; value: string }[];
  readonly frames: readonly OctFrameRef[];
  readonly selectedFrameId?: string;
  readonly metrics: readonly DiagnosticMetric[];
  readonly findings: readonly OctFinding[];
  readonly interpretation?: string;
}

export interface OctFindingRecordViewModel {
  readonly id: string;
  readonly title: string;
  readonly eyes: readonly OctEyeRecord[];
  readonly messages: readonly EmrValidationMessage[];
  readonly readOnly?: boolean;
  readonly loading?: boolean;
  readonly error?: string;
}

export type OctFindingRecordIntent =
  | { type: 'frameSelected'; eyeId: string; frameId: string }
  | { type: 'frameOpenRequested'; eyeId: string; frameId: string }
  | { type: 'findingAddRequested'; eyeId: string }
  | { type: 'findingEditRequested'; eyeId: string; path: EmrNodePath }
  | { type: 'findingRemoveRequested'; eyeId: string; path: EmrNodePath }
  | { type: 'findingSelected'; eyeId: string; path: EmrNodePath }
  | { type: 'retryRequested' };
