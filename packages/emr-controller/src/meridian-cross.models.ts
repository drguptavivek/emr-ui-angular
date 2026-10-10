import type { ClinicalAssessmentStatus, EmrBadge } from './models.js';

/**
 * One drawn meridian. `axisDeg` is the TABO angle exactly as the controller supplies it: 0 degrees on the
 * viewer's right, counter-clockwise, 90 degrees up, as the examiner sees the eye. The component never
 * normalises, converts or compares axes.
 */
export interface CrossMeridian {
  readonly axisDeg: number;
  /** Already formatted, e.g. '-2.50 D'. Written at the line end. */
  readonly powerLabel: string;
  /** Spoken form, e.g. 'Axis 90 degrees, minus 2.50 dioptres'. */
  readonly assistiveLabel: string;
}

export interface MeridianCrossEye {
  readonly eyeId: string;
  /** 'Right eye' */
  readonly label: string;
  /** 'OD' */
  readonly shortLabel: string;
  readonly status: ClinicalAssessmentStatus;
  /** Present when `status` is 'recorded'. Absent means "Not supplied". */
  readonly meridians?: readonly [CrossMeridian, CrossMeridian];
  /** Working distance, gross / net and similar, already formatted. */
  readonly captionLines?: readonly string[];
  readonly flag?: EmrBadge;
}

export interface MeridianCrossViewModel {
  readonly id: string;
  /** Only changes caption vocabulary and footnotes. */
  readonly kind: 'optical' | 'retinoscopy';
  readonly title: string;
  /** Rendered left to right: the first eye (OD) is on the viewer's left. */
  readonly eyes: readonly MeridianCrossEye[];
  /** Whole-chart text alternative, read by assistive technology. */
  readonly summaryText: string;
  readonly readOnly?: boolean;
}

export type MeridianCrossIntent =
  | { readonly type: 'eyeSelected'; readonly eyeId: string }
  | { readonly type: 'editRequested'; readonly eyeId: string };
