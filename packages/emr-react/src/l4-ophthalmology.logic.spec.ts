import { describe, expect, it } from 'vitest';
import type {
  MeridianCrossEye,
  OctEyeRecord,
  OctFindingRecordViewModel,
  OcularMotilityViewModel,
  SpectaclePrescriptionViewModel,
} from '@drguptavivek/emr-controller';
import {
  ASSESSMENT_STATUS_DEFAULTS,
  MERIDIAN_CX,
  MERIDIAN_CY,
  MERIDIAN_HALF,
  MERIDIAN_LABEL_OFFSET,
  MOTILITY_ROWS,
  OCT_FRAME_KIND_DEFAULTS,
  OCT_SEVERITY_DEFAULTS,
  assessmentStatusLabel,
  computeMeridianGeometry,
  drawnMeridians,
  isDiagnosticStacked,
  isMotilityCellSelected,
  isSpectacleFieldReadOnly,
  isSpectacleStacked,
  isTwoColumnStacked,
  motilityCell,
  motilityCellAccessibleLabel,
  nonRecordedStatusLabel,
  octColumnsCount,
  octFindingAccessibleName,
  octFindingFrameLabel,
  octFrameAccessibleName,
  selectedMotilityCell,
  selectedOctFrame,
  shownMotilityEyes,
  spectacleErrorEntries,
  spectacleEyeAccessibleLabel,
  spectacleFieldError,
  spectacleFieldValue,
  spectacleFieldWarning,
  spectacleInputMode,
  spectacleKeyboardType,
  spectacleNoteValue,
  spokenMeridians,
} from './l4-ophthalmology.logic';

