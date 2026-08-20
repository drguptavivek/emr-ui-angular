import type {
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  DiagnosticResultViewModel,
  SpectaclePrescriptionViewModel
} from '@drguptavivek/emr-controller';

const eyeColumns = [
  { id: 'od', label: 'Right eye (OD)', shortLabel: 'OD' },
  { id: 'os', label: 'Left eye (OS)', shortLabel: 'OS' }
] as const;

export const externalEyeSchema: ClinicalMatrixSchema = {
  id: 'external-eye-assessment', label: 'External eye assessment', columns: eyeColumns,
  rows: [
    { id: 'lids', label: 'Lids and lashes', type: 'text' },
    { id: 'conjunctiva', label: 'Conjunctiva', type: 'text' },
    { id: 'lacrimal', label: 'Lacrimal system', type: 'text' }
  ]
};
export const externalEyeValues: ClinicalMatrixValues = {
  lids: { cells: { od: { value: 'No swelling recorded' }, os: { value: 'No swelling recorded' } }, remark: '' },
  conjunctiva: { cells: { od: { value: 'Quiet' }, os: { value: 'Not testable' } }, remark: 'Patient unable to open left eye fully' },
  lacrimal: { cells: { od: { value: 'Patent' }, os: { value: 'Not recorded' } }, remark: '' }
};

export const anteriorSegmentSchema: ClinicalMatrixSchema = {
  id: 'anterior-segment-assessment', label: 'Anterior segment assessment', columns: eyeColumns,
  rows: [
    { id: 'cornea', label: 'Cornea', type: 'text' },
    { id: 'anterior-chamber', label: 'Anterior chamber', type: 'text' },
    { id: 'iris', label: 'Iris and pupil', type: 'text' },
    { id: 'lens', label: 'Lens', type: 'text' }
  ]
};
export const anteriorSegmentValues: ClinicalMatrixValues = {
  cornea: { cells: { od: { value: 'Clear' }, os: { value: 'Clear' } }, remark: '' },
  'anterior-chamber': { cells: { od: { value: 'Deep and quiet' }, os: { value: 'Deep and quiet' } }, remark: '' },
  iris: { cells: { od: { value: 'Round, reactive' }, os: { value: 'Round, reactive' } }, remark: '' },
  lens: { cells: { od: { value: 'Not recorded' }, os: { value: 'Not recorded' } }, remark: 'Slit-lamp detail pending' }
};

export const retinalAssessmentSchema: ClinicalMatrixSchema = {
  id: 'retinal-assessment', label: 'Retinal assessment', columns: eyeColumns,
  rows: [
    { id: 'disc', label: 'Optic disc', type: 'text' },
    { id: 'macula', label: 'Macula', type: 'text' },
    { id: 'vessels', label: 'Vessels', type: 'text' },
    { id: 'periphery', label: 'Periphery', type: 'text' }
  ]
};
export const retinalAssessmentValues: ClinicalMatrixValues = {
  disc: { cells: { od: { value: 'Not recorded' }, os: { value: 'Not recorded' } }, remark: '' },
  macula: { cells: { od: { value: 'Image attached' }, os: { value: 'Image attached' } }, remark: 'Review image attachment' },
  vessels: { cells: { od: { value: 'Not testable' }, os: { value: 'Not testable' } }, remark: 'Dilation not documented' },
  periphery: { cells: { od: { value: 'Not recorded' }, os: { value: 'Not recorded' } }, remark: '' }
};

export const visualAcuitySchema: ClinicalMatrixSchema = {
  id: 'visual-acuity', label: 'Visual acuity', columns: eyeColumns,
  rows: [
    { id: 'unaided-distance', label: 'Distance · unaided', type: 'text' },
    { id: 'best-corrected-distance', label: 'Distance · best corrected', type: 'text' },
    { id: 'pinhole', label: 'Pinhole', type: 'text' },
    { id: 'near', label: 'Near', type: 'text' }
  ]
};
export const visualAcuityValues: ClinicalMatrixValues = {
  'unaided-distance': { cells: { od: { value: '6/18' }, os: { value: '6/12' } }, remark: 'Snellen chart' },
  'best-corrected-distance': { cells: { od: { value: '6/9' }, os: { value: '6/9' } }, remark: '' },
  pinhole: { cells: { od: { value: '6/12' }, os: { value: 'Not testable' } }, remark: 'Left eye discomfort' },
  near: { cells: { od: { value: 'N6' }, os: { value: 'N6' } }, remark: '' }
};

export const iopSchema: ClinicalMatrixSchema = {
  id: 'intraocular-pressure', label: 'Intraocular pressure (IOP)', columns: eyeColumns,
  rows: [{ id: 'iop', label: 'IOP', type: 'decimal', unit: 'mmHg', precision: 1 }]
};
export const iopValues: ClinicalMatrixValues = {
  iop: { cells: { od: { value: 18 }, os: { value: 16 } }, remark: 'Method: Goldmann applanation' }
};

export const refractionSchema: ClinicalMatrixSchema = {
  id: 'refraction', label: 'Refraction', columns: eyeColumns,
  rows: [
    { id: 'sphere', label: 'Sphere', type: 'decimal', unit: 'D', precision: 2 },
    { id: 'cylinder', label: 'Cylinder', type: 'decimal', unit: 'D', precision: 2 },
    { id: 'axis', label: 'Axis', type: 'integer', unit: '°', precision: 0 },
    { id: 'visual-result', label: 'Resulting visual acuity', type: 'text' }
  ]
};
export const refractionValues: ClinicalMatrixValues = {
  sphere: { cells: { od: { value: -1.25 }, os: { value: -0.75 } }, remark: 'Subjective refraction' },
  cylinder: { cells: { od: { value: -0.5 }, os: { value: -0.25 } }, remark: '' },
  axis: { cells: { od: { value: 90 }, os: { value: 80 } }, remark: '' },
  'visual-result': { cells: { od: { value: '6/6' }, os: { value: '6/6' } }, remark: '' }
};

