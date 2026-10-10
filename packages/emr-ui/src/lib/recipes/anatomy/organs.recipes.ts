import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Liver segments, lung lobes and the heart with its coronary arteries. Anterior views put the patient's right on the viewer's left; posterior views put it on the viewer's right. */
export const ORGANS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'liver-couinaud', version: 1, group: 'organs', label: 'Liver — Couinaud segments', region: 'liver', view: 'anterior',
    laterality: 'midline', asset: 'organs/liver-couinaud.svg', width: 1400, height: 1100, provenance,
    description: 'Anterior view of the liver with Couinaud segments I to VIII numbered, the hepatic veins, umbilical fissure and portal division as dashed boundaries, and the gallbladder. The patient\'s right is on the viewer\'s left, marked R; segment I is hidden behind and shown dashed.',
  },
  {
    id: 'lung-lobes-anterior', version: 1, group: 'organs', label: 'Lung lobes — anterior', region: 'lungs', view: 'anterior',
    laterality: 'bilateral', asset: 'organs/lung-lobes-anterior.svg', width: 1400, height: 1200, provenance,
    description: 'Anterior view of both lungs with the right oblique and horizontal fissures and the left oblique fissure, lobes labelled RUL, RML, RLL, LUL, lingula and LLL, and the trachea with both main bronchi. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'lung-lobes-posterior', version: 1, group: 'organs', label: 'Lung lobes — posterior', region: 'lungs', view: 'posterior',
    laterality: 'bilateral', asset: 'organs/lung-lobes-posterior.svg', width: 1400, height: 1200, provenance,
    description: 'Posterior view of both lungs with both oblique fissures rising toward the spine, upper and lower lobes labelled, and the trachea with both main bronchi. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'heart-coronary-anterior', version: 1, group: 'organs', label: 'Heart and coronary arteries — anterior', region: 'heart', view: 'anterior',
    laterality: 'midline', asset: 'organs/heart-coronary-anterior.svg', width: 1200, height: 1200, provenance,
    description: 'Anterior heart outline with the aorta and pulmonary trunk and the main coronary arteries as labelled lines: left main stem, LAD with diagonals, circumflex with obtuse marginals, and right coronary artery with its posterior descending branch. The patient\'s right is on the viewer\'s left, marked R.',
  },
];
