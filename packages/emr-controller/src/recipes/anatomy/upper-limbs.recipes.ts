import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Upper limbs and their joints. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const UPPER_LIMBS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'upper-limb-right-anterior', version: 1, group: 'upper-limbs', label: 'Upper limb — right anterior', region: 'right upper limb', view: 'anterior',
    laterality: 'right', asset: 'upper-limbs/upper-limb-right-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Right arm, forearm and hand in anatomical position seen from the front. The thumb is on the viewer\'s left; palm creases and the cubital crease are marked.',
  },
  {
    id: 'upper-limb-right-posterior', version: 1, group: 'upper-limbs', label: 'Upper limb — right posterior', region: 'right upper limb', view: 'posterior',
    laterality: 'right', asset: 'upper-limbs/upper-limb-right-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Right arm, forearm and hand in anatomical position seen from the back. The thumb is on the viewer\'s right; knuckles and nails and the olecranon are marked.',
  },
  {
    id: 'upper-limb-left-anterior', version: 1, group: 'upper-limbs', label: 'Upper limb — left anterior', region: 'left upper limb', view: 'anterior',
    laterality: 'left', asset: 'upper-limbs/upper-limb-left-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Left arm, forearm and hand in anatomical position seen from the front. The thumb is on the viewer\'s right; palm creases and the cubital crease are marked.',
  },
  {
    id: 'upper-limb-left-posterior', version: 1, group: 'upper-limbs', label: 'Upper limb — left posterior', region: 'left upper limb', view: 'posterior',
    laterality: 'left', asset: 'upper-limbs/upper-limb-left-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Left arm, forearm and hand in anatomical position seen from the back. The thumb is on the viewer\'s left; knuckles and nails and the olecranon are marked.',
  },
  {
    id: 'shoulder-right', version: 1, group: 'upper-limbs', label: 'Shoulder — right', region: 'right shoulder', view: 'anterior',
    laterality: 'right', asset: 'upper-limbs/shoulder-right.svg', width: 1200, height: 1200, provenance,
    description: 'Anterior view of the right shoulder from the side of the neck to the upper arm: deltoid cap, clavicle, acromion, anterior axillary fold and chest wall, with the midline marked.',
  },
  {
    id: 'elbow-right', version: 1, group: 'upper-limbs', label: 'Elbow — right', region: 'right elbow', view: 'anterior',
    laterality: 'right', asset: 'upper-limbs/elbow-right.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the right elbow with distal upper arm and proximal forearm: both epicondyles, the cubital crease and the borders of the cubital fossa.',
  },
  {
    id: 'wrist-right', version: 1, group: 'upper-limbs', label: 'Wrist — right', region: 'right wrist', view: 'palmar',
    laterality: 'right', asset: 'upper-limbs/wrist-right.svg', width: 1000, height: 1200, provenance,
    description: 'Palmar view of the right wrist from the distal forearm to the proximal palm, thumb on the viewer\'s right; wrist creases, pisiform and palmar creases are marked.',
  },
  {
    id: 'shoulder-left', version: 1, group: 'upper-limbs', label: 'Shoulder — left', region: 'left shoulder', view: 'anterior',
    laterality: 'left', asset: 'upper-limbs/shoulder-left.svg', width: 1200, height: 1200, provenance,
    description: 'Anterior view of the left shoulder from the side of the neck to the upper arm: deltoid cap, clavicle, acromion, anterior axillary fold and chest wall, with the midline marked.',
  },
  {
    id: 'elbow-left', version: 1, group: 'upper-limbs', label: 'Elbow — left', region: 'left elbow', view: 'anterior',
    laterality: 'left', asset: 'upper-limbs/elbow-left.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the left elbow with distal upper arm and proximal forearm: both epicondyles, the cubital crease and the borders of the cubital fossa.',
  },
  {
    id: 'wrist-left', version: 1, group: 'upper-limbs', label: 'Wrist — left', region: 'left wrist', view: 'palmar',
    laterality: 'left', asset: 'upper-limbs/wrist-left.svg', width: 1000, height: 1200, provenance,
    description: 'Palmar view of the left wrist from the distal forearm to the proximal palm, thumb on the viewer\'s left; wrist creases, pisiform and palmar creases are marked.',
  },
];
