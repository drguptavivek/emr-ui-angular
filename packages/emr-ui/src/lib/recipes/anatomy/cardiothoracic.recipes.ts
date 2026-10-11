import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
/** Vector trace of an AI-generated illustration supplied by the project owner. Output terms depend on the generator used, so confirm them before any release. */
const tracedHeartProvenance = { author: 'Vector trace of an AI-generated illustration (generator not recorded)', licence: 'Terms of the generating tool apply: confirm before release', reviewStatus: 'unreviewed' } as const;

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
    description: 'Anterior view of both lungs: right oblique and horizontal fissures (RUL, RML, RLL) and left oblique fissure (LUL with lingula, LLL); right dome higher than left; cardiac notch with the lingula; costophrenic angles. The trachea, carina, main and lobar bronchi and their first segmental branches are drawn near the hila only, with the hila marked. A light cardiac silhouette in the mediastinal gap marks the heart borders, with a thin parietal pleura outline and costophrenic recess. The peripheral lung fields are left clear for lesion and bronchus annotation. Patient right on the viewer left.',
  },
  {
    id: 'heart-great-vessels-anterior', version: 1, group: 'cardiothoracic', label: 'Heart and great vessels — anterior', region: 'chest', view: 'anterior',
    laterality: 'midline', asset: 'cardiothoracic/heart-great-vessels-anterior.svg', width: 1700, height: 1400, provenance,
    description: 'Anterior heart with ascending aorta and arch giving brachiocephalic trunk (bifurcating into right subclavian and right common carotid), left common carotid and left subclavian, the descending aorta passing behind the left pulmonary artery, SVC, IVC, left atrial appendage, right ventricle with the right AV and anterior interventricular grooves, and the pulmonary trunk dividing into the right and left pulmonary arteries. Pulmonary veins are posterior and not shown. Patient right on the viewer left.',
  },
  {
    id: 'heart-great-vessels-posterior', version: 1, group: 'cardiothoracic', label: 'Heart and great vessels — posterior', region: 'chest', view: 'posterior',
    laterality: 'midline', asset: 'cardiothoracic/heart-great-vessels-posterior.svg', width: 1800, height: 1300, provenance,
    description: 'Posterior heart with the left atrium and four pulmonary veins, IVC, SVC, coronary sinus and descending aorta. Patient right on the viewer right.',
  },
  {
    id: 'heart-anterior-cutaway', version: 1, group: 'cardiothoracic', label: 'Heart — anterior cutaway', region: 'chest', view: 'anterior cutaway',
    laterality: 'midline', asset: 'cardiothoracic/heart-anterior-cutaway.svg', width: 680, height: 880, provenance: tracedHeartProvenance,
    description: 'Unlabelled textbook-style anterior cutaway of the heart: right atrium and right ventricle, left atrium and left ventricle, septa, tricuspid and mitral valves with the aortic and pulmonary valves, SVC, IVC, ascending aorta with arch and three branches, pulmonary trunk and arteries, pulmonary veins and the trabeculated ventricular lining. Patient right on the viewer left (R and L marked).',
  },
  {
    id: 'heart-anterior-cutaway-chordae', version: 1, group: 'cardiothoracic', label: 'Heart — anterior cutaway with chordae', region: 'chest', view: 'anterior cutaway',
    laterality: 'midline', asset: 'cardiothoracic/heart-anterior-cutaway-chordae.svg', width: 680, height: 880, provenance: tracedHeartProvenance,
    description: 'The anterior heart cutaway with the chordae tendineae and papillary muscles drawn in both ventricles, otherwise unlabelled: chambers, septa, valves, SVC, IVC, aorta with arch branches, pulmonary trunk and arteries, pulmonary veins. Patient right on the viewer left (R and L marked).',
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
