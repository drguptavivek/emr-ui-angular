import type {
  ClinicalAssessmentStatus,
  CrossMeridian,
  DiagnosticResultIntent,
  DiagnosticResultSummaryIntent,
  DiagnosticResultSummaryViewModel,
  DiagnosticResultViewModel,
  GazePosition,
  MeridianCrossEye,
  MotilityCell,
  MotilityEye,
  OctEyeRecord,
  OctFinding,
  OctFindingRecordViewModel,
  OctFrameRef,
  OcularMotilityChartIntent,
  OcularMotilityChartViewModel,
  OcularMotilityIntent,
  OcularMotilityViewModel,
  SpectaclePrescriptionEye,
  SpectaclePrescriptionField,
  SpectaclePrescriptionFieldType,
  SpectaclePrescriptionViewModel,
} from '@drguptavivek/emr-controller';

export type {
  DiagnosticResultSummaryIntent,
  DiagnosticResultSummaryViewModel,
  OcularMotilityChartIntent,
  OcularMotilityChartViewModel,
};

/** Fixed six-state clinical assessment vocabulary. */
export const ASSESSMENT_STATUS_DEFAULTS: Readonly<Record<ClinicalAssessmentStatus, string>> = {
  recorded: 'Recorded',
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown',
};

export function assessmentStatusLabel(
  status: ClinicalAssessmentStatus,
  overrides?: Partial<Record<ClinicalAssessmentStatus, string>>,
): string {
  return overrides?.[status] ?? ASSESSMENT_STATUS_DEFAULTS[status];
}

export function nonRecordedStatusLabel(
  status: ClinicalAssessmentStatus,
  overrides?: Partial<Record<ClinicalAssessmentStatus, string>>,
): string {
  return status === 'recorded' ? '' : assessmentStatusLabel(status, overrides);
}

/** True when a measured container width should stack columns vertically. */
export function isTwoColumnStacked(width: number, collapseBelow = 560): boolean {
  return width > 0 && width < collapseBelow;
}

export function isDiagnosticStacked(width: number): boolean {
  return isTwoColumnStacked(width, 640);
}

export function isSpectacleStacked(width: number): boolean {
  return isTwoColumnStacked(width, 720);
}

// ---------------------------------------------------------------------------
// Spectacle prescription helpers
// ---------------------------------------------------------------------------

export function isSpectacleFieldReadOnly(
  model: SpectaclePrescriptionViewModel,
  field?: SpectaclePrescriptionField,
): boolean {
  return Boolean(model.readOnly || field?.readOnly);
}

export function spectacleFieldValue(
  model: SpectaclePrescriptionViewModel,
  eyeId: string,
  fieldId: string,
): string {
  return model.values[eyeId]?.[fieldId] ?? '';
}

export function spectacleNoteValue(
  model: SpectaclePrescriptionViewModel,
  eyeId: string,
): string {
  return model.notes?.[eyeId] ?? '';
}

export function spectacleEyeAccessibleLabel(eye: SpectaclePrescriptionEye): string {
  return eye.shortLabel ? `${eye.label} (${eye.shortLabel})` : eye.label;
}

export function spectacleFieldError(
  model: SpectaclePrescriptionViewModel,
  eyeId: string,
  fieldId: string,
): string {
  return model.errors?.[`${eyeId}.${fieldId}`] ?? '';
}

export function spectacleFieldWarning(
  model: SpectaclePrescriptionViewModel,
  eyeId: string,
  fieldId: string,
): string {
  return model.warnings?.[`${eyeId}.${fieldId}`] ?? '';
}