export const spectaclePrescriptionSchema: ClinicalMatrixSchema = {
  id: 'spectacle-prescription', label: 'Spectacle prescription', columns: eyeColumns,
  rows: [
    { id: 'prescription-sphere', label: 'Sphere', type: 'decimal', unit: 'D', precision: 2 },
    { id: 'prescription-cylinder', label: 'Cylinder', type: 'decimal', unit: 'D', precision: 2 },
    { id: 'prescription-axis', label: 'Axis', type: 'integer', unit: '°' },
    { id: 'addition', label: 'Near addition', type: 'decimal', unit: 'D', precision: 2 },
    { id: 'prescription-notes', label: 'Prescription notes', type: 'text' }
  ]
};
export const spectaclePrescriptionValues: ClinicalMatrixValues = {
  'prescription-sphere': { cells: { od: { value: -1.25 }, os: { value: -0.75 } }, remark: '' },
  'prescription-cylinder': { cells: { od: { value: -0.5 }, os: { value: -0.25 } }, remark: '' },
  'prescription-axis': { cells: { od: { value: 90 }, os: { value: 80 } }, remark: '' },
  addition: { cells: { od: { value: 1.5 }, os: { value: 1.5 } }, remark: 'Near addition supplied for both eyes' },
  'prescription-notes': { cells: { od: { value: 'Wear for distance' }, os: { value: 'Wear for distance' } }, remark: 'Dispensing instructions supplied separately' }
};

export const spectaclePrescriptionModel: SpectaclePrescriptionViewModel = {
  id: 'spectacle-prescription',
  label: 'Spectacle prescription',
  description: 'Enter the prescribed values for each eye. Values are retained as raw strings by the controller.',
  eyes: [{ id: 'od', label: 'Right eye', shortLabel: 'OD' }, { id: 'os', label: 'Left eye', shortLabel: 'OS' }],
  fields: [
    { id: 'sphere', label: 'Sphere', type: 'decimal', unit: 'D' },
    { id: 'cylinder', label: 'Cylinder', type: 'decimal', unit: 'D' },
    { id: 'axis', label: 'Axis', type: 'integer', unit: '°' },
    { id: 'addition', label: 'Near addition', type: 'decimal', unit: 'D' },
    { id: 'prism', label: 'Prism', type: 'text', unit: 'Δ' },
    { id: 'base', label: 'Base', type: 'select', options: [{ value: 'in', label: 'In' }, { value: 'out', label: 'Out' }, { value: 'up', label: 'Up' }, { value: 'down', label: 'Down' }] },
    { id: 'visual-acuity', label: 'Visual acuity', type: 'text' }
  ],
  values: {
    od: { sphere: '-1.25', cylinder: '-0.50', axis: '090', addition: '+1.50', prism: '', base: '', 'visual-acuity': '6/6' },
    os: { sphere: '-0.75', cylinder: '-0.25', axis: '080', addition: '+1.50', prism: '', base: '', 'visual-acuity': '6/6' }
  },
  notes: { od: '', os: 'Near addition supplied for both eyes.' }
};

export const spectaclePrescriptionErrorsModel: SpectaclePrescriptionViewModel = {
  ...spectaclePrescriptionModel,
  errors: { 'od.axis': 'Axis is required for the right eye.', 'os.notes': 'Add a dispensing note or explicitly record that none was supplied.' }
};

export const perimetryResult: DiagnosticResultViewModel = {
  id: 'perimetry-2026-08-19', title: 'Perimetry result', subtitle: 'Automated visual field examination',
  metadata: [
    { label: 'Right eye (OD)', value: 'Tested · 19 Aug 2026, 10:15' },
    { label: 'Left eye (OS)', value: 'Tested · 19 Aug 2026, 10:24' },
    { label: 'Method', value: 'Humphrey 24-2 · stimulus details supplied by device' }
  ],
  metrics: [
    { id: 'od-reliability', label: 'Right eye (OD) · reliability fields', valueLabel: 'Fixation losses and false responses recorded', referenceLabel: 'See device report', helpText: 'Device-provided description; no grading applied.' },
    { id: 'os-reliability', label: 'Left eye (OS) · reliability fields', valueLabel: 'Reliability data available', referenceLabel: 'See device report' },
    { id: 'od-indices', label: 'Right eye (OD) · summary indices', valueLabel: 'MD and PSD available in report', referenceLabel: 'See device report' },
    { id: 'os-indices', label: 'Left eye (OS) · summary indices', valueLabel: 'MD and PSD available in report', referenceLabel: 'See device report' }
  ],
  interpretation: 'No automated interpretation is displayed here. Review the supplied plot and report in the clinical workflow.',
  attachments: [
    { id: 'od-plot', label: 'Open OD plot', kind: 'plot', assistiveDescription: 'Open right eye visual field plot' },
    { id: 'os-plot', label: 'Open OS plot', kind: 'plot', assistiveDescription: 'Open left eye visual field plot' },
    { id: 'full-report', label: 'Open full report', kind: 'report' }
  ]
};

export const pmtStoryNote = 'PMT is not included in this catalogue until its workflow, terminology, and result model are defined.';
