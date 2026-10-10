import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Child (about 5 years) and infant bodies in anatomical position, anterior and posterior. The infant head is about a quarter of the height; the anterior view shows the anterior fontanelle. */
export const PAEDIATRIC_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'child-body-anterior', version: 1, group: 'paediatric', label: 'Child body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'paediatric/child-body-anterior.svg', width: 800, height: 1400, provenance,
    description: 'Child of about five years seen from the front in anatomical position, with a proportionally larger head and shorter legs than an adult. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'child-body-posterior', version: 1, group: 'paediatric', label: 'Child body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'paediatric/child-body-posterior.svg', width: 800, height: 1400, provenance,
    description: 'Child of about five years seen from behind in anatomical position, with the spine, scapulae and gluteal folds marked. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'infant-body-anterior', version: 1, group: 'paediatric', label: 'Infant body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'paediatric/infant-body-anterior.svg', width: 800, height: 1400, provenance,
    description: 'Infant seen from the front, head about a quarter of the height, short limbs and a rounded trunk, with the anterior fontanelle shown as a light diamond on the crown. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'infant-body-posterior', version: 1, group: 'paediatric', label: 'Infant body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'paediatric/infant-body-posterior.svg', width: 800, height: 1400, provenance,
    description: 'Infant seen from behind, head about a quarter of the height, with the spine, scapulae and gluteal folds marked. The patient\'s right is on the viewer\'s right, marked R.',
  },
];
