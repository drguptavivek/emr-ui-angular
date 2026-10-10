import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Head and scalp outlines: front, back, vertex and both sides. Ears and hairline are landmarks. */
export const HEAD_SCALP_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'head-front', version: 1, group: 'head-scalp', label: 'Head — front', region: 'head', view: 'front',
    laterality: 'bilateral', asset: 'head-scalp/head-front.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from the front, with the frontal hairline, ears, eyes, nose and mouth as light landmarks. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'head-back', version: 1, group: 'head-scalp', label: 'Head — back', region: 'head', view: 'back',
    laterality: 'bilateral', asset: 'head-scalp/head-back.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from behind, with the ears, the occipital prominence, the nape hairline and a dashed midline over the scalp. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'head-vertex', version: 1, group: 'head-scalp', label: 'Head — vertex', region: 'head', view: 'vertex',
    laterality: 'bilateral', asset: 'head-scalp/head-vertex.svg', width: 1000, height: 1000, provenance,
    description: 'Top of the head seen from above with the nose at the top of the image, the ears at the sides, the anterior hairline and a dashed sagittal midline. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'head-right-side', version: 1, group: 'head-scalp', label: 'Head — right side', region: 'head', view: 'right lateral',
    laterality: 'right', asset: 'head-scalp/head-right-side.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from the patient\'s right side, facing the viewer\'s right, with the ear, hairline and jaw line as landmarks. Anterior (A) is on the right of the image and posterior (P) on the left.',
  },
  {
    id: 'head-left-side', version: 1, group: 'head-scalp', label: 'Head — left side', region: 'head', view: 'left lateral',
    laterality: 'left', asset: 'head-scalp/head-left-side.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from the patient\'s left side, facing the viewer\'s left, with the ear, hairline and jaw line as landmarks. Anterior (A) is on the left of the image and posterior (P) on the right.',
  },
];
