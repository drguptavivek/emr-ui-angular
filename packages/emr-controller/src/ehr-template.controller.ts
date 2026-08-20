import { StateController } from './contracts.js';
import type {
  ClinicalFieldDefinition,
  ClinicalFormBlock,
  ClinicalFormSchema,
  ClinicalFormViewModel,
} from './clinical-form.models.js';
import type { EmrGeneratedFieldDefinition } from './field-generator.models.js';
import { validateFieldDefinition } from './field-generator.controller.js';
import type {
  EhrTemplateControllerOptions,
  EhrTemplateDefinition,
  EhrTemplateFieldPlacement,
  EhrTemplateIntent,
  EhrTemplateSection,
  EhrTemplateViewModel,
  TemplateArtifactFormat,
  TemplateArtifactIssue,
} from './ehr-template.models.js';

type PendingImport = { template: EhrTemplateDefinition; issues: readonly TemplateArtifactIssue[] };
const clinicalFieldTypes = new Set(['text', 'multiline', 'integer', 'decimal', 'date', 'select', 'multiselect', 'boolean', 'quantity', 'custom']);

function copy<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => copy(item)) as T;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, copy(item)])) as T;
}

function issue(code: string, message: string, path?: string, severity: TemplateArtifactIssue['severity'] = 'error'): TemplateArtifactIssue {
  return { code, message, path, severity };
}

function initialState(initial: EhrTemplateViewModel): EhrTemplateViewModel {
  const template = copy(initial.template);
  return {
    ...initial,
    template,
    fieldLibrary: copy(initial.fieldLibrary),
    preview: derivePreview(template),
    artifact: initial.artifact ? copy(initial.artifact) : undefined,
    importIssues: initial.importIssues ? copy(initial.importIssues) : undefined,
  };
}

function fieldDefinition(field: EmrGeneratedFieldDefinition, id: string): ClinicalFieldDefinition {
  return {
    id,
    label: field.label,
    type: field.type,
    span: field.span,
    placeholder: field.placeholder,
    hint: field.instructions ?? field.description,
    required: field.required,
    unit: field.unit,
    precision: field.precision,
    rows: field.rows,
    options: field.options,
  };
}

/** Deterministic, value-empty ClinicalForm projection of an EHR template definition. */
export function derivePreview(template: EhrTemplateDefinition): ClinicalFormViewModel {
  const sections = template.sections.map(section => {
    const blocks: ClinicalFormBlock[] = [];
    for (const placement of section.fields) {
      if (placement.field.repeats) {
        blocks.push({
          kind: 'repeatable',
          id: placement.id,
          label: placement.field.label,
          description: placement.field.description,
          fields: [fieldDefinition(placement.field, `${placement.id}__value`)],
        });
      } else {
        blocks.push(fieldDefinition(placement.field, placement.id));
      }
    }
    return { id: section.id, label: section.label, description: section.description, blocks };
  });
  const schema: ClinicalFormSchema = {
    id: `${template.id}-form`,
    label: template.title,
    description: template.description,
    sections,
  };
  const fields: Record<string, { value: null }> = {};
  const repeatableGroups: Record<string, readonly never[]> = {};
  for (const section of template.sections) {
    for (const placement of section.fields) {
      if (placement.field.repeats) repeatableGroups[placement.id] = [];
      else fields[placement.id] = { value: null };
    }
  }
  return { schema, fields, repeatableGroups };
}

function validStatus(value: unknown): value is EhrTemplateDefinition['status'] {
  return value === 'draft' || value === 'active' || value === 'retired';
}

function validValidationRule(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const rule = value as Record<string, unknown>;
  if (typeof rule['id'] !== 'string') return false;
  if (rule['message'] !== undefined && typeof rule['message'] !== 'string') return false;
  switch (rule['kind']) {
    case 'min-length': case 'max-length': case 'minimum': case 'maximum': case 'precision':
      return typeof rule['value'] === 'number';
    case 'pattern':
      return typeof rule['value'] === 'string' && typeof rule['message'] === 'string';
    case 'earliest-date': case 'latest-date':
      return typeof rule['value'] === 'string';
    case 'allowed-values':
      return Array.isArray(rule['values']) && rule['values'].every(item => typeof item === 'string');
    case 'custom':
      return typeof rule['customValidatorId'] === 'string' && typeof rule['message'] === 'string';
    default:
      return false;
  }
}

