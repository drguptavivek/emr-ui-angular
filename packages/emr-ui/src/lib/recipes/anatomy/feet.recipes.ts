import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Feet and toenails. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const FEET_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'foot-right-dorsal', version: 1, group: 'feet', label: 'Foot — right dorsal', region: 'right foot', view: 'dorsal',
    laterality: 'right', asset: 'feet/foot-right-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Right foot dorsal view with the toes pointing up and the big toe, on the medial side, at the viewer\'s left; ankle crease, malleoli, tendon lines and toenails are marked.',
  },
  {
    id: 'foot-right-plantar', version: 1, group: 'feet', label: 'Foot — right plantar', region: 'right foot', view: 'plantar',
    laterality: 'right', asset: 'feet/foot-right-plantar.svg', width: 800, height: 1400, provenance,
    description: 'Right foot plantar view with the toes pointing up and the big toe, on the medial side, at the viewer\'s right; hindfoot, midfoot and forefoot regions, the ball of the foot and the arch edge are marked.',
  },
  {
    id: 'foot-left-dorsal', version: 1, group: 'feet', label: 'Foot — left dorsal', region: 'left foot', view: 'dorsal',
    laterality: 'left', asset: 'feet/foot-left-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Left foot dorsal view with the toes pointing up and the big toe, on the medial side, at the viewer\'s right; ankle crease, malleoli, tendon lines and toenails are marked.',
  },
  {
    id: 'foot-left-plantar', version: 1, group: 'feet', label: 'Foot — left plantar', region: 'left foot', view: 'plantar',
    laterality: 'left', asset: 'feet/foot-left-plantar.svg', width: 800, height: 1400, provenance,
    description: 'Left foot plantar view with the toes pointing up and the big toe, on the medial side, at the viewer\'s left; hindfoot, midfoot and forefoot regions, the ball of the foot and the arch edge are marked.',
  },
  {
    id: 'toenails', version: 1, group: 'feet', label: 'Toenails — both feet', region: 'toenails', view: 'dorsal',
    laterality: 'bilateral', asset: 'feet/toenails.svg', width: 1600, height: 1000, provenance,
    description: 'Dorsal view of the forefoot and toes of both feet, toes up, big toes toward the middle; the left foot is on the viewer\'s left. Each of the ten toenails is shaded.',
  },
];
