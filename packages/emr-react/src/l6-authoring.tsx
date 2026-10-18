'use client';

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  ClinicalFieldType,
  ClinicalOption,
  EhrTemplateIntent,
  EhrTemplateSection,
  EhrTemplateStatus,
  EhrTemplateViewModel,
  EmrGeneratedFieldDefinition,
  FieldGeneratorIntent,
  FieldGeneratorViewModel,
  FieldLibraryPickerIntent,
  FieldLibraryPickerViewModel,
  FieldValidationRule,
  TemplateArtifactFormat,
  TemplateComposerIntent,
  TemplateComposerViewModel,
  TemplatePreviewIntent,
  TemplatePreviewViewModel,
  TerminologyBinding,
  TerminologyBindingRole,
  TerminologyBindingStrength,
  TerminologyMappingRelationship,
  TerminologySearchIntent,
  TerminologySearchState,
  TerminologySearchViewModel,
  TerminologySource,
  ValidationRuleEditorIntent,
  ValidationRuleEditorViewModel,
} from '@drguptavivek/emr-controller';
import { EmrClinicalForm } from './clinical-form';
import { NumberInput, ThemedInput } from './inputs-core';
import { EmrColumns } from './l1-display';
import {
  TERMINOLOGY_ROLES,
  VALIDATION_RULE_KINDS,
  buildValidationRule,
  canAcceptTemplateImport,
  canAddValidationRule,
  filterBindingsByRole,
  summarizeFieldTerminology,
  summarizeValidationRule,
  toPreviewFieldDefinition,
} from './l6-authoring.logic';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrTypedField } from './typed-field';

type PressState = PressableStateCallbackType & { focused?: boolean };

export type {
  FieldLibraryPickerIntent,
  FieldLibraryPickerViewModel,
  TemplateComposerIntent,
  TemplateComposerViewModel,
  TemplatePreviewIntent,
  TemplatePreviewViewModel,
  TerminologySearchIntent,
  TerminologySearchViewModel,
  ValidationRuleEditorIntent,
  ValidationRuleEditorViewModel,
};

// ---------------------------------------------------------------------------
// Defaults (overridable via `labels` prop)
// ---------------------------------------------------------------------------

export const TERMINOLOGY_SEARCH_DEFAULTS = {
  eyebrow: 'Terminology binding',
  searching: 'Searching…',
  sourceLabel: 'Source',
  chooseTerminology: 'Choose terminology',
  searchLabel: 'Search',
  searchButton: 'Search',
  searchUcumPlaceholder: 'Search UCUM units',
  searchRolePlaceholder: (roleLabel: string) => `Search ${roleLabel.toLowerCase()}`,
  retry: 'Retry',
  noConceptsFound: 'No concepts found for this search.',
  resultsGroup: (roleLabel: string) => `${roleLabel} search results`,
  inactive: 'Inactive',
  paginationSummary: (page: number, total: number) => `Page ${page} · ${total} results`,
  previous: 'Previous',
  next: 'Next',
  selectedConcept: 'Selected concept',
  bindingStrength: 'Binding strength',
  relationship: 'Relationship',
  remove: 'Remove',
  roleLabels: {
    'question-meaning': 'Clinical meaning',
    'answer-value-set': 'Answer value set',
    unit: 'Unit / UCUM',
    'classification-mapping': 'Classification mapping',
  } as Readonly<Record<TerminologyBindingRole, string>>,
  strengthOptions: [
    { value: 'required', label: 'Required' },
    { value: 'extensible', label: 'Extensible' },
    { value: 'preferred', label: 'Preferred' },
    { value: 'example', label: 'Example' },
  ] as readonly ClinicalOption[],
  relationshipOptions: [
    { value: 'equivalent', label: 'Equivalent' },
    { value: 'wider', label: 'Wider' },
    { value: 'narrower', label: 'Narrower' },
    { value: 'related-to', label: 'Related' },
  ] as readonly ClinicalOption[],
} as const;

export const VALIDATION_EDITOR_DEFAULTS = {
  eyebrow: 'Validation',
  heading: 'Rules for this field',
  ruleCount: (count: number) => `${count} ${count === 1 ? 'rule' : 'rules'}`,
  ruleTypeLabel: 'Rule type',
  validatorIdLabel: 'Validator ID',
  validatorIdPlaceholder: 'e.g. systolic-range',
  regexLabel: 'Regular expression',
  regexPlaceholder: 'e.g. ^[A-Z0-9-]+$',
  dateLabel: 'Date',
  datePlaceholder: 'YYYY-MM-DD',
  allowedValuesLabel: 'Values',
  allowedValuesPlaceholder: 'Separate values with commas',
  valueLabel: 'Value',
  messageLabel: 'Message (optional)',
  messagePlaceholder: 'Explain how to resolve the issue',
  customNote: 'The controller resolves this validator ID. The UI does not execute clinical validation.',
  addRule: 'Add validation rule',
  currentRulesGroup: 'Current validation rules',
  remove: 'Remove',
  defaultPatternMessage: 'Value does not match the required pattern.',
  ruleLabels: {
    'min-length': 'Minimum length',
    'max-length': 'Maximum length',
    minimum: 'Minimum value',
    maximum: 'Maximum value',
    precision: 'Decimal precision',
    pattern: 'Pattern',
    'earliest-date': 'Earliest date',
    'latest-date': 'Latest date',
    'allowed-values': 'Allowed values',
    custom: 'Custom validator',
  } as Readonly<Record<FieldValidationRule['kind'], string>>,
} as const;

