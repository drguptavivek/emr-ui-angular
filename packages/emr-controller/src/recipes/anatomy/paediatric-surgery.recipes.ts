import type { AnatomyTemplateRecipe } from '../../anatomy-template.models.js';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

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