function validTerminologyBinding(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const binding = value as Record<string, unknown>;
  if (typeof binding['id'] !== 'string' || !['question-meaning', 'answer-value-set', 'unit', 'classification-mapping'].includes(String(binding['role']))) return false;
  if (binding['strength'] !== undefined && !['required', 'extensible', 'preferred', 'example'].includes(String(binding['strength']))) return false;
  if (binding['mappingRelationship'] !== undefined && !['equivalent', 'wider', 'narrower', 'related-to'].includes(String(binding['mappingRelationship']))) return false;
  if (binding['concept'] !== undefined) {
    if (!binding['concept'] || typeof binding['concept'] !== 'object') return false;
    const concept = binding['concept'] as Record<string, unknown>;
    if (['sourceId', 'system', 'code', 'display'].some(key => typeof concept[key] !== 'string')) return false;
  }
  return binding['valueSetCanonical'] === undefined || typeof binding['valueSetCanonical'] === 'string';
}

function validFieldCollections(field: Partial<EmrGeneratedFieldDefinition>): boolean {
  if (!Array.isArray(field.validationRules) || !field.validationRules.every(validValidationRule)) return false;
  if (!Array.isArray(field.terminologyBindings) || !field.terminologyBindings.every(validTerminologyBinding)) return false;
  if (field.options !== undefined && (!Array.isArray(field.options) || !field.options.every(option => option && typeof option === 'object' && typeof option.value === 'string' && typeof option.label === 'string' && (option.disabled === undefined || typeof option.disabled === 'boolean')))) return false;
  return true;
}