export const FIELD_GENERATOR_DEFAULTS = {
  eyebrow: 'Reusable field authoring',
  heading: 'Create an EMR field',
  subtitle:
    'Define the presentation contract once, then reuse it in clinical forms and templates. APIs, terminology interpretation, FHIR mapping and persistence remain controller responsibilities.',
  unsavedChanges: 'Unsaved changes',
  ready: 'Ready',
  saving: 'Saving…',
  saveField: 'Save field',
  identityEyebrow: 'Identity and display',
  identityHeading: 'Field definition',
  fieldIdLabel: 'Stable field ID',
  labelLabel: 'Label',
  descriptionLabel: 'Description',
  instructionsLabel: 'Entry instructions',
  placeholderLabel: 'Placeholder',
  behaviourEyebrow: 'Behaviour',
  behaviourHeading: 'Type, cardinality and layout',
  valueTypeLabel: 'Value type',
  gridSpanLabel: 'Grid span',
  textRowsLabel: 'Text rows',
  precisionLabel: 'Decimal precision',
  requiredFlag: 'Required',
  repeatableFlag: 'Repeatable',
  readOnlyFlag: 'Display only',
  measurementEyebrow: 'Measurement',
  measurementHeading: 'Unit and precision',
  displayUnitLabel: 'Display unit',
  displayUnitPlaceholder: 'e.g. kg',
  unitSystemLabel: 'Unit system',
  unitSystemPlaceholder: 'e.g. UCUM',
  unitCodeLabel: 'Unit code',
  unitCodePlaceholder: 'e.g. kg',
  optionsEyebrow: 'Options',
  optionsHeading: 'Choice values',
  optionCount: (count: number) => `${count} options`,
  optionValueLabel: 'Option value',
  optionLabelLabel: 'Option label',
  addOption: 'Add option',
  removeOption: (label: string) => `Remove option ${label}`,
  remove: 'Remove',
  terminologyEyebrow: 'Terminology',
  terminologyHeading: 'Bind external standards',
  terminologyDescription:
    'Search configured services for LOINC, SNOMED CT, ICD-10, ICD-11 or UCUM concepts. The selected code is stored as a binding on this field.',
  previewEyebrow: 'Live preview',
  previewHeading: 'How it appears in a form',
  untitledField: 'Untitled field',
  fhirReadyTitle: 'FHIR-ready definition',
  fhirReadyNote: 'FHIR Questionnaire / Bundle mapping is resolved by the template controller.',
  statusEyebrow: 'Definition status',
  noErrors: 'No controller-reported errors.',
  savedField: (id: string) => `Saved field ${id}.`,
  typeOptions: [
    { value: 'text', label: 'Text' },
    { value: 'multiline', label: 'Long text' },
    { value: 'integer', label: 'Integer' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Single choice' },
    { value: 'multiselect', label: 'Multiple choice' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'custom', label: 'Custom renderer' },
  ] as readonly ClinicalOption[],
  spanOptions: [
    { value: '3', label: '3 / 12' },
    { value: '4', label: '4 / 12' },
    { value: '6', label: '6 / 12' },
    { value: '8', label: '8 / 12' },
    { value: '9', label: '9 / 12' },
    { value: '12', label: '12 / 12' },
  ] as readonly ClinicalOption[],
} as const;

export const FIELD_LIBRARY_DEFAULTS = {
  eyebrow: 'Field library',
  heading: 'Add reusable fields',
  description: 'Search the controller-supplied field catalogue, then add a field to the selected section.',
  availableCount: (count: number) => `${count} available`,
  searchLabel: 'Search fields',
  searchPlaceholder: 'Search by label, type or terminology',
  selectSectionNote: 'Select a template section before adding a field.',
  availableFieldsList: 'Available reusable fields',
  requiredTag: 'Required',
  repeatableTag: 'Repeatable',
  add: 'Add',
  noMatchingFields: 'No reusable fields match this search.',
} as const;

export const TEMPLATE_PREVIEW_DEFAULTS = {
  eyebrow: 'Reusable form',
  untitledTemplate: 'Untitled template',
  defaultDescription: 'A live, value-empty preview of the current template.',
  interopEyebrow: 'Interoperability',
  interopHeading: 'Import or export template artifacts',
  interopDescription: 'Serialization and FHIR mapping are delegated to the configured artifact controller.',
  working: 'Working…',
  formatLabel: 'Format',
  exportButton: 'Export',
  serializedLabel: 'Serialized preview or import payload',
  serializedPlaceholder: 'Paste a JSON or FHIR artifact to import',
  importButton: 'Import',
  acceptImportButton: 'Accept import',
  artifactMeta: (chars: number, issues: number) => `${chars} characters · ${issues} issue(s)`,
  reviewIssuesHeading: 'Review import issues',
  formatLabels: {
    'internal-json': 'Internal JSON',
    'fhir-r4-questionnaire': 'FHIR R4 Questionnaire',
    'fhir-r4-bundle': 'FHIR R4 Bundle',
    'fhir-r4b-questionnaire': 'FHIR R4B Questionnaire',
    'fhir-r5-questionnaire': 'FHIR R5 Questionnaire',
  } as Readonly<Record<TemplateArtifactFormat, string>>,
} as const;

export const TEMPLATE_COMPOSER_DEFAULTS = {
  eyebrow: 'Template authoring',
  untitledTemplate: 'Untitled EHR template',
  subtitle:
    'Compose reusable clinical forms from controller-defined fields. Terminology, validation, persistence and artifact mapping remain outside the UI.',
  unsavedChanges: 'Unsaved changes',
  saving: 'Saving…',
  saveTemplate: 'Save template',
  metadataEyebrow: 'Template metadata',
  metadataHeading: 'Identity and lifecycle',
  schemaRevision: (schemaVersion: string, revision: number) => `Schema ${schemaVersion} · Revision ${revision}`,
  titleLabel: 'Title',
  descriptionLabel: 'Description',
  localeLabel: 'Locale',
  statusLabel: 'Status',
  structureEyebrow: 'Structure',
  sectionsHeading: 'Sections',
  newSectionPlaceholder: 'New section label',
  addSection: 'Add',
  sectionsNavLabel: 'Template sections',
  fieldCount: (count: number) => `${count} ${count === 1 ? 'field' : 'fields'}`,
  moveUp: 'Up',
  moveDown: 'Down',
  moveItemUp: (label: string) => `Move ${label} up`,
  moveItemDown: (label: string) => `Move ${label} down`,
  noSections: 'No sections yet. Add one to begin composing.',
  selectedSectionEyebrow: 'Selected section',
  removeSection: 'Remove section',
  sectionLabelLabel: 'Label',
  sectionDescriptionLabel: 'Description',
  placementsListLabel: 'Fields in selected section',
  terminologyBound: 'Terminology bound',
  removeField: (label: string) => `Remove ${label}`,
  remove: 'Remove',
  noFieldsInSection: 'No fields in this section. Choose a reusable field from the library.',
  selectSectionPrompt: 'Select a section to edit it and add reusable fields.',
  statusOptions: [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'retired', label: 'Retired' },
  ] as readonly ClinicalOption[],
} as const;

// ---------------------------------------------------------------------------
// 1. EmrTerminologySearch
// ---------------------------------------------------------------------------

