import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Face outlines: frontal and both profiles, with eyes, nose, lips and ears as light landmarks. */
export const FACE_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'face-frontal', version: 1, group: 'face', label: 'Face — frontal', region: 'face', view: 'frontal',
    laterality: 'bilateral', asset: 'face/face-frontal.svg', width: 1000, height: 1200, provenance,
    description: 'Face seen from the front from hairline to chin, with eyebrows, eyes, nose, lips and ears as light landmarks. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'face-right-profile', version: 1, group: 'face', label: 'Face — right profile', region: 'face', view: 'right profile',
    laterality: 'right', asset: 'face/face-right-profile.svg', width: 1000, height: 1200, provenance,
    description: 'Face seen in profile from the patient\'s right side, facing the viewer\'s right, with brow, eye, nose, lips, chin and ear as light landmarks. Anterior (A) is on the right of the image and posterior (P) on the left.',
  },
  {
    id: 'face-left-profile', version: 1, group: 'face', label: 'Face — left profile', region: 'face', view: 'left profile',
    laterality: 'left', asset: 'face/face-left-profile.svg', width: 1000, height: 1200, provenance,
    description: 'Face seen in profile from the patient\'s left side, facing the viewer\'s left, with brow, eye, nose, lips, chin and ear as light landmarks. Anterior (A) is on the left of the image and posterior (P) on the right.',
  },
];
