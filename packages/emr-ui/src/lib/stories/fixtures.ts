import {
  ClinicalListItem,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  FavouriteEntry,
  FavouritesViewModel,
  HierarchyOrderViewModel,
  NavItem,
  PatientBannerViewModel,
  PatientListViewModel,
  TimelineEvent,
  TimelineKindDefinition
} from '@drguptavivek/emr-controller';

export const navItems: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients', label: 'Patients', badge: { label: '12', tone: 'info' } },
  {
    id: 'clinical', label: 'Clinical', children: [
      { id: 'encounters', label: 'Encounters' },
      { id: 'orders', label: 'Orders', badge: { label: '3', tone: 'warning' } },
      { id: 'notes', label: 'Notes' }
    ]
  },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' }
];

export const patientBanner: PatientBannerViewModel = {
  patientId: 'patient-001',
  displayName: 'Ananya Rao',
  identifiers: [
    { label: 'MRN', value: 'MRN-204881' },
    { label: 'UHID', value: 'AIIMS-008221' }
  ],
  ageLabel: '58 years',
  sexLabel: 'Female',
  careSetting: 'opd',
  careSettingLabel: 'OPD · Ophthalmology',
  locationLabel: 'Clinic 4 · Queue 07',
  encounterLabel: 'Follow-up for diabetic eye disease · 19 Aug 2026',
  criticality: { label: 'High risk', tone: 'warning', assistiveText: 'Requires clinical review' },
  vip: { label: 'Priority', tone: 'info' },
  allergies: [
    { id: 'a1', label: 'Penicillin', tone: 'danger', detail: 'Rash' },
    { id: 'a2', label: 'Latex', tone: 'warning' },
    { id: 'a3', label: 'Ibuprofen', tone: 'danger' }
  ],
  allergyStatus: { label: 'Allergy status reviewed', tone: 'warning' },
  chronicDiseases: [
    { id: 'd1', label: 'Type 2 diabetes', tone: 'info' },
    { id: 'd2', label: 'Hypertension', tone: 'info' }
  ],
  chronicDiseaseStatus: { label: 'Active conditions recorded', tone: 'info' },
  alerts: [{ id: 'alert1', label: 'Fall risk', tone: 'warning' }],
  expanded: true
};

export const patientList: PatientListViewModel = {
  query: '',
  rows: [
    { patientId: 'patient-001', displayName: 'Ananya Rao', primaryIdentifier: 'MRN-204881', abha: { value: 'ananya.rao@abdm' }, ageLabel: '58 y', sexLabel: 'F', careSettingLabel: 'OPD', locationLabel: 'Ophthalmology · C4', queueLabel: '07', status: { label: 'Waiting', tone: 'warning' }, alerts: patientBanner.allergies },
    { patientId: 'patient-002', displayName: 'Rohan Mehta', primaryIdentifier: 'MRN-204882', ageLabel: '42 y', sexLabel: 'M', careSettingLabel: 'IPD', locationLabel: 'Ward 3 · Bed 12', queueLabel: '—', status: { label: 'In review', tone: 'info' } },
    { patientId: 'patient-003', displayName: 'Meera Joseph', primaryIdentifier: 'MRN-204883', abha: { value: 'meera.joseph@abdm' }, ageLabel: '71 y', sexLabel: 'F', careSettingLabel: 'Emergency', locationLabel: 'Resuscitation 2', queueLabel: 'STAT', status: { label: 'Urgent', tone: 'danger' }, alerts: [{ id: 'fall', label: 'Fall risk', tone: 'warning' }] },
    { patientId: 'patient-004', displayName: 'Arjun Singh', primaryIdentifier: 'MRN-204884', ageLabel: '36 y', sexLabel: 'M', careSettingLabel: 'OPD', locationLabel: 'Neurology · C2', queueLabel: '15', status: { label: 'Completed', tone: 'success' } }
  ],
  selectedPatientId: 'patient-001', loading: false, page: 1, pageSize: 10, total: 4,
  sort: { field: 'displayName', direction: 'asc' }
};

export const timelineKinds: readonly TimelineKindDefinition[] = [
  { id: 'encounter', label: 'Encounter', tone: 'info' },
  { id: 'lab', label: 'Laboratory', tone: 'success' },
  { id: 'imaging', label: 'Imaging', tone: 'warning' },
  { id: 'note', label: 'Clinical note', tone: 'neutral' }
];

export const timelineEvents: readonly TimelineEvent[] = [
  { id: 't1', occurredAt: '2026-08-19T09:00:00Z', dateLabel: '19 Aug 2026 · 09:00', title: 'Ophthalmology follow-up', summary: 'Visual acuity and retinal review', kindId: 'encounter', encounterId: 'enc-1' },
  { id: 't2', occurredAt: '2026-07-22T11:30:00Z', dateLabel: '22 Jul 2026 · 11:30', title: 'HbA1c and renal profile', summary: 'Results reviewed by clinic', kindId: 'lab' },
  { id: 't3', occurredAt: '2026-06-10T15:15:00Z', dateLabel: '10 Jun 2026 · 15:15', title: 'OCT macula', summary: 'Stable centre-involving changes', kindId: 'imaging' },
  { id: 't4', occurredAt: '2026-05-02T10:00:00Z', dateLabel: '02 May 2026 · 10:00', title: 'Care plan updated', summary: 'Diabetes and blood pressure targets discussed', kindId: 'note' }
];

