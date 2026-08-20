import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrClinicalMatrixComponent } from '../clinical/emr-clinical-matrix.component';
import { EmrSpectaclePrescriptionComponent } from '../clinical/emr-spectacle-prescription.component';
import { EmrDiagnosticResultSummaryComponent } from '../clinical/emr-diagnostic-result-summary.component';
import {
  anteriorSegmentSchema,
  anteriorSegmentValues,
  externalEyeSchema,
  externalEyeValues,
  iopSchema,
  iopValues,
  perimetryResult,
  pmtStoryNote,
  refractionSchema,
  refractionValues,
  retinalAssessmentSchema,
  retinalAssessmentValues,
  spectaclePrescriptionModel,
  spectaclePrescriptionErrorsModel,
  visualAcuitySchema,
  visualAcuityValues
} from './ophthalmology.fixtures';

const meta: Meta = {
  title: 'EMR / Clinical assessment / Ophthalmology',
  decorators: [moduleMetadata({ imports: [EmrClinicalMatrixComponent, EmrDiagnosticResultSummaryComponent, EmrSpectaclePrescriptionComponent] })],
  parameters: {
    docs: {
      description: {
        component: 'Controlled ophthalmology recipes. OD and OS labels, values, metadata, missing states and device descriptions are supplied by the controller; no normality, progression, prescription validity or perimetry classification is inferred by the UI.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

const matrixStory = (schema: unknown, values: unknown): Story => ({
  render: () => ({ template: '<emr-clinical-matrix [schema]="schema" [values]="values" />', props: { schema, values } })
});

export const ExternalEye: Story = matrixStory(externalEyeSchema, externalEyeValues);
export const AnteriorSegment: Story = matrixStory(anteriorSegmentSchema, anteriorSegmentValues);
export const RetinalAssessment: Story = matrixStory(retinalAssessmentSchema, retinalAssessmentValues);
export const VisualAcuity: Story = matrixStory(visualAcuitySchema, visualAcuityValues);
export const IntraocularPressure: Story = matrixStory(iopSchema, iopValues);
export const Refraction: Story = matrixStory(refractionSchema, refractionValues);
export const SpectaclePrescription: Story = {
  render: () => ({ template: '<emr-spectacle-prescription [model]="model" />', props: { model: spectaclePrescriptionModel } })
};
export const SpectaclePrescriptionReadOnly: Story = {
  render: () => ({ template: '<emr-spectacle-prescription [model]="model" />', props: { model: { ...spectaclePrescriptionModel, readOnly: true } } })
};
export const SpectaclePrescriptionErrors: Story = {
  render: () => ({ template: '<emr-spectacle-prescription [model]="model" />', props: { model: spectaclePrescriptionErrorsModel } })
};

export const PerimetryResult: Story = {
  render: () => ({ template: '<emr-diagnostic-result-summary [result]="result" />', props: { result: perimetryResult } })
};

export const PerimetryLoading: Story = {
  render: () => ({ template: '<emr-diagnostic-result-summary [result]="result" />', props: { result: { ...perimetryResult, loading: true } } })
};

export const PerimetryError: Story = {
  render: () => ({ template: '<emr-diagnostic-result-summary [result]="result" />', props: { result: { ...perimetryResult, error: 'The device report is temporarily unavailable.' } } })
};

export const PMTWorkflowNote: Story = {
  render: () => ({ template: '<aside class="emr-diagnostic-summary__state"><strong>PMT</strong><span>{{ note }}</span></aside>', props: { note: pmtStoryNote } })
};
