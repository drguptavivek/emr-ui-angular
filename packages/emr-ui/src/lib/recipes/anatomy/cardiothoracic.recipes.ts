import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Airway, heart and echo schematics. Anterior views: patient's right on the viewer's left; posterior view: patient's right on the viewer's right; echo views follow the usual echo display (stated on each drawing); the valve plane is seen from above (patient's right on the viewer's right). */
export const CARDIOTHORACIC_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'tracheobronchial-tree', version: 1, group: 'cardiothoracic', label: 'Tracheobronchial tree — segmental', region: 'chest', view: 'anterior',
    laterality: 'bilateral', asset: 'cardiothoracic/tracheobronchial-tree.svg', width: 1400, height: 1400, provenance,
    description: 'Anterior view of the trachea, carina, main, lobar and segmental bronchi with segment labels RB1 to RB10 and LB1+2 to LB10. Patient right on the viewer left.',
  },
  {
    id: 'bronchiole-alveolus', version: 1, group: 'cardiothoracic', label: 'Bronchiole to alveolus — detail', region: 'chest', view: 'detail',
    laterality: 'not-applicable', asset: 'cardiothoracic/bronchiole-alveolus.svg', width: 1400, height: 1000, provenance,
    description: 'Schematic of a terminal bronchiole leading to a respiratory bronchiole, alveolar ducts and alveolar sacs, with a capillary network sketched on one sac.',
  },
  {
    id: 'lungs-airway-overlay', version: 1, group: 'cardiothoracic', label: 'Lungs with airway overlay', region: 'chest', view: 'anterior',
    laterality: 'bilateral', asset: 'cardiothoracic/lungs-airway-overlay.svg', width: 1900, height: 1200, provenance,
    description: 'Both lungs with dashed fissures and the bronchial tree to lobar level drawn inside, with the hila, visceral pleura and parietal pleura outline. Patient right on the viewer left.',
  },
  {
    id: 'heart-great-vessels-anterior', version: 1, group: 'cardiothoracic', label: 'Heart and great vessels — anterior', region: 'chest', view: 'anterior',
    laterality: 'midline', asset: 'cardiothoracic/heart-great-vessels-anterior.svg', width: 1700, height: 1400, provenance,
    description: 'Anterior heart with ascending aorta, arch and its three branches, descending aorta, SVC, IVC, pulmonary trunk dividing into the right and left pulmonary arteries, and the pulmonary veins at the left atrium. Patient right on the viewer left.',
  },
  {
    id: 'heart-great-vessels-posterior', version: 1, group: 'cardiothoracic', label: 'Heart and great vessels — posterior', region: 'chest', view: 'posterior',
    laterality: 'midline', asset: 'cardiothoracic/heart-great-vessels-posterior.svg', width: 1800, height: 1300, provenance,
    description: 'Posterior heart with the left atrium and four pulmonary veins, IVC, SVC, coronary sinus and descending aorta. Patient right on the viewer right.',
  },
  {
    id: 'heart-four-chamber-section', version: 1, group: 'cardiothoracic', label: 'Heart — four-chamber section', region: 'chest', view: 'coronal section',
    laterality: 'midline', asset: 'cardiothoracic/heart-four-chamber-section.svg', width: 1800, height: 1300, provenance,
    description: 'Coronal-like four-chamber section with RA, RV, LA and LV, interatrial and interventricular septa, tricuspid and mitral valves, papillary muscles, chordae and the aortic outflow with its valve. Patient right on the viewer left.',
  },
  {
    id: 'echo-parasternal-long-axis', version: 1, group: 'cardiothoracic', label: 'Echo — parasternal long axis', region: 'heart', view: 'echo parasternal long axis',
    laterality: 'not-applicable', asset: 'cardiothoracic/echo-parasternal-long-axis.svg', width: 1700, height: 1200, provenance,
    description: 'Echo-style sector schematic of the parasternal long axis: RV on top, septum, LV, mitral valve, left atrium, aortic root with valve and the descending aorta behind the atrium. LV apex on the viewer left, aortic root on the viewer right.',
  },
  {
    id: 'echo-parasternal-short-axis', version: 1, group: 'cardiothoracic', label: 'Echo — parasternal short axis', region: 'heart', view: 'echo parasternal short axis',
    laterality: 'not-applicable', asset: 'cardiothoracic/echo-parasternal-short-axis.svg', width: 1700, height: 1200, provenance,
    description: 'Echo-style sector schematic of the parasternal short axis at papillary level: circular LV with the six-segment ring and papillary muscles, and the RV crescent on the viewer left.',
  },
  {
    id: 'echo-apical-four-chamber', version: 1, group: 'cardiothoracic', label: 'Echo — apical four-chamber', region: 'heart', view: 'echo apical four-chamber',
    laterality: 'not-applicable', asset: 'cardiothoracic/echo-apical-four-chamber.svg', width: 1700, height: 1200, provenance,
    description: 'Echo-style sector schematic of the apical four-chamber view with the apex at the top, LV on the viewer right and RV on the viewer left, with atria, septa and the mitral and tricuspid valves.',
  },
  {
    id: 'heart-valve-plane', version: 1, group: 'cardiothoracic', label: 'Heart — valve plane', region: 'chest', view: 'base from above',
    laterality: 'midline', asset: 'cardiothoracic/heart-valve-plane.svg', width: 1800, height: 1200, provenance,
    description: 'Cardiac base seen from above with the atria removed: aortic valve cusps with coronary ostia, pulmonary valve, mitral anterior and posterior leaflets and tricuspid leaflets. Anterior at the top, patient right on the viewer right.',
  },
];
