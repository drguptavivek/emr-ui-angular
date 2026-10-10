import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;
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
