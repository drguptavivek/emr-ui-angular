'use client';

import { useState } from 'react';
import { View } from 'react-native';
import type {
  EhrTemplateDefinition,
  EhrTemplateIntent,
  EhrTemplateViewModel,
  EmrGeneratedFieldDefinition,
  FieldGeneratorIntent,
  FieldGeneratorViewModel,
  FieldValidationRule,
  TerminologyConcept,
  TerminologySource,
} from '@drguptavivek/emr-controller';
import {
  EmrFieldGenerator,
  EmrFieldLibraryPicker,
  EmrTemplateComposer,
  EmrTemplatePreview,
  EmrTerminologySearch,
  EmrValidationRuleEditor,
  type FieldLibraryPickerViewModel,
  type TerminologySearchIntent,
  type TerminologySearchViewModel,
  type ValidationRuleEditorIntent,
} from '../../src/l6-authoring';
import { deriveTemplatePreview } from '../../src/l6-authoring.logic';
import type { GallerySection } from './types';

const sources: readonly TerminologySource[] = [
  { id: 'loinc', kind: 'loinc', label: 'LOINC', available: true, supportsPagination: true, versionLabel: '2.78' },
  { id: 'snomed', kind: 'snomed-ct', label: 'SNOMED CT', available: true, supportsPagination: true, versionLabel: 'International 2025-01' },
  { id: 'icd10', kind: 'icd-10', label: 'ICD-10', available: true, versionLabel: 'WHO 2019' },
  { id: 'ucum', kind: 'ucum', label: 'UCUM', available: true, versionLabel: '2.2' },
];

const loincWeight: TerminologyConcept = {
  sourceId: 'loinc',
  system: 'http://loinc.org',
  code: '29463-7',
  display: 'Body weight',
  version: '2.78',
  active: true,
};
const loincIop: TerminologyConcept = {
  sourceId: 'loinc',
  system: 'http://loinc.org',
  code: '56844-4',
  display: 'Intraocular pressure of Eye',
  version: '2.78',
  active: true,
};
const ucumKg: TerminologyConcept = {
  sourceId: 'ucum',
  system: 'http://unitsofmeasure.org',
  code: 'kg',
  display: 'kilogram',
  version: '2.2',
  active: true,
};
const snomedDiabetes: TerminologyConcept = {
  sourceId: 'snomed',
  system: 'http://snomed.info/sct',
  code: '44054006',
  display: 'Diabetes mellitus type 2',
  version: '2025-01',
  active: true,
};

const sampleConcepts: readonly TerminologyConcept[] = [loincWeight, loincIop, ucumKg, snomedDiabetes];

function TerminologySearchDemo() {
  const [model, setModel] = useState<TerminologySearchViewModel>({
    role: 'question-meaning',
    sources,
    search: {
      sourceId: 'loinc',
      role: 'question-meaning',
      query: 'weight',
      options: [loincWeight, loincIop],
      page: 1,
      pageSize: 10,
      total: 2,
      loading: false,
    },
    bindings: [
      { id: 'binding-loinc-weight', role: 'question-meaning', concept: loincWeight, strength: 'preferred' },
    ],
  });

  const handleIntent = (intent: TerminologySearchIntent) => {
    setModel(prev => {
      switch (intent.type) {
        case 'terminologySearchOpened':
          return {
            ...prev,
            search: {
              sourceId: intent.sourceId,
              role: prev.role,
              query: prev.search?.query ?? '',
              options: [],
              page: 1,
              pageSize: 10,
              total: 0,
              loading: false,
            },
          };
        case 'terminologyQueryChanged':
          return prev.search ? { ...prev, search: { ...prev.search, query: intent.query } } : prev;
        case 'terminologySearchRequested': {
          if (!prev.search) return prev;
          const q = prev.search.query.trim().toLowerCase();
          const filtered = sampleConcepts.filter(
            c => c.display.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
          );
          return {
            ...prev,
            search: { ...prev.search, options: filtered, total: filtered.length, loading: false },
          };
        }
        case 'terminologyConceptSelected': {
          const id = `binding-${intent.concept.sourceId}-${intent.concept.code}`;
          const nextBinding = {
            id,
            role: intent.role,
            concept: intent.concept,
            strength: intent.strength ?? 'preferred',
            mappingRelationship: intent.mappingRelationship,
          };
          const filtered = prev.bindings.filter(b => b.id !== id);
          return { ...prev, bindings: [...filtered, nextBinding] };
        }
        case 'terminologyBindingRemoved':
          return { ...prev, bindings: prev.bindings.filter(b => b.id !== intent.bindingId) };
        default:
          return prev;
      }
    });
  };

  return (
    <View style={{ gap: 16 }}>
      <EmrTerminologySearch model={model} onIntent={handleIntent} />
    </View>
  );
}

