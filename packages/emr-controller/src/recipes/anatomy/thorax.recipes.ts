import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Chest, axillae and breasts. Anterior views: patient's right on the viewer's left. Posterior views: patient's right on the viewer's right. Breast clocks follow the examiner facing the patient. */
export const THORAX_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'chest-anterior', version: 1, group: 'thorax', label: 'Chest — anterior', region: 'chest', view: 'anterior',
    laterality: 'bilateral', asset: 'thorax/chest-anterior.svg', width: 1200, height: 1100, provenance,
    description: 'Anterior chest outline from neck base to lower ribs with clavicles, sternal midline and angle, costal margins and nipples; patient\'s right on the viewer\'s left (marked R).',
  },
  {
    id: 'chest-posterior', version: 1, group: 'thorax', label: 'Chest — posterior', region: 'chest', view: 'posterior',
    laterality: 'bilateral', asset: 'thorax/chest-posterior.svg', width: 1200, height: 1100, provenance,
    description: 'Posterior chest outline from C7 to T12 with both scapulae and a dotted spinous-process midline; patient\'s right on the viewer\'s right (marked R).',
  },
  {
    id: 'axilla-right', version: 1, group: 'thorax', label: 'Axilla — right', region: 'axilla', view: 'anterior',
    laterality: 'right', asset: 'thorax/axilla-right.svg', width: 1200, height: 1100, provenance,
    description: 'Anterior upper torso with the patient\'s right arm abducted to expose the axilla, showing the anterior axillary fold; right is on the viewer\'s left (marked R).',
  },
  {
    id: 'axilla-left', version: 1, group: 'thorax', label: 'Axilla — left', region: 'axilla', view: 'anterior',
    laterality: 'left', asset: 'thorax/axilla-left.svg', width: 1200, height: 1100, provenance,
    description: 'Anterior upper torso with the patient\'s left arm abducted to expose the axilla, showing the anterior axillary fold; left is on the viewer\'s right (marked L).',
  },
  {
    id: 'breast-right', version: 1, group: 'thorax', label: 'Breast — right', region: 'breast', view: 'anterior',
    laterality: 'right', asset: 'thorax/breast-right.svg', width: 1200, height: 1200, provenance,
    description: 'Right breast as a clock-face circle with 12, 3, 6 and 9 o\'clock marks, areola and nipple at the centre and an axillary tail toward the viewer\'s left; clock as the examiner faces the patient.',
  },
  {
    id: 'breast-left', version: 1, group: 'thorax', label: 'Breast — left', region: 'breast', view: 'anterior',
    laterality: 'left', asset: 'thorax/breast-left.svg', width: 1200, height: 1200, provenance,
    description: 'Left breast as a clock-face circle with 12, 3, 6 and 9 o\'clock marks, areola and nipple at the centre and an axillary tail toward the viewer\'s right; clock as the examiner faces the patient.',
  },
];
