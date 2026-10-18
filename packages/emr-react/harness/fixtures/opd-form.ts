import type { ClinicalFormViewModel, ClinicalOption } from '@drguptavivek/emr-controller';

// Choice lists copied from VCMS dictionary/choices.csv (PEC_OPD_Register). Patient values are synthetic.
const opts = (labels: string[], start = 1): ClinicalOption[] => labels.map((label, i) => ({ value: String(i + start), label }));
const yesNo = opts(['Yes', 'No']);
const grade = opts(['Referred', 'Not Referred', 'Ungradable']);
const specType = opts(['Near', 'Distance', 'Near+Distance']);
const presentingVa = opts(['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', '5/60', '4/60', '3/60', '2/60', '1/60', 'FCCF', 'HMCF', 'PL+', 'PL-/ Phthisical Eye', 'NC']);
const advice = opts(['1-Referred to RPC', '2-Referred to DR Clinic', '3-Refraction', '4-Refraction & Referred to RPC', '5-No further Intervention', '6-Same Glass Continue', '7-Followup Next Week', '8-Not Referred due to Complication']);
const clinic = opts(['Cataract', 'Retina Opinion', 'Oculoplasty Opinion', 'Glaucoma Opinion', 'Squint Opinion', 'Lasik Opinion', 'Eye Bank Opinion', 'ROP Opinion', 'Myopia Opinion', 'Lens Opinion', 'Cornea Opinion', 'Uvea Opinion', 'Amblyopia Opinion', 'DR Opinion'], 0);

export const opdFormFixture: ClinicalFormViewModel = {
  schema: {
    id: 'opd',
    label: 'OPD Register (synthetic)',
    description: 'Synthetic patient. Choice lists from the VCMS OPD Register.',
    sections: [
      { id: 'patient', label: 'Patient', blocks: [
        { id: 'name', label: 'Patient name', type: 'text', span: 6, required: true },
        { id: 'age', label: 'Age in years', type: 'integer', span: 3, required: true },
        { id: 'sex', label: 'Sex', type: 'select', span: 3, required: true, options: opts(['Male', 'Female']) },
      ] },
      { id: 'va', label: 'Presenting visual acuity', blocks: [
        { id: 'pva_re', label: 'Right eye (OD)', type: 'select', span: 6, options: presentingVa },
        { id: 'pva_le', label: 'Left eye (OS)', type: 'select', span: 6, options: presentingVa },
      ] },
      { id: 'refraction', label: 'Spectacles', blocks: [
        { id: 'SpecPres', label: 'Spectacles prescribed', type: 'select', span: 6, required: true, options: yesNo },
        { id: 'SpecType', label: 'Spectacle type', type: 'select', span: 6, options: specType },
      ] },
      { id: 'glaucoma', label: 'Glaucoma screen', collapsible: true, blocks: [
        { id: 'IOP_RE', label: 'IOP right eye', type: 'quantity', unit: 'mmHg', span: 3 },
        { id: 'IOP_LE', label: 'IOP left eye', type: 'quantity', unit: 'mmHg', span: 3 },
        { id: 'CDR_RE', label: 'CD ratio right eye', type: 'decimal', precision: 2, span: 3 },
        { id: 'CDR_LE', label: 'CD ratio left eye', type: 'decimal', precision: 2, span: 3 },
        { id: 'aiDecisionGL', label: 'AI decision (glaucoma)', type: 'select', span: 12, options: grade },
      ] },
      { id: 'advice', label: 'Advice and referral', blocks: [
        { id: 'advice', label: 'Advice', type: 'select', span: 12, required: true, options: advice },
        { id: 'clinic', label: 'Referred clinic', type: 'multiselect', span: 12, options: clinic },
        { id: 'notes', label: 'Notes', type: 'multiline', span: 12, rows: 3 },
        { id: 'cohort', label: 'Study cohort', type: 'custom', customRendererKey: 'cohort-picker', span: 12 },
      ] },
    ],
  },
  fields: {
    name: { value: 'Test Patient A' },
    age: { value: 58 },
    sex: { value: '2' },
    pva_re: { value: '4' },
    pva_le: { value: null },
    SpecPres: { value: null },
    SpecType: { value: null, hidden: true },
    CDR_RE: { value: 0.7, warning: 'Above 0.6: confirm with the optometrist.' },
    IOP_LE: { value: { value: 31, unit: 'mmHg' }, error: 'Must be between 0 and 50.' },
    advice: { value: null },
    clinic: { value: [] },
  },
  repeatableGroups: {},
};
