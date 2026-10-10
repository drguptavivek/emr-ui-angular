import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Gluteal views are posterior (patient's right on the viewer's right); hip views are anterior (patient's right on the viewer's left). */
export const PELVIS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'gluteal-right', version: 1, group: 'pelvis', label: 'Gluteal region — right', region: 'gluteal', view: 'posterior',
    laterality: 'right', asset: 'pelvis/gluteal-right.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior view of the patient\'s right buttock on the viewer\'s right, with iliac crest, PSIS, gluteal fold, greater trochanter, ischial tuberosity and injection-quadrant dividers.',
  },
  {
    id: 'gluteal-left', version: 1, group: 'pelvis', label: 'Gluteal region — left', region: 'gluteal', view: 'posterior',
    laterality: 'left', asset: 'pelvis/gluteal-left.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior view of the patient\'s left buttock on the viewer\'s left, with iliac crest, PSIS, gluteal fold, greater trochanter, ischial tuberosity and injection-quadrant dividers.',
  },
  {
    id: 'hip-right', version: 1, group: 'pelvis', label: 'Hip — right', region: 'hip', view: 'anterior',
    laterality: 'right', asset: 'pelvis/hip-right.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the patient\'s right hip and upper thigh on the viewer\'s left, with ASIS, inguinal ligament, pubic tubercle, femoral triangle and greater trochanter.',
  },
  {
    id: 'hip-left', version: 1, group: 'pelvis', label: 'Hip — left', region: 'hip', view: 'anterior',
    laterality: 'left', asset: 'pelvis/hip-left.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the patient\'s left hip and upper thigh on the viewer\'s right, with ASIS, inguinal ligament, pubic tubercle, femoral triangle and greater trochanter.',
  },
];
