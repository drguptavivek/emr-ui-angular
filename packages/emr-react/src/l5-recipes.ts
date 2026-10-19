// L5 Recipes: pure data schemas (anatomy outlines and clinical annotation symbol sets).
import type { AnatomyTemplateRecipe, AnnotationSymbolSet } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

/** Abdomen, anterior view. Patient's right is on the viewer's left (marked R). */
export const ABDOMEN_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'abdomen-plain', version: 1, group: 'abdomen', label: 'Abdomen — plain', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'abdomen/abdomen-plain.svg', ...({ width: 1000, height: 1200 } as const), provenance,
    description: 'Anterior abdominal wall outline from costal margins to inguinal ligaments, with the umbilicus marked.',
  },
  {
    id: 'abdomen-quadrants', version: 1, group: 'abdomen', label: 'Abdomen — four quadrants', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'abdomen/abdomen-quadrants.svg', ...({ width: 1000, height: 1200 } as const), provenance,
    description: 'Anterior abdomen divided into four quadrants by vertical and horizontal lines through the umbilicus.',
  },
  {
    id: 'abdomen-nine-regions', version: 1, group: 'abdomen', label: 'Abdomen — nine regions', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'abdomen/abdomen-nine-regions.svg', ...({ width: 1000, height: 1200 } as const), provenance,
    description: 'Anterior abdomen divided into nine regions by the midclavicular, subcostal and intertubercular planes.',
  },
];

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

/** Slit-lamp style cross-section of the anterior segment, anterior up; N and T follow the examiner's view of that eye. */
export const ANTERIOR_SEGMENT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'anterior-segment-od', version: 1, group: 'anterior-segment', label: 'Anterior segment — right eye (OD)', region: 'right eye', view: 'cross-section',
    laterality: 'right', asset: 'anterior-segment/anterior-segment-od.svg', ...({ width: 1400, height: 1000 } as const), provenance,
    description: 'Slit-lamp style cross-section of the right anterior segment with anterior at the top: cornea, anterior chamber, iris, lens, angle, ciliary body and sclera; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'anterior-segment-os', version: 1, group: 'anterior-segment', label: 'Anterior segment — left eye (OS)', region: 'left eye', view: 'cross-section',
    laterality: 'left', asset: 'anterior-segment/anterior-segment-os.svg', ...({ width: 1400, height: 1000 } as const), provenance,
    description: 'Slit-lamp style cross-section of the left anterior segment with anterior at the top: cornea, anterior chamber, iris, lens, angle, ciliary body and sclera; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
  {
    id: 'angle-gonioscopy-od', version: 1, group: 'anterior-segment', label: 'Angle gonioscopy chart — right eye (OD)', region: 'right eye, iridocorneal angle', view: 'gonioscopy chart',
    laterality: 'right', asset: 'anterior-segment/angle-gonioscopy-od.svg', ...({ width: 1400, height: 1000 } as const), provenance,
    description: 'Gonioscopy angle chart of the right eye: concentric rings for Schwalbe\'s line, trabecular meshwork, scleral spur, ciliary body band and iris root, split into superior, nasal, inferior and temporal quadrants with clock hours 12, 3, 6 and 9; nasal on the viewer\'s right, labelled OD.',
  },
  {
    id: 'angle-gonioscopy-os', version: 1, group: 'anterior-segment', label: 'Angle gonioscopy chart — left eye (OS)', region: 'left eye, iridocorneal angle', view: 'gonioscopy chart',
    laterality: 'left', asset: 'anterior-segment/angle-gonioscopy-os.svg', ...({ width: 1400, height: 1000 } as const), provenance,
    description: 'Gonioscopy angle chart of the left eye: concentric rings for Schwalbe\'s line, trabecular meshwork, scleral spur, ciliary body band and iris root, split into superior, nasal, inferior and temporal quadrants with clock hours 12, 3, 6 and 9; nasal on the viewer\'s left, labelled OS.',
  },
  {
    id: 'angle-structures', version: 1, group: 'anterior-segment', label: 'Iridocorneal angle structures', region: 'iridocorneal angle', view: 'enlarged cross-section',
    laterality: 'not-applicable', asset: 'anterior-segment/angle-structures.svg', ...({ width: 1400, height: 1000 } as const), provenance,
    description: 'Enlarged schematic cross-section of the iridocorneal angle with anterior up: cornea, Schwalbe\'s line, trabecular meshwork, Schlemm\'s canal, scleral spur, ciliary body band, iris root, ciliary body and sclera.',
  },
];

/** Posterior views: patient's right is on the viewer's right (marked R). */
export const BACK_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'back-whole', version: 1, group: 'back', label: 'Back — whole', region: 'back', view: 'posterior',
    laterality: 'bilateral', asset: 'back/back-whole.svg', width: 1000, height: 1400, provenance,
    description: 'Whole posterior trunk from neck to upper buttocks with scapulae, spinous-process midline from C7 to L5, iliac crests, posterior superior iliac spine dimples and gluteal cleft.',
  },
  {
    id: 'spine-cervical', version: 1, group: 'back', label: 'Spine — cervical', region: 'cervical spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-cervical.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior neck and lower occiput outline with the cervical spinous processes C2 to C7 and T1 along the midline and the superior nuchal line.',
  },
  {
    id: 'spine-thoracic', version: 1, group: 'back', label: 'Spine — thoracic', region: 'thoracic spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-thoracic.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior upper and mid back with spinous processes C7 and T1 to T12 along the midline and both scapulae as landmarks.',
  },
  {
    id: 'spine-lumbar', version: 1, group: 'back', label: 'Spine — lumbar', region: 'lumbar spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-lumbar.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior lumbar back with spinous processes T12 to S1 along the midline, paraspinal lines, twelfth ribs, iliac crests and posterior superior iliac spine dimples.',
  },
  {
    id: 'spine-sacral', version: 1, group: 'back', label: 'Spine — sacral', region: 'sacral spine', view: 'posterior',
    laterality: 'midline', asset: 'back/spine-sacral.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior sacral region with the sacrum, median crest levels S1 to S5, coccyx, iliac crests, posterior superior iliac spine dimples and the upper gluteal cleft.',
  },
];

/**
 * Bony joint outlines for orthopaedic marking (fractures, implants, arthroplasty). Anterior views: patient's right is on the viewer's left.
 * Lateral knee views are drawn as seen from the side being examined, so the patella (anterior) is on the viewer's right for the right knee and on the left for the left knee.
 */
export const BONY_JOINTS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'pelvis-hip-ap', version: 1, group: 'bony-joints', label: 'Pelvis and hips — AP', region: 'pelvis and hips', view: 'anteroposterior',
    laterality: 'bilateral', asset: 'bony-joints/pelvis-hip-ap.svg', width: 1400, height: 1300, provenance,
    description: 'Anteroposterior pelvis with both hips: iliac wings with crest, ASIS and AIIS, L5 vertebra, sacrum and coccyx, sacroiliac joints, acetabula with rim and teardrop, femoral heads, necks and trochanters, Shenton\'s line, pubic symphysis, rami and obturator foramina. Patient\'s right is on the viewer\'s left (R and L marked).',
  },
  {
    id: 'knee-bony-ap-right', version: 1, group: 'bony-joints', label: 'Knee bones — right AP', region: 'right knee', view: 'anteroposterior',
    laterality: 'right', asset: 'bony-joints/knee-bony-ap-right.svg', width: 1000, height: 1400, provenance,
    description: 'Right knee bones from the front: distal femur with both condyles, patella, tibial plateau with tibial spines and proximal fibula. The fibula (lateral side) is on the viewer\'s left.',
  },
  {
    id: 'knee-bony-ap-left', version: 1, group: 'bony-joints', label: 'Knee bones — left AP', region: 'left knee', view: 'anteroposterior',
    laterality: 'left', asset: 'bony-joints/knee-bony-ap-left.svg', width: 1000, height: 1400, provenance,
    description: 'Left knee bones from the front: distal femur with both condyles, patella, tibial plateau with tibial spines and proximal fibula. The fibula (lateral side) is on the viewer\'s right.',
  },
  {
    id: 'knee-bony-lateral-right', version: 1, group: 'bony-joints', label: 'Knee bones — right lateral', region: 'right knee', view: 'lateral',
    laterality: 'right', asset: 'bony-joints/knee-bony-lateral-right.svg', width: 1000, height: 1400, provenance,
    description: 'Right knee bones seen from the lateral side: distal femoral condyles, patella and tibial tuberosity anteriorly on the viewer\'s right, fibular head posteriorly on the left. Anterior and posterior are labelled.',
  },
  {
    id: 'knee-bony-lateral-left', version: 1, group: 'bony-joints', label: 'Knee bones — left lateral', region: 'left knee', view: 'lateral',
    laterality: 'left', asset: 'bony-joints/knee-bony-lateral-left.svg', width: 1000, height: 1400, provenance,
    description: 'Left knee bones seen from the lateral side: distal femoral condyles, patella and tibial tuberosity anteriorly on the viewer\'s left, fibular head posteriorly on the right. Anterior and posterior are labelled.',
  },
  {
    id: 'shoulder-bony-right', version: 1, group: 'bony-joints', label: 'Shoulder bones — right AP', region: 'right shoulder', view: 'anteroposterior',
    laterality: 'right', asset: 'bony-joints/shoulder-bony-right.svg', width: 1400, height: 1100, provenance,
    description: 'Right glenohumeral joint from the front: proximal humerus on the viewer\'s left, glenoid, acromion, coracoid and scapula, with the clavicle running medially to the viewer\'s right.',
  },
  {
    id: 'shoulder-bony-left', version: 1, group: 'bony-joints', label: 'Shoulder bones — left AP', region: 'left shoulder', view: 'anteroposterior',
    laterality: 'left', asset: 'bony-joints/shoulder-bony-left.svg', width: 1400, height: 1100, provenance,
    description: 'Left glenohumeral joint from the front: proximal humerus on the viewer\'s right, glenoid, acromion, coracoid and scapula, with the clavicle running medially to the viewer\'s left.',
  },
  {
    id: 'hand-bones-right-dorsal', version: 1, group: 'bony-joints', label: 'Hand bones — right dorsal', region: 'right hand', view: 'dorsal',
    laterality: 'right', asset: 'bony-joints/hand-bones-right-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Right hand bones, dorsal view, fingers up and thumb on the viewer\'s left: the carpal bones (pisiform partly tucked behind the triquetrum), five metacarpals, phalanges with visible joint spaces, and the distal radius and ulna.',
  },
  {
    id: 'hand-bones-left-dorsal', version: 1, group: 'bony-joints', label: 'Hand bones — left dorsal', region: 'left hand', view: 'dorsal',
    laterality: 'left', asset: 'bony-joints/hand-bones-left-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Left hand bones, dorsal view, fingers up and thumb on the viewer\'s right: the carpal bones (pisiform partly tucked behind the triquetrum), five metacarpals, phalanges with visible joint spaces, and the distal radius and ulna.',
  },
  {
    id: 'foot-bones-right-dorsal', version: 1, group: 'bony-joints', label: 'Foot bones — right dorsal', region: 'right foot', view: 'dorsal',
    laterality: 'right', asset: 'bony-joints/foot-bones-right-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Right foot bones, dorsal view, toes up and the big toe medial on the viewer\'s left: talus, calcaneus, navicular, cuboid, three cuneiforms, five metatarsals and the phalanges of all toes.',
  },
  {
    id: 'foot-bones-left-dorsal', version: 1, group: 'bony-joints', label: 'Foot bones — left dorsal', region: 'left foot', view: 'dorsal',
    laterality: 'left', asset: 'bony-joints/foot-bones-left-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Left foot bones, dorsal view, toes up and the big toe medial on the viewer\'s right: talus, calcaneus, navicular, cuboid, three cuneiforms, five metatarsals and the phalanges of all toes.',
  },
  {
    id: 'spine-bony-ap', version: 1, group: 'bony-joints', label: 'Spine — AP', region: 'spine', view: 'anteroposterior',
    laterality: 'midline', asset: 'bony-joints/spine-bony-ap.svg', width: 800, height: 1600, provenance,
    description: 'Vertebral column from C1 to the coccyx from the front: cervical, thoracic with rib stubs and lumbar vertebrae, sacrum and coccyx, with level labels C1, C7, T1, T12, L1, L5 and S1. R is on the viewer\'s left.',
  },
  {
    id: 'spine-bony-lateral', version: 1, group: 'bony-joints', label: 'Spine — lateral', region: 'spine', view: 'lateral',
    laterality: 'midline', asset: 'bony-joints/spine-bony-lateral.svg', width: 800, height: 1600, provenance,
    description: 'Vertebral column from C1 to the coccyx from the side, showing cervical and lumbar lordosis and thoracic kyphosis, vertebral bodies, intervertebral discs and spinous processes. Anterior is on the viewer\'s left; levels C1, C7, T1, T12, L1, L5, S1 are labelled.',
  },
];

