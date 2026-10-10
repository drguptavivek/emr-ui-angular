import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1400, height: 1000 } as const;

/** Slit-lamp style cross-section of the anterior segment, anterior up; N and T follow the examiner's view of that eye. */
export const ANTERIOR_SEGMENT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'anterior-segment-od', version: 1, group: 'anterior-segment', label: 'Anterior segment — right eye (OD)', region: 'right eye', view: 'cross-section',
    laterality: 'right', asset: 'anterior-segment/anterior-segment-od.svg', ...size, provenance,
    description: 'Slit-lamp style cross-section of the right anterior segment with anterior at the top: cornea, anterior chamber, iris, lens, angle, ciliary body and sclera; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'anterior-segment-os', version: 1, group: 'anterior-segment', label: 'Anterior segment — left eye (OS)', region: 'left eye', view: 'cross-section',
    laterality: 'left', asset: 'anterior-segment/anterior-segment-os.svg', ...size, provenance,
    description: 'Slit-lamp style cross-section of the left anterior segment with anterior at the top: cornea, anterior chamber, iris, lens, angle, ciliary body and sclera; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
];
