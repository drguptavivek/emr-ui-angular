import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/**
 * Anaesthesia outlines: pre-op airway assessment, airway device position and regional block / line sites.
 * The three sagittal airways face the viewer's left (anterior on the left). The limb block views are drawn for the
 * patient's right side; the lower-limb posterior inset follows the posterior convention (patient's right on the viewer's right).
 */
export const ANAESTHESIA_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'mallampati-classes', version: 1, group: 'anaesthesia', label: 'Mallampati classes I–IV', region: 'oropharynx', view: 'open mouth, four classes',
    laterality: 'midline', asset: 'anaesthesia/mallampati-classes.svg', width: 1600, height: 800, provenance,
    description: 'Four open-mouth views with the tongue protruded, side by side and labelled Class I to Class IV. Class I shows soft palate, fauces, uvula and pillars; Class II the soft palate, fauces and uvula; Class III the soft palate and base of the uvula; Class IV the hard palate only. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'cormack-lehane-grades', version: 1, group: 'anaesthesia', label: 'Cormack–Lehane grades', region: 'larynx', view: 'laryngoscopic view, five grades',
    laterality: 'midline', asset: 'anaesthesia/cormack-lehane-grades.svg', width: 1900, height: 700, provenance,
    description: 'Five circular laryngoscopic views side by side with the epiglottis anterior at the top: Grade 1 full glottis, Grade 2a posterior glottis, Grade 2b arytenoids only, Grade 3 epiglottis only and Grade 4 no laryngeal structures. Each is labelled with its grade.',
  },
  {
    id: 'airway-ett-sagittal', version: 1, group: 'anaesthesia', label: 'Airway — endotracheal tube', region: 'airway', view: 'sagittal',
    laterality: 'midline', asset: 'anaesthesia/airway-ett-sagittal.svg', width: 1400, height: 1200, provenance,
    description: 'Midsagittal head and neck airway facing the viewer\'s left, with nasal cavity and turbinates, tongue, hyoid, epiglottis rising behind the tongue base with the vallecula, larynx with vocal folds, trachea with C-rings to the carina, the oesophagus behind and the cervical spine. A cuffed endotracheal tube passes through the mouth, behind the epiglottis and through the cords, with its cuff just below the cords, a bevelled tip mid-trachea, an inflation line to a pilot balloon outside the mouth and a dashed depth mark at the lips. Anterior is on the left.',
  },
  {
    id: 'airway-lma-sagittal', version: 1, group: 'anaesthesia', label: 'Airway — laryngeal mask', region: 'airway', view: 'sagittal',
    laterality: 'midline', asset: 'anaesthesia/airway-lma-sagittal.svg', width: 1400, height: 1200, provenance,
    description: 'Midsagittal head and neck airway facing the viewer\'s left with a laryngeal mask airway seated over the laryngeal inlet, its tip at the upper oesophageal sphincter, airway tube through the mouth and pilot balloon outside. Nasal cavity, tongue, epiglottis, cords, trachea and oesophagus are shown. Anterior is on the left.',
  },
  {
    id: 'airway-tracheostomy-sagittal', version: 1, group: 'anaesthesia', label: 'Airway — tracheostomy tube', region: 'airway', view: 'sagittal',
    laterality: 'midline', asset: 'anaesthesia/airway-tracheostomy-sagittal.svg', width: 1400, height: 1200, provenance,
    description: 'Midsagittal head and neck airway facing the viewer\'s left with a cuffed tracheostomy tube entering through the anterior neck and anterior tracheal wall below the cricoid, cuff inflated, tip above the carina, neck flange at the skin and pilot balloon outside. Anterior is on the left.',
  },
  {
    id: 'front-of-neck-access', version: 1, group: 'anaesthesia', label: 'Front-of-neck access landmarks', region: 'neck', view: 'anterior',
    laterality: 'midline', asset: 'anaesthesia/front-of-neck-access.svg', width: 1100, height: 1100, provenance,
    description: 'Front of the neck with chin, hyoid, thyroid cartilage, the cricothyroid membrane highlighted with a dashed outline, cricoid cartilage, tracheal rings, sternocleidomastoid borders, clavicles and sternal notch: the midline landmarks for emergency front-of-neck access. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'neuraxial-spine-lateral', version: 1, group: 'anaesthesia', label: 'Neuraxial spine — lateral', region: 'lumbosacral spine', view: 'lateral',
    laterality: 'midline', asset: 'anaesthesia/neuraxial-spine-lateral.svg', width: 1300, height: 1400, provenance,
    description: 'Lateral lumbosacral spine from T12 to S2 with vertebral bodies, discs, spinous processes and interspaces, the dural sac shaded as the subarachnoid space, the epidural space, the conus ending at L1–L2 and the cauda equina, and Tuffier\'s intercristal line dashed at L4. Anterior is on the left and posterior (back skin) on the right.',
  },
  {
    id: 'upper-limb-block-sites-right', version: 1, group: 'anaesthesia', label: 'Upper limb block sites — right', region: 'right neck, shoulder and arm', view: 'anterior',
    laterality: 'right', asset: 'anaesthesia/upper-limb-block-sites-right.svg', width: 1300, height: 1600, provenance,
    description: 'Patient\'s right neck, shoulder, arm and hand from the front with palm forward, with circles and labels for the brachial plexus blocks (interscalene, supraclavicular, infraclavicular, axillary) and the radial, median and ulnar nerve blocks at the wrist. The patient\'s right is on the viewer\'s left, marked R; the midline is the dashed line at the right.',
  },
  {
    id: 'lower-limb-block-sites-right', version: 1, group: 'anaesthesia', label: 'Lower limb block sites — right', region: 'right lower limb', view: 'anterior with posterior inset',
    laterality: 'right', asset: 'anaesthesia/lower-limb-block-sites-right.svg', width: 1900, height: 1800, provenance,
    description: 'Patient\'s right lower limb from the front with circles and labels for femoral, fascia iliaca, adductor canal, superficial peroneal, deep peroneal and saphenous nerve block sites, plus a small posterior view of the knee to heel showing popliteal sciatic, posterior tibial and sural sites. The patient\'s right is on the viewer\'s left on the anterior view and on the viewer\'s right on the posterior inset.',
  },
];