function ValidationRuleEditorDemo() {
  const [rules, setRules] = useState<readonly FieldValidationRule[]>([
    { id: 'r-min', kind: 'minimum', value: 0, message: 'Weight must be positive.' },
    { id: 'r-max', kind: 'maximum', value: 300, message: 'Verify unusually high weight.' },
  ]);

  const handleIntent = (intent: ValidationRuleEditorIntent) => {
    if (intent.type === 'validationRuleAdded') {
      setRules(prev => [...prev, { ...intent.rule, id: `rule-${prev.length + 1}` }]);
    } else if (intent.type === 'validationRuleRemoved') {
      setRules(prev => prev.filter(r => r.id !== intent.ruleId));
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <EmrValidationRuleEditor model={{ rules }} onIntent={handleIntent} />
    </View>
  );
}

function FieldGeneratorDemo() {
  const [model, setModel] = useState<FieldGeneratorViewModel>({
    draft: {
      schemaVersion: '1.0',
      id: 'body-weight',
      revision: 1,
      label: 'Body weight',
      description: 'Measured body weight for the encounter.',
      type: 'quantity',
      required: true,
      repeats: false,
      unit: 'kg',
      unitSystem: 'UCUM',
      unitCode: 'kg',
      precision: 1,
      defaultValue: { value: 68.5, unit: 'kg' },
      validationRules: [{ id: 'weight-min', kind: 'minimum', value: 0, message: 'Weight must be positive.' }],
      terminologyBindings: [
        { id: 'binding-loinc-weight', role: 'question-meaning', concept: loincWeight, strength: 'preferred' },
        { id: 'binding-ucum-kg', role: 'unit', concept: ucumKg, strength: 'required' },
      ],
    },
    sources,
    terminologySearches: {
      'question-meaning': {
        sourceId: 'loinc',
        role: 'question-meaning',
        query: 'weight',
        options: [loincWeight],
        page: 1,
        pageSize: 10,
        total: 1,
        loading: false,
      },
    },
    validationErrors: {},
    saving: false,
    dirty: false,
  });

  const handleIntent = (intent: FieldGeneratorIntent) => {
    setModel(prev => {
      switch (intent.type) {
        case 'draftPatched':
          return { ...prev, draft: { ...prev.draft, ...intent.changes }, dirty: true, savedFieldId: undefined };
        case 'validationRuleAdded':
          return {
            ...prev,
            dirty: true,
            draft: {
              ...prev.draft,
              validationRules: [
                ...prev.draft.validationRules,
                { ...intent.rule, id: `rule-${prev.draft.validationRules.length + 1}` },
              ],
            },
          };
        case 'validationRuleRemoved':
          return {
            ...prev,
            dirty: true,
            draft: {
              ...prev.draft,
              validationRules: prev.draft.validationRules.filter(r => r.id !== intent.ruleId),
            },
          };
        case 'terminologyBindingRemoved':
          return {
            ...prev,
            dirty: true,
            draft: {
              ...prev.draft,
              terminologyBindings: prev.draft.terminologyBindings.filter(b => b.id !== intent.bindingId),
            },
          };
        case 'saveRequested':
          return { ...prev, dirty: false, savedFieldId: prev.draft.id || 'generated-field' };
        default:
          return prev;
      }
    });
  };

  return <EmrFieldGenerator model={model} onIntent={handleIntent} />;
}

const makeLibraryField = (
  id: string,
  label: string,
  type: EmrGeneratedFieldDefinition['type'],
  overrides: Partial<EmrGeneratedFieldDefinition> = {},
): EmrGeneratedFieldDefinition => ({
  schemaVersion: '1.0',
  id,
  revision: 1,
  label,
  type,
  required: false,
  repeats: false,
  validationRules: [],
  terminologyBindings: [],
  span: 6,
  ...overrides,
});

const chiefField = makeLibraryField('chief-complaints', 'Chief complaints', 'multiline', {
  span: 12,
  rows: 3,
  required: true,
});
const weightField = makeLibraryField('weight', 'Weight', 'quantity', {
  unit: 'kg',
  unitSystem: 'UCUM',
  unitCode: 'kg',
  required: true,
});
const pulseField = makeLibraryField('pulse', 'Pulse', 'integer', { unit: 'beats/min' });
const hba1cField = makeLibraryField('hba1c', 'HbA1c', 'decimal', {
  unit: '%',
  precision: 1,
  terminologyBindings: [
    {
      id: 'binding-hba1c',
      role: 'question-meaning',
      strength: 'preferred',
      concept: {
        sourceId: 'loinc',
        code: '4548-4',
        display: 'Hemoglobin A1c/Hemoglobin.total in Blood',
        system: 'http://loinc.org',
        active: true,
      },
    },
  ],
});

const allLibraryFields: readonly EmrGeneratedFieldDefinition[] = [
  chiefField,
  weightField,
  pulseField,
  hba1cField,
];

function FieldLibraryPickerDemo() {
  const [query, setQuery] = useState('');
  const filtered = allLibraryFields.filter(f => {
    const q = query.trim().toLowerCase();
    return !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q);
  });
  const model: FieldLibraryPickerViewModel = {
    fields: filtered,
    query,
    selectedSectionId: 'examination',
  };
  return (
    <EmrFieldLibraryPicker
      model={model}
      onIntent={intent => {
        if (intent.type === 'fieldLibraryQueryChanged') setQuery(intent.query);
      }}
    />
  );
}