/** Lund and Browder burn charts: anterior and posterior figures side by side, divided into the standard regions. Region percentages are controller data, not drawing. */
export const BURNS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'lund-browder-adult', version: 1, group: 'burns', label: 'Lund and Browder chart — adult', region: 'whole body', view: 'burn chart',
    laterality: 'bilateral', asset: 'burns/lund-browder-adult.svg', width: 1600, height: 1100, provenance,
    description: 'Adult anterior figure (left) and posterior figure (right) divided by dashed lines into head, neck, trunk, genitalia or buttocks, upper arms, forearms, hands, thighs, legs and feet. On the anterior figure the patient\'s right is on the viewer\'s left; on the posterior figure it is on the viewer\'s right. Each is marked R and L.',
  },
  {
    id: 'lund-browder-child', version: 1, group: 'burns', label: 'Lund and Browder chart — child', region: 'whole body', view: 'burn chart',
    laterality: 'bilateral', asset: 'burns/lund-browder-child.svg', width: 1600, height: 1100, provenance,
    description: 'Child anterior figure (left) and posterior figure (right) with a larger head and shorter legs, divided by dashed lines into the standard Lund and Browder regions. On the anterior figure the patient\'s right is on the viewer\'s left; on the posterior figure it is on the viewer\'s right. Each is marked R and L.',
  },
];

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

/** Cornea face-on with limbus and clock hours as the examiner sees it; 3 o'clock is on the viewer's right for both eyes. */
export const CORNEA_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'cornea-od', version: 1, group: 'cornea', label: 'Cornea — right eye (OD)', region: 'right eye', view: 'face-on',
    laterality: 'right', asset: 'cornea/cornea-od.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Circular cornea of the right eye with limbus ring, dashed pupil outline, centre cross lines and clock-hour ticks with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'cornea-os', version: 1, group: 'cornea', label: 'Cornea — left eye (OS)', region: 'left eye', view: 'face-on',
    laterality: 'left', asset: 'cornea/cornea-os.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Circular cornea of the left eye with limbus ring, dashed pupil outline, centre cross lines and clock-hour ticks with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
];

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

/**
 * Ear, nasal, laryngeal and cervical outlines for ENT and head-and-neck work. The middle-ear schematic is the standard
 * textbook coronal view of the RIGHT ear (lateral on the viewer's left). Lateral views follow the ear files: the right
 * side faces anterior toward the viewer's right, the left side toward the viewer's left. The laryngoscopy view has
 * the anterior commissure at the top and the patient's right on the viewer's left.
 */
export const ENT_HEAD_NECK_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'middle-ear-schematic', version: 1, group: 'ent-head-neck', label: 'Middle ear — coronal schematic', region: 'right ear', view: 'coronal',
    laterality: 'right', asset: 'ent-head-neck/middle-ear-schematic.svg', width: 1400, height: 1000, provenance,
    description: 'Coronal schematic of the right ear, lateral on the viewer\'s left: external canal, tympanic membrane, middle-ear cavity with malleus, incus and stapes, oval and round windows, cochlea, semicircular canals and the eustachian tube.',
  },
  {
    id: 'mastoid-temporal-right', version: 1, group: 'ent-head-neck', label: 'Mastoid and temporal — right', region: 'right temporal region', view: 'lateral',
    laterality: 'right', asset: 'ent-head-neck/mastoid-temporal-right.svg', width: 1000, height: 1200, provenance,
    description: 'Right temporal region and mastoid from the side, anterior toward the viewer\'s right: pinna, mastoid tip, suprameatal (Macewen\'s) triangle, zygomatic root, and a dashed postauricular incision line.',
  },
  {
    id: 'mastoid-temporal-left', version: 1, group: 'ent-head-neck', label: 'Mastoid and temporal — left', region: 'left temporal region', view: 'lateral',
    laterality: 'left', asset: 'ent-head-neck/mastoid-temporal-left.svg', width: 1000, height: 1200, provenance,
    description: 'Left temporal region and mastoid from the side, anterior toward the viewer\'s left: pinna, mastoid tip, suprameatal (Macewen\'s) triangle, zygomatic root, and a dashed postauricular incision line.',
  },
  {
    id: 'larynx-laryngoscopy', version: 1, group: 'ent-head-neck', label: 'Larynx — laryngoscopy', region: 'larynx', view: 'laryngoscopic',
    laterality: 'bilateral', asset: 'ent-head-neck/larynx-laryngoscopy.svg', width: 1200, height: 1000, provenance,
    description: 'Laryngoscopic view with the anterior commissure at the top and the patient\'s right on the viewer\'s left: epiglottis, vallecula, aryepiglottic folds, arytenoids, false and true vocal cords in abduction, and the piriform fossae.',
  },
  {
    id: 'paranasal-sinuses-frontal', version: 1, group: 'ent-head-neck', label: 'Paranasal sinuses — frontal', region: 'paranasal sinuses', view: 'anterior',
    laterality: 'bilateral', asset: 'ent-head-neck/paranasal-sinuses-frontal.svg', width: 1200, height: 1250, provenance,
    description: 'Frontal facial outline showing the frontal, ethmoid and maxillary sinuses, both orbits and the nasal cavity; patient\'s right on the viewer\'s left.',
  },
  {
    id: 'nasal-lateral-wall-right', version: 1, group: 'ent-head-neck', label: 'Nasal lateral wall — right', region: 'right nasal cavity', view: 'sagittal',
    laterality: 'right', asset: 'ent-head-neck/nasal-lateral-wall-right.svg', width: 1200, height: 1000, provenance,
    description: 'Sagittal view of the right lateral nasal wall, anterior to the left: inferior, middle and superior turbinates with their meatuses, sphenoid sinus, nasopharynx and the eustachian tube opening.',
  },
  {
    id: 'neck-levels-right', version: 1, group: 'ent-head-neck', label: 'Neck levels — right', region: 'right neck', view: 'lateral',
    laterality: 'right', asset: 'ent-head-neck/neck-levels-right.svg', width: 1000, height: 1400, provenance,
    description: 'Right lateral neck, anterior toward the viewer\'s right, with cervical lymph-node levels IA, IB, IIA, IIB, III, IV, VA, VB and VI as dashed boundaries, and the mandible, hyoid, sternocleidomastoid and clavicle as landmarks.',
  },
  {
    id: 'neck-levels-left', version: 1, group: 'ent-head-neck', label: 'Neck levels — left', region: 'left neck', view: 'lateral',
    laterality: 'left', asset: 'ent-head-neck/neck-levels-left.svg', width: 1000, height: 1400, provenance,
    description: 'Left lateral neck, anterior toward the viewer\'s left, with cervical lymph-node levels IA, IB, IIA, IIB, III, IV, VA, VB and VI as dashed boundaries, and the mandible, hyoid, sternocleidomastoid and clavicle as landmarks.',
  },
];

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

/** External (anterior) eye as the examiner faces the patient. OD: nasal on the viewer's right; OS: nasal on the viewer's left. */
export const EYE_EXTERNAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'external-eye-od', version: 1, group: 'eye-external', label: 'External eye — right eye (OD)', region: 'right eye', view: 'external',
    laterality: 'right', asset: 'eye-external/external-eye-od.svg', ...({ width: 1400, height: 1000 } as const), provenance,
    description: 'Outline of the right eye seen from the front: upper and lower lids with lash line, lid creases, palpebral aperture, iris and pupil, and the caruncle at the nasal canthus; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'external-eye-os', version: 1, group: 'eye-external', label: 'External eye — left eye (OS)', region: 'left eye', view: 'external',
    laterality: 'left', asset: 'eye-external/external-eye-os.svg', ...({ width: 1400, height: 1000 } as const), provenance,
    description: 'Outline of the left eye seen from the front: upper and lower lids with lash line, lid creases, palpebral aperture, iris and pupil, and the caruncle at the nasal canthus; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
];

/** Face outlines: frontal and both profiles, with eyes, nose, lips and ears as light landmarks. */
export const FACE_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'face-frontal', version: 1, group: 'face', label: 'Face — frontal', region: 'face', view: 'frontal',
    laterality: 'bilateral', asset: 'face/face-frontal.svg', width: 1000, height: 1200, provenance,
    description: 'Face seen from the front from hairline to chin, with eyebrows, eyes, nose, lips and ears as light landmarks. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'face-right-profile', version: 1, group: 'face', label: 'Face — right profile', region: 'face', view: 'right profile',
    laterality: 'right', asset: 'face/face-right-profile.svg', width: 1000, height: 1200, provenance,
    description: 'Face seen in profile from the patient\'s right side, facing the viewer\'s right, with brow, eye, nose, lips, chin and ear as light landmarks. Anterior (A) is on the right of the image and posterior (P) on the left.',
  },
  {
    id: 'face-left-profile', version: 1, group: 'face', label: 'Face — left profile', region: 'face', view: 'left profile',
    laterality: 'left', asset: 'face/face-left-profile.svg', width: 1000, height: 1200, provenance,
    description: 'Face seen in profile from the patient\'s left side, facing the viewer\'s left, with brow, eye, nose, lips, chin and ear as light landmarks. Anterior (A) is on the left of the image and posterior (P) on the right.',
  },
];

