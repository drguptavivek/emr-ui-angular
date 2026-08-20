import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { EhrTemplateDefinition, EhrTemplateViewModel, EmrGeneratedFieldDefinition, TemplateArtifactResult } from '@drguptavivek/emr-controller';
import { derivePreview } from '@drguptavivek/emr-controller';
import { EmrTemplateComposerComponent } from '../templates/emr-template-composer.component';
import { EmrTemplatePreviewComponent } from '../templates/emr-template-preview.component';

const field = (id: string, label: string, type: EmrGeneratedFieldDefinition['type'], overrides: Partial<EmrGeneratedFieldDefinition> = {}): EmrGeneratedFieldDefinition => ({ schemaVersion: '1.0', id, revision: 1, label, type, required: false, repeats: false, validationRules: [], terminologyBindings: [], span: 6, ...overrides });
const weight = field('weight', 'Weight', 'quantity', { unit: 'kg', unitSystem: 'UCUM', unitCode: 'kg', required: true });
const pulse = field('pulse', 'Pulse', 'integer', { unit: 'beats/min' });
const chief = field('chief-complaints', 'Chief complaints', 'multiline', { span: 12, rows: 3, required: true });
const loincBound = field('hba1c', 'HbA1c', 'decimal', { unit: '%', precision: 1, terminologyBindings: [{ id: 'binding-hba1c', role: 'question-meaning', strength: 'preferred', concept: { sourceId: 'loinc', code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood', system: 'http://loinc.org', active: true } }] });

const makeTemplate = (sections: EhrTemplateDefinition['sections'], overrides: Partial<EhrTemplateDefinition> = {}): EhrTemplateDefinition => ({ schemaVersion: '1.0', id: 'general-examination', revision: 4, title: 'General physical examination', description: 'A reusable examination template for outpatient encounters.', locale: 'en-IN', status: 'draft', sections, ...overrides });
const placement = (source: EmrGeneratedFieldDefinition, id = source.id) => ({ id, sourceFieldId: source.id, sourceFieldRevision: source.revision, field: source });
const makeModel = (template: EhrTemplateDefinition, overrides: Partial<EhrTemplateViewModel> = {}): EhrTemplateViewModel => ({ template, fieldLibrary: [chief, weight, pulse, loincBound], fieldLibraryQuery: '', selectedSectionId: template.sections[0]?.id, preview: derivePreview(template), loading: false, saving: false, dirty: false, ...overrides });
const general = makeTemplate([{ id: 'history', label: 'History', description: 'Presenting concern and relevant history.', fields: [placement(chief)] }, { id: 'examination', label: 'General examination', description: 'Record core observations.', fields: [placement(weight), placement(pulse)] }]);
const meta: Meta = { title: 'EMR / Templates / Composer', decorators: [moduleMetadata({ imports: [EmrTemplateComposerComponent, EmrTemplatePreviewComponent] })], parameters: { docs: { description: { component: 'Controlled, reusable EHR template composition surfaces. The UI emits intents; controllers own field catalogues, terminology, validation, persistence and artifact conversion.' } } } };
export default meta;
type Story = StoryObj;

export const Empty: Story = { render: () => ({ template: `<emr-template-composer [model]="model" />`, props: { model: makeModel(makeTemplate([])) } }) };
export const MultiSectionGeneralExamination: Story = { render: () => ({ template: `<emr-template-composer [model]="model" />`, props: { model: makeModel(general, { selectedSectionId: 'examination' }) } }) };
export const TerminologyBound: Story = { render: () => ({ template: `<emr-template-composer [model]="model" />`, props: { model: makeModel(makeTemplate([{ id: 'metabolic', label: 'Metabolic assessment', fields: [placement(loincBound)] }])) } }) };
export const Preview: Story = { render: () => ({ template: `<emr-template-preview [model]="model" />`, props: { model: makeModel(general) } }) };
const importIssues = [{ severity: 'warning' as const, code: 'lossy-display', message: 'Display instructions were not present in the imported artifact.', path: 'item[0].text' }];
export const ImportIssues: Story = { render: () => ({ template: `<emr-template-preview [model]="model" />`, props: { model: makeModel(general, { importIssues, error: 'Review the import issues and explicitly accept the template.' }) } }) };
const artifact: TemplateArtifactResult = { format: 'fhir-r4-questionnaire', fhirVersion: '4.0.1', serialized: '{\n  "resourceType": "Questionnaire",\n  "status": "active"\n}', issues: [] };
export const ExportLoading: Story = { render: () => ({ template: `<emr-template-preview [model]="model" />`, props: { model: makeModel(general, { loading: true }) } }) };
export const ExportError: Story = { render: () => ({ template: `<emr-template-preview [model]="model" />`, props: { model: makeModel(general, { error: 'The configured FHIR export service is unavailable.' }) } }) };
export const ExportedArtifact: Story = { render: () => ({ template: `<emr-template-preview [model]="model" />`, props: { model: makeModel(general, { artifact }) } }) };
export const ReadonlyPublished: Story = { render: () => ({ template: `<emr-template-composer [model]="model" [readOnly]="true" />`, props: { model: makeModel(general, { readOnly: true, template: { ...general, status: 'active' } }) } }) };
export const Mobile: Story = { render: () => ({ template: `<div style="max-width: 430px"><emr-template-composer [model]="model" /></div>`, props: { model: makeModel(general, { selectedSectionId: 'history' }) } }) };
export const TwoInstances: Story = { render: () => ({ template: `<emr-template-composer headingId="template-composer-one" [model]="first" /><emr-template-composer headingId="template-composer-two" [model]="second" />`, props: { first: makeModel(general, { selectedSectionId: 'history' }), second: makeModel({ ...general, id: 'second-template', title: 'Second reusable template' }, { selectedSectionId: 'examination' }) } }) };