function validateTemplate(value: unknown): { template?: EhrTemplateDefinition; issues: readonly TemplateArtifactIssue[] } {
  const errors: TemplateArtifactIssue[] = [];
  if (!value || typeof value !== 'object') return { issues: [issue('invalid-template', 'The imported value is not an object.')] };
  const candidate = value as Partial<EhrTemplateDefinition>;
  if (candidate.schemaVersion !== '1.0') errors.push(issue('unsupported-schema', 'Only template schema version 1.0 is supported.', 'schemaVersion'));
  for (const key of ['id', 'title', 'locale']) if (typeof candidate[key as keyof EhrTemplateDefinition] !== 'string' || !String(candidate[key as keyof EhrTemplateDefinition]).trim()) errors.push(issue('required-property', `${key} is required.`, key));
  if (!Number.isInteger(candidate.revision) || (candidate.revision as number) < 0) errors.push(issue('invalid-revision', 'Revision must be a non-negative integer.', 'revision'));
  if (!validStatus(candidate.status)) errors.push(issue('invalid-status', 'Status must be draft, active, or retired.', 'status'));
  if (!Array.isArray(candidate.sections)) errors.push(issue('invalid-sections', 'Sections must be an array.', 'sections'));
  const sections = Array.isArray(candidate.sections) ? candidate.sections : [];
  const sectionIds = new Set<string>();
  const placementIds = new Set<string>();
  for (const [sectionIndex, sectionValue] of sections.entries()) {
    if (!sectionValue || typeof sectionValue !== 'object') { errors.push(issue('invalid-section', 'Each section must be an object.', `sections[${sectionIndex}]`)); continue; }
    const section = sectionValue as Partial<EhrTemplateSection>;
    const path = `sections[${sectionIndex}]`;
    if (!section || typeof section !== 'object' || typeof section.id !== 'string' || !section.id.trim()) errors.push(issue('invalid-section', 'Each section needs a non-empty id.', `${path}.id`));
    if (typeof section.label !== 'string' || !section.label.trim()) errors.push(issue('invalid-section', 'Each section needs a non-empty label.', `${path}.label`));
    if (section.id && sectionIds.has(section.id)) errors.push(issue('duplicate-section-id', `Section id “${section.id}” is duplicated.`, `${path}.id`));
    if (section.id) sectionIds.add(section.id);
    if (!Array.isArray(section.fields)) { errors.push(issue('invalid-fields', 'Section fields must be an array.', `${path}.fields`)); continue; }
    for (const [fieldIndex, placementValue] of section.fields.entries()) {
      const fieldPath = `${path}.fields[${fieldIndex}]`;
      if (!placementValue || typeof placementValue !== 'object') { errors.push(issue('invalid-placement', 'Each field placement must be an object.', fieldPath)); continue; }
      const placement = placementValue as Partial<EhrTemplateFieldPlacement>;
      if (typeof placement.id !== 'string' || !placement.id.trim()) errors.push(issue('invalid-placement', 'Each field placement needs a non-empty id.', `${fieldPath}.id`));
      if (placement.id && placementIds.has(placement.id)) errors.push(issue('duplicate-placement-id', `Field placement id “${placement.id}” is duplicated.`, `${fieldPath}.id`));
      if (placement.id) placementIds.add(placement.id);
      if (typeof placement.sourceFieldId !== 'string' || !placement.sourceFieldId.trim()) errors.push(issue('invalid-placement', 'Each placement needs a source field id.', `${fieldPath}.sourceFieldId`));
      if (!Number.isInteger(placement.sourceFieldRevision) || (placement.sourceFieldRevision as number) < 0) errors.push(issue('invalid-placement-revision', 'Placement revision must be a non-negative integer.', `${fieldPath}.sourceFieldRevision`));
      const field = placement.field as Partial<EmrGeneratedFieldDefinition> | undefined;
      if (!field || typeof field !== 'object' || field.schemaVersion !== '1.0' || typeof field.id !== 'string' || !field.id.trim() || typeof field.label !== 'string' || !field.label.trim() || typeof field.type !== 'string' || !clinicalFieldTypes.has(field.type) || !Number.isInteger(field.revision) || (field.revision as number) < 0 || typeof field.required !== 'boolean' || typeof field.repeats !== 'boolean' || !validFieldCollections(field)) errors.push(issue('invalid-field-snapshot', 'Each placement must contain a complete generated field snapshot.', `${fieldPath}.field`));
      else {
        if (placement.sourceFieldId !== field.id) errors.push(issue('field-source-mismatch', 'Placement sourceFieldId must match the embedded field snapshot id.', `${fieldPath}.sourceFieldId`));
        if (placement.sourceFieldRevision !== field.revision) errors.push(issue('field-revision-mismatch', 'Placement sourceFieldRevision must match the embedded field snapshot revision.', `${fieldPath}.sourceFieldRevision`));
        for (const [key, message] of Object.entries(validateFieldDefinition(field as EmrGeneratedFieldDefinition))) errors.push(issue('invalid-field-definition', message, `${fieldPath}.field.${key}`));
      }
    }
  }
  return errors.length ? { issues: errors } : { template: copy(value as EhrTemplateDefinition), issues: [] };
}

export class EhrTemplateController extends StateController<EhrTemplateViewModel, EhrTemplateIntent> {
  private readonly options: EhrTemplateControllerOptions;
  private exportRequest?: { token: number; controller: AbortController; template: EhrTemplateDefinition };
  private importRequest?: { token: number; controller: AbortController };
  private saveRequest?: { token: number; controller: AbortController };
  private pendingImport?: PendingImport;
  private requestSequence = 0;
  private sectionSequence = 0;
  private placementSequence = 0;

  constructor(initial: EhrTemplateViewModel, options: EhrTemplateControllerOptions = {}) {
    super(initialState(initial));
    this.options = options;
  }