const eyeColumns = [{ id: 'od', label: 'Right eye (OD)', shortLabel: 'OD' }, { id: 'os', label: 'Left eye (OS)', shortLabel: 'OS' }];

export const ophthalmologySchema: ClinicalMatrixSchema = {
  id: 'ophthalmology-assessment', label: 'Ophthalmic assessment', columns: eyeColumns,
  rows: [
    { id: 'va-distance', label: 'Distance visual acuity', type: 'text', helpText: 'Unaided or best corrected' },
    { id: 'iop', label: 'Intraocular pressure', type: 'decimal', unit: 'mmHg', precision: 1 },
    { id: 'spherical-equivalent', label: 'Spherical equivalent', type: 'decimal', unit: 'D', precision: 2 },
    { id: 'pupil', label: 'Pupil response', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'sluggish', label: 'Sluggish' }, { value: 'rapd', label: 'RAPD' }] },
    { id: 'dilation', label: 'Dilated examination', type: 'boolean' },
    { id: 'exam-date', label: 'Examination date', type: 'date' }
  ]
};

export const ophthalmologyValues: ClinicalMatrixValues = {
  'va-distance': { cells: { od: { value: '6/12' }, os: { value: '6/9' } }, remark: 'Improves with pinhole' },
  iop: { cells: { od: { value: 18, warning: 'Review with progression data' }, os: { value: 16 } }, remark: '' },
  'spherical-equivalent': { cells: { od: { value: -1.25 }, os: { value: -0.75 } }, remark: '' },
  pupil: { cells: { od: { value: 'normal' }, os: { value: 'normal' } }, remark: '' },
  dilation: { cells: { od: { value: true }, os: { value: true } }, remark: 'Tolerated well' },
  'exam-date': { cells: { od: { value: '2026-08-19' }, os: { value: '2026-08-19' } }, remark: '' }
};

export const neurologySchema: ClinicalMatrixSchema = {
  id: 'neurology-motor-reflex', label: 'Neurology · motor power and reflexes',
  columnGroups: [
    { id: 'upper-limbs', label: 'Upper limbs', columnIds: ['right-arm', 'left-arm'] },
    { id: 'lower-limbs', label: 'Lower limbs', columnIds: ['right-leg', 'left-leg'] }
  ],
  columns: [
    { id: 'right-arm', label: 'Right arm', shortLabel: 'R arm' }, { id: 'left-arm', label: 'Left arm', shortLabel: 'L arm' },
    { id: 'right-leg', label: 'Right leg', shortLabel: 'R leg' }, { id: 'left-leg', label: 'Left leg', shortLabel: 'L leg' }
  ],
  rows: [
    { id: 'power', label: 'Power (MRC)', type: 'integer', precision: 0, helpText: '0–5 scale' },
    { id: 'tone', label: 'Tone', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'increased', label: 'Increased' }, { value: 'reduced', label: 'Reduced' }] },
    { id: 'biceps', label: 'Biceps reflex', type: 'select', applicableColumnIds: ['right-arm', 'left-arm'], options: [{ value: 'normal', label: 'Normal 2+' }, { value: 'brisk', label: 'Brisk 3+' }, { value: 'absent', label: 'Absent 0' }] },
    { id: 'knee', label: 'Knee reflex', type: 'select', applicableColumnIds: ['right-leg', 'left-leg'], options: [{ value: 'normal', label: 'Normal 2+' }, { value: 'brisk', label: 'Brisk 3+' }, { value: 'absent', label: 'Absent 0' }] },
    { id: 'plantar', label: 'Plantar response', type: 'select', applicableColumnIds: ['right-leg', 'left-leg'], options: [{ value: 'down', label: 'Down-going' }, { value: 'up', label: 'Up-going' }, { value: 'equivocal', label: 'Equivocal' }] }
  ]
};

export const neurologyValues: ClinicalMatrixValues = {
  power: { cells: { 'right-arm': { value: 5 }, 'left-arm': { value: 4 }, 'right-leg': { value: 5 }, 'left-leg': { value: 4, warning: 'Compare with prior examination' } }, remark: 'Mild left-sided weakness' },
  tone: { cells: { 'right-arm': { value: 'normal' }, 'left-arm': { value: 'increased' }, 'right-leg': { value: 'normal' }, 'left-leg': { value: 'increased' } }, remark: '' },
  biceps: { cells: { 'right-arm': { value: 'normal' }, 'left-arm': { value: 'brisk' } }, remark: '' },
  knee: { cells: { 'right-leg': { value: 'normal' }, 'left-leg': { value: 'brisk' } }, remark: '' },
  plantar: { cells: { 'right-leg': { value: 'down' }, 'left-leg': { value: 'equivocal' } }, remark: 'Repeat on next review' }
};

