import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1400, height: 1200 } as const;

/** Nine diagnostic gaze positions; patient's right is on the viewer's left (marked R). */
export const OCULAR_MOTILITY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'ocular-motility-chart', version: 1, group: 'ocular-motility', label: 'Ocular motility — nine gaze positions', region: 'both eyes', view: 'nine gaze positions',
    laterality: 'bilateral', asset: 'ocular-motility/ocular-motility-chart.svg', ...size, provenance,
    description: 'Three-by-three grid of the nine diagnostic gaze positions, each cell showing both eyes with the gaze direction; the patient\'s right eye is on the viewer\'s left, labelled R and L.',
  },
];