  dispatch(intent: EhrTemplateIntent): void {
    if (this.isDestroyed()) return;
    switch (intent.type) {
      case 'templatePatched': this.patchTemplate(intent.changes); return;
      case 'fieldLibraryQueryChanged': this.setState(state => ({ ...state, fieldLibraryQuery: intent.query })); return;
      case 'sectionSelected': if (this.section(intent.sectionId)) this.setState(state => ({ ...state, selectedSectionId: intent.sectionId, error: undefined })); return;
      case 'sectionAdded': this.addSection(intent.section); return;
      case 'sectionPatched': this.patchSection(intent.sectionId, intent.changes); return;
      case 'sectionMoved': this.moveSection(intent.sectionId, intent.direction); return;
      case 'sectionRemoved': this.removeSection(intent.sectionId); return;
      case 'fieldAdded': this.addField(intent.sectionId, intent.field, intent.placementId); return;
      case 'fieldMoved': this.moveField(intent.sectionId, intent.placementId, intent.direction); return;
      case 'fieldRemoved': this.removeField(intent.sectionId, intent.placementId); return;
      case 'artifactExportRequested': void this.exportArtifact(intent.format); return;
      case 'artifactImportRequested': void this.importArtifact(intent.format, intent.serialized); return;
      case 'importAccepted': this.acceptImport(); return;
      case 'saveRequested': void this.save(); return;
      default: this.assertNever(intent);
    }
  }

  private section(id: string): EhrTemplateSection | undefined { return this.getSnapshot().template.sections.find(section => section.id === id); }

  private mutate(mutator: (template: EhrTemplateDefinition) => EhrTemplateDefinition): void {
    this.setState(state => {
      if (state.readOnly) return state;
      const template = mutator(copy(state.template));
      return { ...state, template, preview: derivePreview(template), dirty: true, error: undefined, artifact: undefined };
    });
  }

  private patchTemplate(changes: Pick<Partial<EhrTemplateDefinition>, 'title' | 'description' | 'locale' | 'status'>): void {
    const safeChanges = copy(changes);
    this.mutate(template => ({ ...template, ...safeChanges, revision: template.revision + 1 }));
  }

  private addSection(section: EhrTemplateSection): void {
    let generatedId = '';
    if (!section.id.trim()) do { generatedId = `section-${++this.sectionSequence}`; } while (this.section(generatedId));
    const normalized = copy({ ...section, id: section.id.trim() || generatedId });
    if (this.section(normalized.id)) return this.setState(state => ({ ...state, error: `Section id “${normalized.id}” is already in use.` }));
    this.mutate(template => ({ ...template, revision: template.revision + 1, sections: [...template.sections, normalized] }));
  }

  private patchSection(sectionId: string, changes: Pick<Partial<EhrTemplateSection>, 'label' | 'description'>): void {
    if (!this.section(sectionId)) return;
    this.mutate(template => ({ ...template, revision: template.revision + 1, sections: template.sections.map(section => section.id === sectionId ? { ...section, ...copy(changes) } : section) }));
  }

  private moveSection(sectionId: string, direction: 'up' | 'down'): void {
    this.mutate(template => ({ ...template, revision: template.revision + 1, sections: this.move(template.sections, section => section.id === sectionId, direction) }));
  }

  private removeSection(sectionId: string): void {
    if (!this.section(sectionId)) return;
    this.mutate(template => ({ ...template, revision: template.revision + 1, sections: template.sections.filter(section => section.id !== sectionId) }));
    this.setState(state => state.selectedSectionId === sectionId ? { ...state, selectedSectionId: undefined, selectedPlacementId: undefined } : state);
  }

  private addField(sectionId: string, field: EmrGeneratedFieldDefinition, placementId: string): void {
    const section = this.section(sectionId);
    if (!section) return;
    const placementExists = (id: string) => this.getSnapshot().template.sections.some(candidate => candidate.fields.some(placement => placement.id === id));
    let generatedId = '';
    if (!placementId.trim()) do { generatedId = `placement-${++this.placementSequence}`; } while (placementExists(generatedId));
    const resolvedPlacementId = placementId.trim() || generatedId;
    if (placementExists(resolvedPlacementId)) return this.setState(state => ({ ...state, error: `Field placement id “${resolvedPlacementId}” is already in use.` }));
    const placement: EhrTemplateFieldPlacement = { id: resolvedPlacementId, sourceFieldId: field.id, sourceFieldRevision: field.revision, field: copy(field) };
    this.mutate(template => ({ ...template, revision: template.revision + 1, sections: template.sections.map(candidate => candidate.id === sectionId ? { ...candidate, fields: [...candidate.fields, placement] } : candidate) }));
    this.setState(state => ({ ...state, selectedSectionId: sectionId, selectedPlacementId: resolvedPlacementId }));
  }