const initialTemplate: EhrTemplateDefinition = {
  schemaVersion: '1.0',
  id: 'general-examination',
  revision: 4,
  title: 'General physical examination',
  description: 'A reusable examination template for outpatient encounters.',
  locale: 'en-IN',
  status: 'draft',
  sections: [
    {
      id: 'history',
      label: 'History',
      description: 'Presenting concern and relevant history.',
      fields: [{ id: 'chief-complaints', sourceFieldId: 'chief-complaints', sourceFieldRevision: 1, field: chiefField }],
    },
    {
      id: 'examination',
      label: 'General examination',
      description: 'Record core observations.',
      fields: [
        { id: 'weight', sourceFieldId: 'weight', sourceFieldRevision: 1, field: weightField },
        { id: 'pulse', sourceFieldId: 'pulse', sourceFieldRevision: 1, field: pulseField },
      ],
    },
  ],
};

function reduceTemplateIntent(model: EhrTemplateViewModel, intent: EhrTemplateIntent): EhrTemplateViewModel {
  const withTemplate = (template: EhrTemplateDefinition): EhrTemplateViewModel => ({
    ...model,
    template,
    preview: deriveTemplatePreview(template),
    dirty: true,
  });
  switch (intent.type) {
    case 'templatePatched':
      return withTemplate({
        ...model.template,
        ...intent.changes,
        revision: model.template.revision + 1,
      });
    case 'fieldLibraryQueryChanged': {
      const q = intent.query.trim().toLowerCase();
      return {
        ...model,
        fieldLibraryQuery: intent.query,
        fieldLibrary: allLibraryFields.filter(
          f => !q || f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q),
        ),
      };
    }
    case 'sectionSelected':
      return { ...model, selectedSectionId: intent.sectionId };
    case 'sectionAdded': {
      const id = `section-${model.template.sections.length + 1}`;
      const nextSection = { ...intent.section, id };
      return {
        ...withTemplate({
          ...model.template,
          revision: model.template.revision + 1,
          sections: [...model.template.sections, nextSection],
        }),
        selectedSectionId: id,
      };
    }
    case 'sectionPatched':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map(s => (s.id === intent.sectionId ? { ...s, ...intent.changes } : s)),
      });
    case 'sectionRemoved':
      return {
        ...withTemplate({
          ...model.template,
          revision: model.template.revision + 1,
          sections: model.template.sections.filter(s => s.id !== intent.sectionId),
        }),
        selectedSectionId: model.selectedSectionId === intent.sectionId ? undefined : model.selectedSectionId,
      };
    case 'fieldAdded': {
      const placementId = `${intent.field.id}-${Date.now()}`;
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map(s =>
          s.id === intent.sectionId
            ? {
                ...s,
                fields: [
                  ...s.fields,
                  {
                    id: placementId,
                    sourceFieldId: intent.field.id,
                    sourceFieldRevision: intent.field.revision,
                    field: intent.field,
                  },
                ],
              }
            : s,
        ),
      });
    }
    case 'fieldRemoved':
      return withTemplate({
        ...model.template,
        revision: model.template.revision + 1,
        sections: model.template.sections.map(s =>
          s.id === intent.sectionId ? { ...s, fields: s.fields.filter(f => f.id !== intent.placementId) } : s,
        ),
      });
    case 'artifactExportRequested':
      return {
        ...model,
        artifact: {
          format: intent.format,
          fhirVersion: intent.format === 'internal-json' ? undefined : '4.0.1',
          serialized: JSON.stringify(
            intent.format === 'internal-json'
              ? model.template
              : { resourceType: 'Questionnaire', id: model.template.id, status: model.template.status },
            null,
            2,
          ),
          issues: [],
        },
      };
    case 'saveRequested':
      return { ...model, dirty: false };
    default:
      return model;
  }
}