export const clinicalItems: readonly ClinicalListItem[] = [
  { id: 'm1', title: 'Metformin 500 mg', subtitle: 'Twice daily with meals', detail: 'Active · Started 2024', badges: [{ label: 'Long-term', tone: 'info' }] },
  { id: 'm2', title: 'Latanoprost 0.005%', subtitle: 'One drop at night · Both eyes', detail: 'Active · Reconciled today', badges: [{ label: 'Eye drop', tone: 'success' }] },
  { id: 'm3', title: 'Aspirin 75 mg', subtitle: 'Once daily', detail: 'Prescribed by cardiology', readOnly: true }
];

export const emptyClinicalItems: readonly ClinicalListItem[] = [];

const labNodes = [
  { id: 'lab-haem', label: 'Haematology', kind: 'group' as const, selectable: false, expanded: true, children: [
    { id: 'lab-cbc', label: 'Complete blood count', code: 'CBC', kind: 'item' as const, selectable: true },
    { id: 'lab-esr', label: 'Erythrocyte sedimentation rate', code: 'ESR', kind: 'item' as const, selectable: true }
  ] },
  { id: 'lab-chem', label: 'Clinical chemistry', kind: 'group' as const, selectable: true, expanded: false, children: [
    { id: 'lab-hba1c', label: 'Glycated haemoglobin', code: 'HBA1C', kind: 'item' as const, selectable: true },
    { id: 'lab-creatinine', label: 'Serum creatinine', code: 'CREAT', kind: 'item' as const, selectable: true }
  ] }
];

const radiologyNodes = [
  { id: 'rad-ct', label: 'CT', kind: 'group' as const, selectable: false, expanded: true, children: [{ id: 'rad-ct-head', label: 'CT head without contrast', code: 'CT-HEAD-NC', kind: 'item' as const, selectable: true }] },
  { id: 'rad-mri', label: 'MRI', kind: 'group' as const, selectable: true, expanded: true, children: [{ id: 'rad-mri-brain', label: 'MRI brain with screening sequences', code: 'MRI-BRAIN', kind: 'item' as const, selectable: true }] },
  { id: 'rad-us', label: 'Ultrasound', kind: 'group' as const, selectable: false, expanded: false, children: [{ id: 'rad-us-carotid', label: 'Carotid Doppler', code: 'US-CAROTID', kind: 'item' as const, selectable: true }] }
];

export const labOrderState: HierarchyOrderViewModel = {
  title: 'Order laboratory tests', query: '', roots: labNodes, loading: false,
  selected: [{ id: 'order-cbc', catalogueId: 'lab-cbc', label: 'Complete blood count', code: 'CBC', kind: 'laboratory', details: { urgency: 'routine', fasting: false, notes: 'Baseline before review' } }]
};

export const radiologyOrderState: HierarchyOrderViewModel = {
  title: 'Order radiology', query: 'brain', roots: radiologyNodes, loading: false,
  selected: [{ id: 'order-mri', catalogueId: 'rad-mri-brain', label: 'MRI brain with screening sequences', code: 'MRI-BRAIN', kind: 'radiology', details: { urgency: 'urgent', bodySite: 'Brain', laterality: 'not-applicable', contrast: true, clinicalIndication: 'Left-sided weakness' } }],
  preview: { groupId: 'rad-mri', groupLabel: 'MRI', items: [{ catalogueId: 'rad-mri-brain', label: 'MRI brain with screening sequences', code: 'MRI-BRAIN' }], duplicateIds: [] }
};

export const favourites: readonly FavouriteEntry[] = [
  { id: 'fav-1', name: 'Diabetes follow-up', kind: 'combination', summary: 'HbA1c, renal profile and eye review', updatedAt: '2026-08-19', orderTemplates: [{ id: 'template-hba1c', catalogueId: 'lab-hba1c', label: 'Glycated haemoglobin', code: 'HBA1C', kind: 'laboratory' }, { id: 'template-creat', catalogueId: 'lab-creatinine', label: 'Serum creatinine', code: 'CREAT', kind: 'laboratory' }] },
  { id: 'fav-2', name: 'Glaucoma review', kind: 'medication', summary: 'Latanoprost and adherence counselling', updatedAt: '2026-08-17', orderTemplates: [{ id: 'template-latanoprost', catalogueId: 'med-latanoprost', label: 'Latanoprost 0.005%', kind: 'medication' }] }
];

export const favouritesState: FavouritesViewModel = { open: true, mode: 'list', activeKind: 'combination', query: '', items: favourites, loading: false };
export const favouritesLoadingState: FavouritesViewModel = { ...favouritesState, items: [], loading: true };
export const favouritesErrorState: FavouritesViewModel = { ...favouritesState, error: 'The favourites service is temporarily unavailable.' };
