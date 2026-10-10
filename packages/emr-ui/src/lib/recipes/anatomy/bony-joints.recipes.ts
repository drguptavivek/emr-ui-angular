import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Bony joint outlines for orthopaedic marking (fractures, implants, arthroplasty). Anterior views: patient's right is on the viewer's left.
 * Lateral knee views are drawn as seen from the side being examined, so the patella (anterior) is on the viewer's right for the right knee and on the left for the left knee.
 */
export const BONY_JOINTS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'pelvis-hip-ap', version: 1, group: 'bony-joints', label: 'Pelvis and hips — AP', region: 'pelvis and hips', view: 'anteroposterior',
    laterality: 'bilateral', asset: 'bony-joints/pelvis-hip-ap.svg', width: 1400, height: 1300, provenance,
    description: 'Anteroposterior pelvis with both hips: iliac wings, sacrum and coccyx, acetabula, femoral heads and necks, greater and lesser trochanters, pubic rami and obturator foramina. Patient\'s right is on the viewer\'s left (R and L marked).',
  },
  {
    id: 'knee-bony-ap-right', version: 1, group: 'bony-joints', label: 'Knee bones — right AP', region: 'right knee', view: 'anteroposterior',
    laterality: 'right', asset: 'bony-joints/knee-bony-ap-right.svg', width: 1000, height: 1400, provenance,
    description: 'Right knee bones from the front: distal femur with both condyles, patella, tibial plateau with tibial spines and proximal fibula. The fibula (lateral side) is on the viewer\'s left.',
  },
  {
    id: 'knee-bony-ap-left', version: 1, group: 'bony-joints', label: 'Knee bones — left AP', region: 'left knee', view: 'anteroposterior',
    laterality: 'left', asset: 'bony-joints/knee-bony-ap-left.svg', width: 1000, height: 1400, provenance,
    description: 'Left knee bones from the front: distal femur with both condyles, patella, tibial plateau with tibial spines and proximal fibula. The fibula (lateral side) is on the viewer\'s right.',
  },
  {
    id: 'knee-bony-lateral-right', version: 1, group: 'bony-joints', label: 'Knee bones — right lateral', region: 'right knee', view: 'lateral',
    laterality: 'right', asset: 'bony-joints/knee-bony-lateral-right.svg', width: 1000, height: 1400, provenance,
    description: 'Right knee bones seen from the lateral side: distal femoral condyles, patella and tibial tuberosity anteriorly on the viewer\'s right, fibular head posteriorly on the left. Anterior and posterior are labelled.',
  },
  {
    id: 'knee-bony-lateral-left', version: 1, group: 'bony-joints', label: 'Knee bones — left lateral', region: 'left knee', view: 'lateral',
    laterality: 'left', asset: 'bony-joints/knee-bony-lateral-left.svg', width: 1000, height: 1400, provenance,
    description: 'Left knee bones seen from the lateral side: distal femoral condyles, patella and tibial tuberosity anteriorly on the viewer\'s left, fibular head posteriorly on the right. Anterior and posterior are labelled.',
  },
  {
    id: 'shoulder-bony-right', version: 1, group: 'bony-joints', label: 'Shoulder bones — right AP', region: 'right shoulder', view: 'anteroposterior',
    laterality: 'right', asset: 'bony-joints/shoulder-bony-right.svg', width: 1400, height: 1100, provenance,
    description: 'Right glenohumeral joint from the front: proximal humerus on the viewer\'s left, glenoid, acromion, coracoid and scapula, with the clavicle running medially to the viewer\'s right.',
  },
  {
    id: 'shoulder-bony-left', version: 1, group: 'bony-joints', label: 'Shoulder bones — left AP', region: 'left shoulder', view: 'anteroposterior',
    laterality: 'left', asset: 'bony-joints/shoulder-bony-left.svg', width: 1400, height: 1100, provenance,
    description: 'Left glenohumeral joint from the front: proximal humerus on the viewer\'s right, glenoid, acromion, coracoid and scapula, with the clavicle running medially to the viewer\'s left.',
  },
  {
    id: 'hand-bones-right-dorsal', version: 1, group: 'bony-joints', label: 'Hand bones — right dorsal', region: 'right hand', view: 'dorsal',
    laterality: 'right', asset: 'bony-joints/hand-bones-right-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Right hand bones, dorsal view, fingers up and thumb on the viewer\'s left: eight carpal bones, five metacarpals, phalanges with visible joint spaces, and the distal radius and ulna.',
  },
  {
    id: 'hand-bones-left-dorsal', version: 1, group: 'bony-joints', label: 'Hand bones — left dorsal', region: 'left hand', view: 'dorsal',
    laterality: 'left', asset: 'bony-joints/hand-bones-left-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Left hand bones, dorsal view, fingers up and thumb on the viewer\'s right: eight carpal bones, five metacarpals, phalanges with visible joint spaces, and the distal radius and ulna.',
  },
  {
    id: 'foot-bones-right-dorsal', version: 1, group: 'bony-joints', label: 'Foot bones — right dorsal', region: 'right foot', view: 'dorsal',
    laterality: 'right', asset: 'bony-joints/foot-bones-right-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Right foot bones, dorsal view, toes up and the big toe medial on the viewer\'s left: talus, calcaneus, navicular, cuboid, three cuneiforms, five metatarsals and the phalanges of all toes.',
  },
  {
    id: 'foot-bones-left-dorsal', version: 1, group: 'bony-joints', label: 'Foot bones — left dorsal', region: 'left foot', view: 'dorsal',
    laterality: 'left', asset: 'bony-joints/foot-bones-left-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Left foot bones, dorsal view, toes up and the big toe medial on the viewer\'s right: talus, calcaneus, navicular, cuboid, three cuneiforms, five metatarsals and the phalanges of all toes.',
  },
  {
    id: 'spine-bony-ap', version: 1, group: 'bony-joints', label: 'Spine — AP', region: 'spine', view: 'anteroposterior',
    laterality: 'midline', asset: 'bony-joints/spine-bony-ap.svg', width: 800, height: 1600, provenance,
    description: 'Vertebral column from C1 to the coccyx from the front: cervical, thoracic with rib stubs and lumbar vertebrae, sacrum and coccyx, with level labels C1, C7, T1, T12, L1, L5 and S1. R is on the viewer\'s left.',
  },
  {
    id: 'spine-bony-lateral', version: 1, group: 'bony-joints', label: 'Spine — lateral', region: 'spine', view: 'lateral',
    laterality: 'midline', asset: 'bony-joints/spine-bony-lateral.svg', width: 800, height: 1600, provenance,
    description: 'Vertebral column from C1 to the coccyx from the side, showing cervical and lumbar lordosis and thoracic kyphosis, vertebral bodies, intervertebral discs and spinous processes. Anterior is on the viewer\'s left; levels C1, C7, T1, T12, L1, L5, S1 are labelled.',
  },
];
