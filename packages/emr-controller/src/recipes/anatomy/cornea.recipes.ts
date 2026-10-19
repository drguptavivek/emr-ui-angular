import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1200, height: 1200 } as const;

/** Cornea face-on with limbus and clock hours as the examiner sees it; 3 o'clock is on the viewer's right for both eyes. */
export const CORNEA_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'cornea-od', version: 1, group: 'cornea', label: 'Cornea — right eye (OD)', region: 'right eye', view: 'face-on',
    laterality: 'right', asset: 'cornea/cornea-od.svg', ...size, provenance,
    description: 'Circular cornea of the right eye with limbus ring, dashed pupil outline, centre cross lines and clock-hour ticks with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'cornea-os', version: 1, group: 'cornea', label: 'Cornea — left eye (OS)', region: 'left eye', view: 'face-on',
    laterality: 'left', asset: 'cornea/cornea-os.svg', ...size, provenance,
    description: 'Circular cornea of the left eye with limbus ring, dashed pupil outline, centre cross lines and clock-hour ticks with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
];
