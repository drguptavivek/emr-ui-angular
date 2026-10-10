import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Ear, nose and throat outlines. Each ear and each tympanic membrane is drawn for its own side.
 * External ears are lateral views (anterior toward the tragus); tympanic membranes are otoscopic views
 * with the anterior margin toward the viewer's right for the right ear and toward the left for the left ear.
 */
export const ENT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'ear-right-external', version: 1, group: 'ent', label: 'Ear — right external', region: 'right ear', view: 'lateral',
    laterality: 'right', asset: 'ent/ear-right-external.svg', width: 1000, height: 1200, provenance,
    description: 'Right external ear seen from the side, anterior toward the viewer\'s right, with helix, antihelix, tragus and lobule, and dashed preauricular and mastoid areas.',
  },
  {
    id: 'ear-left-external', version: 1, group: 'ent', label: 'Ear — left external', region: 'left ear', view: 'lateral',
    laterality: 'left', asset: 'ent/ear-left-external.svg', width: 1000, height: 1200, provenance,
    description: 'Left external ear seen from the side, anterior toward the viewer\'s left, with helix, antihelix, tragus and lobule, and dashed preauricular and mastoid areas.',
  },
  {
    id: 'tympanic-membrane-right', version: 1, group: 'ent', label: 'Tympanic membrane — right', region: 'right tympanic membrane', view: 'otoscopic',
    laterality: 'right', asset: 'ent/tympanic-membrane-right.svg', width: 1000, height: 1000, provenance,
    description: 'Right eardrum as seen through an otoscope: handle of malleus rising toward 1 o\'clock, umbo, light reflex at 5 o\'clock, pars flaccida above, anterior margin on the viewer\'s right, quadrants divided by dashed lines.',
  },
  {
    id: 'tympanic-membrane-left', version: 1, group: 'ent', label: 'Tympanic membrane — left', region: 'left tympanic membrane', view: 'otoscopic',
    laterality: 'left', asset: 'ent/tympanic-membrane-left.svg', width: 1000, height: 1000, provenance,
    description: 'Left eardrum as seen through an otoscope: handle of malleus rising toward 11 o\'clock, umbo, light reflex at 7 o\'clock, pars flaccida above, anterior margin on the viewer\'s left, quadrants divided by dashed lines.',
  },
  {
    id: 'nose-external', version: 1, group: 'ent', label: 'Nose — external', region: 'nose', view: 'anterior',
    laterality: 'bilateral', asset: 'ent/nose-external.svg', width: 1000, height: 1200, provenance,
    description: 'External nose from the front, from bridge to base, with alae, tip, nostrils and columella; patient\'s right on the viewer\'s left.',
  },
  {
    id: 'nasal-septum', version: 1, group: 'ent', label: 'Nasal septum', region: 'nasal septum', view: 'sagittal',
    laterality: 'midline', asset: 'ent/nasal-septum.svg', width: 1200, height: 1000, provenance,
    description: 'Schematic sagittal view of the nasal septum, anterior to the left, showing quadrangular cartilage, perpendicular plate of the ethmoid, vomer, maxillary crest and Little\'s area.',
  },
  {
    id: 'oropharynx', version: 1, group: 'ent', label: 'Oropharynx — open mouth', region: 'oropharynx', view: 'open-mouth',
    laterality: 'bilateral', asset: 'ent/oropharynx.svg', width: 1200, height: 1000, provenance,
    description: 'Open-mouth view of the throat showing palate, uvula, both tonsils between anterior and posterior pillars, posterior pharyngeal wall and tongue; patient\'s right on the viewer\'s left.',
  },
];
