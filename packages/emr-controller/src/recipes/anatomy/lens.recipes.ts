import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const wide = { width: 1400, height: 1000 } as const;
const square = { width: 1200, height: 1200 } as const;

/** Lens views: sagittal sections with anterior up, and a retroillumination chart with N and T following the examiner's view of that eye. */
export const LENS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'lens-cross-section', version: 1, group: 'lens', label: 'Lens — sagittal cross-section', region: 'lens', view: 'sagittal cross-section',
    laterality: 'not-applicable', asset: 'lens/lens-cross-section.svg', ...wide, provenance,
    description: 'Sagittal schematic of the crystalline lens with anterior up: anterior and posterior capsule, cortex and nucleus, zonules, ciliary body and processes on both sides, and the iris for context.',
  },
  {
    id: 'lens-slit-section', version: 1, group: 'lens', label: 'Lens — slit-lamp optical section', region: 'lens', view: 'slit-lamp optical section',
    laterality: 'not-applicable', asset: 'lens/lens-slit-section.svg', ...wide, provenance,
    description: 'Slit-lamp optical section of the lens with anterior up and the slit beam marked: anterior capsule, anterior cortex, adult, infantile, fetal and embryonic nuclear zones, posterior cortex and posterior capsule, for grading nuclear opacity.',
  },
  {
    id: 'lens-retroillumination-od', version: 1, group: 'lens', label: 'Lens retroillumination — right eye (OD)', region: 'right lens', view: 'retroillumination',
    laterality: 'right', asset: 'lens/lens-retroillumination-od.svg', ...square, provenance,
    description: 'Red-reflex retroillumination chart of the right lens: dilated pupil circle with dashed zone rings and clock-hour radials, 12, 3, 6 and 9 labelled; nasal on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'lens-retroillumination-os', version: 1, group: 'lens', label: 'Lens retroillumination — left eye (OS)', region: 'left lens', view: 'retroillumination',
    laterality: 'left', asset: 'lens/lens-retroillumination-os.svg', ...square, provenance,
    description: 'Red-reflex retroillumination chart of the left lens: dilated pupil circle with dashed zone rings and clock-hour radials, 12, 3, 6 and 9 labelled; nasal on the viewer\'s left, labelled OS, N and T.',
  },
];