/** Feet and toenails. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const FEET_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'foot-right-dorsal', version: 1, group: 'feet', label: 'Foot — right dorsal', region: 'right foot', view: 'dorsal',
    laterality: 'right', asset: 'feet/foot-right-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Right foot dorsal view with the toes pointing up and the big toe, on the medial side, at the viewer\'s left; ankle crease, malleoli, tendon lines and toenails are marked.',
  },
  {
    id: 'foot-right-plantar', version: 1, group: 'feet', label: 'Foot — right plantar', region: 'right foot', view: 'plantar',
    laterality: 'right', asset: 'feet/foot-right-plantar.svg', width: 800, height: 1400, provenance,
    description: 'Right foot plantar view with the toes pointing up and the big toe, on the medial side, at the viewer\'s right; hindfoot, midfoot and forefoot regions, the ball of the foot and the arch edge are marked.',
  },
  {
    id: 'foot-left-dorsal', version: 1, group: 'feet', label: 'Foot — left dorsal', region: 'left foot', view: 'dorsal',
    laterality: 'left', asset: 'feet/foot-left-dorsal.svg', width: 800, height: 1400, provenance,
    description: 'Left foot dorsal view with the toes pointing up and the big toe, on the medial side, at the viewer\'s right; ankle crease, malleoli, tendon lines and toenails are marked.',
  },
  {
    id: 'foot-left-plantar', version: 1, group: 'feet', label: 'Foot — left plantar', region: 'left foot', view: 'plantar',
    laterality: 'left', asset: 'feet/foot-left-plantar.svg', width: 800, height: 1400, provenance,
    description: 'Left foot plantar view with the toes pointing up and the big toe, on the medial side, at the viewer\'s left; hindfoot, midfoot and forefoot regions, the ball of the foot and the arch edge are marked.',
  },
  {
    id: 'toenails', version: 1, group: 'feet', label: 'Toenails — both feet', region: 'toenails', view: 'dorsal',
    laterality: 'bilateral', asset: 'feet/toenails.svg', width: 1600, height: 1000, provenance,
    description: 'Dorsal view of the forefoot and toes of both feet, toes up, big toes toward the middle; the left foot is on the viewer\'s left. Each of the ten toenails is shaded.',
  },
];

/** Respectful clinical schematics. Perianal and anal-canal views are in lithotomy orientation, 12 o'clock anterior, patient's right on the viewer's left. */
export const GENITAL_PERINEAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'genital-male-external', version: 1, group: 'genital-perineal', label: 'Male external genitalia', region: 'male external genitalia', view: 'anterior',
    laterality: 'midline', asset: 'genital-perineal/genital-male-external.svg', width: 1000, height: 1200, provenance,
    description: 'Schematic anterior outline of the penis with glans, scrotum with median raphe and testes, inguinal folds and medial thighs; patient\'s right on the viewer\'s left.',
  },
  {
    id: 'genital-female-external', version: 1, group: 'genital-perineal', label: 'Female external genitalia', region: 'female external genitalia', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/genital-female-external.svg', width: 1000, height: 1200, provenance,
    description: 'Schematic lithotomy outline of the vulva with mons pubis, labia majora and minora, clitoris, urethral meatus, vaginal introitus, perineum and anus; anterior at the top.',
  },
  {
    id: 'perineum', version: 1, group: 'genital-perineal', label: 'Perineum', region: 'perineum', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/perineum.svg', width: 1000, height: 1000, provenance,
    description: 'Lithotomy perineum diamond from pubic symphysis to coccyx between the ischial tuberosities, divided into urogenital and anal triangles with perineal body and anus; anterior at the top.',
  },
  {
    id: 'perianal', version: 1, group: 'genital-perineal', label: 'Perianal region', region: 'perianal', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/perianal.svg', width: 1000, height: 1000, provenance,
    description: 'Lithotomy perianal outline with the anus and radial skin folds at the centre, two concentric perianal rings, anterior raphe and natal cleft; anterior at the top, labelled.',
  },
  {
    id: 'anal-canal-clock-face', version: 1, group: 'genital-perineal', label: 'Anal canal — clock face', region: 'anal canal', view: 'lithotomy',
    laterality: 'midline', asset: 'genital-perineal/anal-canal-clock-face.svg', width: 1000, height: 1000, provenance,
    description: 'Lithotomy clock face of the anal canal with all twelve hours marked, 12 o\'clock anterior and 3 o\'clock on the patient\'s left, with concentric perianal skin and anal canal rings.',
  },
];

/** Gastrointestinal tract maps for endoscopy and ERCP reports. Anterior views put the patient's right on the viewer's left (marked R). */
export const GI_TRACT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'oesophagus-endoscopy-map', version: 1, group: 'gi-tract', label: 'Oesophagus — endoscopy map', region: 'oesophagus', view: 'anterior',
    laterality: 'midline', asset: 'gi-tract/oesophagus-endoscopy-map.svg', width: 1000, height: 1400, provenance,
    description: 'Vertical oesophagus schematic with a distance scale from the incisors (15 to 40 cm), upper oesophageal sphincter, aortic arch and left main bronchus indentations, diaphragmatic hiatus, dashed Z-line and the gastro-oesophageal junction.',
  },
  {
    id: 'stomach-endoscopy-map', version: 1, group: 'gi-tract', label: 'Stomach — endoscopy map', region: 'stomach', view: 'anterior',
    laterality: 'midline', asset: 'gi-tract/stomach-endoscopy-map.svg', width: 1200, height: 1200, provenance,
    description: 'Stomach outline from the oesophageal entry to the duodenal bulb with cardia, fundus, upper, mid and lower body, incisura angularis, antrum, pylorus (sphincter) and lesser and greater curvatures separated by dashed boundaries, plus a small circumferential wall key.',
  },
  {
    id: 'stomach-retroflexion', version: 1, group: 'gi-tract', label: 'Stomach — retroflexed cardia view', region: 'stomach', view: 'retroflexed',
    laterality: 'not-applicable', asset: 'gi-tract/stomach-retroflexion.svg', width: 1200, height: 1200, provenance,
    description: 'Circular endoscopic field of the retroflexed view of the cardia, with the scope shaft passing through the gastro-oesophageal junction ring, fundal folds around it and the lesser and greater curve sides labelled.',
  },
  {
    id: 'duodenum-segments', version: 1, group: 'gi-tract', label: 'Duodenum — segments D1 to D4', region: 'duodenum', view: 'anterior',
    laterality: 'midline', asset: 'gi-tract/duodenum-segments.svg', width: 1000, height: 1000, provenance,
    description: 'Duodenal C-loop from the pylorus through D1 (bulb), D2 with major and minor papillae, D3 and D4 to the duodenojejunal flexure, with the pancreatic head outlined lightly inside the loop.',
  },
  {
    id: 'colon-colonoscopy-map', version: 1, group: 'gi-tract', label: 'Colon — colonoscopy map', region: 'colon', view: 'anterior',
    laterality: 'midline', asset: 'gi-tract/colon-colonoscopy-map.svg', width: 1400, height: 1200, provenance,
    description: 'Whole colon framed in the abdominal outline, from caecum with appendix, ileocaecal valve and terminal ileum through the hepatic flexure, transverse colon, splenic flexure and descending colon to the sigmoid loop, rectosigmoid junction, rectum and anal canal, with approximate distance-from-anal-verge ticks at 15, 30, 40 and 60 cm and the anal verge at 0 cm.',
  },
  {
    id: 'sigmoid-rectum', version: 1, group: 'gi-tract', label: 'Sigmoid and rectum', region: 'rectum', view: 'anterior',
    laterality: 'midline', asset: 'gi-tract/sigmoid-rectum.svg', width: 1200, height: 1200, provenance,
    description: 'Sigmoid colon, rectosigmoid junction, rectum in upper, middle and lower thirds with distance ticks at 5, 10 and 15 cm from the anal verge, valves of Houston, anorectal junction and anal canal.',
  },
  {
    id: 'small-bowel-overview', version: 1, group: 'gi-tract', label: 'Small bowel — overview', region: 'small bowel', view: 'anterior',
    laterality: 'midline', asset: 'gi-tract/small-bowel-overview.svg', width: 1000, height: 1200, provenance,
    description: 'Abdomen with jejunal loops on the patient\'s left and ileal loops towards the right iliac fossa, from the duodenojejunal flexure to the ileocaecal valve, with the mesentery root as a dashed line.',
  },
  {
    id: 'biliary-pancreatic-ercp', version: 1, group: 'gi-tract', label: 'Biliary tree and pancreatic duct — ERCP', region: 'biliary tree', view: 'anterior',
    laterality: 'midline', asset: 'gi-tract/biliary-pancreatic-ercp.svg', width: 1200, height: 1200, provenance,
    description: 'ERCP schematic with right and left hepatic ducts and intrahepatic branches, common hepatic duct, cystic duct and gallbladder, common bile duct, pancreatic duct along the pancreas, and the ampulla in the second part of the duodenum.',
  },
];

/**
 * Globe, lids, lacrimal system and orbit. Surgical and lid views are the examiner's front view (nasal on the
 * viewer's right for OD, on the viewer's left for OS; clock hours as the examiner faces the patient). The orbit
 * views follow the radiological convention: the patient's right is on the viewer's left.
 */
export const GLOBE_ORBIT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'globe-cross-section', version: 1, group: 'globe-orbit', label: 'Globe — horizontal cross-section', region: 'globe', view: 'cross-section',
    laterality: 'not-applicable', asset: 'globe-orbit/globe-cross-section.svg', width: 1400, height: 1000, provenance,
    description: 'Horizontal cross-section of the whole eye with anterior at the left: cornea, anterior chamber, iris, lens, zonules, ciliary body, vitreous cavity, and sclera, choroid and retina as concentric layers at the posterior wall, with the macula and fovea on the visual axis and the optic disc, optic nerve and nerve sheath offset to one side.',
  },
  {
    id: 'globe-surgical-od', version: 1, group: 'globe-orbit', label: 'Globe for vitreoretinal surgery — right eye (OD)', region: 'right eye', view: 'surgical',
    laterality: 'right', asset: 'globe-orbit/globe-surgical-od.svg', width: 1400, height: 1400, provenance,
    description: 'Front view of the right globe for vitreoretinal surgery: limbus and pupil, the four rectus insertions (SR 7.7, IR 6.5, MR 5.5, LR 6.9 mm from the limbus), a dashed scleral buckle equator line and three pars plana ports about 4 mm from the limbus at 10, 2 and 8 o\'clock; nasal side on the viewer\'s right, labelled OD, N, T and clock hours.',
  },
  {
    id: 'globe-surgical-os', version: 1, group: 'globe-orbit', label: 'Globe for vitreoretinal surgery — left eye (OS)', region: 'left eye', view: 'surgical',
    laterality: 'left', asset: 'globe-orbit/globe-surgical-os.svg', width: 1400, height: 1400, provenance,
    description: 'Front view of the left globe for vitreoretinal surgery: limbus and pupil, the four rectus insertions (SR 7.7, IR 6.5, MR 5.5, LR 6.9 mm from the limbus), a dashed scleral buckle equator line and three pars plana ports about 4 mm from the limbus at 2, 10 and 4 o\'clock; nasal side on the viewer\'s left, labelled OS, N, T and clock hours.',
  },
  {
    id: 'eyelids-od', version: 1, group: 'globe-orbit', label: 'Eyelids — right eye (OD)', region: 'right eyelids', view: 'eyelid detail',
    laterality: 'right', asset: 'globe-orbit/eyelids-od.svg', width: 1400, height: 1000, provenance,
    description: 'Oculoplastic detail of the right eyelids from the front: upper and lower lid margins with lash line, grey line and posterior lip, upper lid crease, lower lid fold, upper and lower puncta, caruncle and the medial and lateral canthi; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'eyelids-os', version: 1, group: 'globe-orbit', label: 'Eyelids — left eye (OS)', region: 'left eyelids', view: 'eyelid detail',
    laterality: 'left', asset: 'globe-orbit/eyelids-os.svg', width: 1400, height: 1000, provenance,
    description: 'Oculoplastic detail of the left eyelids from the front: upper and lower lid margins with lash line, grey line and posterior lip, upper lid crease, lower lid fold, upper and lower puncta, caruncle and the medial and lateral canthi; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
  {
    id: 'lacrimal-system-right', version: 1, group: 'globe-orbit', label: 'Lacrimal drainage system — right', region: 'right lacrimal system', view: 'schematic',
    laterality: 'right', asset: 'globe-orbit/lacrimal-system-right.svg', width: 1100, height: 1150, provenance,
    description: 'Schematic of the right lacrimal drainage system seen from the front, patient\'s right on the viewer\'s left: lacrimal gland above the lateral lids, upper and lower puncta, upper, lower and common canaliculi, lacrimal sac, nasolacrimal duct and its outlet in the inferior meatus beneath the inferior turbinate, labelled R and L.',
  },
  {
    id: 'orbit-coronal', version: 1, group: 'globe-orbit', label: 'Orbit — coronal (right orbit)', region: 'right orbit', view: 'coronal',
    laterality: 'right', asset: 'globe-orbit/orbit-coronal.svg', width: 1200, height: 1200, provenance,
    description: 'Coronal view of the right orbit in the radiological convention, patient\'s right on the viewer\'s left so the lateral wall is at the left and the medial wall at the right: orbital roof, floor and walls around the centred globe, the superior, inferior, medial and lateral recti, the superior and inferior obliques and the optic nerve at the centre, labelled R and L.',
  },
  {
    id: 'orbit-axial', version: 1, group: 'globe-orbit', label: 'Orbits — axial', region: 'both orbits', view: 'axial',
    laterality: 'bilateral', asset: 'globe-orbit/orbit-axial.svg', width: 1400, height: 1000, provenance,
    description: 'Axial view of both orbits with anterior at the top and the patient\'s right on the viewer\'s left (radiological convention): the globes, medial and lateral recti, medial and lateral orbital walls, ethmoid sinuses between the orbits, and the optic nerves converging to the optic chiasm, labelled R, L and Anterior.',
  },
];

