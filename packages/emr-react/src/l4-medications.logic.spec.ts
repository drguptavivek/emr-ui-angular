import { describe, expect, it } from 'vitest';
import type { DoseScheduleViewModel, DoseSlot, ReconRow, ScoreResultCardViewModel } from '@drguptavivek/emr-controller';
import {
  doseAmountWord,
  dosePatternNotation,
  dosePatternSentence,
  doseSlotIcons,
  doseSlotText,
  doseUnitText,
  formatDoseAmount,
  hasDoseMeta,
  isCountedDoseForm,
  isDoseGridCompact,
  isDoseSlotNone,
  isReconReasonInvalid,
  isReconRowLocked,
  isReconRowSelected,
  isReconStacked,
  reconRowName,
  reconSeverityWord,
  scoreStatusText,
  showFrequencyCode,
  showScoreResult,
  splitDoseParts,
  taperHasPattern,
} from './l4-medications.logic';

describe('l4 medications & scores logic', () => {
  describe('score result card helpers', () => {
    const baseScore: ScoreResultCardViewModel = {
      id: 'news2',
      instrumentLabel: 'NEWS2 early warning score',
      result: {
        total: 7,
        bandLabel: 'High clinical risk',
        bandTone: 'danger',
      },
    };

    it('resolves non-recorded assessment status text', () => {
      expect(scoreStatusText(undefined)).toBe('');
      expect(scoreStatusText('recorded')).toBe('');
      expect(scoreStatusText('not-assessed')).toBe('Not assessed');
      expect(scoreStatusText('unable-to-assess')).toBe('Unable to assess');
      expect(scoreStatusText('not-applicable')).toBe('Not applicable');
      expect(scoreStatusText('declined')).toBe('Declined');
      expect(scoreStatusText('unknown')).toBe('Unknown');
    });

    it('shows result details only when recorded result is present without loading or error', () => {
      expect(showScoreResult(baseScore)).toBe(true);
      expect(showScoreResult({ ...baseScore, loading: true })).toBe(false);
      expect(showScoreResult({ ...baseScore, error: 'Network error' })).toBe(false);
      expect(showScoreResult({ ...baseScore, status: 'not-assessed' })).toBe(false);
      expect(showScoreResult({ ...baseScore, result: null })).toBe(false);
    });
  });

  describe('dose schedule helpers', () => {
    const slots: DoseSlot[] = [
      { id: 'm', label: 'Morning', amount: 1 },
      { id: 'a', label: 'Afternoon', amount: null },
      { id: 'n', label: 'Night', amount: 0.5 },
    ];

    it('distinguishes counted forms and formats quarter fractions as glyphs', () => {
      expect(isCountedDoseForm('tablet')).toBe(true);
      expect(isCountedDoseForm('liquid')).toBe(false);
      expect(splitDoseParts(1.5)).toEqual({ whole: 1, frac: 0.5 });
      expect(splitDoseParts(0.33)).toBeNull();
      expect(formatDoseAmount(null, 'tablet')).toBe('');
      expect(formatDoseAmount(0.5, 'tablet')).toBe('½');
      expect(formatDoseAmount(1.25, 'tablet')).toBe('1¼');
      expect(formatDoseAmount(1.5, 'liquid')).toBe('1.5');
    });

    it('writes words for fractional counted amounts only', () => {
      expect(doseAmountWord(null, 'tablet')).toBe('');
      expect(doseAmountWord(1, 'tablet')).toBe('');
      expect(doseAmountWord(0.5, 'tablet')).toBe('half');
      expect(doseAmountWord(1.5, 'tablet')).toBe('one and half');
      expect(doseAmountWord(2.75, 'tablet')).toBe('two and three quarters');
      expect(doseAmountWord(0.5, 'liquid')).toBe('');
    });

    it('formats units, slot text, notation and spoken sentences', () => {
      const unit = { one: 'tablet', other: 'tablets' };
      expect(doseUnitText(0.5, unit)).toBe('tablet');
      expect(doseUnitText(1, unit)).toBe('tablet');
      expect(doseUnitText(2, unit)).toBe('tablets');
      expect(isDoseSlotNone(slots[1]!)).toBe(true);
      expect(isDoseSlotNone({ id: 'x', label: 'Night', amount: null, amountLabel: '1 cm ribbon' })).toBe(false);
      expect(doseSlotText(slots[0]!, 'tablet', unit)).toBe('1 tablet');
      expect(doseSlotText(slots[1]!, 'tablet', unit)).toBe('none');
      expect(dosePatternNotation(slots, 'tablet')).toBe('1 - 0 - ½');
      expect(
        dosePatternNotation(
          [
            { id: 'm', label: 'Morning', amount: null, amountLabel: 'thin layer' },
            { id: 'n', label: 'Night', amount: null, amountLabel: 'thin layer' },
          ],
          'cream',
        ),
      ).toBe('');
      expect(dosePatternSentence(slots, 'tablet', unit)).toBe('Morning 1 tablet, Afternoon none, Night ½ tablet');
    });

    it('hides frequency code when it duplicates site code', () => {
      expect(showFrequencyCode('BD', 'OU')).toBe(true);
      expect(showFrequencyCode('OD', 'OD')).toBe(false);
      expect(showFrequencyCode('od', 'OD')).toBe(false);
      expect(showFrequencyCode(undefined, 'OD')).toBe(false);
    });

    it('builds icon sequences for forms and fractional tablets', () => {
      expect(doseSlotIcons({ id: 's', label: 'Morning', amount: 1.5 }, 'tablet')).toEqual(['tablet', 'tablet-half']);
      expect(doseSlotIcons({ id: 's', label: 'Morning', amount: 2 }, 'capsule')).toEqual(['capsule', 'capsule']);
      expect(doseSlotIcons({ id: 's', label: 'Morning', amount: 3 }, 'drop')).toEqual(['drop', 'drop', 'drop']);
      expect(doseSlotIcons({ id: 's', label: 'Morning', amount: 5 }, 'liquid')).toEqual(['spoon']);
      expect(doseSlotIcons({ id: 's', label: 'Morning', amount: null, amountLabel: 'ribbon' }, 'ointment')).toEqual(['tube']);
      expect(doseSlotIcons({ id: 's', label: 'Morning', amount: 10 }, 'injection')).toEqual(['syringe']);
    });

    it('detects metadata, taper patterns and compact grid breakpoints', () => {
      const model: DoseScheduleViewModel = {
        medication: { label: 'Paracetamol', formLabel: 'Tablet', form: 'tablet' },
        frequency: { label: 'Twice daily' },
        slots,
      };
      expect(hasDoseMeta(model)).toBe(false);
      expect(hasDoseMeta({ ...model, route: 'By mouth' })).toBe(true);
      expect(taperHasPattern([{ id: 'w1', periodLabel: 'Week 1', frequencyLabel: '4 times daily' }])).toBe(false);
      expect(taperHasPattern([{ id: 'w1', periodLabel: 'Week 1', frequencyLabel: '4 times daily', slots }])).toBe(true);
      expect(isDoseGridCompact(360, 4)).toBe(true);
      expect(isDoseGridCompact(360, 3)).toBe(false);
      expect(isDoseGridCompact(640, 4)).toBe(false);
    });
  });

  describe('medication reconciliation helpers', () => {
    const row: ReconRow = {
      id: 'r1',
      path: ['medications', 'r1'],
      left: { id: 'h1', nameLabel: 'Atorvastatin 20 mg tablet', doseSummary: '1 tablet once daily (OD)' },
      decisionOptions: [{ value: 'stop', label: 'Stop' }],
      decision: 'stop',
      reasonRequired: true,
      messages: [{ path: ['medications', 'r1', 'reason'], severity: 'error', message: 'Give a reason.' }],
    };

    it('switches to stacked cards below 760px once measured', () => {
      expect(isReconStacked(null)).toBe(false);
      expect(isReconStacked(0)).toBe(false);
      expect(isReconStacked(480)).toBe(true);
      expect(isReconStacked(760)).toBe(false);
      expect(isReconStacked(1024)).toBe(false);
    });

    it('resolves row selection, locking, row name and reason error state', () => {
      expect(isReconRowSelected(row, 'r1')).toBe(true);
      expect(isReconRowSelected(row, 'r2')).toBe(false);
      expect(isReconRowLocked(false, false)).toBe(false);
      expect(isReconRowLocked(true, false)).toBe(true);
      expect(isReconRowLocked(false, true)).toBe(true);
      expect(reconRowName(row)).toBe('Atorvastatin 20 mg tablet');
      expect(reconRowName({ ...row, left: undefined, right: { id: 'o1', nameLabel: 'Ondansetron 4 mg', doseSummary: '1 tablet' } })).toBe('Ondansetron 4 mg');
      expect(isReconReasonInvalid(row)).toBe(true);
      expect(isReconReasonInvalid({ ...row, messages: [{ path: ['medications', 'r1'], severity: 'warning', message: 'Differs' }] })).toBe(false);
      expect(reconSeverityWord('error')).toBe('Error');
      expect(reconSeverityWord('warning')).toBe('Warning');
      expect(reconSeverityWord('info')).toBe('Note');
    });
  });
});
