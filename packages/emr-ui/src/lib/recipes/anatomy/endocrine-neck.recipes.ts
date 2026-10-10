import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Thyroid and parathyroid outlines for endocrine and ENT surgery. Anterior view: patient's right on the viewer's left (marked R); posterior view: patient's right on the viewer's right; transverse section: radiological orientation (patient's right on the viewer's left). */
export const ENDOCRINE_NECK_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'thyroid-anterior', version: 1, group: 'endocrine-neck', label: 'Thyroid — anterior neck', region: 'neck', view: 'anterior',
    laterality: 'bilateral', asset: 'endocrine-neck/thyroid-anterior.svg', width: 1600, height: 1200, provenance,
    description: 'Anterior neck with the thyroid gland (right and left lobes joined by a thin isthmus, dashed pyramidal lobe variant), hyoid bone, thyroid and cricoid cartilages, trachea with rings, clavicles and sternal notch. Patient right on the viewer left.',
  },
  {
    id: 'thyroid-parathyroid-posterior', version: 1, group: 'endocrine-neck', label: 'Thyroid and parathyroids — posterior', region: 'neck', view: 'posterior',
    laterality: 'bilateral', asset: 'endocrine-neck/thyroid-parathyroid-posterior.svg', width: 1500, height: 1200, provenance,
    description: 'Posterior view of the thyroid lobes with the four parathyroid glands, recurrent laryngeal nerves in the tracheo-oesophageal grooves, trachea, oesophagus and inferior thyroid arteries. Patient right on the viewer right.',
  },
  {
    id: 'thyroid-transverse-section', version: 1, group: 'endocrine-neck', label: 'Thyroid — transverse section', region: 'neck', view: 'transverse',
    laterality: 'bilateral', asset: 'endocrine-neck/thyroid-transverse-section.svg', width: 1800, height: 1100, provenance,
    description: 'Axial neck section at the thyroid level, ultrasound style: trachea centred with the thyroid lobes and isthmus around it, carotids and internal jugular veins laterally, strap muscles and sternocleidomastoid, oesophagus and vertebra. Patient right on the viewer left, anterior up.',
  },
];
