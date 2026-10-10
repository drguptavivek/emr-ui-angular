import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Teeth and oral cavity outlines. Arch charts are occlusal views with the anterior teeth at the outer edge
 * and the patient's right on the viewer's left; they carry no tooth numbering (that is a configuration choice).
 */
export const DENTAL_ORAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'dentition-adult', version: 1, group: 'dental-oral', label: 'Dentition — adult', region: 'teeth', view: 'occlusal',
    laterality: 'bilateral', asset: 'dental-oral/dentition-adult.svg', width: 1200, height: 1500, provenance,
    description: 'Thirty-two permanent teeth in upper and lower arches, occlusal view, anterior teeth at the outer edge, patient\'s right on the viewer\'s left; no tooth numbers.',
  },
  {
    id: 'dentition-primary', version: 1, group: 'dental-oral', label: 'Dentition — primary', region: 'teeth', view: 'occlusal',
    laterality: 'bilateral', asset: 'dental-oral/dentition-primary.svg', width: 1200, height: 1300, provenance,
    description: 'Twenty primary teeth in upper and lower arches, occlusal view, anterior teeth at the outer edge, patient\'s right on the viewer\'s left; no tooth numbers.',
  },
  {
    id: 'tooth-surfaces', version: 1, group: 'dental-oral', label: 'Tooth — five surfaces', region: 'tooth', view: 'occlusal',
    laterality: 'not-applicable', asset: 'dental-oral/tooth-surfaces.svg', width: 1000, height: 1000, provenance,
    description: 'One generic tooth in occlusal view: occlusal surface in the centre with buccal above, lingual below, mesial on the viewer\'s left and distal on the viewer\'s right.',
  },
  {
    id: 'tongue', version: 1, group: 'dental-oral', label: 'Tongue — dorsal', region: 'tongue', view: 'dorsal',
    laterality: 'bilateral', asset: 'dental-oral/tongue.svg', width: 1000, height: 1200, provenance,
    description: 'Dorsal surface of the protruded tongue, base at the top and tip toward the viewer, with median sulcus, V-shaped sulcus terminalis, circumvallate papillae and foramen caecum.',
  },
  {
    id: 'palate', version: 1, group: 'dental-oral', label: 'Palate — hard and soft', region: 'palate', view: 'inferior',
    laterality: 'midline', asset: 'dental-oral/palate.svg', width: 1000, height: 1200, provenance,
    description: 'Roof of the mouth seen from below within the upper dental arch: incisive papilla and palatine rugae toward the viewer, median raphe, hard and soft palate and uvula at the top.',
  },
  {
    id: 'oral-cavity', version: 1, group: 'dental-oral', label: 'Oral cavity — open mouth', region: 'oral cavity', view: 'open-mouth',
    laterality: 'bilateral', asset: 'dental-oral/oral-cavity.svg', width: 1200, height: 1000, provenance,
    description: 'Open-mouth view of the oral cavity showing upper and lower front teeth, buccal mucosa, hard and soft palate, uvula, tonsils between the pillars, posterior pharyngeal wall and tongue; patient\'s right on the viewer\'s left.',
  },
  {
    id: 'tooth-profile', version: 1, group: 'dental-oral', label: 'Tooth — longitudinal section', region: 'tooth', view: 'longitudinal',
    laterality: 'not-applicable', asset: 'dental-oral/tooth-profile.svg', width: 1400, height: 1400, provenance,
    description: 'One tooth in longitudinal section, crown up: enamel, dentine, pulp chamber, root canal, root, periodontal ligament, alveolar bone, gingiva and the cementoenamel junction.',
  },
  {
    id: 'tmj-right', version: 1, group: 'dental-oral', label: 'TMJ — right', region: 'right temporomandibular joint', view: 'lateral',
    laterality: 'right', asset: 'dental-oral/tmj-right.svg', width: 1200, height: 1000, provenance,
    description: 'Lateral schematic of the right temporomandibular joint, anterior toward the viewer\'s right: condyle, articular disc, articular eminence, glenoid fossa and external auditory meatus.',
  },
  {
    id: 'tmj-left', version: 1, group: 'dental-oral', label: 'TMJ — left', region: 'left temporomandibular joint', view: 'lateral',
    laterality: 'left', asset: 'dental-oral/tmj-left.svg', width: 1200, height: 1000, provenance,
    description: 'Lateral schematic of the left temporomandibular joint, anterior toward the viewer\'s left: condyle, articular disc, articular eminence, glenoid fossa and external auditory meatus.',
  },
];
