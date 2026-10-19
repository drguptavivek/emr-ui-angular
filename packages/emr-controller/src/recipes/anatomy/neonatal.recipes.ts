import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Newborn outlines. Anterior and supine views: patient's right on the viewer's left. Posterior view and the vertex-from-above
 * view (face at the top): the baby's right is on the viewer's right. Each lateral view faces the side it is named for.
 */
export const NEONATAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'neonate-body-anterior', version: 1, group: 'neonatal', label: 'Neonate body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'neonatal/neonate-body-anterior.svg', width: 900, height: 1400, provenance,
    description: 'Newborn body in anterior view with the head about a quarter of the length, short limbs, nipples, and an umbilical stump with a cord clamp. Patient\'s right on the viewer\'s left.',
  },
  {
    id: 'neonate-body-posterior', version: 1, group: 'neonatal', label: 'Neonate body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'neonatal/neonate-body-posterior.svg', width: 900, height: 1400, provenance,
    description: 'Newborn body in posterior view with the same proportions, spine line, gluteal folds and popliteal creases. Patient\'s right on the viewer\'s right.',
  },
  {
    id: 'neonate-head-vertex', version: 1, group: 'neonatal', label: 'Neonate head — vertex', region: 'head', view: 'vertex',
    laterality: 'bilateral', asset: 'neonatal/neonate-head-vertex.svg', width: 1400, height: 1200, provenance,
    description: 'Newborn skull seen from above with the diamond anterior and triangular posterior fontanelles and the sagittal, coronal, lambdoid and metopic sutures, for marking caput, cephalhaematoma, moulding and subgaleal swelling. Face at the top, baby\'s right on the viewer\'s right.',
  },
  {
    id: 'neonate-head-lateral-right', version: 1, group: 'neonatal', label: 'Neonate head — right lateral', region: 'head', view: 'right lateral',
    laterality: 'right', asset: 'neonatal/neonate-head-lateral-right.svg', width: 1300, height: 1200, provenance,
    description: 'Right side of a newborn head with ear, face profile, sagittal, coronal and lambdoid sutures and the anterior and posterior fontanelles; face to the viewer\'s right.',
  },
  {
    id: 'neonate-head-lateral-left', version: 1, group: 'neonatal', label: 'Neonate head — left lateral', region: 'head', view: 'left lateral',
    laterality: 'left', asset: 'neonatal/neonate-head-lateral-left.svg', width: 1300, height: 1200, provenance,
    description: 'Left side of a newborn head with ear, face profile, sagittal, coronal and lambdoid sutures and the anterior and posterior fontanelles; face to the viewer\'s left.',
  },
  {
    id: 'neonate-face-oral', version: 1, group: 'neonatal', label: 'Neonate face and palate', region: 'face and palate', view: 'anterior with palate inset',
    laterality: 'midline', asset: 'neonatal/neonate-face-oral.svg', width: 1700, height: 1050, provenance,
    description: 'Newborn face in front view with nose, philtrum and upper and lower lips, beside an open-mouth inset of the hard and soft palate with alveolar ridge, incisive papilla and uvula, for cleft lip and palate marking. Patient\'s right on the viewer\'s left.',
  },
  {
    id: 'neonate-hips-feet', version: 1, group: 'neonatal', label: 'Neonate hips and feet', region: 'hips and feet', view: 'supine anterior',
    laterality: 'bilateral', asset: 'neonatal/neonate-hips-feet.svg', width: 1200, height: 1300, provenance,
    description: 'Supine newborn lower body from the umbilicus to the toes with both hip joints, groin creases, thigh folds, patellae and feet, for recording the hip examination side and foot position such as talipes. Patient\'s right on the viewer\'s left.',
  },
];