function TemplatePreviewDemo() {
  const [model, setModel] = useState<EhrTemplateViewModel>(() => ({
    template: initialTemplate,
    fieldLibrary: allLibraryFields,
    fieldLibraryQuery: '',
    selectedSectionId: 'examination',
    preview: deriveTemplatePreview(initialTemplate),
    loading: false,
    saving: false,
    dirty: false,
  }));
  return <EmrTemplatePreview model={model} onIntent={intent => setModel(m => reduceTemplateIntent(m, intent))} />;
}

function TemplateComposerDemo() {
  const [model, setModel] = useState<EhrTemplateViewModel>(() => ({
    template: initialTemplate,
    fieldLibrary: allLibraryFields,
    fieldLibraryQuery: '',
    selectedSectionId: 'examination',
    preview: deriveTemplatePreview(initialTemplate),
    loading: false,
    saving: false,
    dirty: false,
  }));
  return <EmrTemplateComposer model={model} onIntent={intent => setModel(m => reduceTemplateIntent(m, intent))} />;
}

export const gallery: GallerySection[] = [
  { id: 'terminology-search', title: 'EmrTerminologySearch', render: TerminologySearchDemo },
  { id: 'validation-rule-editor', title: 'EmrValidationRuleEditor', render: ValidationRuleEditorDemo },
  { id: 'field-generator', title: 'EmrFieldGenerator', render: FieldGeneratorDemo },
  { id: 'field-library-picker', title: 'EmrFieldLibraryPicker', render: FieldLibraryPickerDemo },
  { id: 'template-preview', title: 'EmrTemplatePreview', render: TemplatePreviewDemo },
  { id: 'template-composer', title: 'EmrTemplateComposer', render: TemplateComposerDemo },
];
