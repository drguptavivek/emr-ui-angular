import type {
  ClinicalFieldDefinition,
  ClinicalFormBlock,
  ClinicalFormSchema,
  ClinicalFormViewModel,
  EhrTemplateDefinition,
  EmrGeneratedFieldDefinition,
  FieldValidationRule,
  TemplateArtifactIssue,
  TerminologyBinding,
  TerminologyBindingRole,
} from '@drguptavivek/emr-controller';

export const TERMINOLOGY_ROLES: readonly TerminologyBindingRole[] = [
  'question-meaning',
  'answer-value-set',
  'unit',
  'classification-mapping',
];

export const VALIDATION_RULE_KINDS: readonly FieldValidationRule['kind'][] = [
  'min-length',
  'max-length',
  'minimum',
  'maximum',
  'precision',
  'pattern',
  'earliest-date',
  'latest-date',
  'allowed-values',
  'custom',
];

/** Checks whether the current rule draft in EmrValidationRuleEditor is complete enough to add. */
export const canAddValidationRule = (
  kind: FieldValidationRule['kind'],
  value: string,
  message: string,
): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (kind === 'custom') return message.trim().length > 0;
  if (
    kind === 'min-length' ||
    kind === 'max-length' ||
    kind === 'minimum' ||
    kind === 'maximum' ||
    kind === 'precision'
  ) {
    return Number.isFinite(Number(trimmed));
  }
  if (kind === 'allowed-values') {
    return trimmed.split(',').some(item => item.trim().length > 0);
  }
  return true;
};

/** Constructs a typed FieldValidationRule from the editor's draft inputs. */
export const buildValidationRule = (
  kind: FieldValidationRule['kind'],
  value: string,
  message: string,
  defaultPatternMessage = 'Value does not match the required pattern.',
): FieldValidationRule => {
  const trimmedValue = value.trim();
  const trimmedMessage = message.trim();
  const base = { id: '', ...(trimmedMessage ? { message: trimmedMessage } : {}) };
  if (kind === 'pattern') {
    return {
      id: '',
      kind: 'pattern',
      value: trimmedValue,
      message: trimmedMessage || defaultPatternMessage,
    };
  }
  if (kind === 'custom') {
    return {
      id: '',
      kind: 'custom',
      customValidatorId: trimmedValue,
      message: trimmedMessage,
    };
  }
  if (kind === 'allowed-values') {
    return {
      ...base,
      kind: 'allowed-values',
      values: trimmedValue.split(',').map(item => item.trim()).filter(Boolean),
    };
  }
  if (kind === 'earliest-date' || kind === 'latest-date') {
    return {
      ...base,
      kind,
      value: trimmedValue,
    };
  }
  return {
    ...base,
    kind,
    value: Number(trimmedValue),
  };
};

/** Formats a concise value summary for an existing validation rule row. */
export const summarizeValidationRule = (rule: FieldValidationRule): string =>
  'values' in rule
    ? rule.values.join(', ')
    : 'customValidatorId' in rule
      ? rule.customValidatorId
      : String(rule.value);

/** Filters a field's terminology bindings down to a single role. */
export const filterBindingsByRole = (
  bindings: readonly TerminologyBinding[],
  role: TerminologyBindingRole,
): TerminologyBinding[] => bindings.filter(binding => binding.role === role);

/** Joins terminology codes (or roles when unbound to a single concept) for field library cards. */
export const summarizeFieldTerminology = (field: EmrGeneratedFieldDefinition): string =>
  field.terminologyBindings.map(binding => binding.concept?.code ?? binding.role).join(' · ');

/** Projects an authored field draft into a ClinicalFieldDefinition for live preview in EmrTypedField. */
export const toPreviewFieldDefinition = (
  draft: EmrGeneratedFieldDefinition,
  untitledLabel = 'Untitled field',
): ClinicalFieldDefinition => ({
  id: draft.id || 'generated-field',
  label: draft.label || untitledLabel,
  type: draft.type,
  required: draft.required,
  placeholder: draft.placeholder,
  hint: draft.instructions ?? draft.description,
  unit: draft.unit,
  precision: draft.precision,
  rows: draft.rows,
  options: draft.options,
  span: draft.span,
});

/** True when import issues exist and none have `error` severity, allowing explicit acceptance. */
export const canAcceptTemplateImport = (
  importIssues?: readonly TemplateArtifactIssue[],
): boolean => !!importIssues?.length && !importIssues.some(issue => issue.severity === 'error');

/** Deterministic, value-empty ClinicalFormViewModel projection of an EHR template definition. */
export const deriveTemplatePreview = (template: EhrTemplateDefinition): ClinicalFormViewModel => {
  const toClinicalField = (field: EmrGeneratedFieldDefinition, id: string): ClinicalFieldDefinition => ({
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
  });

  const sections = template.sections.map(section => {
    const blocks: ClinicalFormBlock[] = [];
    for (const placement of section.fields) {
      if (placement.field.repeats) {
        blocks.push({
          kind: 'repeatable',
          id: placement.id,
          label: placement.field.label,
          description: placement.field.description,
          fields: [toClinicalField(placement.field, `${placement.id}__value`)],
        });
      } else {
        blocks.push(toClinicalField(placement.field, placement.id));
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
};