  private moveField(sectionId: string, placementId: string, direction: 'up' | 'down'): void {
    if (!this.section(sectionId)?.fields.some(field => field.id === placementId)) return;
    this.mutate(template => ({ ...template, revision: template.revision + 1, sections: template.sections.map(section => section.id === sectionId ? { ...section, fields: this.move(section.fields, field => field.id === placementId, direction) } : section) }));
  }

  private removeField(sectionId: string, placementId: string): void {
    if (!this.section(sectionId)?.fields.some(field => field.id === placementId)) return;
    this.mutate(template => ({ ...template, revision: template.revision + 1, sections: template.sections.map(section => section.id === sectionId ? { ...section, fields: section.fields.filter(field => field.id !== placementId) } : section) }));
    this.setState(state => state.selectedPlacementId === placementId ? { ...state, selectedPlacementId: undefined } : state);
  }

  private move<T>(items: readonly T[], match: (item: T) => boolean, direction: 'up' | 'down'): readonly T[] {
    const index = items.findIndex(match);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= items.length) return [...items];
    const result = [...items];
    [result[index], result[target]] = [result[target], result[index]];
    return result;
  }

  private async exportArtifact(format: TemplateArtifactFormat): Promise<void> {
    this.exportRequest?.controller.abort();
    this.importRequest?.controller.abort();
    this.exportRequest = undefined;
    this.importRequest = undefined;
    this.setState(state => ({ ...state, loading: false }));
    if (format === 'internal-json') {
      const template = copy(this.getSnapshot().template);
      const artifact = { format, serialized: JSON.stringify(template), issues: [] } as const;
      this.setState(state => ({ ...state, artifact, error: undefined }));
      return;
    }
    if (!this.options.artifactPort) return this.setState(state => ({ ...state, error: 'No artifact service is configured.' }));
    const templateReference = this.getSnapshot().template;
    const request = { token: ++this.requestSequence, controller: new AbortController(), template: templateReference };
    this.exportRequest = request;
    this.setState(state => ({ ...state, loading: true, error: undefined }));
    try {
      const result = await this.options.artifactPort.exportTemplate(copy(templateReference), format, { signal: request.controller.signal });
      if (this.exportRequest?.token !== request.token || request.controller.signal.aborted) return;
      if (this.getSnapshot().template !== templateReference) { this.setState(state => ({ ...state, loading: false })); return; }
      this.setState(state => ({ ...state, artifact: copy(result), loading: false }));
    } catch (error) {
      if (this.exportRequest?.token !== request.token || request.controller.signal.aborted) return;
      this.setState(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Unable to export template.' }));
    }
  }

  private async importArtifact(format: TemplateArtifactFormat, serialized: string): Promise<void> {
    this.pendingImport = undefined;
    this.importRequest?.controller.abort();
    this.exportRequest?.controller.abort();
    this.importRequest = undefined;
    this.exportRequest = undefined;
    this.setState(state => ({ ...state, loading: false }));
    if (format === 'internal-json') {
      let parsed: unknown;
      try { parsed = JSON.parse(serialized); } catch { return this.setState(state => ({ ...state, importIssues: [issue('invalid-json', 'The template JSON could not be parsed.')], error: 'Template import requires correction before it can be applied.' })); }
      const result = validateTemplate(parsed);
      return this.receiveImport(result.template, result.issues);
    }
    if (!this.options.artifactPort) return this.setState(state => ({ ...state, error: 'No artifact service is configured.' }));
    const request = { token: ++this.requestSequence, controller: new AbortController() };
    this.importRequest = request;
    this.setState(state => ({ ...state, loading: true, error: undefined, importIssues: undefined }));
    try {
      const result = await this.options.artifactPort.importTemplate(serialized, format, { signal: request.controller.signal });
      if (this.importRequest?.token !== request.token || request.controller.signal.aborted) return;
      this.setState(state => ({ ...state, loading: false }));
      const validated = result.template ? validateTemplate(result.template) : { template: undefined, issues: [] };
      this.receiveImport(validated.template, [...result.issues, ...validated.issues]);
    } catch (error) {
      if (this.importRequest?.token !== request.token || request.controller.signal.aborted) return;
      this.pendingImport = undefined;
      this.setState(state => ({ ...state, loading: false, importIssues: [issue('import-failed', error instanceof Error ? error.message : 'Unable to import template.')] }));
    }
  }

  private receiveImport(template: EhrTemplateDefinition | undefined, issues: readonly TemplateArtifactIssue[]): void {
    if (!template || issues.some(item => item.severity === 'error')) {
      this.pendingImport = undefined;
      this.setState(state => ({ ...state, loading: false, importIssues: copy(issues.length ? issues : [issue('missing-template', 'The import did not contain a valid template.')]), error: 'Template import requires correction before it can be applied.' }));
      return;
    }
    this.pendingImport = { template: copy(template), issues: copy(issues) };
    if (issues.length) this.setState(state => ({ ...state, importIssues: copy(issues), error: 'Review the import issues and explicitly accept the template.' }));
    else this.acceptImport();
  }

  private acceptImport(): void {
    const pending = this.pendingImport;
    if (!pending || this.getSnapshot().readOnly) return;
    this.pendingImport = undefined;
    this.saveRequest?.controller.abort();
    this.saveRequest = undefined;
    const template = copy(pending.template);
    this.setState(state => ({ ...state, template, preview: derivePreview(template), dirty: true, saving: false, concurrencyToken: undefined, importIssues: undefined, error: undefined, selectedSectionId: undefined, selectedPlacementId: undefined }));
  }

  private async save(): Promise<void> {
    if (!this.options.repository) return this.setState(state => ({ ...state, error: 'No template repository is configured.' }));
    if (this.getSnapshot().readOnly) return;
    const validation = validateTemplate(this.getSnapshot().template);
    if (!validation.template) return this.setState(state => ({ ...state, error: validation.issues.map(item => item.message).join(' ') }));
    this.saveRequest?.controller.abort();
    const request = { token: ++this.requestSequence, controller: new AbortController() };
    this.saveRequest = request;
    const templateReference = this.getSnapshot().template;
    const template = copy(templateReference);
    this.setState(state => ({ ...state, saving: true, error: undefined }));
    try {
      const result = await this.options.repository.save(template, { signal: request.controller.signal, concurrencyToken: this.getSnapshot().concurrencyToken });
      if (this.saveRequest?.token !== request.token || request.controller.signal.aborted) return;
      this.setState(state => {
        const changedWhileSaving = state.template !== templateReference;
        const updatedTemplate = { ...state.template, revision: result.revision };
        return { ...state, template: updatedTemplate, preview: derivePreview(updatedTemplate), saving: false, dirty: changedWhileSaving, concurrencyToken: result.concurrencyToken, error: undefined };
      });
    } catch (error) {
      if (this.saveRequest?.token !== request.token || request.controller.signal.aborted) return;
      this.setState(state => ({ ...state, saving: false, error: error instanceof Error ? error.message : 'Unable to save template.' }));
    }
  }

  private assertNever(value: never): never { throw new Error(`Unhandled EhrTemplateIntent: ${JSON.stringify(value)}`); }

  protected override onDestroy(): void {
    this.exportRequest?.controller.abort();
    this.importRequest?.controller.abort();
    this.saveRequest?.controller.abort();
    this.exportRequest = undefined;
    this.pendingImport = undefined;
  }
}
