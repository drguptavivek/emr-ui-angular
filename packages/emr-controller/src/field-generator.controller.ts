import { StateController } from './contracts.js';
import type {
  EmrGeneratedFieldDefinition,
  FieldDefinitionRepositoryPort,
  FieldGeneratorIntent,
  FieldGeneratorViewModel,
  FieldGeneratorControllerOptions,
  FieldValidationRule
} from './field-generator.models.js';
import type {
  TerminologyBindingRole,
  TerminologyConcept,
  TerminologySearchState,
  TerminologySource
} from './terminology.models.js';

const DEFAULT_PAGE_SIZE = 20;

type SearchRequest = { controller: AbortController; sequence: number };

export class FieldGeneratorController extends StateController<FieldGeneratorViewModel, FieldGeneratorIntent> {
  private readonly terminology;
  private readonly repository?: FieldDefinitionRepositoryPort;
  private readonly requests = new Map<TerminologyBindingRole, SearchRequest>();
  private saveRequest?: AbortController;
  private bindingSequence = 0;

  constructor(
    draft: EmrGeneratedFieldDefinition,
    sourcesOrOptions: readonly TerminologySource[] | FieldGeneratorControllerOptions,
    maybeOptions?: FieldGeneratorControllerOptions
  ) {
    const sources = Array.isArray(sourcesOrOptions) ? sourcesOrOptions : [];
    const options: FieldGeneratorControllerOptions | undefined = Array.isArray(sourcesOrOptions)
      ? maybeOptions
      : sourcesOrOptions as FieldGeneratorControllerOptions;
    if (!options) throw new Error('Field generator terminology options are required.');
    super({
      draft: cloneDraft(draft),
      sources: [...sources],
      terminologySearches: {},
      validationErrors: validateFieldDefinition(draft),
      saving: false,
      dirty: false
    });
    this.terminology = options.terminology;
    this.repository = options.repository;
  }

  dispatch(intent: FieldGeneratorIntent): void {
    if (this.isDestroyed()) return;
    switch (intent.type) {
      case 'draftPatched':
        if (this.isReadOnly()) return;
        this.setState(state => {
          const draft = cloneDraft({ ...state.draft, ...intent.changes });
          return { ...state, draft, validationErrors: validateFieldDefinition(draft), dirty: true, error: undefined };
        });
        return;
      case 'validationRuleAdded':
        if (this.isReadOnly()) return;
        this.setState(state => {
          const existingIds = new Set(state.draft.validationRules.map(rule => rule.id));
          let generatedId = '';
          let sequence = state.draft.validationRules.length + 1;
          do { generatedId = `rule-${sequence++}`; } while (existingIds.has(generatedId));
          const rule = { ...intent.rule, id: intent.rule.id.trim() || generatedId } as FieldValidationRule;
          const validationRules = [...state.draft.validationRules.filter(candidate => candidate.id !== rule.id), rule];
          const draft = cloneDraft({ ...state.draft, validationRules });
          return { ...state, draft, validationErrors: validateFieldDefinition(draft), dirty: true, error: undefined };
        });
        return;
      case 'validationRuleRemoved':
        if (this.isReadOnly()) return;
        this.setState(state => {
          const draft = cloneDraft({ ...state.draft, validationRules: state.draft.validationRules.filter(rule => rule.id !== intent.ruleId) });
          return { ...state, draft, validationErrors: validateFieldDefinition(draft), dirty: true, error: undefined };
        });
        return;
      case 'terminologySearchOpened':
        this.openSearch(intent.role, intent.sourceId);
        return;
      case 'terminologyQueryChanged':
        this.cancelSearch(intent.role);
        this.setState(state => ({
          ...state,
          terminologySearches: {
            ...state.terminologySearches,
            [intent.role]: {
              ...(state.terminologySearches[intent.role] ?? defaultSearch(intent.role, '')),
              query: intent.query,
              page: 1,
              options: [],
              total: 0,
              loading: false,
              error: undefined
            }
          }
        }));
        return;
      case 'terminologySearchRequested':
        void this.search(intent.role);
        return;
      case 'terminologyPageChanged':
        this.setSearchPage(intent.role, intent.page);
        void this.search(intent.role);
        return;
      case 'terminologyRetryRequested':
        void this.search(intent.role);
        return;
      case 'terminologyConceptSelected':
        if (this.isReadOnly()) return;
        {
          const selectionError = validateTerminologySelection(this.getSnapshot().sources, intent.role, intent.concept, intent.mappingRelationship);
          if (selectionError) { this.setState(state => ({ ...state, error: selectionError })); return; }
        }
        this.setState(state => {
          const concept = cloneConcept(intent.concept);
          const matchingBinding = state.draft.terminologyBindings.find(candidate => candidate.role === intent.role && candidate.concept?.system === intent.concept.system && candidate.concept.code === intent.concept.code && candidate.concept.version === intent.concept.version);
          const bindingIds = new Set(state.draft.terminologyBindings.map(candidate => candidate.id));
          let generatedBindingId = '';
          do { generatedBindingId = `binding-${++this.bindingSequence}`; } while (bindingIds.has(generatedBindingId));
          const binding = {
            id: matchingBinding?.id ?? generatedBindingId,
            role: intent.role,
            concept,
            valueSetCanonical: intent.role === 'answer-value-set' ? concept.canonicalUri : undefined,
            strength: intent.strength,
            mappingRelationship: intent.mappingRelationship
          };
          const retained = intent.role === 'classification-mapping'
            ? state.draft.terminologyBindings.filter(candidate => candidate.id !== matchingBinding?.id)
            : state.draft.terminologyBindings.filter(candidate => candidate.role !== intent.role);
          const draft = cloneDraft({
            ...state.draft,
            terminologyBindings: [...retained, binding]
          });
          return { ...state, draft, validationErrors: validateFieldDefinition(draft), dirty: true, error: undefined };
        });
        return;
      case 'terminologyBindingRemoved':
        if (this.isReadOnly()) return;
        this.setState(state => {
          const draft = cloneDraft({
            ...state.draft,
            terminologyBindings: state.draft.terminologyBindings.filter(binding => binding.id !== intent.bindingId)
          });
          return { ...state, draft, validationErrors: validateFieldDefinition(draft), dirty: true, error: undefined };
        });
        return;
      case 'saveRequested':
        if (this.isReadOnly() || !this.repository) return;
        void this.save();
        return;
      case 'resetRequested':
        if (this.isReadOnly()) return;
        this.abortAllRequests();
        this.setState(state => ({
          ...state,
          draft: cloneDraft(intent.draft),
          validationErrors: validateFieldDefinition(intent.draft),
          dirty: false,
          saving: false,
          error: undefined,
          savedFieldId: undefined
        }));
        return;
      default:
        assertNever(intent);
    }
  }

