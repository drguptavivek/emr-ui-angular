import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Vascular views, anterior. Patient's right is on the viewer's left (marked R). */
export const VASCULAR_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'pulse-sites', version: 1, group: 'vascular', label: 'Pulse sites — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'vascular/pulse-sites.svg', width: 1200, height: 1600, provenance,
    description: 'Whole-body anterior outline with labelled circles at the carotid, brachial, radial, femoral, popliteal, posterior tibial and dorsalis pedis pulse sites on both sides; posterior sites are dashed.',
  },
  {
    id: 'superficial-veins-lower-limbs', version: 1, group: 'vascular', label: 'Superficial veins — lower limbs', region: 'lower limbs', view: 'anterior',
    laterality: 'bilateral', asset: 'vascular/superficial-veins-lower-limbs.svg', width: 1200, height: 1400, provenance,
    description: 'Both legs from waist to toes, anterior view, with the great saphenous vein, the posterior course of the small saphenous vein, the dorsal venous arch and the saphenofemoral and saphenopopliteal junctions.',
  },
];