export function spectacleErrorEntries(
  model: SpectaclePrescriptionViewModel,
): [string, string][] {
  return Object.entries(model.errors ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
}

export function spectacleInputMode(
  type: SpectaclePrescriptionFieldType,
): 'text' | 'decimal' | 'numeric' {
  if (type === 'decimal') return 'decimal';
  if (type === 'integer') return 'numeric';
  return 'text';
}

export function spectacleKeyboardType(
  type: SpectaclePrescriptionFieldType,
): 'default' | 'decimal-pad' | 'number-pad' {
  if (type === 'decimal') return 'decimal-pad';
  if (type === 'integer') return 'number-pad';
  return 'default';
}

// ---------------------------------------------------------------------------
// Meridian cross geometry & helpers (TABO convention, presentation-only)
// ---------------------------------------------------------------------------

export const MERIDIAN_DIAL_WIDTH = 300;
export const MERIDIAN_DIAL_HEIGHT = 240;
export const MERIDIAN_CX = 150;
export const MERIDIAN_CY = 120;
export const MERIDIAN_HALF = 74;
export const MERIDIAN_LABEL_OFFSET = 92;

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface DrawnMeridianGeometry {
  readonly axisDeg: number;
  /** Clockwise CSS/RN rotation degree (`-axisDeg`) for a horizontal bar centered at (CX, CY). */
  readonly rotationDeg: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly powerX: number;
  readonly powerY: number;
  readonly powerLabel: string;
  readonly axisX: number;
  readonly axisY: number;
  readonly axisLabel: string;
  readonly assistiveLabel: string;
}

/**
 * TABO: 0 degrees on the viewer's right, counter-clockwise, 90 degrees up, as the examiner sees
 * the eye. Screen y points down, so y offsets subtract sin(rad). No clinical transposition or
 * normalisation is performed.
 */
export function computeMeridianGeometry(meridian: CrossMeridian): DrawnMeridianGeometry {
  const rad = (meridian.axisDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return {
    axisDeg: meridian.axisDeg,
    rotationDeg: -meridian.axisDeg,
    x1: round2(MERIDIAN_CX - c * MERIDIAN_HALF),
    y1: round2(MERIDIAN_CY + s * MERIDIAN_HALF),
    x2: round2(MERIDIAN_CX + c * MERIDIAN_HALF),
    y2: round2(MERIDIAN_CY - s * MERIDIAN_HALF),
    powerX: round2(MERIDIAN_CX + c * MERIDIAN_LABEL_OFFSET),
    powerY: round2(MERIDIAN_CY - s * MERIDIAN_LABEL_OFFSET),
    powerLabel: meridian.powerLabel,
    axisX: round2(MERIDIAN_CX - c * MERIDIAN_LABEL_OFFSET),
    axisY: round2(MERIDIAN_CY + s * MERIDIAN_LABEL_OFFSET),
    axisLabel: `${meridian.axisDeg}°`,
    assistiveLabel: meridian.assistiveLabel,
  };
}

export function drawnMeridians(eye: MeridianCrossEye): DrawnMeridianGeometry[] {
  if (eye.status !== 'recorded' || !eye.meridians) return [];
  return eye.meridians.map(computeMeridianGeometry);
}

export function spokenMeridians(eye: MeridianCrossEye): string {
  return (eye.meridians ?? []).map(m => m.assistiveLabel).join('; ');
}

// ---------------------------------------------------------------------------
// Ocular motility chart helpers
// ---------------------------------------------------------------------------

/** Rows of the 3x3 gaze grid in declared order; no mirroring is inferred by the UI. */
export const MOTILITY_ROWS: readonly (readonly GazePosition[])[] = [
  ['up-right', 'up', 'up-left'],
  ['right', 'primary', 'left'],
  ['down-right', 'down', 'down-left'],
];

/** Binocular layout renders one grid from the first supplied eye entry. */
export function shownMotilityEyes(model: OcularMotilityViewModel): readonly MotilityEye[] {
  return model.layout === 'binocular' ? model.eyes.slice(0, 1) : model.eyes;
}

export function motilityCell(eye: MotilityEye, position: GazePosition): MotilityCell | undefined {
  return eye.cells[position];
}

export function isMotilityCellSelected(
  model: OcularMotilityViewModel,
  eyeId: string,
  position: GazePosition,
): boolean {
  const s = model.selected;
  return Boolean(s && s.eyeId === eyeId && s.position === position);
}

export function selectedMotilityCell(
  model: OcularMotilityViewModel,
): { eye: MotilityEye; position: GazePosition } | null {
  const s = model.selected;
  if (!s) return null;
  const eye = shownMotilityEyes(model).find(e => e.eyeId === s.eyeId);
  return eye ? { eye, position: s.position } : null;
}

export function motilityCellAccessibleLabel(
  model: OcularMotilityViewModel,
  eye: MotilityEye,
  position: GazePosition,
  notSuppliedLabel = 'Not supplied',
  statusOverrides?: Partial<Record<ClinicalAssessmentStatus, string>>,
): string {
  const c = eye.cells[position];
  const value = !c
    ? notSuppliedLabel
    : c.status !== 'recorded'
      ? nonRecordedStatusLabel(c.status, statusOverrides)
      : (c.valueLabel ?? notSuppliedLabel);
  const extra = [c?.badge?.label, c?.badge?.assistiveText, c?.note].filter(Boolean).join(', ');
  const posLabel = model.positionLabels[position];
  return `${eye.label} ${posLabel}: ${value}${extra ? `, ${extra}` : ''}`;
}

// ---------------------------------------------------------------------------
// OCT finding record helpers
// ---------------------------------------------------------------------------

export const OCT_FRAME_KIND_DEFAULTS: Readonly<Record<OctFrameRef['kind'], string>> = {
  'b-scan': 'B-scan',
  'en-face': 'En face',
  'thickness-map': 'Thickness map',
  report: 'Report',
};

export const OCT_SEVERITY_DEFAULTS: Readonly<Record<'error' | 'warning' | 'info', string>> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Note',
};

export function octColumnsCount(model: OctFindingRecordViewModel): number {
  return Math.min(model.eyes.length, 2) || 1;
}

export function selectedOctFrame(eye: OctEyeRecord): OctFrameRef | undefined {
  return eye.frames.find(f => f.frameId === eye.selectedFrameId);
}

export function octFrameAccessibleName(
  frame: OctFrameRef,
  noImageLabel = 'No image supplied',
): string {
  return `${frame.label}. ${frame.altText}${frame.thumbnailUrl ? '' : `. ${noImageLabel}`}`;
}

export function octFindingFrameLabel(
  eye: OctEyeRecord,
  finding: OctFinding,
): string | undefined {
  if (!finding.frameId) return undefined;
  return eye.frames.find(f => f.frameId === finding.frameId)?.label;
}

export function octFindingAccessibleName(eye: OctEyeRecord, finding: OctFinding): string {
  return [finding.label, finding.locationLabel, eye.label].filter(Boolean).join(', ');
}