/** Colposcopic cervix clock face and a frontal uterus and adnexa schematic. */
export const GYNAECOLOGY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'cervix-clock-face', version: 1, group: 'gynaecology', label: 'Cervix — clock face', region: 'cervix', view: 'colposcopic',
    laterality: 'midline', asset: 'gynaecology/cervix-clock-face.svg', width: 1200, height: 1200, provenance,
    description: 'Colposcopic view of the cervix with the external os at the centre, a dashed ring for the transformation zone, and clock hours marked: 12 anterior at the top, 6 posterior, 9 on the viewer\'s left (patient\'s right) and 3 on the viewer\'s right.',
  },
  {
    id: 'uterus-adnexa', version: 1, group: 'gynaecology', label: 'Uterus and adnexa — frontal', region: 'uterus', view: 'anterior',
    laterality: 'bilateral', asset: 'gynaecology/uterus-adnexa.svg', width: 1200, height: 1200, provenance,
    description: 'Frontal schematic of the uterus showing fundus, body with cavity, cervix and canal, both fallopian tubes with fimbriae, both ovaries and the vagina. The patient\'s right is on the viewer\'s left, marked R.',
  },
];

/** Hands and fingernails. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const HANDS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'hand-right-palmar', version: 1, group: 'hands', label: 'Hand — right palmar', region: 'right hand', view: 'palmar',
    laterality: 'right', asset: 'hands/hand-right-palmar.svg', width: 1000, height: 1400, provenance,
    description: 'Right hand palmar view with the fingers pointing up and the thumb on the viewer\'s right; palmar and finger flexion creases and the wrist creases are marked.',
  },
  {
    id: 'hand-right-dorsal', version: 1, group: 'hands', label: 'Hand — right dorsal', region: 'right hand', view: 'dorsal',
    laterality: 'right', asset: 'hands/hand-right-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Right hand dorsal view with the fingers pointing up and the thumb on the viewer\'s left; knuckle creases, tendon lines and fingernails are marked.',
  },
  {
    id: 'hand-left-palmar', version: 1, group: 'hands', label: 'Hand — left palmar', region: 'left hand', view: 'palmar',
    laterality: 'left', asset: 'hands/hand-left-palmar.svg', width: 1000, height: 1400, provenance,
    description: 'Left hand palmar view with the fingers pointing up and the thumb on the viewer\'s left; palmar and finger flexion creases and the wrist creases are marked.',
  },
  {
    id: 'hand-left-dorsal', version: 1, group: 'hands', label: 'Hand — left dorsal', region: 'left hand', view: 'dorsal',
    laterality: 'left', asset: 'hands/hand-left-dorsal.svg', width: 1000, height: 1400, provenance,
    description: 'Left hand dorsal view with the fingers pointing up and the thumb on the viewer\'s right; knuckle creases, tendon lines and fingernails are marked.',
  },
  {
    id: 'fingernails', version: 1, group: 'hands', label: 'Fingernails — both hands', region: 'fingernails', view: 'dorsal',
    laterality: 'bilateral', asset: 'hands/fingernails.svg', width: 1400, height: 1000, provenance,
    description: 'Dorsal view of the fingers and nails of both hands, fingers up, thumbs pointing toward the middle; the left hand is on the viewer\'s left. Each of the ten nails is shaded.',
  },
];

/** Head and scalp outlines: front, back, vertex and both sides. Ears and hairline are landmarks. */
export const HEAD_SCALP_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'head-front', version: 1, group: 'head-scalp', label: 'Head — front', region: 'head', view: 'front',
    laterality: 'bilateral', asset: 'head-scalp/head-front.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from the front, with the frontal hairline, ears, eyes, nose and mouth as light landmarks. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'head-back', version: 1, group: 'head-scalp', label: 'Head — back', region: 'head', view: 'back',
    laterality: 'bilateral', asset: 'head-scalp/head-back.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from behind, with the ears, the occipital prominence, the nape hairline and a dashed midline over the scalp. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'head-vertex', version: 1, group: 'head-scalp', label: 'Head — vertex', region: 'head', view: 'vertex',
    laterality: 'bilateral', asset: 'head-scalp/head-vertex.svg', width: 1000, height: 1000, provenance,
    description: 'Top of the head seen from above with the nose at the top of the image, the ears at the sides, the anterior hairline and a dashed sagittal midline. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'head-right-side', version: 1, group: 'head-scalp', label: 'Head — right side', region: 'head', view: 'right lateral',
    laterality: 'right', asset: 'head-scalp/head-right-side.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from the patient\'s right side, facing the viewer\'s right, with the ear, hairline and jaw line as landmarks. Anterior (A) is on the right of the image and posterior (P) on the left.',
  },
  {
    id: 'head-left-side', version: 1, group: 'head-scalp', label: 'Head — left side', region: 'head', view: 'left lateral',
    laterality: 'left', asset: 'head-scalp/head-left-side.svg', width: 1000, height: 1200, provenance,
    description: 'Head and upper neck seen from the patient\'s left side, facing the viewer\'s left, with the ear, hairline and jaw line as landmarks. Anterior (A) is on the left of the image and posterior (P) on the right.',
  },
];

const wide = { width: 1400, height: 1000 } as const;
const square = { width: 1200, height: 1200 } as const;

/** Lens views: sagittal sections with anterior up, and a retroillumination chart with N and T following the examiner's view of that eye. */
export const LENS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'lens-cross-section', version: 1, group: 'lens', label: 'Lens — sagittal cross-section', region: 'lens', view: 'sagittal cross-section',
    laterality: 'not-applicable', asset: 'lens/lens-cross-section.svg', ...wide, provenance,
    description: 'Sagittal schematic of the crystalline lens with anterior up: anterior and posterior capsule, cortex and nucleus, zonules, ciliary body and processes on both sides, and the iris for context.',
  },
  {
    id: 'lens-slit-section', version: 1, group: 'lens', label: 'Lens — slit-lamp optical section', region: 'lens', view: 'slit-lamp optical section',
    laterality: 'not-applicable', asset: 'lens/lens-slit-section.svg', ...wide, provenance,
    description: 'Slit-lamp optical section of the lens with anterior up and the slit beam marked: anterior capsule, anterior cortex, adult, infantile, fetal and embryonic nuclear zones, posterior cortex and posterior capsule, for grading nuclear opacity.',
  },
  {
    id: 'lens-retroillumination-od', version: 1, group: 'lens', label: 'Lens retroillumination — right eye (OD)', region: 'right lens', view: 'retroillumination',
    laterality: 'right', asset: 'lens/lens-retroillumination-od.svg', ...square, provenance,
    description: 'Red-reflex retroillumination chart of the right lens: dilated pupil circle with dashed zone rings and clock-hour radials, 12, 3, 6 and 9 labelled; nasal on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'lens-retroillumination-os', version: 1, group: 'lens', label: 'Lens retroillumination — left eye (OS)', region: 'left lens', view: 'retroillumination',
    laterality: 'left', asset: 'lens/lens-retroillumination-os.svg', ...square, provenance,
    description: 'Red-reflex retroillumination chart of the left lens: dilated pupil circle with dashed zone rings and clock-hour radials, 12, 3, 6 and 9 labelled; nasal on the viewer\'s left, labelled OS, N and T.',
  },
];

/** Lower limbs and their joints. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const LOWER_LIMBS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'lower-limb-right-anterior', version: 1, group: 'lower-limbs', label: 'Lower limb — right anterior', region: 'right lower limb', view: 'anterior',
    laterality: 'right', asset: 'lower-limbs/lower-limb-right-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Right thigh, knee, leg and foot in anatomical position seen from the front, big toe on the medial side; patella, tibial tuberosity, tibial crest and malleoli are marked.',
  },
  {
    id: 'lower-limb-right-posterior', version: 1, group: 'lower-limbs', label: 'Lower limb — right posterior', region: 'right lower limb', view: 'posterior',
    laterality: 'right', asset: 'lower-limbs/lower-limb-right-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Right thigh, knee, leg and foot in anatomical position seen from the back; gluteal fold, popliteal crease, calf, Achilles tendon and heel are marked.',
  },
  {
    id: 'lower-limb-left-anterior', version: 1, group: 'lower-limbs', label: 'Lower limb — left anterior', region: 'left lower limb', view: 'anterior',
    laterality: 'left', asset: 'lower-limbs/lower-limb-left-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Left thigh, knee, leg and foot in anatomical position seen from the front, big toe on the medial side; patella, tibial tuberosity, tibial crest and malleoli are marked.',
  },
  {
    id: 'lower-limb-left-posterior', version: 1, group: 'lower-limbs', label: 'Lower limb — left posterior', region: 'left lower limb', view: 'posterior',
    laterality: 'left', asset: 'lower-limbs/lower-limb-left-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Left thigh, knee, leg and foot in anatomical position seen from the back; gluteal fold, popliteal crease, calf, Achilles tendon and heel are marked.',
  },
  {
    id: 'knee-right', version: 1, group: 'lower-limbs', label: 'Knee — right', region: 'right knee', view: 'anterior',
    laterality: 'right', asset: 'lower-limbs/knee-right.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the right knee with distal thigh and proximal leg: patella, quadriceps tendon, patellar ligament, tibial tuberosity and the joint line.',
  },
  {
    id: 'ankle-right', version: 1, group: 'lower-limbs', label: 'Ankle — right', region: 'right ankle', view: 'anterior',
    laterality: 'right', asset: 'lower-limbs/ankle-right.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the right ankle with distal leg and the front of the foot, big toe on the medial side; both malleoli, the ankle crease and the toes are marked.',
  },
  {
    id: 'knee-left', version: 1, group: 'lower-limbs', label: 'Knee — left', region: 'left knee', view: 'anterior',
    laterality: 'left', asset: 'lower-limbs/knee-left.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the left knee with distal thigh and proximal leg: patella, quadriceps tendon, patellar ligament, tibial tuberosity and the joint line.',
  },
  {
    id: 'ankle-left', version: 1, group: 'lower-limbs', label: 'Ankle — left', region: 'left ankle', view: 'anterior',
    laterality: 'left', asset: 'lower-limbs/ankle-left.svg', width: 1000, height: 1400, provenance,
    description: 'Anterior view of the left ankle with distal leg and the front of the foot, big toe on the medial side; both malleoli, the ankle crease and the toes are marked.',
  },
];

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

/**
 * Newborn outlines. Anterior and supine views: patient's right on the viewer's left. Posterior view and the vertex-from-above
 * view (face at the top): the baby's right is on the viewer's right. Each lateral view faces the side it is named for.
 */
export const NEONATAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'neonate-body-anterior', version: 1, group: 'neonatal', label: 'Neonate body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'neonatal/neonate-body-anterior.svg', width: 900, height: 1400, provenance,
    description: 'Newborn body in anterior view with the head about a quarter of the length, short limbs, nipples, and an umbilical stump with a cord clamp. Patient\'s right on the viewer\'s left.',
  },
  {
    id: 'neonate-body-posterior', version: 1, group: 'neonatal', label: 'Neonate body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'neonatal/neonate-body-posterior.svg', width: 900, height: 1400, provenance,
    description: 'Newborn body in posterior view with the same proportions, spine line, gluteal folds and popliteal creases. Patient\'s right on the viewer\'s right.',
  },
  {
    id: 'neonate-head-vertex', version: 1, group: 'neonatal', label: 'Neonate head — vertex', region: 'head', view: 'vertex',
    laterality: 'bilateral', asset: 'neonatal/neonate-head-vertex.svg', width: 1400, height: 1200, provenance,
    description: 'Newborn skull seen from above with the diamond anterior and triangular posterior fontanelles and the sagittal, coronal, lambdoid and metopic sutures, for marking caput, cephalhaematoma, moulding and subgaleal swelling. Face at the top, baby\'s right on the viewer\'s right.',
  },
  {
    id: 'neonate-head-lateral-right', version: 1, group: 'neonatal', label: 'Neonate head — right lateral', region: 'head', view: 'right lateral',
    laterality: 'right', asset: 'neonatal/neonate-head-lateral-right.svg', width: 1300, height: 1200, provenance,
    description: 'Right side of a newborn head with ear, face profile, sagittal, coronal and lambdoid sutures and the anterior and posterior fontanelles; face to the viewer\'s right.',
  },
  {
    id: 'neonate-head-lateral-left', version: 1, group: 'neonatal', label: 'Neonate head — left lateral', region: 'head', view: 'left lateral',
    laterality: 'left', asset: 'neonatal/neonate-head-lateral-left.svg', width: 1300, height: 1200, provenance,
    description: 'Left side of a newborn head with ear, face profile, sagittal, coronal and lambdoid sutures and the anterior and posterior fontanelles; face to the viewer\'s left.',
  },
  {
    id: 'neonate-face-oral', version: 1, group: 'neonatal', label: 'Neonate face and palate', region: 'face and palate', view: 'anterior with palate inset',
    laterality: 'midline', asset: 'neonatal/neonate-face-oral.svg', width: 1700, height: 1050, provenance,
    description: 'Newborn face in front view with nose, philtrum and upper and lower lips, beside an open-mouth inset of the hard and soft palate with alveolar ridge, incisive papilla and uvula, for cleft lip and palate marking. Patient\'s right on the viewer\'s left.',
  },
  {
    id: 'neonate-hips-feet', version: 1, group: 'neonatal', label: 'Neonate hips and feet', region: 'hips and feet', view: 'supine anterior',
    laterality: 'bilateral', asset: 'neonatal/neonate-hips-feet.svg', width: 1200, height: 1300, provenance,
    description: 'Supine newborn lower body from the umbilicus to the toes with both hip joints, groin creases, thigh folds, patellae and feet, for recording the hip examination side and foot position such as talipes. Patient\'s right on the viewer\'s left.',
  },
];

