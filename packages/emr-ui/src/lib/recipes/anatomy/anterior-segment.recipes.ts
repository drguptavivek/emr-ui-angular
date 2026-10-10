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
  {
    id: 'angle-gonioscopy-od', version: 1, group: 'anterior-segment', label: 'Angle gonioscopy chart — right eye (OD)', region: 'right eye, iridocorneal angle', view: 'gonioscopy chart',
    laterality: 'right', asset: 'anterior-segment/angle-gonioscopy-od.svg', ...size, provenance,
    description: 'Gonioscopy angle chart of the right eye: concentric rings for Schwalbe\'s line, trabecular meshwork, scleral spur, ciliary body band and iris root, split into superior, nasal, inferior and temporal quadrants with clock hours 12, 3, 6 and 9; nasal on the viewer\'s right, labelled OD.',
  },
  {
    id: 'angle-gonioscopy-os', version: 1, group: 'anterior-segment', label: 'Angle gonioscopy chart — left eye (OS)', region: 'left eye, iridocorneal angle', view: 'gonioscopy chart',
    laterality: 'left', asset: 'anterior-segment/angle-gonioscopy-os.svg', ...size, provenance,
    description: 'Gonioscopy angle chart of the left eye: concentric rings for Schwalbe\'s line, trabecular meshwork, scleral spur, ciliary body band and iris root, split into superior, nasal, inferior and temporal quadrants with clock hours 12, 3, 6 and 9; nasal on the viewer\'s left, labelled OS.',
  },
  {
    id: 'angle-structures', version: 1, group: 'anterior-segment', label: 'Iridocorneal angle structures', region: 'iridocorneal angle', view: 'enlarged cross-section',
    laterality: 'not-applicable', asset: 'anterior-segment/angle-structures.svg', ...size, provenance,
    description: 'Enlarged schematic cross-section of the iridocorneal angle with anterior up: cornea, Schwalbe\'s line, trabecular meshwork, Schlemm\'s canal, scleral spur, ciliary body band, iris root, ciliary body and sclera.',
  },
];
