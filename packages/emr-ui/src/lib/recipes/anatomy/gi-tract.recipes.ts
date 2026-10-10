import type { AnatomyTemplateRecipe } from '@drguptavivek/emr-controller';

const provenance = { author: 'EMR component library (original schematic)', licence: 'Project-internal', reviewStatus: 'unreviewed' } as const;

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
    description: 'Stomach outline from the oesophageal entry to the duodenal bulb with cardia, fundus, upper, mid and lower body, incisura angularis, antrum, pylorus and lesser and greater curvatures separated by dashed boundaries, plus a small circumferential wall key.',
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
    description: 'Whole colon framed in the abdomen, from caecum with appendix, ileocaecal valve and terminal ileum through the flexures and transverse colon to the sigmoid, rectum and anal canal, with distance-from-anal-verge ticks at 15, 30, 40 and 60 cm.',
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