/** L6 terminology search & binding card for a single binding role. */
export function EmrTerminologySearch({
  model,
  headingId = 'emr-terminology-heading',
  labels,
  onIntent,
}: {
  model: TerminologySearchViewModel;
  headingId?: string;
  labels?: Partial<typeof TERMINOLOGY_SEARCH_DEFAULTS>;
  onIntent: (intent: TerminologySearchIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...TERMINOLOGY_SEARCH_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const search = model.search;
  const roleLabel = l.roleLabels[model.role] ?? model.role;
  const placeholder = model.role === 'unit' ? l.searchUcumPlaceholder : l.searchRolePlaceholder(roleLabel);

  const sourceOptions: ClinicalOption[] = model.sources.map(s => ({
    value: s.id,
    label: s.versionLabel ? `${s.label} · ${s.versionLabel}` : s.label,
    disabled: !s.available,
  }));

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>{l.eyebrow}</Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {roleLabel}
          </Text>
        </View>
        {search?.loading ? (
          <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
            {l.searching}
          </Text>
        ) : null}
      </View>

      <View style={styles.fieldStack}>
        <View style={styles.fieldRow}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
            {l.sourceLabel}
          </Text>
          <EmrSelect
            label={`${roleLabel} ${l.sourceLabel}`}
            options={sourceOptions}
            value={search?.sourceId ?? null}
            readOnly={readOnly}
            onChange={sourceId => {
              if (sourceId) onIntent({ type: 'terminologySearchOpened', role: model.role, sourceId });
            }}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
            {l.searchLabel}
          </Text>
          <View style={styles.inlineRow}>
            <View style={styles.flex}>
              <ThemedInput
                id={`${headingId}-query`}
                aria-label={`${roleLabel} ${l.searchLabel}`}
                value={search?.query ?? ''}
                placeholder={placeholder}
                readOnly={readOnly}
                editable={!readOnly && !!search?.sourceId}
                onChangeText={query => onIntent({ type: 'terminologyQueryChanged', role: model.role, query })}
                onSubmitEditing={() => onIntent({ type: 'terminologySearchRequested', role: model.role })}
              />
            </View>
            <EmrButton
              variant="outline"
              label={l.searchButton}
              disabled={readOnly || !search?.sourceId || !!search?.loading}
              onPress={() => onIntent({ type: 'terminologySearchRequested', role: model.role })}
            />
          </View>
        </View>
      </View>

      {search?.error ? (
        <View role="alert" style={[styles.messageBox, styles.errorRow, { backgroundColor: t.dangerSoft }]}>
          <Text style={[styles.flex, { color: t.danger, fontSize: t.textSm, fontFamily: font }]}>{search.error}</Text>
          <EmrButton
            small
            variant="ghost"
            label={l.retry}
            disabled={readOnly}
            onPress={() => onIntent({ type: 'terminologyRetryRequested', role: model.role })}
          />
        </View>
      ) : search && !search.loading && search.sourceId && search.query && search.options.length === 0 ? (
        <View role="status" style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.noConceptsFound}</Text>
        </View>
      ) : null}

      {search && search.options.length > 0 ? (
        <View role="group" aria-label={l.resultsGroup(roleLabel)} style={styles.resultsList}>
          {search.options.map(concept => {
            const inactive = concept.active === false;
            return (
              <Pressable
                key={`${concept.sourceId}:${concept.code}`}
                role="button"
                aria-disabled={readOnly || inactive}
                disabled={readOnly || inactive}
                onPress={() =>
                  onIntent({
                    type: 'terminologyConceptSelected',
                    role: model.role,
                    concept,
                    strength: 'preferred',
                    mappingRelationship: model.role === 'classification-mapping' ? 'related-to' : undefined,
                  })
                }
                style={({ pressed, focused }: PressState) => [
                  styles.resultItem,
                  focusRing(t, focused),
                  {
                    minHeight: t.controlHeight,
                    borderColor: t.border,
                    backgroundColor: pressed ? t.surfaceRaised : t.surface,
                    opacity: readOnly || inactive ? 0.6 : 1,
                  },
                ]}
              >
                <View style={styles.flex}>
                  <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                    {concept.display}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{concept.code}</Text>
                </View>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                  {concept.system}
                  {concept.version ? ` · ${concept.version}` : ''}
                  {inactive ? ` · ${l.inactive}` : ''}
                </Text>
              </Pressable>
            );
          })}
          {search.total > search.pageSize ? (
            <View style={styles.paginationRow}>
              <Text style={[styles.flex, { color: t.textMuted, fontSize: t.textSm, fontFamily: font }]}>
                {l.paginationSummary(search.page, search.total)}
              </Text>
              <EmrButton
                small
                variant="ghost"
                label={l.previous}
                disabled={readOnly || search.page <= 1}
                onPress={() => onIntent({ type: 'terminologyPageChanged', role: model.role, page: search.page - 1 })}
              />
              <EmrButton
                small
                variant="ghost"
                label={l.next}
                disabled={readOnly || search.page * search.pageSize >= search.total}
                onPress={() => onIntent({ type: 'terminologyPageChanged', role: model.role, page: search.page + 1 })}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {model.bindings.map(binding => (
        <View
          key={binding.id}
          style={[styles.bindingCard, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
        >
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.selectedConcept}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {binding.concept?.display ?? binding.valueSetCanonical ?? binding.id}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
              {[binding.concept?.code, binding.concept?.system, binding.valueSetCanonical].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <View style={styles.bindingControls}>
            <View style={styles.selectWrap}>
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{l.bindingStrength}</Text>
              <EmrSelect
                label={l.bindingStrength}
                options={l.strengthOptions}
                value={binding.strength ?? 'preferred'}
                readOnly={readOnly}
                onChange={strength => {
                  if (strength && binding.concept) {
                    onIntent({
                      type: 'terminologyConceptSelected',
                      role: model.role,
                      concept: binding.concept,
                      strength: strength as TerminologyBindingStrength,
                      mappingRelationship: binding.mappingRelationship,
                    });
                  }
                }}
              />
            </View>
            {model.role === 'classification-mapping' ? (
              <View style={styles.selectWrap}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{l.relationship}</Text>
                <EmrSelect
                  label={l.relationship}
                  options={l.relationshipOptions}
                  value={binding.mappingRelationship ?? 'related-to'}
                  readOnly={readOnly}
                  onChange={rel => {
                    if (rel && binding.concept) {
                      onIntent({
                        type: 'terminologyConceptSelected',
                        role: model.role,
                        concept: binding.concept,
                        strength: binding.strength,
                        mappingRelationship: rel as TerminologyMappingRelationship,
                      });
                    }
                  }}
                />
              </View>
            ) : null}
            <EmrButton
              small
              variant="ghost"
              label={l.remove}
              disabled={readOnly}
              onPress={() => onIntent({ type: 'terminologyBindingRemoved', bindingId: binding.id })}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrValidationRuleEditor
// ---------------------------------------------------------------------------

/** L6 validation rule authoring card. Emits rule additions and removals; never executes clinical validation. */
export function EmrValidationRuleEditor({
  model,
  headingId = 'emr-validation-heading',
  labels,
  onIntent,
}: {
  model: ValidationRuleEditorViewModel;
  headingId?: string;
  labels?: Partial<typeof VALIDATION_EDITOR_DEFAULTS>;
  onIntent: (intent: ValidationRuleEditorIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...VALIDATION_EDITOR_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;

  const [kind, setKind] = useState<FieldValidationRule['kind']>('minimum');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  const kindOptions: ClinicalOption[] = VALIDATION_RULE_KINDS.map(k => ({
    value: k,
    label: l.ruleLabels[k],
  }));

  const valueFieldMeta =
    kind === 'custom'
      ? { label: l.validatorIdLabel, placeholder: l.validatorIdPlaceholder }
      : kind === 'pattern'
        ? { label: l.regexLabel, placeholder: l.regexPlaceholder }
        : kind === 'earliest-date' || kind === 'latest-date'
          ? { label: l.dateLabel, placeholder: l.datePlaceholder }
          : kind === 'allowed-values'
            ? { label: l.allowedValuesLabel, placeholder: l.allowedValuesPlaceholder }
            : { label: l.valueLabel, placeholder: '0' };

  const handleAdd = () => {
    if (readOnly || !canAddValidationRule(kind, value, message)) return;
    const rule = buildValidationRule(kind, value, message, l.defaultPatternMessage);
    onIntent({ type: 'validationRuleAdded', rule });
    setValue('');
    setMessage('');
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>{l.eyebrow}</Text>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {l.heading}
          </Text>
        </View>
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
          {l.ruleCount(model.rules.length)}
        </Text>
      </View>

      <View style={styles.fieldStack}>
        <View style={styles.fieldRow}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
            {l.ruleTypeLabel}
          </Text>
          <EmrSelect
            label={l.ruleTypeLabel}
            options={kindOptions}
            value={kind}
            readOnly={readOnly}
            onChange={next => {
              if (next) {
                setKind(next as FieldValidationRule['kind']);
                setValue('');
              }
            }}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
            {valueFieldMeta.label}
          </Text>
          <ThemedInput
            id={`${headingId}-rule-value`}
            aria-label={valueFieldMeta.label}
            value={value}
            placeholder={valueFieldMeta.placeholder}
            readOnly={readOnly}
            editable={!readOnly}
            onChangeText={setValue}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
            {l.messageLabel}
          </Text>
          <ThemedInput
            id={`${headingId}-rule-message`}
            aria-label={l.messageLabel}
            value={message}
            placeholder={l.messagePlaceholder}
            readOnly={readOnly}
            editable={!readOnly}
            onChangeText={setMessage}
          />
        </View>
      </View>

      {kind === 'custom' ? (
        <View style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.customNote}</Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <EmrButton
          variant="outline"
          label={l.addRule}
          disabled={readOnly || !canAddValidationRule(kind, value, message)}
          onPress={handleAdd}
        />
      </View>

      {model.rules.length > 0 ? (
        <View role="list" aria-label={l.currentRulesGroup} style={styles.rulesList}>
          {model.rules.map(rule => (
            <View
              key={rule.id}
              role="listitem"
              style={[styles.ruleRow, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
            >
              <View style={styles.flex}>
                <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                  {l.ruleLabels[rule.kind]}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                  {summarizeValidationRule(rule)}
                </Text>
                {rule.message ? (
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontStyle: 'italic', fontFamily: font }}>
                    {rule.message}
                  </Text>
                ) : null}
              </View>
              <EmrButton
                small
                variant="ghost"
                label={l.remove}
                disabled={readOnly}
                onPress={() => onIntent({ type: 'validationRuleRemoved', ruleId: rule.id })}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrFieldGenerator
// ---------------------------------------------------------------------------

/** L6 controlled authoring surface for reusable EMR fields. */
export function EmrFieldGenerator({
  model,
  headingId = 'emr-field-generator-heading',
  labels,
  onIntent,
}: {
  model: FieldGeneratorViewModel;
  headingId?: string;
  labels?: Partial<typeof FIELD_GENERATOR_DEFAULTS>;
  onIntent: (intent: FieldGeneratorIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...FIELD_GENERATOR_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const draft = model.draft;

  const [optionValue, setOptionValue] = useState('');
  const [optionLabel, setOptionLabel] = useState('');

  const emit = (intent: FieldGeneratorIntent) => {
    if (!readOnly) onIntent(intent);
  };

  const patch = <K extends keyof EmrGeneratedFieldDefinition>(key: K, value: EmrGeneratedFieldDefinition[K]) => {
    emit({ type: 'draftPatched', changes: { [key]: value } });
  };

  const handleAddOption = () => {
    const val = optionValue.trim();
    const lbl = optionLabel.trim();
    if (!val || !lbl || readOnly) return;
    const nextOptions = [...(draft.options ?? []).filter(o => o.value !== val), { value: val, label: lbl }];
    patch('options', nextOptions);
    setOptionValue('');
    setOptionLabel('');
  };

  const errorEntries = Object.entries(model.validationErrors ?? {});

  return (
    <View role="region" aria-labelledby={headingId} style={styles.surfaceStack}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>{l.eyebrow}</Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.text2xl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {l.heading}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
            {model.dirty ? l.unsavedChanges : l.ready}
          </Text>
          <EmrButton
            label={model.saving ? l.saving : l.saveField}
            disabled={readOnly || model.saving}
            onPress={() => emit({ type: 'saveRequested' })}
          />
        </View>
      </View>

      {model.error ? (
        <View role="alert" style={[styles.messageBox, { backgroundColor: t.dangerSoft }]}>
          <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: font }}>{model.error}</Text>
        </View>
      ) : null}

      <EmrColumns widths={['1.7fr', '1fr']} collapseBelow={860} gap={18}>
        <View style={styles.columnStack}>
          {/* Identity and display */}
          <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                  {l.identityEyebrow}
                </Text>
                <Text
                  role="heading"
                  aria-level={3}
                  nativeID={`${headingId}-identity`}
                  style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                >
                  {l.identityHeading}
                </Text>
              </View>
            </View>
            <View style={styles.fieldStack}>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.fieldIdLabel}
                </Text>
                <ThemedInput
                  id={`${headingId}-field-id`}
                  aria-label={l.fieldIdLabel}
                  value={draft.id}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onChangeText={val => patch('id', val)}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.labelLabel}
                </Text>
                <ThemedInput
                  id={`${headingId}-field-label`}
                  aria-label={l.labelLabel}
                  value={draft.label}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onChangeText={val => patch('label', val)}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.descriptionLabel}
                </Text>
                <ThemedInput
                  id={`${headingId}-field-description`}
                  aria-label={l.descriptionLabel}
                  multiline
                  numberOfLines={2}
                  value={draft.description ?? ''}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onChangeText={val => patch('description', val)}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.instructionsLabel}
                </Text>
                <ThemedInput
                  id={`${headingId}-field-instructions`}
                  aria-label={l.instructionsLabel}
                  multiline
                  numberOfLines={2}
                  value={draft.instructions ?? ''}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onChangeText={val => patch('instructions', val)}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.placeholderLabel}
                </Text>
                <ThemedInput
                  id={`${headingId}-field-placeholder`}
                  aria-label={l.placeholderLabel}
                  value={draft.placeholder ?? ''}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onChangeText={val => patch('placeholder', val)}
                />
              </View>
            </View>
          </View>

          {/* Behaviour */}
          <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                  {l.behaviourEyebrow}
                </Text>
                <Text
                  role="heading"
                  aria-level={3}
                  nativeID={`${headingId}-behaviour`}
                  style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                >
                  {l.behaviourHeading}
                </Text>
              </View>
            </View>
            <View style={styles.fieldStack}>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.valueTypeLabel}
                </Text>
                <EmrSelect
                  label={l.valueTypeLabel}
                  options={l.typeOptions}
                  value={draft.type}
                  readOnly={readOnly}
                  onChange={val => {
                    if (val) patch('type', val as ClinicalFieldType);
                  }}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.gridSpanLabel}
                </Text>
                <EmrSelect
                  label={l.gridSpanLabel}
                  options={l.spanOptions}
                  value={String(draft.span ?? 12)}
                  readOnly={readOnly}
                  onChange={val => {
                    if (val) patch('span', Number(val) as 3 | 4 | 6 | 8 | 9 | 12);
                  }}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.textRowsLabel}
                </Text>
                <NumberInput
                  id={`${headingId}-field-rows`}
                  aria-label={l.textRowsLabel}
                  integer
                  value={draft.rows}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onNumber={val => patch('rows', val ?? undefined)}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                  {l.precisionLabel}
                </Text>
                <NumberInput
                  id={`${headingId}-field-precision`}
                  aria-label={l.precisionLabel}
                  integer
                  value={draft.precision}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onNumber={val => patch('precision', val ?? undefined)}
                />
              </View>
              <View style={styles.flagsRow}>
                <EmrOptionChip
                  label={l.requiredFlag}
                  multiple
                  selected={draft.required}
                  readOnly={readOnly}
                  onPress={() => patch('required', !draft.required)}
                />
                <EmrOptionChip
                  label={l.repeatableFlag}
                  multiple
                  selected={draft.repeats}
                  readOnly={readOnly}
                  onPress={() => patch('repeats', !draft.repeats)}
                />
                <EmrOptionChip
                  label={l.readOnlyFlag}
                  multiple
                  selected={!!draft.readOnly}
                  readOnly={readOnly}
                  onPress={() => patch('readOnly', !draft.readOnly)}
                />
              </View>
            </View>
          </View>

          {/* Measurement (quantity only) */}
          {draft.type === 'quantity' ? (
            <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                    {l.measurementEyebrow}
                  </Text>
                  <Text
                    role="heading"
                    aria-level={3}
                    nativeID={`${headingId}-unit`}
                    style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                  >
                    {l.measurementHeading}
                  </Text>
                </View>
              </View>
              <View style={styles.fieldStack}>
                <View style={styles.fieldRow}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                    {l.displayUnitLabel}
                  </Text>
                  <ThemedInput
                    id={`${headingId}-field-unit`}
                    aria-label={l.displayUnitLabel}
                    value={draft.unit ?? ''}
                    placeholder={l.displayUnitPlaceholder}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={val => patch('unit', val)}
                  />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                    {l.unitSystemLabel}
                  </Text>
                  <ThemedInput
                    id={`${headingId}-field-unit-system`}
                    aria-label={l.unitSystemLabel}
                    value={draft.unitSystem ?? ''}
                    placeholder={l.unitSystemPlaceholder}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={val => patch('unitSystem', val)}
                  />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                    {l.unitCodeLabel}
                  </Text>
                  <ThemedInput
                    id={`${headingId}-field-unit-code`}
                    aria-label={l.unitCodeLabel}
                    value={draft.unitCode ?? ''}
                    placeholder={l.unitCodePlaceholder}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={val => patch('unitCode', val)}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* Choice options (select / multiselect only) */}
          {draft.type === 'select' || draft.type === 'multiselect' ? (
            <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                    {l.optionsEyebrow}
                  </Text>
                  <Text
                    role="heading"
                    aria-level={3}
                    nativeID={`${headingId}-options`}
                    style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                  >
                    {l.optionsHeading}
                  </Text>
                </View>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                  {l.optionCount(draft.options?.length ?? 0)}
                </Text>
              </View>
              <View style={styles.fieldStack}>
                <View style={styles.fieldRow}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                    {l.optionValueLabel}
                  </Text>
                  <ThemedInput
                    id={`${headingId}-option-value`}
                    aria-label={l.optionValueLabel}
                    value={optionValue}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={setOptionValue}
                  />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                    {l.optionLabelLabel}
                  </Text>
                  <ThemedInput
                    id={`${headingId}-option-label`}
                    aria-label={l.optionLabelLabel}
                    value={optionLabel}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={setOptionLabel}
                  />
                </View>
                <View style={styles.buttonRow}>
                  <EmrButton
                    variant="outline"
                    label={l.addOption}
                    disabled={readOnly || !optionValue.trim() || !optionLabel.trim()}
                    onPress={handleAddOption}
                  />
                </View>
                {draft.options?.length ? (
                  <View style={styles.flagsRow}>
                    {draft.options.map(option => (
                      <View
                        key={option.value}
                        style={[styles.optionPill, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
                      >
                        <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>
                          {option.label}{' '}
                          <Text style={{ color: t.textMuted, fontSize: t.textXs }}>{option.value}</Text>
                        </Text>
                        <EmrButton
                          small
                          variant="ghost"
                          label={l.remove}
                          accessibilityLabel={l.removeOption(option.label)}
                          disabled={readOnly}
                          onPress={() =>
                            patch(
                              'options',
                              (draft.options ?? []).filter(o => o.value !== option.value),
                            )
                          }
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Validation rules */}
          <EmrValidationRuleEditor
            headingId={`${headingId}-validation`}
            model={{ rules: draft.validationRules, readOnly }}
            onIntent={emit}
          />

          {/* Terminology bindings */}
          <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                  {l.terminologyEyebrow}
                </Text>
                <Text
                  role="heading"
                  aria-level={3}
                  nativeID={`${headingId}-terminology`}
                  style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                >
                  {l.terminologyHeading}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font, marginTop: 4 }}>
                  {l.terminologyDescription}
                </Text>
              </View>
            </View>
            <View style={styles.columnStack}>
              {TERMINOLOGY_ROLES.map(role => (
                <EmrTerminologySearch
                  key={role}
                  headingId={`${headingId}-terminology-${role}`}
                  model={{
                    role,
                    sources: model.sources,
                    search: model.terminologySearches[role],
                    bindings: filterBindingsByRole(draft.terminologyBindings, role),
                    readOnly,
                  }}
                  onIntent={emit}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Live preview & status pane */}
        <View style={styles.columnStack}>
          <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                  {l.previewEyebrow}
                </Text>
                <Text
                  role="heading"
                  aria-level={3}
                  nativeID={`${headingId}-preview`}
                  style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                >
                  {l.previewHeading}
                </Text>
              </View>
              <EmrBadgeView badge={{ label: draft.type, tone: 'neutral' }} />
            </View>
            <EmrTypedField
              definition={toPreviewFieldDefinition(draft, l.untitledField)}
              model={{ value: draft.defaultValue ?? null }}
              controlId={`${headingId}-generated-field-preview`}
              readOnly
              onValueChange={() => {}}
              onStatusChange={() => {}}
            />
            <View style={[styles.previewFooter, { borderTopColor: t.border }]}>
              <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                {l.fhirReadyTitle}
              </Text>
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{l.fhirReadyNote}</Text>
            </View>
          </View>

          <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.statusEyebrow}
            </Text>
            {errorEntries.length > 0 ? (
              <View role="list" style={styles.fieldStack}>
                {errorEntries.map(([key, errMsg]) => (
                  <View key={key} role="listitem">
                    <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: font }}>
                      <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{key}:</Text> {errMsg}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.noErrors}</Text>
              </View>
            )}
            {model.savedFieldId ? (
              <View role="status" style={[styles.messageBox, { backgroundColor: t.successSoft }]}>
                <Text style={{ color: t.success, fontSize: t.textSm, fontFamily: font }}>
                  {l.savedField(model.savedFieldId)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </EmrColumns>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrFieldLibraryPicker
// ---------------------------------------------------------------------------

/** L6 searchable catalogue of reusable field definitions for template composition. */
export function EmrFieldLibraryPicker({
  model,
  headingId = 'emr-field-library-heading',
  labels,
  onIntent,
}: {
  model: FieldLibraryPickerViewModel;
  headingId?: string;
  labels?: Partial<typeof FIELD_LIBRARY_DEFAULTS>;
  onIntent: (intent: FieldLibraryPickerIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...FIELD_LIBRARY_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>{l.eyebrow}</Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {l.heading}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font, marginTop: 2 }}>{l.description}</Text>
        </View>
        <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
          {l.availableCount(model.fields.length)}
        </Text>
      </View>

      <View style={styles.fieldRow}>
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
          {l.searchLabel}
        </Text>
        <ThemedInput
          id={`${headingId}-search`}
          aria-label={l.searchLabel}
          value={model.query}
          placeholder={l.searchPlaceholder}
          readOnly={readOnly}
          editable={!readOnly}
          onChangeText={query => onIntent({ type: 'fieldLibraryQueryChanged', query })}
        />
      </View>

      {!model.selectedSectionId ? (
        <View role="status" style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.selectSectionNote}</Text>
        </View>
      ) : null}

      {model.fields.length > 0 ? (
        <View role="list" aria-label={l.availableFieldsList} style={styles.libraryList}>
          {model.fields.map(field => {
            const termSummary = summarizeFieldTerminology(field);
            return (
              <View
                key={field.id}
                role="listitem"
                style={[styles.libraryItem, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
              >
                <View style={styles.flex}>
                  <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
                    {field.label}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
                    {field.type}
                    {field.required ? ` · ${l.requiredTag}` : ''}
                    {field.repeats ? ` · ${l.repeatableTag}` : ''}
                  </Text>
                  {field.description ? (
                    <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{field.description}</Text>
                  ) : null}
                  {termSummary ? (
                    <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>{termSummary}</Text>
                  ) : null}
                </View>
                <EmrButton
                  small
                  variant="outline"
                  label={l.add}
                  disabled={readOnly || !model.selectedSectionId}
                  onPress={() => {
                    if (!readOnly && model.selectedSectionId) {
                      onIntent({
                        type: 'fieldAdded',
                        sectionId: model.selectedSectionId,
                        field,
                        placementId: '',
                      });
                    }
                  }}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <View role="status" style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.noMatchingFields}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 5. EmrTemplatePreview
// ---------------------------------------------------------------------------

const ARTIFACT_FORMATS: readonly TemplateArtifactFormat[] = [
  'internal-json',
  'fhir-r4-questionnaire',
  'fhir-r4-bundle',
  'fhir-r4b-questionnaire',
  'fhir-r5-questionnaire',
];

/** L6 live clinical form preview and FHIR/JSON artifact import/export surface. */
export function EmrTemplatePreview({
  model,
  headingId = 'emr-template-preview-heading',
  labels,
  onIntent,
}: {
  model: TemplatePreviewViewModel;
  headingId?: string;
  labels?: Partial<typeof TEMPLATE_PREVIEW_DEFAULTS>;
  onIntent: (intent: TemplatePreviewIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...TEMPLATE_PREVIEW_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;

  const [format, setFormat] = useState<TemplateArtifactFormat>('fhir-r4-questionnaire');
  const [serialized, setSerialized] = useState('');

  const formatOptions: ClinicalOption[] = ARTIFACT_FORMATS.map(f => ({
    value: f,
    label: l.formatLabels[f] ?? f,
  }));

  const emit = (intent: TemplatePreviewIntent) => {
    if (!readOnly) onIntent(intent);
  };

  return (
    <View role="region" aria-labelledby={headingId} style={styles.columnStack}>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>{l.eyebrow}</Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.template.title || l.untitledTemplate}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
            {model.template.description || l.defaultDescription}
          </Text>
        </View>
        <EmrBadgeView badge={{ label: model.template.status, tone: 'neutral' }} />
      </View>

      <View style={[styles.previewSurface, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
        <EmrClinicalForm model={model.preview} idPrefix={headingId} onIntent={() => {}} />
      </View>

      <View
        role="region"
        aria-labelledby={`${headingId}-artifact`}
        style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.interopEyebrow}
            </Text>
            <Text
              role="heading"
              aria-level={3}
              nativeID={`${headingId}-artifact`}
              style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
            >
              {l.interopHeading}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.interopDescription}</Text>
          </View>
          {model.loading ? (
            <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
              {l.working}
            </Text>
          ) : null}
        </View>

        <View style={styles.inlineRow}>
          <View style={styles.flex}>
            <EmrSelect
              label={l.formatLabel}
              options={formatOptions}
              value={format}
              readOnly={readOnly || model.loading}
              onChange={next => {
                if (next) setFormat(next as TemplateArtifactFormat);
              }}
            />
          </View>
          <EmrButton
            variant="outline"
            label={l.exportButton}
            disabled={readOnly || model.loading}
            onPress={() => emit({ type: 'artifactExportRequested', format })}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
            {l.serializedLabel}
          </Text>
          <ThemedInput
            id={`${headingId}-serialized`}
            aria-label={l.serializedLabel}
            multiline
            numberOfLines={6}
            value={serialized}
            placeholder={l.serializedPlaceholder}
            readOnly={readOnly || model.loading}
            editable={!readOnly && !model.loading}
            onChangeText={setSerialized}
          />
        </View>

        <View style={styles.flagsRow}>
          <EmrButton
            variant="outline"
            label={l.importButton}
            disabled={readOnly || model.loading || !serialized.trim()}
            onPress={() => {
              if (serialized.trim()) emit({ type: 'artifactImportRequested', format, serialized });
            }}
          />
          {canAcceptTemplateImport(model.importIssues) ? (
            <EmrButton
              variant="outline"
              label={l.acceptImportButton}
              disabled={readOnly || model.loading}
              onPress={() => emit({ type: 'importAccepted' })}
            />
          ) : null}
        </View>

        {model.artifact ? (
          <View
            role="status"
            style={[styles.artifactBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          >
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.formatLabels[model.artifact.format] ?? model.artifact.format}
              {model.artifact.fhirVersion ? ` · FHIR ${model.artifact.fhirVersion}` : ''}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
              {l.artifactMeta(model.artifact.serialized.length, model.artifact.issues.length)}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textXs, fontFamily: t.fontMono }}>
              {model.artifact.serialized}
            </Text>
          </View>
        ) : null}

        {model.importIssues?.length ? (
          <View
            role="alert"
            style={[styles.artifactBox, { borderColor: t.warning, backgroundColor: t.warningSoft }]}
          >
            <Text style={{ color: t.warning, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.reviewIssuesHeading}
            </Text>
            {model.importIssues.map(issue => (
              <Text key={`${issue.code}:${issue.path ?? ''}`} style={{ color: t.warning, fontSize: t.textSm, fontFamily: font }}>
                <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{issue.severity}</Text> · {issue.message}
                {issue.path ? ` · ${issue.path}` : ''}
              </Text>
            ))}
          </View>
        ) : null}

        {model.error ? (
          <View role="alert" style={[styles.messageBox, { backgroundColor: t.dangerSoft }]}>
            <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: font }}>{model.error}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 6. EmrTemplateComposer
// ---------------------------------------------------------------------------

/** L6 full EHR template composition surface: metadata, sections, field library picker, and live preview. */
export function EmrTemplateComposer({
  model,
  headingId = 'emr-template-composer-heading',
  labels,
  onIntent,
}: {
  model: TemplateComposerViewModel;
  headingId?: string;
  labels?: Partial<typeof TEMPLATE_COMPOSER_DEFAULTS>;
  onIntent: (intent: TemplateComposerIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...TEMPLATE_COMPOSER_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;

  const [newSectionLabel, setNewSectionLabel] = useState('');

  const emit = (intent: TemplateComposerIntent) => {
    if (!readOnly || intent.type === 'sectionSelected') onIntent(intent);
  };

  const selectedSection: EhrTemplateSection | undefined = model.template.sections.find(
    s => s.id === model.selectedSectionId,
  );

  const handleAddSection = () => {
    const lbl = newSectionLabel.trim();
    if (!lbl || readOnly) return;
    emit({ type: 'sectionAdded', section: { id: '', label: lbl, fields: [] } });
    setNewSectionLabel('');
  };

  return (
    <View role="region" aria-labelledby={headingId} style={styles.surfaceStack}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>{l.eyebrow}</Text>
          <Text
            role="heading"
            aria-level={1}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.text2xl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.template.title || l.untitledTemplate}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
            {model.dirty ? l.unsavedChanges : model.template.status}
          </Text>
          <EmrButton
            label={model.saving ? l.saving : l.saveTemplate}
            disabled={readOnly || model.saving}
            onPress={() => emit({ type: 'saveRequested' })}
          />
        </View>
      </View>

      {model.error ? (
        <View role="alert" style={[styles.messageBox, { backgroundColor: t.dangerSoft }]}>
          <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: font }}>{model.error}</Text>
        </View>
      ) : null}

      {/* Template metadata */}
      <View
        role="region"
        aria-labelledby={`${headingId}-identity`}
        style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.metadataEyebrow}
            </Text>
            <Text
              role="heading"
              aria-level={2}
              nativeID={`${headingId}-identity`}
              style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
            >
              {l.metadataHeading}
            </Text>
          </View>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
            {l.schemaRevision(model.template.schemaVersion, model.template.revision)}
          </Text>
        </View>

        <View style={styles.fieldStack}>
          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.titleLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-template-title`}
              aria-label={l.titleLabel}
              value={model.template.title}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={title => emit({ type: 'templatePatched', changes: { title } })}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.descriptionLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-template-description`}
              aria-label={l.descriptionLabel}
              multiline
              numberOfLines={2}
              value={model.template.description ?? ''}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={description => emit({ type: 'templatePatched', changes: { description } })}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.localeLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-template-locale`}
              aria-label={l.localeLabel}
              value={model.template.locale}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={locale => emit({ type: 'templatePatched', changes: { locale } })}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.statusLabel}
            </Text>
            <EmrSelect
              label={l.statusLabel}
              options={l.statusOptions}
              value={model.template.status}
              readOnly={readOnly}
              onChange={status => {
                if (status) emit({ type: 'templatePatched', changes: { status: status as EhrTemplateStatus } });
              }}
            />
          </View>
        </View>
      </View>

      <EmrColumns widths={['1fr', '1.8fr']} collapseBelow={860} gap={16}>
        {/* Sidebar: Sections + Field library picker */}
        <View style={styles.columnStack}>
          <View
            role="region"
            aria-labelledby={`${headingId}-sections`}
            style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                  {l.structureEyebrow}
                </Text>
                <Text
                  role="heading"
                  aria-level={2}
                  nativeID={`${headingId}-sections`}
                  style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                >
                  {l.sectionsHeading}
                </Text>
              </View>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                {model.template.sections.length}
              </Text>
            </View>

            <View style={styles.inlineRow}>
              <View style={styles.flex}>
                <ThemedInput
                  id={`${headingId}-new-section`}
                  aria-label={l.newSectionPlaceholder}
                  value={newSectionLabel}
                  placeholder={l.newSectionPlaceholder}
                  readOnly={readOnly}
                  editable={!readOnly}
                  onChangeText={setNewSectionLabel}
                />
              </View>
              <EmrButton
                variant="outline"
                label={l.addSection}
                disabled={readOnly || !newSectionLabel.trim()}
                onPress={handleAddSection}
              />
            </View>

            {model.template.sections.length > 0 ? (
              <View role="navigation" aria-label={l.sectionsNavLabel} style={styles.sectionsList}>
                {model.template.sections.map((section, index) => {
                  const selected = section.id === model.selectedSectionId;
                  return (
                    <View
                      key={section.id}
                      style={[
                        styles.sectionItem,
                        {
                          borderColor: selected ? t.primary : t.border,
                          backgroundColor: t.surfaceRaised,
                        },
                      ]}
                    >
                      <Pressable
                        role="button"
                        aria-current={selected ? true : undefined}
                        onPress={() => emit({ type: 'sectionSelected', sectionId: section.id })}
                        style={({ focused }: PressState) => [
                          styles.flex,
                          styles.sectionSelectBtn,
                          focusRing(t, focused),
                          { minHeight: t.controlHeight },
                        ]}
                      >
                        <Text
                          style={{
                            color: t.text,
                            fontSize: t.textMd,
                            fontWeight: fontWeight(t.weightBold),
                            fontFamily: font,
                          }}
                        >
                          {section.label}
                        </Text>
                        <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: font }}>
                          {l.fieldCount(section.fields.length)}
                        </Text>
                      </Pressable>
                      <View style={styles.itemActions}>
                        <EmrButton
                          small
                          variant="ghost"
                          label={l.moveUp}
                          accessibilityLabel={l.moveItemUp(section.label)}
                          disabled={readOnly || index === 0}
                          onPress={() => emit({ type: 'sectionMoved', sectionId: section.id, direction: 'up' })}
                        />
                        <EmrButton
                          small
                          variant="ghost"
                          label={l.moveDown}
                          accessibilityLabel={l.moveItemDown(section.label)}
                          disabled={readOnly || index === model.template.sections.length - 1}
                          onPress={() => emit({ type: 'sectionMoved', sectionId: section.id, direction: 'down' })}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.noSections}</Text>
              </View>
            )}
          </View>

          <EmrFieldLibraryPicker
            headingId={`${headingId}-field-library`}
            model={{
              fields: model.fieldLibrary,
              query: model.fieldLibraryQuery,
              selectedSectionId: model.selectedSectionId,
              readOnly,
            }}
            onIntent={emit}
          />
        </View>

        {/* Main: Selected section editor + Template preview */}
        <View style={styles.columnStack}>
          {selectedSection ? (
            <View
              role="region"
              aria-labelledby={`${headingId}-section-editor`}
              style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
                    {l.selectedSectionEyebrow}
                  </Text>
                  <Text
                    role="heading"
                    aria-level={2}
                    nativeID={`${headingId}-section-editor`}
                    style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
                  >
                    {selectedSection.label}
                  </Text>
                </View>
                <EmrButton
                  small
                  variant="outline"
                  label={l.removeSection}
                  disabled={readOnly}
                  onPress={() => emit({ type: 'sectionRemoved', sectionId: selectedSection.id })}
                />
              </View>

              <View style={styles.fieldStack}>
                <View style={styles.fieldRow}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                    {l.sectionLabelLabel}
                  </Text>
                  <ThemedInput
                    id={`${headingId}-section-label-${selectedSection.id}`}
                    aria-label={l.sectionLabelLabel}
                    value={selectedSection.label}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={label =>
                      emit({ type: 'sectionPatched', sectionId: selectedSection.id, changes: { label } })
                    }
                  />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                    {l.sectionDescriptionLabel}
                  </Text>
                  <ThemedInput
                    id={`${headingId}-section-description-${selectedSection.id}`}
                    aria-label={l.sectionDescriptionLabel}
                    multiline
                    numberOfLines={2}
                    value={selectedSection.description ?? ''}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={description =>
                      emit({ type: 'sectionPatched', sectionId: selectedSection.id, changes: { description } })
                    }
                  />
                </View>
              </View>

              {selectedSection.fields.length > 0 ? (
                <View role="list" aria-label={l.placementsListLabel} style={styles.sectionsList}>
                  {selectedSection.fields.map((placement, index) => {
                    const selected = placement.id === model.selectedPlacementId;
                    return (
                      <View
                        key={placement.id}
                        role="listitem"
                        style={[
                          styles.sectionItem,
                          {
                            borderColor: selected ? t.primary : t.border,
                            backgroundColor: t.surfaceRaised,
                          },
                        ]}
                      >
                        <Pressable
                          role="button"
                          onPress={() => emit({ type: 'sectionSelected', sectionId: selectedSection.id })}
                          style={({ focused }: PressState) => [
                            styles.flex,
                            styles.sectionSelectBtn,
                            focusRing(t, focused),
                            { minHeight: t.controlHeight },
                          ]}
                        >
                          <Text
                            style={{
                              color: t.text,
                              fontSize: t.textMd,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: font,
                            }}
                          >
                            {placement.field.label}
                          </Text>
                          <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: font }}>
                            {placement.field.type} · {placement.field.id}
                            {placement.field.terminologyBindings.length ? ` · ${l.terminologyBound}` : ''}
                          </Text>
                        </Pressable>
                        <View style={styles.itemActions}>
                          <EmrButton
                            small
                            variant="ghost"
                            label={l.moveUp}
                            accessibilityLabel={l.moveItemUp(placement.field.label)}
                            disabled={readOnly || index === 0}
                            onPress={() =>
                              emit({
                                type: 'fieldMoved',
                                sectionId: selectedSection.id,
                                placementId: placement.id,
                                direction: 'up',
                              })
                            }
                          />
                          <EmrButton
                            small
                            variant="ghost"
                            label={l.moveDown}
                            accessibilityLabel={l.moveItemDown(placement.field.label)}
                            disabled={readOnly || index === selectedSection.fields.length - 1}
                            onPress={() =>
                              emit({
                                type: 'fieldMoved',
                                sectionId: selectedSection.id,
                                placementId: placement.id,
                                direction: 'down',
                              })
                            }
                          />
                          <EmrButton
                            small
                            variant="ghost"
                            label={l.remove}
                            accessibilityLabel={l.removeField(placement.field.label)}
                            disabled={readOnly}
                            onPress={() =>
                              emit({
                                type: 'fieldRemoved',
                                sectionId: selectedSection.id,
                                placementId: placement.id,
                              })
                            }
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.noFieldsInSection}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
              <View style={[styles.messageBox, { backgroundColor: t.surfaceRaised }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.selectSectionPrompt}</Text>
              </View>
            </View>
          )}

          <EmrTemplatePreview headingId={`${headingId}-preview`} model={model} onIntent={emit} />
        </View>
      </EmrColumns>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  surfaceStack: { gap: 18, minWidth: 0 },
  columnStack: { gap: 16, minWidth: 0 },
  topHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 14, minWidth: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  eyebrow: { fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  fieldStack: { gap: 10 },
  fieldRow: { gap: 4, minWidth: 0 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  optionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12, paddingRight: 4, paddingVertical: 2, borderWidth: 1, borderRadius: 999 },
  messageBox: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resultsList: { gap: 6 },
  resultItem: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 },
  paginationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  bindingCard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderRadius: 8 },
  bindingControls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8 },
  selectWrap: { gap: 4, minWidth: 140 },
  rulesList: { gap: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 },
  previewFooter: { borderTopWidth: 1, paddingTop: 12, gap: 4 },
  libraryList: { gap: 8 },
  libraryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 },
  previewSurface: { borderWidth: 1, borderRadius: 12, padding: 16 },
  artifactBox: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 },
  sectionsList: { gap: 8 },
  sectionItem: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: 6, borderWidth: 1, borderRadius: 8 },
  sectionSelectBtn: { justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4, gap: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
