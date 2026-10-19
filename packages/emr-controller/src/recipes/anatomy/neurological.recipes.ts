import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1000, height: 1600 } as const;

/**
 * Whole-body neurological maps. Anterior views put the patient's right on the viewer's left (marked R);
 * posterior views put it on the viewer's right. Boundaries are dashed; labels sit inside their territories.
 */
export const NEUROLOGICAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'dermatomes-anterior', version: 1, group: 'neurological', label: 'Dermatomes — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'neurological/dermatomes-anterior.svg', ...size, provenance,
    description: 'Whole-body anterior outline with dashed dermatome boundaries labelled V1–V3 on the face and C3 to S1 on the neck, trunk, limbs, hands and feet. Patient right is on the viewer left.',
  },
  {
    id: 'dermatomes-posterior', version: 1, group: 'neurological', label: 'Dermatomes — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'neurological/dermatomes-posterior.svg', ...size, provenance,
    description: 'Whole-body posterior outline with dashed dermatome boundaries labelled C2 to S5, including a perianal S3–S5 inset. Patient right is on the viewer right.',
  },
  {
    id: 'peripheral-nerves-anterior', version: 1, group: 'neurological', label: 'Peripheral nerve territories — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'neurological/peripheral-nerves-anterior.svg', ...size, provenance,
    description: 'Whole-body anterior outline with dashed cutaneous peripheral nerve territories labelled with short nerve names such as median, ulnar, femoral and saphenous. Patient right is on the viewer left.',
  },
  {
    id: 'peripheral-nerves-posterior', version: 1, group: 'neurological', label: 'Peripheral nerve territories — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'neurological/peripheral-nerves-posterior.svg', ...size, provenance,
    description: 'Whole-body posterior outline with dashed cutaneous peripheral nerve territories labelled with short nerve names such as occipital, cluneal, sural and radial. Patient right is on the viewer right.',
  },
];
