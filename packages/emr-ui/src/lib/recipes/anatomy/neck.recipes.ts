import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Neck outlines: anterior, posterior, both laterals and both supraclavicular fossae. */
export const NECK_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'neck-anterior', version: 1, group: 'neck', label: 'Neck — anterior', region: 'neck', view: 'anterior',
    laterality: 'bilateral', asset: 'neck/neck-anterior.svg', width: 1200, height: 1000, provenance,
    description: 'Front of the neck from the chin and jaw to the upper chest, with the sternocleidomastoid muscles, hyoid, thyroid cartilage, trachea, thyroid gland region, clavicles and suprasternal notch as landmarks. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'neck-posterior', version: 1, group: 'neck', label: 'Neck — posterior', region: 'neck', view: 'posterior',
    laterality: 'bilateral', asset: 'neck/neck-posterior.svg', width: 1200, height: 1000, provenance,
    description: 'Back of the neck from the skull base to the upper back, with the nape hairline, C7 prominence, spinous process line, trapezius slope and upper scapular borders as landmarks. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'neck-right-lateral', version: 1, group: 'neck', label: 'Neck — right lateral', region: 'neck', view: 'right lateral',
    laterality: 'right', asset: 'neck/neck-right-lateral.svg', width: 1200, height: 1000, provenance,
    description: 'Side of the neck seen from the patient\'s right side, facing the viewer\'s right, with the ear, jaw line, sternocleidomastoid, trapezius slope and clavicle region as landmarks. Anterior (A) is on the right of the image and posterior (P) on the left.',
  },
  {
    id: 'neck-left-lateral', version: 1, group: 'neck', label: 'Neck — left lateral', region: 'neck', view: 'left lateral',
    laterality: 'left', asset: 'neck/neck-left-lateral.svg', width: 1200, height: 1000, provenance,
    description: 'Side of the neck seen from the patient\'s left side, facing the viewer\'s left, with the ear, jaw line, sternocleidomastoid, trapezius slope and clavicle region as landmarks. Anterior (A) is on the left of the image and posterior (P) on the right.',
  },
  {
    id: 'supraclavicular-right', version: 1, group: 'neck', label: 'Supraclavicular — right', region: 'right supraclavicular fossa', view: 'anterior',
    laterality: 'right', asset: 'neck/supraclavicular-right.svg', width: 1200, height: 1000, provenance,
    description: 'Front of the patient\'s right neck and shoulder with the clavicle, sternocleidomastoid and trapezius borders, and the supraclavicular fossa outlined with a dashed line. The midline is at the right edge of the drawing.',
  },
  {
    id: 'supraclavicular-left', version: 1, group: 'neck', label: 'Supraclavicular — left', region: 'left supraclavicular fossa', view: 'anterior',
    laterality: 'left', asset: 'neck/supraclavicular-left.svg', width: 1200, height: 1000, provenance,
    description: 'Front of the patient\'s left neck and shoulder with the clavicle, sternocleidomastoid and trapezius borders, and the supraclavicular fossa outlined with a dashed line. The midline is at the left edge of the drawing.',
  },
];
