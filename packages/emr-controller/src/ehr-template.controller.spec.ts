import { describe, expect, it, vi } from 'vitest';
import { EhrTemplateController, derivePreview } from './ehr-template.controller.js';
import type { EhrTemplateDefinition, EhrTemplateViewModel, TemplateArtifactPort } from './ehr-template.models.js';
import type { EmrGeneratedFieldDefinition } from './field-generator.models.js';

const field = (id: string, repeats = false): EmrGeneratedFieldDefinition => ({
  schemaVersion: '1.0', id, revision: 2, label: id, type: 'text', required: false, repeats,
  validationRules: [], terminologyBindings: [],
});

const template: EhrTemplateDefinition = {
  schemaVersion: '1.0', id: 'opd', revision: 1, title: 'OPD assessment', locale: 'en-IN', status: 'draft',
  sections: [{ id: 'history', label: 'History', fields: [{ id: 'chief', sourceFieldId: 'chief', sourceFieldRevision: 2, field: field('chief') }] }],
};
const view = (value = template): EhrTemplateViewModel => ({ template: value, fieldLibrary: [field('chief'), field('weight')], fieldLibraryQuery: '', preview: derivePreview(value), loading: false, saving: false, dirty: false });

describe('EhrTemplateController', () => {
  it('keeps deterministic section and field ordering and snapshots added fields immutably', () => {
    const controller = new EhrTemplateController(view());
    const added = field('weight');
    controller.dispatch({ type: 'sectionAdded', section: { id: 'exam', label: 'Examination', fields: [] } });
    controller.dispatch({ type: 'fieldAdded', sectionId: 'exam', placementId: 'weight-placement', field: added });
    added.label = 'mutated after dispatch';
    expect(controller.getSnapshot().template.sections.map(section => section.id)).toEqual(['history', 'exam']);
    expect(controller.getSnapshot().template.sections[1].fields[0].field.label).toBe('weight');
    controller.dispatch({ type: 'sectionMoved', sectionId: 'exam', direction: 'up' });
    expect(controller.getSnapshot().template.sections.map(section => section.id)).toEqual(['exam', 'history']);
    controller.dispatch({ type: 'fieldMoved', sectionId: 'exam', placementId: 'weight-placement', direction: 'up' });
    controller.dispatch({ type: 'fieldRemoved', sectionId: 'exam', placementId: 'weight-placement' });
    expect(controller.getSnapshot().template.sections[0].fields).toEqual([]);
  });

  it('derives a value-empty ClinicalForm preview, including repeatable fields', () => {
    const value = { ...template, sections: [{ id: 'exam', label: 'Exam', fields: [{ id: 'weight', sourceFieldId: 'weight', sourceFieldRevision: 1, field: field('weight', true) }] }] };
    const preview = derivePreview(value);
    expect(preview.schema.sections[0].blocks[0]).toMatchObject({ kind: 'repeatable', id: 'weight', fields: [{ id: 'weight__value' }] });
    expect(preview.repeatableGroups).toEqual({ weight: [] });
  });

  it('assigns section and placement identities in the controller when the UI supplies none', () => {
    const controller = new EhrTemplateController(view());
    controller.dispatch({ type: 'sectionAdded', section: { id: '', label: 'Examination', fields: [] } });
    const sectionId = controller.getSnapshot().template.sections[1].id;
    controller.dispatch({ type: 'fieldAdded', sectionId, placementId: '', field: field('weight') });
    expect(sectionId).toBe('section-1');
    expect(controller.getSnapshot().template.sections[1].fields[0].id).toBe('placement-1');
  });

  it('round trips internal JSON and rejects invalid imports without partial mutation', async () => {
    const controller = new EhrTemplateController(view());
    controller.dispatch({ type: 'artifactExportRequested', format: 'internal-json' });
    const serialized = controller.getSnapshot().artifact?.serialized;
    expect(serialized).toBeTruthy();
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: '{"schemaVersion":"1.0"}' });
    expect(controller.getSnapshot().template.id).toBe('opd');
    expect(controller.getSnapshot().importIssues?.length).toBeGreaterThan(0);
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: serialized! });
    expect(controller.getSnapshot().template.id).toBe('opd');
    expect(controller.getSnapshot().preview.schema.label).toBe('OPD assessment');
  });

  it('requires explicit acceptance for warning-bearing imports', async () => {
    const artifactPort: TemplateArtifactPort = {
      exportTemplate: vi.fn(),
      importTemplate: vi.fn(async () => ({ template, issues: [{ severity: 'warning', code: 'lossy', message: 'Some display metadata was omitted.' }] })),
    };
    const controller = new EhrTemplateController(view(), { artifactPort });
    controller.dispatch({ type: 'artifactImportRequested', format: 'fhir-r4-questionnaire', serialized: '{}' });
    await vi.waitFor(() => expect(controller.getSnapshot().importIssues).toHaveLength(1));
    expect(controller.getSnapshot().dirty).toBe(false);
    controller.dispatch({ type: 'importAccepted' });
    expect(controller.getSnapshot().dirty).toBe(true);
  });

  it('clears an older warning import when a later import fails', async () => {
    const artifactPort: TemplateArtifactPort = {
      exportTemplate: vi.fn(),
      importTemplate: vi.fn(async () => ({ template, issues: [{ severity: 'warning', code: 'lossy', message: 'Review.' }] })),
    };
    const controller = new EhrTemplateController(view(), { artifactPort });
    controller.dispatch({ type: 'artifactImportRequested', format: 'fhir-r4-questionnaire', serialized: '{}' });
    await vi.waitFor(() => expect(controller.getSnapshot().importIssues).toHaveLength(1));
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: '{invalid' });
    controller.dispatch({ type: 'importAccepted' });
    expect(controller.getSnapshot().dirty).toBe(false);
    expect(controller.getSnapshot().template.id).toBe('opd');
  });

  it('rejects duplicate placement ids across sections and mismatched field snapshots', () => {
    const invalid = { ...template, sections: [
      { id: 'one', label: 'One', fields: [{ id: 'duplicate', sourceFieldId: 'chief', sourceFieldRevision: 2, field: field('chief') }] },
      { id: 'two', label: 'Two', fields: [{ id: 'duplicate', sourceFieldId: 'wrong', sourceFieldRevision: 99, field: field('weight') }] },
    ] };
    const controller = new EhrTemplateController(view());
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: JSON.stringify(invalid) });
    expect(controller.getSnapshot().importIssues?.map(item => item.code)).toEqual(expect.arrayContaining(['duplicate-placement-id', 'field-source-mismatch', 'field-revision-mismatch']));
    expect(controller.getSnapshot().template.id).toBe('opd');
  });

  it('suppresses stale FHIR responses and exposes errors', async () => {
    let firstResolve!: (value: { template: EhrTemplateDefinition; issues: [] }) => void;
    let secondResolve!: (value: { template: EhrTemplateDefinition; issues: [] }) => void;
    const artifactPort: TemplateArtifactPort = {
      exportTemplate: vi.fn(),
      importTemplate: vi.fn()
        .mockImplementationOnce(() => new Promise(resolve => { firstResolve = resolve; }))
        .mockImplementationOnce(() => new Promise(resolve => { secondResolve = resolve; })),
    };
    const controller = new EhrTemplateController(view(), { artifactPort });
    controller.dispatch({ type: 'artifactImportRequested', format: 'fhir-r4-questionnaire', serialized: 'first' });
    controller.dispatch({ type: 'artifactImportRequested', format: 'fhir-r4-questionnaire', serialized: 'second' });
    secondResolve({ template: { ...template, id: 'second' }, issues: [] });
    await vi.waitFor(() => expect(controller.getSnapshot().template.id).toBe('second'));
    firstResolve({ template: { ...template, id: 'first' }, issues: [] });
    await Promise.resolve();
    expect(controller.getSnapshot().template.id).toBe('second');
  });

  it('suppresses older imports across different FHIR formats', async () => {
    const resolvers: Array<(value: { template: EhrTemplateDefinition; issues: [] }) => void> = [];
    const artifactPort: TemplateArtifactPort = { exportTemplate: vi.fn(), importTemplate: vi.fn(() => new Promise(resolve => { resolvers.push(resolve); })) };
    const controller = new EhrTemplateController(view(), { artifactPort });
    controller.dispatch({ type: 'artifactImportRequested', format: 'fhir-r4-questionnaire', serialized: 'older' });
    controller.dispatch({ type: 'artifactImportRequested', format: 'fhir-r5-questionnaire', serialized: 'newer' });
    resolvers[1]({ template: { ...template, id: 'newer' }, issues: [] });
    await vi.waitFor(() => expect(controller.getSnapshot().template.id).toBe('newer'));
    resolvers[0]({ template: { ...template, id: 'older' }, issues: [] });
    await Promise.resolve();
    expect(controller.getSnapshot().template.id).toBe('newer');
  });

  it('ignores an external import that resolves after an internal import supersedes it', async () => {
    let resolve!: (value: { template: EhrTemplateDefinition; issues: [] }) => void;
    const artifactPort: TemplateArtifactPort = { exportTemplate: vi.fn(), importTemplate: vi.fn(() => new Promise(done => { resolve = done; })) };
    const controller = new EhrTemplateController(view(), { artifactPort });
    controller.dispatch({ type: 'artifactImportRequested', format: 'fhir-r4-questionnaire', serialized: 'older' });
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: JSON.stringify({ ...template, id: 'internal' }) });
    expect(controller.getSnapshot().template.id).toBe('internal');
    resolve({ template: { ...template, id: 'late-external' }, issues: [] });
    await Promise.resolve();
    expect(controller.getSnapshot().template.id).toBe('internal');
  });

  it('reports null sections and placements as import issues instead of throwing', () => {
    const controller = new EhrTemplateController(view());
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: JSON.stringify({ ...template, sections: [null] }) });
    expect(controller.getSnapshot().importIssues?.[0].code).toBe('invalid-section');
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: JSON.stringify({ ...template, sections: [{ id: 'section', label: 'Section', fields: [null] }] }) });
    expect(controller.getSnapshot().importIssues?.[0].code).toBe('invalid-placement');
  });

  it('rejects embedded field snapshots that fail field-definition validation', () => {
    const malformed = field('bad');
    malformed.validationRules = [{ id: 'pattern', kind: 'pattern', value: '[', message: 'Bad' }];
    const value = { ...template, sections: [{ id: 'section', label: 'Section', fields: [{ id: 'bad-placement', sourceFieldId: 'bad', sourceFieldRevision: 2, field: malformed }] }] };
    const controller = new EhrTemplateController(view());
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: JSON.stringify(value) });
    expect(controller.getSnapshot().importIssues?.map(item => item.code)).toContain('invalid-field-definition');
  });

  it('reports malformed nested field collections without throwing', () => {
    const malformedFields = [
      { ...field('bad'), validationRules: [null] },
      { ...field('bad'), validationRules: [{ id: 'x', kind: 'bogus' }] },
      { ...field('bad'), terminologyBindings: [null] },
      { ...field('bad'), type: 'select', options: [{ value: null, label: 'Example' }] },
      { ...field('bad'), terminologyBindings: [{ id: 'bad-binding', role: 'classification-mapping', strength: 'bogus', mappingRelationship: 'bogus', concept: { sourceId: 'icd', system: 'http://example.org/icd', code: 'X', display: 'X' } }] },
      { ...field('bad'), validationRules: [{ id: 'minimum', kind: 'minimum', value: 1, message: 42 }] },
    ];
    for (const malformed of malformedFields) {
      const value = { ...template, sections: [{ id: 'section', label: 'Section', fields: [{ id: 'bad-placement', sourceFieldId: 'bad', sourceFieldRevision: 2, field: malformed }] }] };
      const controller = new EhrTemplateController(view());
      controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: JSON.stringify(value) });
      expect(controller.getSnapshot().importIssues?.map(item => item.code)).toContain('invalid-field-snapshot');
      expect(controller.getSnapshot().template.id).toBe('opd');
    }
  });

  it('does not expose an export artifact for a stale template snapshot', async () => {
    let resolve!: (value: { format: 'fhir-r4-questionnaire'; serialized: string; issues: [] }) => void;
    const artifactPort: TemplateArtifactPort = { importTemplate: vi.fn(), exportTemplate: vi.fn(() => new Promise(done => { resolve = done; })) };
    const controller = new EhrTemplateController(view(), { artifactPort });
    controller.dispatch({ type: 'artifactExportRequested', format: 'fhir-r4-questionnaire' });
    controller.dispatch({ type: 'templatePatched', changes: { title: 'Changed after export started' } });
    resolve({ format: 'fhir-r4-questionnaire', serialized: '{}', issues: [] });
    await vi.waitFor(() => expect(controller.getSnapshot().loading).toBe(false));
    expect(controller.getSnapshot().artifact).toBeUndefined();
  });

  it('saves with concurrency token and protects readonly templates', async () => {
    const save = vi.fn(async () => ({ revision: 9, concurrencyToken: 'next' }));
    const controller = new EhrTemplateController(view(), { repository: { save } });
    controller.dispatch({ type: 'templatePatched', changes: { title: 'Changed' } });
    controller.dispatch({ type: 'saveRequested' });
    await vi.waitFor(() => expect(save).toHaveBeenCalled());
    await vi.waitFor(() => expect(controller.getSnapshot().saving).toBe(false));
    expect(save.mock.calls[0][1].concurrencyToken).toBeUndefined();
    expect(controller.getSnapshot().template.revision).toBe(9);
    expect(controller.getSnapshot().dirty).toBe(false);
    const readOnly = new EhrTemplateController({ ...view(), readOnly: true });
    readOnly.dispatch({ type: 'templatePatched', changes: { title: 'Should not change' } });
    expect(readOnly.getSnapshot().template.title).toBe('OPD assessment');
  });

  it('does not persist an invalid edited template', () => {
    const save = vi.fn();
    const controller = new EhrTemplateController(view(), { repository: { save } });
    controller.dispatch({ type: 'templatePatched', changes: { title: '' } });
    controller.dispatch({ type: 'saveRequested' });
    expect(save).not.toHaveBeenCalled();
    expect(controller.getSnapshot().error).toContain('title is required');
  });

  it('preserves dirty state when the template changes during a save', async () => {
    let resolve!: (result: { revision: number; concurrencyToken?: string }) => void;
    const controller = new EhrTemplateController(view(), { repository: { save: async () => new Promise(done => { resolve = done; }) } });
    controller.dispatch({ type: 'saveRequested' });
    controller.dispatch({ type: 'templatePatched', changes: { title: 'Edited during save' } });
    resolve({ revision: 3, concurrencyToken: 'v3' });
    await vi.waitFor(() => expect(controller.getSnapshot().saving).toBe(false));
    expect(controller.getSnapshot()).toMatchObject({ dirty: true, concurrencyToken: 'v3', template: { title: 'Edited during save', revision: 3 } });
  });

  it('invalidates an in-flight save when an imported template is accepted', async () => {
    let resolve!: (result: { revision: number; concurrencyToken?: string }) => void;
    const controller = new EhrTemplateController(view(), { repository: { save: async () => new Promise(done => { resolve = done; }) } });
    controller.dispatch({ type: 'saveRequested' });
    controller.dispatch({ type: 'artifactImportRequested', format: 'internal-json', serialized: JSON.stringify({ ...template, id: 'imported' }) });
    resolve({ revision: 99, concurrencyToken: 'stale-token' });
    await Promise.resolve();
    expect(controller.getSnapshot()).toMatchObject({ saving: false, dirty: true, template: { id: 'imported', revision: 1 } });
    expect(controller.getSnapshot().concurrencyToken).toBeUndefined();
  });

  it('does not call external ports after destroy', () => {
    const save = vi.fn();
    const controller = new EhrTemplateController(view(), { repository: { save } });
    controller.destroy();
    controller.dispatch({ type: 'saveRequested' });
    expect(save).not.toHaveBeenCalled();
  });
});