/** Spine, cord and brachial plexus outlines for marking disc, stenosis, fusion, cord and root levels. */
export const NEURO_SPINE_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'spine-sagittal-neuro', version: 1, group: 'neuro-spine', label: 'Spine — sagittal (C2 to S1)', region: 'spine', view: 'sagittal',
    laterality: 'midline', asset: 'neuro-spine/spine-sagittal-neuro.svg', width: 1000, height: 2000, provenance,
    description: 'Sagittal spine from C2 to S1, anterior to the left of the drawing, with vertebral bodies, intervertebral discs, spinal canal, cord ending at L1-L2 and cauda equina below, each level labelled.',
  },
  {
    id: 'spinal-cord-cross-section', version: 1, group: 'neuro-spine', label: 'Spinal cord — cross-section', region: 'spinal cord', view: 'axial cross-section',
    laterality: 'midline', asset: 'neuro-spine/spinal-cord-cross-section.svg', width: 1200, height: 1000, provenance,
    description: 'Spinal cord cross-section with anterior at the top and patient right on the left of the drawing: grey matter dorsal and ventral horns, dorsal columns, lateral corticospinal and spinothalamic tracts, dorsal and ventral roots.',
  },
  {
    id: 'brachial-plexus-right', version: 1, group: 'neuro-spine', label: 'Brachial plexus — right', region: 'brachial plexus', view: 'schematic anterior',
    laterality: 'right', asset: 'neuro-spine/brachial-plexus-right.svg', width: 1400, height: 1000, provenance,
    description: 'Schematic right brachial plexus in anterior view with the spine at the right of the drawing: roots C5 to T1, trunks, divisions, cords and the musculocutaneous, axillary, radial, median and ulnar nerves.',
  },
];

/**
 * Whole-body neurological maps. Anterior views put the patient's right on the viewer's left (marked R);
 * posterior views put it on the viewer's right. Boundaries are dashed; labels sit inside their territories.
 */
export const NEUROLOGICAL_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'dermatomes-anterior', version: 1, group: 'neurological', label: 'Dermatomes — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'neurological/dermatomes-anterior.svg', ...({ width: 1000, height: 1600 } as const), provenance,
    description: 'Whole-body anterior outline with dashed dermatome boundaries labelled V1–V3 on the face and C3 to S1 on the neck, trunk, limbs, hands and feet. Patient right is on the viewer left.',
  },
  {
    id: 'dermatomes-posterior', version: 1, group: 'neurological', label: 'Dermatomes — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'neurological/dermatomes-posterior.svg', ...({ width: 1000, height: 1600 } as const), provenance,
    description: 'Whole-body posterior outline with dashed dermatome boundaries labelled C2 to S5, including a perianal S3–S5 inset. Patient right is on the viewer right.',
  },
  {
    id: 'peripheral-nerves-anterior', version: 1, group: 'neurological', label: 'Peripheral nerve territories — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'neurological/peripheral-nerves-anterior.svg', ...({ width: 1000, height: 1600 } as const), provenance,
    description: 'Whole-body anterior outline with dashed cutaneous peripheral nerve territories labelled with short nerve names such as median, ulnar, femoral and saphenous. Patient right is on the viewer left.',
  },
  {
    id: 'peripheral-nerves-posterior', version: 1, group: 'neurological', label: 'Peripheral nerve territories — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'neurological/peripheral-nerves-posterior.svg', ...({ width: 1000, height: 1600 } as const), provenance,
    description: 'Whole-body posterior outline with dashed cutaneous peripheral nerve territories labelled with short nerve names such as occipital, cluneal, sural and radial. Patient right is on the viewer right.',
  },
];

/**
 * Labour-ward delivery-record outlines. Perineal views are lithotomy, 12 o'clock anterior, patient's right on the viewer's left.
 * Dashed lines are reference guides only: clinicians draw the actual incision or findings over them.
 */
export const OBSTETRIC_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'episiotomy-perineum', version: 1, group: 'obstetric', label: 'Episiotomy — perineum (lithotomy)', region: 'perineum', view: 'lithotomy',
    laterality: 'midline', asset: 'obstetric/episiotomy-perineum.svg', width: 1400, height: 1200, provenance,
    description: 'Lithotomy perineum with vulva, introitus, posterior fourchette, perineal body, anus and ischial tuberosities; dashed reference lines from the fourchette for midline, mediolateral 60 degrees (right and left, with angle arcs) and lateral incisions. 12 o\'clock anterior, patient\'s right on the viewer\'s left.',
  },
  {
    id: 'perineal-tear-degrees', version: 1, group: 'obstetric', label: 'Perineal tear — degrees', region: 'perineum and anal sphincter', view: 'lithotomy',
    laterality: 'midline', asset: 'obstetric/perineal-tear-degrees.svg', width: 1400, height: 1200, provenance,
    description: 'Lithotomy schematic of the perineum with concentric zones around the anus for classifying obstetric perineal tears: skin and vaginal epithelium (1st), perineal muscles (2nd), external anal sphincter split into 3a and 3b, internal anal sphincter (3c) and anorectal mucosa (4th degree). Anterior at the top.',
  },
  {
    id: 'perineal-repair', version: 1, group: 'obstetric', label: 'Perineal repair', region: 'perineum', view: 'lithotomy',
    laterality: 'midline', asset: 'obstetric/perineal-repair.svg', width: 1400, height: 1200, provenance,
    description: 'Lithotomy perineum with vaginal apex, hymenal remnant and introitus, posterior fourchette, perineal body, perineal skin and anus, with a dashed midline repair line for drawing continuous and interrupted sutures. Anterior at the top, patient\'s right on the viewer\'s left.',
  },
  {
    id: 'cervix-dilatation', version: 1, group: 'obstetric', label: 'Cervical dilatation 1–10 cm', region: 'cervix', view: 'row of circles',
    laterality: 'not-applicable', asset: 'obstetric/cervix-dilatation.svg', width: 1400, height: 700, provenance,
    description: 'A row of ten circles representing cervical dilatation from 1 to 10 cm, drawn in proportion to one another and labelled 1 to 10, for partogram-style marking.',
  },
  {
    id: 'fetal-head-position', version: 1, group: 'obstetric', label: 'Fetal head position in the pelvis', region: 'fetal head', view: 'vertex in pelvis',
    laterality: 'midline', asset: 'obstetric/fetal-head-position.svg', width: 1800, height: 1200, provenance,
    description: 'Fetal skull seen from the vertex inside a circle representing the maternal pelvis, with anterior and posterior fontanelles and sagittal, coronal and lambdoid sutures; symphysis at the top, sacrum at the bottom, maternal right on the viewer\'s left, for drawing OA, OP and OT positions.',
  },
  {
    id: 'placenta-surfaces', version: 1, group: 'obstetric', label: 'Placenta — maternal and fetal surfaces', region: 'placenta', view: 'both surfaces',
    laterality: 'not-applicable', asset: 'obstetric/placenta-surfaces.svg', width: 1900, height: 1000, provenance,
    description: 'Two placental discs side by side: the maternal surface divided into cotyledons and the fetal surface with chorionic vessels radiating from the cord insertion, for recording completeness, cord insertion and infarcts.',
  },
  {
    id: 'abdomen-pregnant-leopold', version: 1, group: 'obstetric', label: 'Pregnant abdomen — fetal lie and fundal height', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'obstetric/abdomen-pregnant-leopold.svg', width: 1200, height: 1400, provenance,
    description: 'Term-pregnant abdomen in anterior view with the gravid outline, fundus, umbilicus and pubic symphysis, and dashed level guides at the symphysis, umbilicus and xiphisternum, for marking fetal lie, presentation and fundal height. Patient\'s right on the viewer\'s left.',
  },
  {
    id: 'caesarean-incisions', version: 1, group: 'obstetric', label: 'Caesarean section — incisions', region: 'lower abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'obstetric/caesarean-incisions.svg', width: 1400, height: 1200, provenance,
    description: 'Pregnant lower abdomen in anterior view with umbilicus, symphysis, iliac spines and groin folds, and dashed reference incisions labelled Pfannenstiel (transverse lower) and midline (vertical). Patient\'s right on the viewer\'s left.',
  },
];

const scan = { width: 1600, height: 1000 } as const;
const grid = { width: 1200, height: 1200 } as const;

/** OCT schematics: horizontal B-scans (nasal on the viewer's right for OD, left for OS) and the ETDRS grid in fundus orientation. */
export const OCT_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'oct-macula-bscan-od', version: 1, group: 'oct', label: 'OCT macula B-scan — right eye (OD)', region: 'right eye, macula', view: 'horizontal B-scan',
    laterality: 'right', asset: 'oct/oct-macula-bscan-od.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the fovea of the right eye: central foveal pit with the retinal layers from ILM to sclera labelled, clear space between the RPE and neurosensory retina and beneath the RPE; nasal on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'oct-macula-bscan-os', version: 1, group: 'oct', label: 'OCT macula B-scan — left eye (OS)', region: 'left eye, macula', view: 'horizontal B-scan',
    laterality: 'left', asset: 'oct/oct-macula-bscan-os.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the fovea of the left eye: central foveal pit with the retinal layers from ILM to sclera labelled, clear space between the RPE and neurosensory retina and beneath the RPE; nasal on the viewer\'s left, labelled OS, N and T.',
  },
  {
    id: 'oct-disc-bscan-od', version: 1, group: 'oct', label: 'OCT optic disc B-scan — right eye (OD)', region: 'right eye, optic nerve head', view: 'horizontal B-scan',
    laterality: 'right', asset: 'oct/oct-disc-bscan-od.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the optic nerve head of the right eye: optic cup, RNFL thickening at the neuroretinal rim, Bruch\'s membrane opening and lamina cribrosa; nasal on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'oct-disc-bscan-os', version: 1, group: 'oct', label: 'OCT optic disc B-scan — left eye (OS)', region: 'left eye, optic nerve head', view: 'horizontal B-scan',
    laterality: 'left', asset: 'oct/oct-disc-bscan-os.svg', ...scan, provenance,
    description: 'Schematic horizontal OCT B-scan through the optic nerve head of the left eye: optic cup, RNFL thickening at the neuroretinal rim, Bruch\'s membrane opening and lamina cribrosa; nasal on the viewer\'s left, labelled OS, N and T.',
  },
  {
    id: 'oct-etdrs-grid-od', version: 1, group: 'oct', label: 'OCT ETDRS grid — right eye (OD)', region: 'right eye, macula', view: 'ETDRS grid',
    laterality: 'right', asset: 'oct/oct-etdrs-grid-od.svg', ...grid, provenance,
    description: 'ETDRS macular grid of the right eye: 1, 3 and 6 mm rings, central subfield and inner and outer superior, nasal, inferior and temporal sectors split by diagonals; nasal on the viewer\'s right, labelled OD.',
  },
  {
    id: 'oct-etdrs-grid-os', version: 1, group: 'oct', label: 'OCT ETDRS grid — left eye (OS)', region: 'left eye, macula', view: 'ETDRS grid',
    laterality: 'left', asset: 'oct/oct-etdrs-grid-os.svg', ...grid, provenance,
    description: 'ETDRS macular grid of the left eye: 1, 3 and 6 mm rings, central subfield and inner and outer superior, nasal, inferior and temporal sectors split by diagonals; nasal on the viewer\'s left, labelled OS.',
  },
];

