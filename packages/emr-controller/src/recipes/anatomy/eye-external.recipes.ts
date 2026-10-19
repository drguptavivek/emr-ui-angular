import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1400, height: 1000 } as const;

/** External (anterior) eye as the examiner faces the patient. OD: nasal on the viewer's right; OS: nasal on the viewer's left. */
export const EYE_EXTERNAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'external-eye-od', version: 1, group: 'eye-external', label: 'External eye — right eye (OD)', region: 'right eye', view: 'external',
    laterality: 'right', asset: 'eye-external/external-eye-od.svg', ...size, provenance,
    description: 'Outline of the right eye seen from the front: upper and lower lids with lash line, lid creases, palpebral aperture, iris and pupil, and the caruncle at the nasal canthus; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'external-eye-os', version: 1, group: 'eye-external', label: 'External eye — left eye (OS)', region: 'left eye', view: 'external',
    laterality: 'left', asset: 'eye-external/external-eye-os.svg', ...size, provenance,
    description: 'Outline of the left eye seen from the front: upper and lower lids with lash line, lid creases, palpebral aperture, iris and pupil, and the caruncle at the nasal canthus; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
];
