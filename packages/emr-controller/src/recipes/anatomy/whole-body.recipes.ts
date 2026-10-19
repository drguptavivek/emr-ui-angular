import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Whole body in anatomical position: anterior, posterior and both lateral views. A and P mark anterior and posterior on the lateral views. */
export const WHOLE_BODY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'whole-body-anterior', version: 1, group: 'whole-body', label: 'Whole body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'whole-body/whole-body-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from the front in anatomical position, arms slightly away from the trunk with palms forward. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'whole-body-posterior', version: 1, group: 'whole-body', label: 'Whole body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'whole-body/whole-body-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from behind in anatomical position, arms slightly away from the trunk, with the spine and scapulae marked. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'whole-body-right-lateral', version: 1, group: 'whole-body', label: 'Whole body — right lateral', region: 'whole body', view: 'right lateral',
    laterality: 'right', asset: 'whole-body/whole-body-right-lateral.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from the patient\'s right side, facing the viewer\'s right, arm hanging by the side. Anterior (A) is on the right of the image and posterior (P) on the left.',
  },
  {
    id: 'whole-body-left-lateral', version: 1, group: 'whole-body', label: 'Whole body — left lateral', region: 'whole body', view: 'left lateral',
    laterality: 'left', asset: 'whole-body/whole-body-left-lateral.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from the patient\'s left side, facing the viewer\'s left, arm hanging by the side. Anterior (A) is on the left of the image and posterior (P) on the right.',
  },
];