/** Nine diagnostic gaze positions; patient's right is on the viewer's left (marked R). */
export const OCULAR_MOTILITY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'ocular-motility-chart', version: 1, group: 'ocular-motility', label: 'Ocular motility — nine gaze positions', region: 'both eyes', view: 'nine gaze positions',
    laterality: 'bilateral', asset: 'ocular-motility/ocular-motility-chart.svg', ...({ width: 1400, height: 1200 } as const), provenance,
    description: 'Three-by-three grid of the nine diagnostic gaze positions, each cell showing both eyes with the gaze direction; the patient\'s right eye is on the viewer\'s left, labelled R and L.',
  },
];

/** Enlarged optic disc with cup, rim, exiting vessels and ISNT sectors; nasal on the viewer's right for OD, left for OS. */
export const OPTIC_DISC_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'optic-disc-od', version: 1, group: 'optic-disc', label: 'Optic disc — right eye (OD)', region: 'right eye', view: 'enlarged disc',
    laterality: 'right', asset: 'optic-disc/optic-disc-od.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Enlarged optic disc of the right eye with dashed cup outline, neuroretinal rim, vessels exiting nasally and ISNT sectors labelled I, S, N and T; nasal side on the viewer\'s right, labelled OD.',
  },
  {
    id: 'optic-disc-os', version: 1, group: 'optic-disc', label: 'Optic disc — left eye (OS)', region: 'left eye', view: 'enlarged disc',
    laterality: 'left', asset: 'optic-disc/optic-disc-os.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Enlarged optic disc of the left eye with dashed cup outline, neuroretinal rim, vessels exiting nasally and ISNT sectors labelled I, S, N and T; nasal side on the viewer\'s left, labelled OS.',
  },
];

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

/** Paediatric surgery (congenital anomalies). Anterior views put the patient's right on the viewer's left; the posterior view the reverse. Both are marked R/L. */
export const PAEDIATRIC_SURGERY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'spina-bifida-lumbosacral', version: 1, group: 'paediatric-surgery', label: 'Spina bifida — lumbosacral region', region: 'lumbosacral spine', view: 'posterior',
    laterality: 'midline', asset: 'paediatric-surgery/spina-bifida-lumbosacral.svg', width: 1000, height: 1200, provenance,
    description: 'Neonatal back from the thoracolumbar region to the buttocks, posterior view, with the spinous process line, iliac crests, natal cleft and a dashed zone over the lumbosacral spine for marking a sac, dimple, hair tuft or haemangioma.',
  },
  {
    id: 'cleft-lip-palate-classification', version: 1, group: 'paediatric-surgery', label: 'Cleft lip and palate — classification', region: 'lip and palate', view: 'front and palate',
    laterality: 'bilateral', asset: 'paediatric-surgery/cleft-lip-palate-classification.svg', width: 1400, height: 1000, provenance,
    description: 'Infant upper lip and nose from the front beside an open-mouth palate view, with dashed guides for unilateral right, unilateral left and bilateral lip clefts, the alveolus, the primary palate at the incisive foramen and the secondary hard and soft palate.',
  },
  {
    id: 'abdominal-wall-defects', version: 1, group: 'paediatric-surgery', label: 'Abdominal wall defects', region: 'abdominal wall', view: 'anterior',
    laterality: 'midline', asset: 'paediatric-surgery/abdominal-wall-defects.svg', width: 1800, height: 1200, provenance,
    description: 'Neonatal abdomen from the front with the umbilical cord insertion centred, and an enlarged inset marking the right paraumbilical gastroschisis site and the central umbilical ring omphalocele site.',
  },
  {
    id: 'anorectal-malformation-perineum', version: 1, group: 'paediatric-surgery', label: 'Anorectal malformation — perineum', region: 'perineum', view: 'lithotomy',
    laterality: 'midline', asset: 'paediatric-surgery/anorectal-malformation-perineum.svg', width: 1800, height: 1000, provenance,
    description: 'Neonatal perineum in lithotomy shown as male and female variants side by side, each with the normal anal position as a dashed circle, perineal body, anal dimple and the scrotum or vulva outline; anterior at the top.',
  },
  {
    id: 'hypospadias-meatus-positions', version: 1, group: 'paediatric-surgery', label: 'Hypospadias — meatal positions', region: 'penis', view: 'ventral',
    laterality: 'midline', asset: 'paediatric-surgery/hypospadias-meatus-positions.svg', width: 1000, height: 1200, provenance,
    description: 'Penis in ventral view with the scrotum above, and dots along the ventral midline for the glanular, coronal, distal shaft, mid-shaft, proximal shaft, penoscrotal, scrotal and perineal meatal positions.',
  },
  {
    id: 'inguinoscrotal-paediatric', version: 1, group: 'paediatric-surgery', label: 'Inguinoscrotal region — child', region: 'groin and scrotum', view: 'anterior',
    laterality: 'bilateral', asset: 'paediatric-surgery/inguinoscrotal-paediatric.svg', width: 1200, height: 1200, provenance,
    description: 'Child lower abdomen and groin from the front, with both inguinal canals as dashed courses between the deep and superficial rings, the inguinal ligaments, and the scrotum with testes for marking hernia, hydrocele and undescended testis.',
  },
];

/** Child (about 5 years) and infant bodies in anatomical position, anterior and posterior. The infant head is about a quarter of the height; the anterior view shows the anterior fontanelle. */
export const PAEDIATRIC_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'child-body-anterior', version: 1, group: 'paediatric', label: 'Child body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'paediatric/child-body-anterior.svg', width: 800, height: 1400, provenance,
    description: 'Child of about five years seen from the front in anatomical position, with a proportionally larger head and shorter legs than an adult. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'child-body-posterior', version: 1, group: 'paediatric', label: 'Child body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'paediatric/child-body-posterior.svg', width: 800, height: 1400, provenance,
    description: 'Child of about five years seen from behind in anatomical position, with the spine, scapulae and gluteal folds marked. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'infant-body-anterior', version: 1, group: 'paediatric', label: 'Infant body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'paediatric/infant-body-anterior.svg', width: 800, height: 1400, provenance,
    description: 'Infant seen from the front, head about a quarter of the height, short limbs and a rounded trunk, with the anterior fontanelle shown as a light diamond on the crown. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'infant-body-posterior', version: 1, group: 'paediatric', label: 'Infant body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'paediatric/infant-body-posterior.svg', width: 800, height: 1400, provenance,
    description: 'Infant seen from behind, head about a quarter of the height, with the spine, scapulae and gluteal folds marked. The patient\'s right is on the viewer\'s right, marked R.',
  },
];

/** Gluteal views are posterior (patient's right on the viewer's right); hip views are anterior (patient's right on the viewer's left). */
export const PELVIS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'gluteal-right', version: 1, group: 'pelvis', label: 'Gluteal region — right', region: 'gluteal', view: 'posterior',
    laterality: 'right', asset: 'pelvis/gluteal-right.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior view of the patient\'s right buttock on the viewer\'s right, with iliac crest, PSIS, gluteal fold, greater trochanter, ischial tuberosity and injection-quadrant dividers.',
  },
  {
    id: 'gluteal-left', version: 1, group: 'pelvis', label: 'Gluteal region — left', region: 'gluteal', view: 'posterior',
    laterality: 'left', asset: 'pelvis/gluteal-left.svg', width: 1000, height: 1200, provenance,
    description: 'Posterior view of the patient\'s left buttock on the viewer\'s left, with iliac crest, PSIS, gluteal fold, greater trochanter, ischial tuberosity and injection-quadrant dividers.',
  },
  {
    id: 'hip-right', version: 1, group: 'pelvis', label: 'Hip — right', region: 'hip', view: 'anterior',
    laterality: 'right', asset: 'pelvis/hip-right.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the patient\'s right hip and upper thigh on the viewer\'s left, with ASIS, inguinal ligament, pubic tubercle, femoral triangle and greater trochanter.',
  },
  {
    id: 'hip-left', version: 1, group: 'pelvis', label: 'Hip — left', region: 'hip', view: 'anterior',
    laterality: 'left', asset: 'pelvis/hip-left.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the patient\'s left hip and upper thigh on the viewer\'s right, with ASIS, inguinal ligament, pubic tubercle, femoral triangle and greater trochanter.',
  },
];

/** Retinal fundus views as seen through an ophthalmoscope: disc nasal (viewer's right for OD, left for OS), 12 o'clock superior. */
export const RETINA_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'retina-posterior-pole-od', version: 1, group: 'retina', label: 'Retina posterior pole — right eye (OD)', region: 'right retina, posterior pole', view: 'fundus',
    laterality: 'right', asset: 'retina/retina-posterior-pole-od.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Fundus outline of the right posterior pole: optic disc with cup, macula and fovea, and the superior and inferior vascular arcades; optic disc on the viewer\'s right (nasal), labelled OD, N, T, S and I.',
  },
  {
    id: 'retina-posterior-pole-os', version: 1, group: 'retina', label: 'Retina posterior pole — left eye (OS)', region: 'left retina, posterior pole', view: 'fundus',
    laterality: 'left', asset: 'retina/retina-posterior-pole-os.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Fundus outline of the left posterior pole: optic disc with cup, macula and fovea, and the superior and inferior vascular arcades; optic disc on the viewer\'s left (nasal), labelled OS, N, T, S and I.',
  },
  {
    id: 'retina-peripheral-od', version: 1, group: 'retina', label: 'Retina peripheral chart — right eye (OD)', region: 'right retina, periphery', view: 'peripheral chart',
    laterality: 'right', asset: 'retina/retina-peripheral-od.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Peripheral retinal chart of the right eye: concentric rings for the posterior pole, equator and ora serrata, twelve clock-hour radial lines, optic disc and macula, with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s right, labelled OD, N and T.',
  },
  {
    id: 'retina-peripheral-os', version: 1, group: 'retina', label: 'Retina peripheral chart — left eye (OS)', region: 'left retina, periphery', view: 'peripheral chart',
    laterality: 'left', asset: 'retina/retina-peripheral-os.svg', ...({ width: 1200, height: 1200 } as const), provenance,
    description: 'Peripheral retinal chart of the left eye: concentric rings for the posterior pole, equator and ora serrata, twelve clock-hour radial lines, optic disc and macula, with 12, 3, 6 and 9 labelled; nasal side on the viewer\'s left, labelled OS, N and T.',
  },
];

/** Whole adult skeleton in anatomical position. Anterior view: patient's right is on the viewer's left; posterior view: the reverse. Each view is drawn for its own aspect. */
export const SKELETON_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'skeleton-anterior', version: 1, group: 'skeleton', label: 'Skeleton — anterior', region: 'whole skeleton', view: 'anterior',
    laterality: 'bilateral', asset: 'skeleton/skeleton-anterior.svg', ...({ width: 800, height: 1600 } as const), provenance,
    description: 'Whole adult skeleton from the front in anatomical position: skull and mandible, sternum and ribs, lumbar spine, pelvis, long bones of both limbs, and simplified hands and feet. Patient\'s right is on the viewer\'s left (R and L marked).',
  },
  {
    id: 'skeleton-posterior', version: 1, group: 'skeleton', label: 'Skeleton — posterior', region: 'whole skeleton', view: 'posterior',
    laterality: 'bilateral', asset: 'skeleton/skeleton-posterior.svg', ...({ width: 800, height: 1600 } as const), provenance,
    description: 'Whole adult skeleton from behind in anatomical position: occiput, vertebral column, ribs, scapulae, sacrum and pelvis, long bones of both limbs, and simplified hands and heels. Patient\'s right is on the viewer\'s right (L and R marked).',
  },
];

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