  private openSearch(role: TerminologyBindingRole, sourceId: string): void {
    this.cancelSearch(role);
    const source = this.getSnapshot().sources.find(candidate => candidate.id === sourceId);
    if (!source || !source.available) {
      this.setSearchState(role, state => ({ ...state, sourceId, loading: false, error: 'Terminology source is unavailable.' }));
      return;
    }
    this.setState(state => ({
      ...state,
      terminologySearches: {
        ...state.terminologySearches,
        [role]: {
          ...(state.terminologySearches[role] ?? defaultSearch(role, sourceId)),
          sourceId,
          page: 1,
          options: [],
          total: 0,
          loading: false,
          error: undefined
        }
      }
    }));
  }

  private setSearchPage(role: TerminologyBindingRole, page: number): void {
    this.setSearchState(role, state => ({ ...state, page: Math.max(1, page) }));
  }

  private setSearchState(role: TerminologyBindingRole, update: (state: TerminologySearchState) => TerminologySearchState): void {
    this.setState(state => {
      const previous = state.terminologySearches[role] ?? defaultSearch(role, '');
      return { ...state, terminologySearches: { ...state.terminologySearches, [role]: update(previous) } };
    });
  }

  private async search(role: TerminologyBindingRole): Promise<void> {
    const searchState = this.getSnapshot().terminologySearches[role];
    if (!searchState?.sourceId) return;
    const source = this.getSnapshot().sources.find(candidate => candidate.id === searchState.sourceId);
    if (!source?.available) return;
    const previous = this.requests.get(role);
    previous?.controller.abort();
    const controller = new AbortController();
    const sequence = (previous?.sequence ?? 0) + 1;
    this.requests.set(role, { controller, sequence });
    this.setSearchState(role, state => ({ ...state, loading: true, error: undefined }));
    try {
      const result = await this.terminology.search({
        sourceId: searchState.sourceId,
        query: searchState.query,
        page: searchState.page,
        pageSize: searchState.pageSize,
        signal: controller.signal
      });
      const current = this.requests.get(role);
      const latest = this.getSnapshot().terminologySearches[role];
      if (controller.signal.aborted || current?.sequence !== sequence || latest?.sourceId !== searchState.sourceId || latest.query !== searchState.query || latest.page !== searchState.page) return;
      this.setSearchState(role, state => ({ ...state, options: [...result.items], total: result.total, loading: false }));
    } catch (error: unknown) {
      const current = this.requests.get(role);
      if (controller.signal.aborted || current?.sequence !== sequence) return;
      this.setSearchState(role, state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Terminology search failed.' }));
    }
  }

  private async save(): Promise<void> {
    const validationErrors = validateFieldDefinition(this.getSnapshot().draft);
    if (Object.keys(validationErrors).length > 0) {
      this.setState(state => ({ ...state, validationErrors, error: 'Correct the highlighted field definition errors before saving.' }));
      return;
    }
    this.saveRequest?.abort();
    const controller = new AbortController();
    this.saveRequest = controller;
    const draftReference = this.getSnapshot().draft;
    const draft = cloneDraft(draftReference);
    this.setState(state => ({ ...state, saving: true, error: undefined }));
    try {
      const result = await this.repository!.save(draft, { signal: controller.signal });
      if (controller.signal.aborted) return;
      this.setState(state => {
        const changedWhileSaving = state.draft !== draftReference;
        return {
          ...state,
          draft: cloneDraft({ ...state.draft, revision: result.revision }),
          saving: false,
          dirty: changedWhileSaving,
          savedFieldId: result.fieldId,
          error: undefined
        };
      });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      this.setState(state => ({ ...state, saving: false, error: error instanceof Error ? error.message : 'Field definition could not be saved.' }));
    }
  }

  private abortAllRequests(): void {
    for (const request of this.requests.values()) request.controller.abort();
    this.requests.clear();
    this.saveRequest?.abort();
    this.saveRequest = undefined;
  }

  private cancelSearch(role: TerminologyBindingRole): void {
    this.requests.get(role)?.controller.abort();
    this.requests.delete(role);
  }

  private isReadOnly(): boolean {
    return this.getSnapshot().readOnly === true || this.getSnapshot().draft.readOnly === true;
  }

  protected override onDestroy(): void {
    this.abortAllRequests();
  }
}

function defaultSearch(role: TerminologyBindingRole, sourceId: string): TerminologySearchState {
  return { role, sourceId, query: '', options: [], page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, loading: false };
}

function cloneConcept(concept: TerminologyConcept): TerminologyConcept {
  return {
    ...concept,
    designations: concept.designations ? [...concept.designations] : undefined,
    providerMetadata: concept.providerMetadata ? { ...concept.providerMetadata } : undefined
  };
}

function validateTerminologySelection(
  sources: readonly TerminologySource[],
  role: TerminologyBindingRole,
  concept: TerminologyConcept,
  relationship: import('./terminology.models.js').TerminologyMappingRelationship | undefined
): string | undefined {
  const source = sources.find(candidate => candidate.id === concept.sourceId);
  if (!source?.available) return 'The selected terminology source is not configured or available.';
  if (!concept.system.trim() || !concept.code.trim() || !concept.display.trim()) return 'The selected terminology concept is incomplete.';
  if (concept.active === false) return 'Inactive terminology concepts cannot be newly associated with a field.';
  if (role === 'unit' && source.kind !== 'ucum') return 'Unit bindings must use a configured UCUM source.';
  if (role === 'question-meaning' && !['loinc', 'snomed-ct', 'custom'].includes(source.kind)) return 'Clinical meaning bindings require LOINC, SNOMED CT, or a configured custom source.';
  if (role === 'answer-value-set' && !concept.canonicalUri?.trim()) return 'Answer value-set bindings require a canonical ValueSet URI.';
  if (role === 'classification-mapping') {
    if (!['icd-10', 'icd-11', 'custom'].includes(source.kind)) return 'Classification mappings require ICD-10, ICD-11, or a configured custom classification source.';
    if (!relationship) return 'Classification mappings require a mapping relationship.';
  }
  return undefined;
}

function cloneDraft(draft: EmrGeneratedFieldDefinition): EmrGeneratedFieldDefinition {
  return {
    ...draft,
    options: draft.options ? draft.options.map(option => ({ ...option })) : undefined,
    validationRules: draft.validationRules.map(rule => ({ ...rule, ...(rule.kind === 'allowed-values' ? { values: [...rule.values] } : {}) })),
    terminologyBindings: draft.terminologyBindings.map(binding => ({ ...binding, concept: binding.concept ? cloneConcept(binding.concept) : undefined }))
  };
}

export function validateFieldDefinition(draft: EmrGeneratedFieldDefinition): Readonly<Record<string, string>> {
  const errors: Record<string, string> = {};
  const value = draft.defaultValue;
  if (!draft.id.trim()) errors['field-id'] = 'A stable field id is required.';
  if (!draft.label.trim()) errors['field-label'] = 'A field label is required.';
  if (draft.type === 'quantity' && !draft.unitCode?.trim()) errors['unitCode'] = 'A unit code is required for quantity fields.';
  if (draft.type === 'quantity' && !draft.unitSystem?.trim()) errors['unitSystem'] = 'A unit system is required for quantity fields.';
  if (draft.type === 'select' || draft.type === 'multiselect') {
    const options = draft.options ?? [];
    if (options.some(option => !option.value.trim() || !option.label.trim())) errors['options'] = 'Choice values and labels must not be empty.';
    if (new Set(options.map(option => option.value)).size !== options.length) errors['options'] = 'Choice values must be unique.';
  }
  const ruleIds = new Set<string>();
  for (const rule of draft.validationRules) {
    if (!rule.id?.trim()) errors['validationRules'] = 'Every validation rule requires an ID.';
    else if (ruleIds.has(rule.id)) errors['validationRules'] = 'Validation rule IDs must be unique.';
    ruleIds.add(rule.id);
    const message = validationMessage(rule, draft, value);
    if (message) errors[rule.id] = message;
  }
  const minimum = draft.validationRules.find((rule): rule is Extract<FieldValidationRule, { kind: 'minimum' }> => rule.kind === 'minimum');
  const maximum = draft.validationRules.find((rule): rule is Extract<FieldValidationRule, { kind: 'maximum' }> => rule.kind === 'maximum');
  if (minimum && maximum && minimum.value > maximum.value) errors[maximum.id] = 'Maximum must be greater than or equal to minimum.';
  const minLength = draft.validationRules.find((rule): rule is Extract<FieldValidationRule, { kind: 'min-length' }> => rule.kind === 'min-length');
  const maxLength = draft.validationRules.find((rule): rule is Extract<FieldValidationRule, { kind: 'max-length' }> => rule.kind === 'max-length');
  if (minLength && maxLength && minLength.value > maxLength.value) errors[maxLength.id] = 'Maximum length must be greater than or equal to minimum length.';
  const earliest = draft.validationRules.find((rule): rule is Extract<FieldValidationRule, { kind: 'earliest-date' }> => rule.kind === 'earliest-date');
  const latest = draft.validationRules.find((rule): rule is Extract<FieldValidationRule, { kind: 'latest-date' }> => rule.kind === 'latest-date');
  if (earliest && latest && earliest.value > latest.value) errors[latest.id] = 'Latest date must be on or after earliest date.';
  const seenBindings = new Set<string>();
  const bindingIds = new Set<string>();
  const roles: readonly TerminologyBindingRole[] = ['question-meaning', 'answer-value-set', 'unit', 'classification-mapping'];
  for (const binding of draft.terminologyBindings) {
    if (!binding.id?.trim()) errors['terminologyBindings'] = 'Every terminology binding requires an ID.';
    else if (bindingIds.has(binding.id)) errors['terminologyBindings'] = 'Terminology binding IDs must be unique.';
    bindingIds.add(binding.id);
    if (!roles.includes(binding.role)) errors[`binding-${binding.id}`] = 'Terminology binding role is invalid.';
    if (binding.concept && (!binding.concept.system?.trim() || !binding.concept.code?.trim() || !binding.concept.display?.trim() || !binding.concept.sourceId?.trim())) errors[`binding-${binding.id}`] = 'Terminology concept coding is incomplete.';
    if (binding.role === 'answer-value-set' && !binding.valueSetCanonical?.trim()) errors[`binding-${binding.id}`] = 'Answer value-set binding requires a canonical URI.';
    if (binding.role === 'unit' && binding.concept?.system !== 'http://unitsofmeasure.org') errors[`binding-${binding.id}`] = 'Unit binding must use the UCUM system.';
    if (binding.role === 'classification-mapping' && !binding.mappingRelationship) errors[`binding-${binding.id}`] = 'Classification mapping requires a relationship.';
    if (binding.role !== 'answer-value-set' && !binding.concept) errors[`binding-${binding.id}`] = 'Terminology binding requires a coded concept.';
    const key = [binding.role, binding.concept?.system ?? '', binding.concept?.version ?? '', binding.concept?.code ?? '', binding.valueSetCanonical ?? ''].join('|');
    if (seenBindings.has(key)) errors[`binding-${binding.id}`] = 'This terminology binding is already associated with the field.';
    seenBindings.add(key);
  }
  return errors;
}

function validationMessage(rule: FieldValidationRule, draft: EmrGeneratedFieldDefinition, value: unknown): string | undefined {
  const type = draft.type;
  const textType = type === 'text' || type === 'multiline';
  const numericType = type === 'integer' || type === 'decimal' || type === 'quantity';
  switch (rule.kind) {
    case 'min-length':
    case 'max-length':
      if (!textType && type !== 'multiselect') return `Validation rule ${rule.kind} is not compatible with ${type}.`;
      if (!Number.isInteger(rule.value) || rule.value < 0) return 'Length must be a non-negative integer.';
      if (isEmpty(value)) return undefined;
      if (lengthOf(value) !== undefined && (rule.kind === 'min-length' ? lengthOf(value)! < rule.value : lengthOf(value)! > rule.value)) {
        return rule.message ?? `${rule.kind === 'min-length' ? 'Minimum' : 'Maximum'} length is ${rule.value}.`;
      }
      return undefined;
    case 'minimum':
    case 'maximum': {
      if (!numericType) return `Validation rule ${rule.kind} is not compatible with ${type}.`;
      if (!Number.isFinite(rule.value)) return 'Numeric validation bounds must be finite numbers.';
      const number = numericValue(value);
      if (number === undefined) return undefined;
      if (rule.kind === 'minimum' && number < rule.value) return rule.message ?? `Value must be at least ${rule.value}.`;
      if (rule.kind === 'maximum' && number > rule.value) return rule.message ?? `Value must be at most ${rule.value}.`;
      return undefined;
    }
    case 'precision':
      if (type !== 'decimal' && type !== 'quantity') return `Validation rule precision is not compatible with ${type}.`;
      if (!Number.isInteger(rule.value) || rule.value < 0) return 'Precision must be a non-negative integer.';
      const numeric = numericValue(value);
      if (numeric !== undefined && decimalPlaces(numeric) > rule.value) return rule.message ?? `Value must have at most ${rule.value} decimal places.`;
      return undefined;
    case 'pattern':
      if (!textType) return `Validation rule pattern is not compatible with ${type}.`;
      if (!rule.value) return 'Pattern must not be empty.';
      try { new RegExp(rule.value); } catch { return 'Pattern must be a valid regular expression.'; }
      if (!isEmpty(value)) {
        if (!new RegExp(rule.value).test(String(value))) return rule.message;
      }
      return undefined;
    case 'earliest-date':
    case 'latest-date':
      if (type !== 'date') return `Validation rule ${rule.kind} is not compatible with ${type}.`;
      if (!isValidIsoDate(rule.value)) return 'Date validation boundary must use a valid YYYY-MM-DD date.';
      if (!isEmpty(value)) {
        const actual = String(value);
        if (rule.kind === 'earliest-date' && actual < rule.value) return rule.message ?? `Date must be on or after ${rule.value}.`;
        if (rule.kind === 'latest-date' && actual > rule.value) return rule.message ?? `Date must be on or before ${rule.value}.`;
      }
      return undefined;
    case 'allowed-values':
      if (type !== 'select' && type !== 'multiselect') return `Validation rule allowed-values is not compatible with ${type}.`;
      if (!rule.values.length || rule.values.some(candidate => !candidate.trim())) return 'Allowed values must contain at least one non-empty value.';
      if (new Set(rule.values).size !== rule.values.length) return 'Allowed values must not contain duplicates.';
      if (isEmpty(value)) return undefined;
      const values = Array.isArray(value) ? value : [String(value)];
      if (values.some(candidate => !rule.values.includes(String(candidate)))) return rule.message ?? 'Select a permitted value.';
      return undefined;
    case 'custom':
      return rule.customValidatorId.trim() ? undefined : 'Custom validator ID is required.';
    default:
      return assertNever(rule);
  }
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function lengthOf(value: unknown): number | undefined {
  return typeof value === 'string' || Array.isArray(value) ? value.length : undefined;
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object' && 'value' in value && typeof value.value === 'number' && Number.isFinite(value.value)) return value.value;
  return undefined;
}

function decimalPlaces(value: number): number {
  const text = String(value);
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported field generator value: ${JSON.stringify(value)}`);
}
