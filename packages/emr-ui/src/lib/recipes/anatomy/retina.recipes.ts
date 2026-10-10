import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
const size = { width: 1200, height: 1200 } as const;

/** Retinal fundus views as seen through an ophthalmoscope: disc nasal (viewer's right for OD, left for OS), 12 o'clock superior. */
export const RETINA_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'retina-posterior-pole-od', version: 1, group: 'retina', label: 'Retina posterior pole — right eye (OD)', region: 'right retina, posterior pole', view: 'fundus',
    laterality: 'right', asset: 'retina/retina-posterior-pole-od.svg', ...size, provenance,
    description: 'Fundus outline of the right posterior pole: optic disc with cup, macula and fovea, and the superior and inferior vascular arcades; optic disc on the viewer\'s right (nasal), labelled OD, N, T, S and I.',
  },
  {
    id: 'retina-posterior-pole-os', version: 1, group: 'retina', label: 'Retina posterior pole — left eye (OS)', region: 'left retina, posterior pole', view: 'fundus',
    laterality: 'left', asset: 'retina/retina-posterior-pole-os.svg', ...size, provenance,
    description: 'Fundus outline of the left posterior pole: optic disc with cup, macula and fovea, and the superior and inferior vascular arcades; optic disc on the viewer\'s left (nasal), labelled OS, N, T, S and I.',
  },
  {
    id: 'retina-peripheral-od', version: 1, group: 'retina', label: 'Retina peripheral chart — right eye (OD)', region: 'right retina, periphery', view: 'peripheral chart',
    laterality: 'right', asset: 'retina/retina-peripheral-od.svg', ...size, provenance,
    description: 'Peripheral retinal chart of the right eye: concentric rings for the posterior pole, equator and ora serrata, twelve clock-hour radial lines, optic disc and macula, with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'retina-peripheral-os', version: 1, group: 'retina', label: 'Retina peripheral chart — left eye (OS)', region: 'left retina, periphery', view: 'peripheral chart',
    laterality: 'left', asset: 'retina/retina-peripheral-os.svg', ...size, provenance,
    description: 'Peripheral retinal chart of the left eye: concentric rings for the posterior pole, equator and ora serrata, twelve clock-hour radial lines, optic disc and macula, with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
];
