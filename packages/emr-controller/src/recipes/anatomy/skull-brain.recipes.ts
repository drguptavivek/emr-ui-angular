import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const landscape = { width: 1400, height: 1000 } as const;

/** Skull and brain outlines for craniotomy, lesion and level marking. Lateral views face the side they are drawn for; the axial slice is radiological. */
export const SKULL_BRAIN_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'skull-lateral-right', version: 1, group: 'skull-brain', label: 'Skull — right lateral', region: 'skull', view: 'right lateral',
    laterality: 'right', asset: 'skull-brain/skull-lateral-right.svg', ...landscape, provenance,
    description: 'Right lateral skull with the face to the right of the drawing: coronal, lambdoid and squamous sutures, orbit, zygomatic arch, mandible, external auditory meatus and mastoid, with pterion, asterion, nasion and inion marked.',
  },
  {
    id: 'skull-lateral-left', version: 1, group: 'skull-brain', label: 'Skull — left lateral', region: 'skull', view: 'left lateral',
    laterality: 'left', asset: 'skull-brain/skull-lateral-left.svg', ...landscape, provenance,
    description: 'Left lateral skull with the face to the left of the drawing: coronal, lambdoid and squamous sutures, orbit, zygomatic arch, mandible, external auditory meatus and mastoid, with pterion, asterion, nasion and inion marked.',
  },
  {
    id: 'skull-superior', version: 1, group: 'skull-brain', label: 'Skull — superior (vertex)', region: 'skull', view: 'superior',
    laterality: 'midline', asset: 'skull-brain/skull-superior.svg', width: 1000, height: 1200, provenance,
    description: 'Vertex view of the skull, anterior at the top, patient right on the right of the drawing, with the coronal, sagittal and lambdoid sutures, bregma, lambda and Kocher\'s point on each side.',
  },
  {
    id: 'brain-lateral-left', version: 1, group: 'skull-brain', label: 'Brain — left lateral', region: 'brain', view: 'left lateral',
    laterality: 'left', asset: 'skull-brain/brain-lateral-left.svg', ...landscape, provenance,
    description: 'Left cerebral hemisphere seen from the left, frontal pole to the left of the drawing: frontal, parietal, temporal and occipital lobes, central sulcus, Sylvian fissure, cerebellum and brainstem.',
  },
  {
    id: 'brain-lateral-right', version: 1, group: 'skull-brain', label: 'Brain — right lateral', region: 'brain', view: 'right lateral',
    laterality: 'right', asset: 'skull-brain/brain-lateral-right.svg', ...landscape, provenance,
    description: 'Right cerebral hemisphere seen from the right, frontal pole to the right of the drawing: frontal, parietal, temporal and occipital lobes, central sulcus, Sylvian fissure, cerebellum and brainstem.',
  },
  {
    id: 'brain-medial', version: 1, group: 'skull-brain', label: 'Brain — midsagittal', region: 'brain', view: 'midsagittal',
    laterality: 'midline', asset: 'skull-brain/brain-medial.svg', ...landscape, provenance,
    description: 'Midsagittal brain with anterior to the left of the drawing: corpus callosum, thalamus, lateral and fourth ventricles, cerebellum, brainstem and pituitary gland.',
  },
  {
    id: 'brain-axial', version: 1, group: 'skull-brain', label: 'Brain — axial (ventricles and basal ganglia)', region: 'brain', view: 'axial',
    laterality: 'bilateral', asset: 'skull-brain/brain-axial.svg', width: 1200, height: 1200, provenance,
    description: 'Axial slice at the lateral ventricles and basal ganglia in radiological orientation: anterior at the top, patient right on the left of the drawing, with cortex, ventricles, caudate, lentiform nucleus, thalamus, internal capsule and falx.',
  },
];
