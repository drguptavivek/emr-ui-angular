import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Lower limbs and their joints. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const LOWER_LIMBS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'lower-limb-right-anterior', version: 1, group: 'lower-limbs', label: 'Lower limb — right anterior', region: 'right lower limb', view: 'anterior',
    laterality: 'right', asset: 'lower-limbs/lower-limb-right-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Right thigh, knee, leg and foot in anatomical position seen from the front, big toe on the medial side; patella, tibial tuberosity, tibial crest and malleoli are marked.',
  },
  {
    id: 'lower-limb-right-posterior', version: 1, group: 'lower-limbs', label: 'Lower limb — right posterior', region: 'right lower limb', view: 'posterior',
    laterality: 'right', asset: 'lower-limbs/lower-limb-right-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Right thigh, knee, leg and foot in anatomical position seen from the back; gluteal fold, popliteal crease, calf, Achilles tendon and heel are marked.',
  },
  {
    id: 'lower-limb-left-anterior', version: 1, group: 'lower-limbs', label: 'Lower limb — left anterior', region: 'left lower limb', view: 'anterior',
    laterality: 'left', asset: 'lower-limbs/lower-limb-left-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Left thigh, knee, leg and foot in anatomical position seen from the front, big toe on the medial side; patella, tibial tuberosity, tibial crest and malleoli are marked.',
  },
  {
    id: 'lower-limb-left-posterior', version: 1, group: 'lower-limbs', label: 'Lower limb — left posterior', region: 'left lower limb', view: 'posterior',
    laterality: 'left', asset: 'lower-limbs/lower-limb-left-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Left thigh, knee, leg and foot in anatomical position seen from the back; gluteal fold, popliteal crease, calf, Achilles tendon and heel are marked.',
  },
  {
    id: 'knee-right', version: 1, group: 'lower-limbs', label: 'Knee — right', region: 'right knee', view: 'anterior',
    laterality: 'right', asset: 'lower-limbs/knee-right.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the right knee with distal thigh and proximal leg: patella, quadriceps tendon, patellar ligament, tibial tuberosity and the joint line.',
  },
  {
    id: 'ankle-right', version: 1, group: 'lower-limbs', label: 'Ankle — right', region: 'right ankle', view: 'anterior',
    laterality: 'right', asset: 'lower-limbs/ankle-right.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the right ankle with distal leg and the front of the foot, big toe on the medial side; both malleoli, the ankle crease and the toes are marked.',
  },
  {
    id: 'knee-left', version: 1, group: 'lower-limbs', label: 'Knee — left', region: 'left knee', view: 'anterior',
    laterality: 'left', asset: 'lower-limbs/knee-left.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the left knee with distal thigh and proximal leg: patella, quadriceps tendon, patellar ligament, tibial tuberosity and the joint line.',
  },
  {
    id: 'ankle-left', version: 1, group: 'lower-limbs', label: 'Ankle — left', region: 'left ankle', view: 'anterior',
    laterality: 'left', asset: 'lower-limbs/ankle-left.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the left ankle with distal leg and the front of the foot, big toe on the medial side; both malleoli, the ankle crease and the toes are marked.',
  },
];