/** Chest, axillae and breasts. Anterior views: patient's right on the viewer's left. Posterior views: patient's right on the viewer's right. Breast clocks follow the examiner facing the patient. */
export const THORAX_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'chest-anterior', version: 1, group: 'thorax', label: 'Chest — anterior', region: 'chest', view: 'anterior',
    laterality: 'bilateral', asset: 'thorax/chest-anterior.svg', width: 1200, height: 1100, provenance,
    description: 'Anterior chest outline from neck base to lower ribs with clavicles, sternal midline and angle, costal margins and nipples; patient\'s right on the viewer\'s left (marked R).',
  },
  {
    id: 'chest-posterior', version: 1, group: 'thorax', label: 'Chest — posterior', region: 'chest', view: 'posterior',
    laterality: 'bilateral', asset: 'thorax/chest-posterior.svg', width: 1200, height: 1100, provenance,
    description: 'Posterior chest outline from C7 to T12 with both scapulae and a dotted spinous-process midline; patient\'s right on the viewer\'s right (marked R).',
  },
  {
    id: 'axilla-right', version: 1, group: 'thorax', label: 'Axilla — right', region: 'axilla', view: 'anterior',
    laterality: 'right', asset: 'thorax/axilla-right.svg', width: 1200, height: 1100, provenance,
    description: 'Anterior upper torso with the patient\'s right arm abducted to expose the axilla, showing the anterior axillary fold; right is on the viewer\'s left (marked R).',
  },
  {
    id: 'axilla-left', version: 1, group: 'thorax', label: 'Axilla — left', region: 'axilla', view: 'anterior',
    laterality: 'left', asset: 'thorax/axilla-left.svg', width: 1200, height: 1100, provenance,
    description: 'Anterior upper torso with the patient\'s left arm abducted to expose the axilla, showing the anterior axillary fold; left is on the viewer\'s right (marked L).',
  },
  {
    id: 'breast-right', version: 1, group: 'thorax', label: 'Breast — right', region: 'breast', view: 'anterior',
    laterality: 'right', asset: 'thorax/breast-right.svg', width: 1200, height: 1200, provenance,
    description: 'Right breast as a clock-face circle with 12, 3, 6 and 9 o\'clock marks, areola and nipple at the centre and an axillary tail toward the viewer\'s left; clock as the examiner faces the patient.',
  },
  {
    id: 'breast-left', version: 1, group: 'thorax', label: 'Breast — left', region: 'breast', view: 'anterior',
    laterality: 'left', asset: 'thorax/breast-left.svg', width: 1200, height: 1200, provenance,
    description: 'Left breast as a clock-face circle with 12, 3, 6 and 9 o\'clock marks, areola and nipple at the centre and an axillary tail toward the viewer\'s right; clock as the examiner faces the patient.',
  },
];

/** Upper limbs and their joints. Anterior views: patient's right is on the viewer's left; posterior views: the reverse. Each side is drawn for its own side. */
export const UPPER_LIMBS_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'upper-limb-right-anterior', version: 1, group: 'upper-limbs', label: 'Upper limb — right anterior', region: 'right upper limb', view: 'anterior',
    laterality: 'right', asset: 'upper-limbs/upper-limb-right-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Right arm, forearm and hand in anatomical position seen from the front. The thumb is on the viewer\'s left; palm creases and the cubital crease are marked.',
  },
  {
    id: 'upper-limb-right-posterior', version: 1, group: 'upper-limbs', label: 'Upper limb — right posterior', region: 'right upper limb', view: 'posterior',
    laterality: 'right', asset: 'upper-limbs/upper-limb-right-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Right arm, forearm and hand in anatomical position seen from the back. The thumb is on the viewer\'s right; knuckles and nails and the olecranon are marked.',
  },
  {
    id: 'upper-limb-left-anterior', version: 1, group: 'upper-limbs', label: 'Upper limb — left anterior', region: 'left upper limb', view: 'anterior',
    laterality: 'left', asset: 'upper-limbs/upper-limb-left-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Left arm, forearm and hand in anatomical position seen from the front. The thumb is on the viewer\'s right; palm creases and the cubital crease are marked.',
  },
  {
    id: 'upper-limb-left-posterior', version: 1, group: 'upper-limbs', label: 'Upper limb — left posterior', region: 'left upper limb', view: 'posterior',
    laterality: 'left', asset: 'upper-limbs/upper-limb-left-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Left arm, forearm and hand in anatomical position seen from the back. The thumb is on the viewer\'s left; knuckles and nails and the olecranon are marked.',
  },
  {
    id: 'shoulder-right', version: 1, group: 'upper-limbs', label: 'Shoulder — right', region: 'right shoulder', view: 'anterior',
    laterality: 'right', asset: 'upper-limbs/shoulder-right.svg', width: 1200, height: 1200, provenance,
    description: 'Anterior view of the right shoulder from the side of the neck to the upper arm: deltoid cap, clavicle, acromion, anterior axillary fold and chest wall, with the midline marked.',
  },
  {
    id: 'elbow-right', version: 1, group: 'upper-limbs', label: 'Elbow — right', region: 'right elbow', view: 'anterior',
    laterality: 'right', asset: 'upper-limbs/elbow-right.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the right elbow with distal upper arm and proximal forearm: both epicondyles, the cubital crease and the borders of the cubital fossa.',
  },
  {
    id: 'wrist-right', version: 1, group: 'upper-limbs', label: 'Wrist — right', region: 'right wrist', view: 'palmar',
    laterality: 'right', asset: 'upper-limbs/wrist-right.svg', width: 1000, height: 1200, provenance,
    description: 'Palmar view of the right wrist from the distal forearm to the proximal palm, thumb on the viewer\'s right; wrist creases, pisiform and palmar creases are marked.',
  },
  {
    id: 'shoulder-left', version: 1, group: 'upper-limbs', label: 'Shoulder — left', region: 'left shoulder', view: 'anterior',
    laterality: 'left', asset: 'upper-limbs/shoulder-left.svg', width: 1200, height: 1200, provenance,
    description: 'Anterior view of the left shoulder from the side of the neck to the upper arm: deltoid cap, clavicle, acromion, anterior axillary fold and chest wall, with the midline marked.',
  },
  {
    id: 'elbow-left', version: 1, group: 'upper-limbs', label: 'Elbow — left', region: 'left elbow', view: 'anterior',
    laterality: 'left', asset: 'upper-limbs/elbow-left.svg', width: 1000, height: 1200, provenance,
    description: 'Anterior view of the left elbow with distal upper arm and proximal forearm: both epicondyles, the cubital crease and the borders of the cubital fossa.',
  },
  {
    id: 'wrist-left', version: 1, group: 'upper-limbs', label: 'Wrist — left', region: 'left wrist', view: 'palmar',
    laterality: 'left', asset: 'upper-limbs/wrist-left.svg', width: 1000, height: 1200, provenance,
    description: 'Palmar view of the left wrist from the distal forearm to the proximal palm, thumb on the viewer\'s left; wrist creases, pisiform and palmar creases are marked.',
  },
];

/** Vascular views, anterior. Patient's right is on the viewer's left (marked R). */
export const VASCULAR_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'pulse-sites', version: 1, group: 'vascular', label: 'Pulse sites — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'vascular/pulse-sites.svg', width: 1200, height: 1600, provenance,
    description: 'Whole-body anterior outline with labelled circles at the carotid, brachial, radial, femoral, popliteal, posterior tibial and dorsalis pedis pulse sites on both sides; posterior sites are dashed.',
  },
  {
    id: 'superficial-veins-lower-limbs', version: 1, group: 'vascular', label: 'Superficial veins — lower limbs', region: 'lower limbs', view: 'anterior',
    laterality: 'bilateral', asset: 'vascular/superficial-veins-lower-limbs.svg', width: 1200, height: 1400, provenance,
    description: 'Both legs from waist to toes, anterior view, with the great saphenous vein, the posterior course of the small saphenous vein, the dorsal venous arch and the saphenofemoral and saphenopopliteal junctions.',
  },
];

/** Whole body in anatomical position: anterior, posterior and both lateral views. A and P mark anterior and posterior on the lateral views. */
export const WHOLE_BODY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'whole-body-anterior', version: 1, group: 'whole-body', label: 'Whole body — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'whole-body/whole-body-anterior.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from the front in anatomical position, arms slightly away from the trunk with palms forward. The patient\'s right is on the viewer\'s left, marked R.',
  },
  {
    id: 'whole-body-posterior', version: 1, group: 'whole-body', label: 'Whole body — posterior', region: 'whole body', view: 'posterior',
    laterality: 'bilateral', asset: 'whole-body/whole-body-posterior.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from behind in anatomical position, arms slightly away from the trunk, with the spine and scapulae marked. The patient\'s right is on the viewer\'s right, marked R.',
  },
  {
    id: 'whole-body-right-lateral', version: 1, group: 'whole-body', label: 'Whole body — right lateral', region: 'whole body', view: 'right lateral',
    laterality: 'right', asset: 'whole-body/whole-body-right-lateral.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from the patient\'s right side, facing the viewer\'s right, arm hanging by the side. Anterior (A) is on the right of the image and posterior (P) on the left.',
  },
  {
    id: 'whole-body-left-lateral', version: 1, group: 'whole-body', label: 'Whole body — left lateral', region: 'whole body', view: 'left lateral',
    laterality: 'left', asset: 'whole-body/whole-body-left-lateral.svg', width: 800, height: 1600, provenance,
    description: 'Standing figure seen from the patient\'s left side, facing the viewer\'s left, arm hanging by the side. Anterior (A) is on the left of the image and posterior (P) on the right.',
  },
];

const abdomen = { width: 1200, height: 1200 } as const;

/** Wound and procedure views. Anterior views put the patient's right on the viewer's left (marked R). */
export const WOUND_PROCEDURE_RECIPES: readonly AnatomyTemplateRecipe[] = [
  {
    id: 'wound-surface-depth', version: 1, group: 'wound-procedure', label: 'Wound — surface and depth', region: 'skin', view: 'schematic',
    laterality: 'not-applicable', asset: 'wound-procedure/wound-surface-depth.svg', width: 1400, height: 1000, provenance,
    description: 'Skin cross-section with epidermis, dermis, subcutaneous tissue, fascia and muscle for depth staging, beside a wound-surface outline on a clock face where 12 o\'clock is head-ward.',
  },
  {
    id: 'incision-sites-abdomen', version: 1, group: 'wound-procedure', label: 'Abdomen — incision sites', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'wound-procedure/incision-sites-abdomen.svg', ...abdomen, provenance,
    description: 'Anterior abdomen with dashed common incision lines: midline, Pfannenstiel, right subcostal Kocher and McBurney, plus laparoscopic port sites. Patient right is on the viewer left.',
  },
  {
    id: 'drain-stoma-sites', version: 1, group: 'wound-procedure', label: 'Abdomen — drain and stoma sites', region: 'abdomen', view: 'anterior',
    laterality: 'bilateral', asset: 'wound-procedure/drain-stoma-sites.svg', ...abdomen, provenance,
    description: 'Anterior abdomen with small circles at typical stoma sites (ileostomy, colostomy, gastrostomy, jejunostomy) and drain or catheter sites. Patient right is on the viewer left.',
  },
  {
    id: 'injection-catheter-sites', version: 1, group: 'wound-procedure', label: 'Injection and line sites — anterior', region: 'whole body', view: 'anterior',
    laterality: 'bilateral', asset: 'wound-procedure/injection-catheter-sites.svg', width: 1200, height: 1600, provenance,
    description: 'Whole-body anterior outline with circles at common injection and line sites: deltoid, ventrogluteal, vastus lateralis, abdominal subcutaneous, internal jugular, subclavian, antecubital and femoral.',
  },
];