describe('l4-ophthalmology.logic', () => {
  describe('clinical assessment status labels', () => {
    it('returns all six distinct clinical assessment status labels and supports overrides', () => {
      expect(Object.keys(ASSESSMENT_STATUS_DEFAULTS)).toEqual([
        'recorded',
        'not-assessed',
        'unable-to-assess',
        'not-applicable',
        'declined',
        'unknown',
      ]);
      expect(assessmentStatusLabel('not-assessed')).toBe('Not assessed');
      expect(assessmentStatusLabel('unable-to-assess')).toBe('Unable to assess');
      expect(assessmentStatusLabel('declined', { declined: 'Patient declined' })).toBe('Patient declined');
      expect(nonRecordedStatusLabel('recorded')).toBe('');
      expect(nonRecordedStatusLabel('unknown')).toBe('Unknown');
    });
  });

  describe('responsive stacking thresholds', () => {
    it('does not stack before measurement (width = 0) and stacks below breakpoint', () => {
      expect(isTwoColumnStacked(0, 560)).toBe(false);
      expect(isTwoColumnStacked(559, 560)).toBe(true);
      expect(isTwoColumnStacked(560, 560)).toBe(false);
      expect(isDiagnosticStacked(500)).toBe(true);
      expect(isDiagnosticStacked(640)).toBe(false);
      expect(isSpectacleStacked(700)).toBe(true);
      expect(isSpectacleStacked(720)).toBe(false);
    });
  });

  describe('spectacle prescription helpers', () => {
    const model: SpectaclePrescriptionViewModel = {
      id: 'rx-1',
      label: 'Spectacle prescription',
      eyes: [
        { id: 'od', label: 'Right eye', shortLabel: 'OD' },
        { id: 'os', label: 'Left eye' },
      ],
      fields: [
        { id: 'sphere', label: 'Sphere', type: 'decimal', unit: 'D' },
        { id: 'axis', label: 'Axis', type: 'integer', unit: '°', readOnly: true },
        { id: 'base', label: 'Base', type: 'select' },
      ],
      values: {
        od: { sphere: '-1.25', axis: '090' },
        os: { sphere: '-0.75' },
      },
      notes: { os: 'Wear for distance' },
      errors: { 'od.axis': 'Axis is required.', 'os.sphere': '' },
      warnings: { 'od.sphere': 'Verify high cylinder.' },
    };

    it('reads field values, notes, errors, warnings, and read-only states', () => {
      expect(isSpectacleFieldReadOnly(model, model.fields[0])).toBe(false);
      expect(isSpectacleFieldReadOnly(model, model.fields[1])).toBe(true);
      expect(isSpectacleFieldReadOnly({ ...model, readOnly: true }, model.fields[0])).toBe(true);

      expect(spectacleFieldValue(model, 'od', 'sphere')).toBe('-1.25');
      expect(spectacleFieldValue(model, 'os', 'axis')).toBe('');
      expect(spectacleNoteValue(model, 'od')).toBe('');
      expect(spectacleNoteValue(model, 'os')).toBe('Wear for distance');

      expect(spectacleEyeAccessibleLabel(model.eyes[0]!)).toBe('Right eye (OD)');
      expect(spectacleEyeAccessibleLabel(model.eyes[1]!)).toBe('Left eye');

      expect(spectacleFieldError(model, 'od', 'axis')).toBe('Axis is required.');
      expect(spectacleFieldError(model, 'od', 'sphere')).toBe('');
      expect(spectacleFieldWarning(model, 'od', 'sphere')).toBe('Verify high cylinder.');
      expect(spectacleErrorEntries(model)).toEqual([['od.axis', 'Axis is required.']]);
    });

    it('maps field types to inputMode and keyboardType', () => {
      expect(spectacleInputMode('decimal')).toBe('decimal');
      expect(spectacleInputMode('integer')).toBe('numeric');
      expect(spectacleInputMode('text')).toBe('text');
      expect(spectacleKeyboardType('decimal')).toBe('decimal-pad');
      expect(spectacleKeyboardType('integer')).toBe('number-pad');
      expect(spectacleKeyboardType('select')).toBe('default');
    });
  });

  describe('meridian cross TABO geometry', () => {
    it('computes cardinal 180 and 90 degree meridians without modifying clinical values', () => {
      const m180 = computeMeridianGeometry({
        axisDeg: 180,
        powerLabel: '-1.00 D',
        assistiveLabel: 'Axis 180 degrees, minus 1.00 dioptres',
      });
      expect(m180.axisDeg).toBe(180);
      expect(m180.rotationDeg).toBe(-180);
      expect(m180.x1).toBe(MERIDIAN_CX + MERIDIAN_HALF);
      expect(m180.y1).toBe(MERIDIAN_CY);
      expect(m180.x2).toBe(MERIDIAN_CX - MERIDIAN_HALF);
      expect(m180.y2).toBe(MERIDIAN_CY);
      expect(m180.powerX).toBe(MERIDIAN_CX - MERIDIAN_LABEL_OFFSET);
      expect(m180.powerY).toBe(MERIDIAN_CY);
      expect(m180.axisX).toBe(MERIDIAN_CX + MERIDIAN_LABEL_OFFSET);
      expect(m180.axisY).toBe(MERIDIAN_CY);
      expect(m180.axisLabel).toBe('180°');

      const m90 = computeMeridianGeometry({
        axisDeg: 90,
        powerLabel: '-2.50 D',
        assistiveLabel: 'Axis 90 degrees, minus 2.50 dioptres',
      });
      expect(m90.rotationDeg).toBe(-90);
      expect(m90.x1).toBe(MERIDIAN_CX);
      expect(m90.y1).toBe(MERIDIAN_CY + MERIDIAN_HALF);
      expect(m90.x2).toBe(MERIDIAN_CX);
      expect(m90.y2).toBe(MERIDIAN_CY - MERIDIAN_HALF);
      expect(m90.powerX).toBe(MERIDIAN_CX);
      expect(m90.powerY).toBe(MERIDIAN_CY - MERIDIAN_LABEL_OFFSET);
      expect(m90.axisX).toBe(MERIDIAN_CX);
      expect(m90.axisY).toBe(MERIDIAN_CY + MERIDIAN_LABEL_OFFSET);
    });

    it('returns drawn meridians only when status is recorded and meridians are present', () => {
      const recordedEye: MeridianCrossEye = {
        eyeId: 'od',
        label: 'Right eye',
        shortLabel: 'OD',
        status: 'recorded',
        meridians: [
          { axisDeg: 180, powerLabel: '-1.00 D', assistiveLabel: 'Axis 180 degrees, minus 1.00 dioptres' },
          { axisDeg: 90, powerLabel: '-2.50 D', assistiveLabel: 'Axis 90 degrees, minus 2.50 dioptres' },
        ],
      };
      expect(drawnMeridians(recordedEye)).toHaveLength(2);
      expect(spokenMeridians(recordedEye)).toBe(
        'Axis 180 degrees, minus 1.00 dioptres; Axis 90 degrees, minus 2.50 dioptres',
      );

      const declinedEye: MeridianCrossEye = {
        ...recordedEye,
        status: 'declined',
      };
      expect(drawnMeridians(declinedEye)).toEqual([]);
    });
  });

  describe('ocular motility chart helpers', () => {
    const positionLabels: OcularMotilityViewModel['positionLabels'] = {
      'up-right': 'Up and right',
      up: 'Up',
      'up-left': 'Up and left',
      right: 'Right',
      primary: 'Primary',
      left: 'Left',
      'down-right': 'Down and right',
      down: 'Down',
      'down-left': 'Down and left',
    };

    const baseModel: OcularMotilityViewModel = {
      id: 'mt-1',
      title: 'Ocular motility',
      layout: 'per-eye',
      positionLabels,
      summaryText: 'Nine-position motility chart.',
      selected: { eyeId: 'od', position: 'left' },
      eyes: [
        {
          eyeId: 'od',
          label: 'Right eye',
          shortLabel: 'OD',
          cells: {
            primary: { valueLabel: 'Full', status: 'recorded' },
            left: {
              valueLabel: '-2',
              status: 'recorded',
              badge: { label: 'Underaction', tone: 'warning' },
              note: 'Abduction deficit',
            },
            up: { valueLabel: null, status: 'unable-to-assess' },
          },
        },
        {
          eyeId: 'os',
          label: 'Left eye',
          shortLabel: 'OS',
          cells: { primary: { valueLabel: 'Full', status: 'recorded' } },
        },
      ],
    };

    it('maintains 3x3 gaze order without mirroring and handles binocular vs per-eye layout', () => {
      expect(MOTILITY_ROWS).toEqual([
        ['up-right', 'up', 'up-left'],
        ['right', 'primary', 'left'],
        ['down-right', 'down', 'down-left'],
      ]);
      expect(shownMotilityEyes(baseModel)).toHaveLength(2);
      expect(shownMotilityEyes({ ...baseModel, layout: 'binocular' })).toHaveLength(1);
    });

    it('resolves selected cell and accessible cell descriptions', () => {
      const od = baseModel.eyes[0]!;
      expect(motilityCell(od, 'left')?.valueLabel).toBe('-2');
      expect(isMotilityCellSelected(baseModel, 'od', 'left')).toBe(true);
      expect(isMotilityCellSelected(baseModel, 'od', 'primary')).toBe(false);
      expect(selectedMotilityCell(baseModel)?.position).toBe('left');

      expect(motilityCellAccessibleLabel(baseModel, od, 'left')).toBe(
        'Right eye Left: -2, Underaction, Abduction deficit',
      );
      expect(motilityCellAccessibleLabel(baseModel, od, 'up')).toBe(
        'Right eye Up: Unable to assess',
      );
      expect(motilityCellAccessibleLabel(baseModel, od, 'down')).toBe(
        'Right eye Down: Not supplied',
      );
    });
  });

  describe('OCT finding record helpers', () => {
    const odEye: OctEyeRecord = {
      eyeId: 'od',
      label: 'Right eye',
      shortLabel: 'OD',
      status: 'recorded',
      metadata: [],
      frames: [
        {
          frameId: 'od-f1',
          label: 'Horizontal B-scan through fovea',
          kind: 'b-scan',
          altText: 'Synthetic B-scan',
          thumbnailUrl: 'data:image/svg+xml;utf8,<svg/>',
        },
        {
          frameId: 'od-f2',
          label: 'RNFL report',
          kind: 'report',
          altText: 'Synthetic report',
        },
      ],
      selectedFrameId: 'od-f1',
      metrics: [],
      findings: [
        {
          id: 'fd-1',
          path: ['octRecord', 'eyes', 'od', 'findings', 0],
          label: 'Drusen',
          locationLabel: 'Parafoveal',
          status: 'recorded',
          frameId: 'od-f1',
        },
      ],
    };

    const octModel: OctFindingRecordViewModel = {
      id: 'oct-1',
      title: 'OCT macula',
      eyes: [odEye],
      messages: [],
    };

    it('resolves frame kinds, severities, selected frame, and finding accessible labels', () => {
      expect(OCT_FRAME_KIND_DEFAULTS['thickness-map']).toBe('Thickness map');
      expect(OCT_SEVERITY_DEFAULTS.info).toBe('Note');
      expect(octColumnsCount(octModel)).toBe(1);
      expect(octColumnsCount({ ...octModel, eyes: [odEye, { ...odEye, eyeId: 'os' }] })).toBe(2);

      expect(selectedOctFrame(odEye)?.frameId).toBe('od-f1');
      expect(octFrameAccessibleName(odEye.frames[0]!)).toBe(
        'Horizontal B-scan through fovea. Synthetic B-scan',
      );
      expect(octFrameAccessibleName(odEye.frames[1]!)).toBe(
        'RNFL report. Synthetic report. No image supplied',
      );

      const finding = odEye.findings[0]!;
      expect(octFindingFrameLabel(odEye, finding)).toBe('Horizontal B-scan through fovea');
      expect(octFindingAccessibleName(odEye, finding)).toBe('Drusen, Parafoveal, Right eye');
    });
  });
});
