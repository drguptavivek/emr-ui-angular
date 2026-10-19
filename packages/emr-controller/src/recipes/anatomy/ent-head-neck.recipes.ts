import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Ear, nasal, laryngeal and cervical outlines for ENT and head-and-neck work. The middle-ear schematic is the standard
 * textbook coronal view of the RIGHT ear (lateral on the viewer's left). Lateral views follow the ear files: the right
 * side faces anterior toward the viewer's right, the left side toward the viewer's left. The laryngoscopy view has
 * the anterior commissure at the top and the patient's right on the viewer's left.
 */
export const ENT_HEAD_NECK_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'middle-ear-schematic', version: 1, group: 'ent-head-neck', label: 'Middle ear — coronal schematic', region: 'right ear', view: 'coronal',
    laterality: 'right', asset: 'ent-head-neck/middle-ear-schematic.svg', width: 1400, height: 1000, provenance,
    description: 'Coronal schematic of the right ear, lateral on the viewer\'s left: external canal, tympanic membrane, middle-ear cavity with malleus, incus and stapes, oval and round windows, cochlea, semicircular canals and the eustachian tube.',
  },
  {
    id: 'mastoid-temporal-right', version: 1, group: 'ent-head-neck', label: 'Mastoid and temporal — right', region: 'right temporal region', view: 'lateral',
    laterality: 'right', asset: 'ent-head-neck/mastoid-temporal-right.svg', width: 1000, height: 1200, provenance,
    description: 'Right temporal region and mastoid from the side, anterior toward the viewer\'s right: pinna, mastoid tip, suprameatal (Macewen\'s) triangle, zygomatic root, and a dashed postauricular incision line.',
  },
  {
    id: 'mastoid-temporal-left', version: 1, group: 'ent-head-neck', label: 'Mastoid and temporal — left', region: 'left temporal region', view: 'lateral',
    laterality: 'left', asset: 'ent-head-neck/mastoid-temporal-left.svg', width: 1000, height: 1200, provenance,
    description: 'Left temporal region and mastoid from the side, anterior toward the viewer\'s left: pinna, mastoid tip, suprameatal (Macewen\'s) triangle, zygomatic root, and a dashed postauricular incision line.',
  },
  {
    id: 'larynx-laryngoscopy', version: 1, group: 'ent-head-neck', label: 'Larynx — laryngoscopy', region: 'larynx', view: 'laryngoscopic',
    laterality: 'bilateral', asset: 'ent-head-neck/larynx-laryngoscopy.svg', width: 1200, height: 1000, provenance,
    description: 'Laryngoscopic view with the anterior commissure at the top and the patient\'s right on the viewer\'s left: epiglottis, vallecula, aryepiglottic folds, arytenoids, false and true vocal cords in abduction, and the piriform fossae.',
  },
  {
    id: 'paranasal-sinuses-frontal', version: 1, group: 'ent-head-neck', label: 'Paranasal sinuses — frontal', region: 'paranasal sinuses', view: 'anterior',
    laterality: 'bilateral', asset: 'ent-head-neck/paranasal-sinuses-frontal.svg', width: 1200, height: 1250, provenance,
    description: 'Frontal facial outline showing the frontal, ethmoid and maxillary sinuses, both orbits and the nasal cavity; patient\'s right on the viewer\'s left.',
  },
  {
    id: 'nasal-lateral-wall-right', version: 1, group: 'ent-head-neck', label: 'Nasal lateral wall — right', region: 'right nasal cavity', view: 'sagittal',
    laterality: 'right', asset: 'ent-head-neck/nasal-lateral-wall-right.svg', width: 1200, height: 1000, provenance,
    description: 'Sagittal view of the right lateral nasal wall, anterior to the left: inferior, middle and superior turbinates with their meatuses, sphenoid sinus, nasopharynx and the eustachian tube opening.',
  },
  {
    id: 'neck-levels-right', version: 1, group: 'ent-head-neck', label: 'Neck levels — right', region: 'right neck', view: 'lateral',
    laterality: 'right', asset: 'ent-head-neck/neck-levels-right.svg', width: 1000, height: 1400, provenance,
    description: 'Right lateral neck, anterior toward the viewer\'s right, with cervical lymph-node levels IA, IB, IIA, IIB, III, IV, VA, VB and VI as dashed boundaries, and the mandible, hyoid, sternocleidomastoid and clavicle as landmarks.',
  },
  {
    id: 'neck-levels-left', version: 1, group: 'ent-head-neck', label: 'Neck levels — left', region: 'left neck', view: 'lateral',
    laterality: 'left', asset: 'ent-head-neck/neck-levels-left.svg', width: 1000, height: 1400, provenance,
    description: 'Left lateral neck, anterior toward the viewer\'s left, with cervical lymph-node levels IA, IB, IIA, IIB, III, IV, VA, VB and VI as dashed boundaries, and the mandible, hyoid, sternocleidomastoid and clavicle as landmarks.',
  },
];