/** Every anatomy outline recipe, in group order. */
export const ANATOMY_RECIPES: readonly AnatomyTemplateRecipe[] = [
  ...ABDOMEN_RECIPES,
  ...ANAESTHESIA_RECIPES,
  ...ANTERIOR_SEGMENT_RECIPES,
  ...BACK_RECIPES,
  ...BONY_JOINTS_RECIPES,
  ...BURNS_RECIPES,
  ...CARDIOTHORACIC_RECIPES,
  ...CORNEA_RECIPES,
  ...DENTAL_ORAL_RECIPES,
  ...ENDOCRINE_NECK_RECIPES,
  ...ENT_HEAD_NECK_RECIPES,
  ...ENT_RECIPES,
  ...EYE_EXTERNAL_RECIPES,
  ...FACE_RECIPES,
  ...FEET_RECIPES,
  ...GENITAL_PERINEAL_RECIPES,
  ...GI_TRACT_RECIPES,
  ...GLOBE_ORBIT_RECIPES,
  ...GYNAECOLOGY_RECIPES,
  ...HANDS_RECIPES,
  ...HEAD_SCALP_RECIPES,
  ...LENS_RECIPES,
  ...LOWER_LIMBS_RECIPES,
  ...NECK_RECIPES,
  ...NEONATAL_RECIPES,
  ...NEURO_SPINE_RECIPES,
  ...NEUROLOGICAL_RECIPES,
  ...OBSTETRIC_RECIPES,
  ...OCT_RECIPES,
  ...OCULAR_MOTILITY_RECIPES,
  ...OPTIC_DISC_RECIPES,
  ...ORGANS_RECIPES,
  ...PAEDIATRIC_SURGERY_RECIPES,
  ...PAEDIATRIC_RECIPES,
  ...PELVIS_RECIPES,
  ...RETINA_RECIPES,
  ...SKELETON_RECIPES,
  ...SKULL_BRAIN_RECIPES,
  ...THORAX_RECIPES,
  ...UPPER_LIMBS_RECIPES,
  ...VASCULAR_RECIPES,
  ...WHOLE_BODY_RECIPES,
  ...WOUND_PROCEDURE_RECIPES,
];

/** Skin and wound findings for general use. Colours are data; a clinician reviews them before production use. */
export const GENERAL_FINDINGS_SYMBOLS: AnnotationSymbolSet = {
  id: 'general-findings',
  label: 'General findings',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Common skin and wound finding marks; drafted for this library, not yet reviewed by a clinician.',
  labels: [
    { id: 'inflammation', label: 'Inflammation', color: '#dc2626' },
    { id: 'swelling', label: 'Swelling', color: '#0369a1' },
    { id: 'redness', label: 'Redness', color: '#f87171' },
    { id: 'lump', label: 'Lump or mass', color: '#7c3aed' },
    { id: 'scar', label: 'Scar', color: '#7e5a6b' },
    { id: 'staples', label: 'Staples', color: '#475569' },
    { id: 'sutures', label: 'Sutures', color: '#6d28d9' },
    { id: 'open-wound', label: 'Open wound', color: '#7f1d1d' },
    { id: 'laceration', label: 'Laceration', color: '#dc2626' },
    { id: 'bruise', label: 'Bruise', color: '#6d28d9' },
    { id: 'abrasion', label: 'Abrasion', color: '#ea580c' },
    { id: 'ulcer', label: 'Ulcer', color: '#9f1239' },
    { id: 'burn', label: 'Burn', color: '#c2410c' },
    { id: 'rash', label: 'Rash', color: '#be123c' },
    { id: 'tenderness', label: 'Tenderness', color: '#7c3aed' },
    { id: 'pain-point', label: 'Pain point', color: '#dc2626' },
  ],
  presets: [
    { id: 'finding-inflammation', label: 'Inflammation', tool: 'polygon', fillPattern: 'hatch', colour: '#dc2626', width: 3, classId: 'inflammation' },
    { id: 'finding-swelling', label: 'Swelling', description: 'Dashed outline', tool: 'polygon', strokeStyle: 'dashed', colour: '#0369a1', width: 3, classId: 'swelling' },
    { id: 'finding-redness', label: 'Redness (erythema)', description: 'Light hatching', tool: 'polygon', fillPattern: 'hatch', colour: '#f87171', width: 2, classId: 'redness' },
    { id: 'finding-lump', label: 'Lump or mass', tool: 'circle', colour: '#7c3aed', width: 3, classId: 'lump' },
    { id: 'finding-scar', label: 'Scar', tool: 'curve', colour: '#7e5a6b', width: 3, classId: 'scar' },
    { id: 'finding-staples', label: 'Staples', description: 'Small brackets along the wound', tool: 'curve', strokeStyle: 'stapled', colour: '#475569', width: 3, classId: 'staples' },
    { id: 'finding-sutures', label: 'Sutures', description: 'Ticks across the wound', tool: 'curve', strokeStyle: 'sutured', colour: '#6d28d9', width: 3, classId: 'sutures' },
    { id: 'finding-open-wound', label: 'Open wound', tool: 'polygon', colour: '#7f1d1d', width: 4, classId: 'open-wound' },
    { id: 'finding-laceration', label: 'Laceration', tool: 'freeform', colour: '#dc2626', width: 3, classId: 'laceration' },
    { id: 'finding-bruise', label: 'Bruise (contusion)', description: 'Crosshatched', tool: 'polygon', fillPattern: 'crosshatch', colour: '#6d28d9', width: 2, classId: 'bruise' },
    { id: 'finding-abrasion', label: 'Abrasion', tool: 'polygon', fillPattern: 'hatch', colour: '#ea580c', width: 2, classId: 'abrasion' },
    { id: 'finding-ulcer', label: 'Ulcer', tool: 'circle', fillPattern: 'crosshatch', colour: '#9f1239', width: 3, classId: 'ulcer' },
    { id: 'finding-burn', label: 'Burn', tool: 'polygon', fillPattern: 'hatch', colour: '#c2410c', width: 3, classId: 'burn' },
    { id: 'finding-rash', label: 'Rash', tool: 'polygon', strokeStyle: 'dashed', colour: '#be123c', width: 2, classId: 'rash' },
    { id: 'finding-tenderness', label: 'Tenderness', description: 'Text with an arrow to the tender area', tool: 'callout', colour: '#7c3aed', width: 3, classId: 'tenderness' },
    { id: 'finding-pain-point', label: 'Pain point', description: 'Arrow pointing at the painful spot', tool: 'arrow', colour: '#dc2626', width: 3, classId: 'pain-point' },
  ],
};

/**
 * The conventional retinal-drawing colour code: red for attached retina, arterioles, haemorrhage and breaks;
 * blue for detached retina and veins; green for vitreous opacity; yellow for exudate; brown or black for pigment.
 * Colours are data; a retina specialist reviews them before production use.
 */
export const RETINA_SYMBOLS: AnnotationSymbolSet = {
  id: 'retina',
  label: 'Retina',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Conventional retinal-drawing colour code; drafted for this library, not yet reviewed by a retina specialist.',
  labels: [
    { id: 'retina-attached', label: 'Attached retina', color: '#dc2626' },
    { id: 'retina-detached', label: 'Detached retina', color: '#2563eb' },
    { id: 'lattice-degeneration', label: 'Lattice degeneration', color: '#2563eb' },
    { id: 'retinal-break', label: 'Retinal break', color: '#dc2626' },
    { id: 'retinal-arteriole', label: 'Arteriole', color: '#dc2626' },
    { id: 'retinal-vein', label: 'Vein', color: '#2563eb' },
    { id: 'retinal-haemorrhage', label: 'Haemorrhage', color: '#b91c1c' },
    { id: 'vitreous-opacity', label: 'Vitreous opacity', color: '#15803d' },
    { id: 'retinal-exudate', label: 'Exudate', color: '#ca8a04' },
    { id: 'retinal-pigment', label: 'Pigment', color: '#78350f' },
    { id: 'retina-note', label: 'Note', color: '#334155' },
  ],
  presets: [
    { id: 'retina-attached', label: 'Attached retina', tool: 'polygon', colour: '#dc2626', width: 3, classId: 'retina-attached' },
    { id: 'retina-detached', label: 'Detached retina', description: 'Blue hatching', tool: 'polygon', fillPattern: 'hatch', colour: '#2563eb', width: 3, classId: 'retina-detached' },
    { id: 'retina-lattice', label: 'Lattice degeneration', description: 'Blue lattice (#) pattern', tool: 'polygon', fillPattern: 'lattice', colour: '#2563eb', width: 3, classId: 'lattice-degeneration' },
    { id: 'retina-break', label: 'Retinal break', description: 'Red outline', tool: 'polygon', colour: '#dc2626', width: 3, classId: 'retinal-break' },
    { id: 'retina-arteriole', label: 'Arteriole', tool: 'curve', colour: '#dc2626', width: 2, classId: 'retinal-arteriole' },
    { id: 'retina-vein', label: 'Vein', tool: 'curve', colour: '#2563eb', width: 3, classId: 'retinal-vein' },
    { id: 'retina-haemorrhage', label: 'Haemorrhage', tool: 'freeform', colour: '#b91c1c', width: 3, classId: 'retinal-haemorrhage' },
    { id: 'retina-vitreous-opacity', label: 'Vitreous opacity', tool: 'freeform', colour: '#15803d', width: 3, classId: 'vitreous-opacity' },
    { id: 'retina-exudate', label: 'Exudate', tool: 'polygon', colour: '#ca8a04', width: 3, classId: 'retinal-exudate' },
    { id: 'retina-pigment', label: 'Pigment', tool: 'polygon', colour: '#78350f', width: 3, classId: 'retinal-pigment' },
    { id: 'retina-callout', label: 'Callout note', description: 'Text with an arrow to the area', tool: 'callout', colour: '#334155', width: 3, classId: 'retina-note' },
  ],
};

/** Surgical planning and operative marks. Colours are data; a clinician reviews them before production use. */
export const SURGERY_SYMBOLS: AnnotationSymbolSet = {
  id: 'surgery',
  label: 'Surgery',
  version: 1,
  reviewStatus: 'unreviewed',
  provenance: 'Conventional operative-note drawing marks; drafted for this library, not yet reviewed by a surgeon.',
  labels: [
    { id: 'suture-line', label: 'Suture line', color: '#6d28d9' },
    { id: 'incision', label: 'Incision', color: '#be123c' },
    { id: 'planned-incision', label: 'Planned incision', color: '#be123c' },
    { id: 'excision-margin', label: 'Excision margin', color: '#b45309' },
    { id: 'drain-site', label: 'Drain site', color: '#0369a1' },
    { id: 'area-to-excise', label: 'Area to excise', color: '#be185d' },
    { id: 'surgical-note', label: 'Note', color: '#334155' },
  ],
  presets: [
    { id: 'surgery-sutures', label: 'Sutures', description: 'Closed wound, drawn as a line crossed by ticks', tool: 'curve', strokeStyle: 'sutured', colour: '#6d28d9', width: 3, classId: 'suture-line' },
    { id: 'surgery-incision', label: 'Incision', description: 'Made incision', tool: 'curve', strokeStyle: 'solid', colour: '#be123c', width: 3, classId: 'incision' },
    { id: 'surgery-planned-incision', label: 'Planned incision', description: 'Marked, not yet made', tool: 'curve', strokeStyle: 'dashed', colour: '#be123c', width: 3, classId: 'planned-incision' },
    { id: 'surgery-excision-margin', label: 'Excision margin', description: 'Outline of tissue to be removed', tool: 'polygon', strokeStyle: 'dashed', colour: '#b45309', width: 3, classId: 'excision-margin' },
    { id: 'surgery-drain-site', label: 'Drain site', description: 'Arrow pointing at the drain exit', tool: 'arrow', colour: '#0369a1', width: 3, classId: 'drain-site' },
    { id: 'surgery-area-to-excise', label: 'Area to excise', description: 'Hatched area', tool: 'polygon', fillPattern: 'hatch', colour: '#be185d', width: 2, classId: 'area-to-excise' },
    { id: 'surgery-callout', label: 'Callout note', description: 'Text with an arrow to the area', tool: 'callout', colour: '#334155', width: 3, classId: 'surgical-note' },
  ],
};

export const ANNOTATION_SYMBOL_SETS: readonly AnnotationSymbolSet[] = [
  GENERAL_FINDINGS_SYMBOLS,
  RETINA_SYMBOLS,
  SURGERY_SYMBOLS,
];
