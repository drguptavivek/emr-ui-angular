import { Component, Input, OnInit, signal } from '@angular/core';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { anatomyTemplateToImage } from '@drguptavivek/emr-controller';
import type { AnatomyTemplateRecipe, AnnotationLayerRecord, AnnotationPoint, AnnotationSymbolSet, EmrClinicalAnnotationCanvasState } from '@drguptavivek/emr-controller';
import { EmrClinicalAnnotationCanvasComponent } from '../domain/emr-clinical-annotation-canvas.component';
import { ANATOMY_RECIPES } from '../recipes/anatomy';
import { GENERAL_FINDINGS_SYMBOLS } from '../recipes/annotation-symbols/general-findings';
import { SURGERY_SYMBOLS } from '../recipes/annotation-symbols/surgery';

/** Where Storybook serves the outline SVGs (see .storybook/main.ts staticDirs). */
const ASSET_BASE = '/assets/anatomy';

const titleCase = (value: string) => value.replace(/-/g, ' ').replace(/^./, first => first.toUpperCase());

const groups = [...new Set(ANATOMY_RECIPES.map(recipe => recipe.group))].map(group => ({
  group,
  recipes: ANATOMY_RECIPES.filter(recipe => recipe.group === group),
}));

const imageUrl = (recipe: AnatomyTemplateRecipe) => anatomyTemplateToImage(recipe, ASSET_BASE).imageUrl;

@Component({
  selector: 'emr-anatomy-gallery-story',
  standalone: true,
  template: `
    <div class="emr-story-surface anatomy-gallery">
      <p class="anatomy-gallery__note">{{ total }} views in {{ groups.length }} sets. Every outline is unreviewed and needs clinical review before production use.</p>
      @for (set of groups; track set.group) {
        <section class="anatomy-gallery__set" [attr.aria-labelledby]="'set-' + set.group">
          <h2 [id]="'set-' + set.group">{{ set.group }} <span>({{ set.recipes.length }})</span></h2>
          <ul>
            @for (recipe of set.recipes; track recipe.id) {
              <li>
                <img [src]="url(recipe)" [alt]="recipe.description" loading="lazy" />
                <span class="anatomy-gallery__label">{{ recipe.label }}</span>
                <code>{{ recipe.id }} · {{ recipe.width }}×{{ recipe.height }}</code>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [`
    .anatomy-gallery{display:grid;gap:20px}
    .anatomy-gallery__note{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .anatomy-gallery__set h2{margin:0 0 8px;font-size:var(--emr-text-lg);text-transform:capitalize}
    .anatomy-gallery__set h2 span{color:var(--emr-text-muted);font-weight:var(--emr-weight-regular)}
    ul{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
    li{display:grid;gap:4px;align-content:start;padding:8px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    img{width:100%;aspect-ratio:1;object-fit:contain;background:var(--emr-background);border-radius:4px}
    .anatomy-gallery__label{font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium)}
    code{font-size:var(--emr-text-2xs);color:var(--emr-text-muted);overflow-wrap:anywhere}
  `],
})
class AnatomyGalleryStoryComponent {
  readonly groups = groups;
  readonly total = ANATOMY_RECIPES.length;
  url = imageUrl;
}

/** Pen palettes are controller data (mark colours are saved with each mark), so the canvas supplies none of its own. */
const penColours = [
  { id: 'slate', label: 'Slate', hex: '#475f70' },
  { id: 'red', label: 'Red', hex: '#dc2626' },
  { id: 'blue', label: 'Blue', hex: '#2563eb' },
  { id: 'green', label: 'Green', hex: '#15803d' },
  { id: 'amber', label: 'Amber', hex: '#b45309' },
  { id: 'purple', label: 'Purple', hex: '#7c3aed' },
] as const;
const penWidths = [
  { id: 'fine', label: 'Fine', px: 2 },
  { id: 'medium', label: 'Medium', px: 3 },
  { id: 'bold', label: 'Bold', px: 4 },
  { id: 'heavy', label: 'Heavy', px: 6 },
] as const;

/** A symbol set's classes join the story's own; the story's win on a clash. */
const withLabels = (own: EmrClinicalAnnotationCanvasState['availableLabels'], set: AnnotationSymbolSet) => [...own, ...set.labels.filter(label => !own.some(known => known.id === label.id))];

/** The annotation canvas with every outline as a selectable background; the host keeps the latest state. */
@Component({
  selector: 'emr-anatomy-canvas-story',
  standalone: true,
  imports: [EmrClinicalAnnotationCanvasComponent],
  template: `<div class="emr-story-surface"><emr-clinical-annotation-canvas [model]="model()" /></div>`,
})
class AnatomyCanvasStoryComponent implements OnInit {
  @Input() layout: 'compact' | 'draw' = 'compact';
  readonly model = signal<EmrClinicalAnnotationCanvasState>({
    instanceId: 'anatomy-outline-demo',
    title: 'Anatomical drawing',
    description: 'Choose any standard outline and mark findings. Outlines are schematic and unreviewed.',
    imageTemplates: ANATOMY_RECIPES.map(recipe => ({ ...anatomyTemplateToImage(recipe, ASSET_BASE), label: recipe.label, group: titleCase(recipe.group) })),
    availableLabels: withLabels([
      { id: 'lesion', label: 'Lesion', color: '#dc2626' },
      { id: 'wound', label: 'Wound', color: '#b45309' },
      { id: 'tenderness', label: 'Tenderness', color: '#7c3aed' },
      { id: 'scar', label: 'Scar', color: '#475569' },
    ], GENERAL_FINDINGS_SYMBOLS),
    // No specialty set is chosen here, so the general findings are the default symbols.
    symbolPresets: GENERAL_FINDINGS_SYMBOLS.presets,
    selectedImageId: 'whole-body-anterior',
    selectedLabelId: 'lesion',
    selectedTool: 'circle',
    brushColor: '#dc2626',
    brushWidth: 3,
    layers: [
      { id: 'sample-1', tool: 'circle', label: 'Lesion', color: '#dc2626', strokeWidth: 3, visible: true, classIds: ['lesion'], center: { x: 0.5, y: 0.32 }, radiusX: 0.07, radiusY: 0.03 },
      { id: 'sample-2', tool: 'line', label: 'Wound', color: '#b45309', strokeWidth: 3, visible: true, classIds: ['wound'], points: [{ x: 0.42, y: 0.55 }, { x: 0.58, y: 0.6 }] },
      { id: 'sample-3', tool: 'text', label: '4 cm', color: '#7c3aed', strokeWidth: 2, visible: true, classIds: ['tenderness'], point: { x: 0.6, y: 0.75 }, text: '4 cm', fontSize: 24 },
    ],
    textContent: 'Finding',
    colourOptions: penColours,
    widthOptions: penWidths,
  });

  ngOnInit(): void {
    this.model.update(model => ({ ...model, layout: this.layout }));
  }
}

/** A canvas on one outline with a symbol set's presets and classes and some example marks. */
const symbolStory = (set: AnnotationSymbolSet, recipeId: string, title: string, layers: AnnotationLayerRecord[], startId = set.presets[0].id): EmrClinicalAnnotationCanvasState => {
  const recipe = ANATOMY_RECIPES.find(candidate => candidate.id === recipeId);
  const start = set.presets.find(preset => preset.id === startId);
  if (!recipe || !start) throw new Error(`Unknown outline ${recipeId} or symbol ${startId}`);
  return {
    instanceId: `anatomy-${set.id}-demo`,
    title,
    description: 'Pick a symbol, then draw. Outlines and symbols are schematic and unreviewed.',
    imageTemplates: [{ ...anatomyTemplateToImage(recipe, ASSET_BASE), label: recipe.label }],
    availableLabels: set.labels,
    symbolPresets: set.presets,
    selectedImageId: recipe.id,
    selectedSymbolId: start.id,
    selectedLabelId: start.classId,
    selectedTool: start.tool,
    brushStrokeStyle: start.strokeStyle,
    brushFillPattern: start.fillPattern,
    brushColor: start.colour ?? '#475f70',
    brushWidth: start.width ?? 3,
    layers,
    textContent: 'Note',
    colourOptions: penColours,
    widthOptions: penWidths,
    layout: 'draw',
  };
};

/** Points along a gentle S-curve, dense enough that suture ticks follow it. */
const sCurve = (from: AnnotationPoint, to: AnnotationPoint, sway: number, steps = 14): AnnotationPoint[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { x: from.x + (to.x - from.x) * t + sway * Math.sin(t * Math.PI * 2), y: from.y + (to.y - from.y) * t };
  });

const surgicalSymbolsState = symbolStory(SURGERY_SYMBOLS, 'abdomen-plain', 'Abdominal surgery drawing', [
  { id: 'sx-incision', tool: 'curve', label: 'Sutures', color: '#6d28d9', strokeWidth: 3, visible: true, strokeStyle: 'sutured', classIds: ['suture-line'], points: sCurve({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.78 }, 0.02) },
  { id: 'sx-drain', tool: 'arrow', label: 'Drain site', color: '#0369a1', strokeWidth: 3, visible: true, classIds: ['drain-site'], points: [{ x: 0.82, y: 0.72 }, { x: 0.68, y: 0.6 }] },
  { id: 'sx-note', tool: 'callout', label: 'Port site clean', color: '#334155', strokeWidth: 3, visible: true, classIds: ['surgical-note'], points: [{ x: 0.4, y: 0.9 }, { x: 0.46, y: 0.72 }], text: 'Port site clean', fontSize: 36 },
]);

const woundFindingsState = symbolStory(GENERAL_FINDINGS_SYMBOLS, 'whole-body-anterior', 'Wound and skin findings', [
  { id: 'wf-staples', tool: 'curve', label: 'Staples', color: '#475569', strokeWidth: 3, visible: true, strokeStyle: 'stapled', classIds: ['staples'], points: sCurve({ x: 0.5, y: 0.37 }, { x: 0.5, y: 0.52 }, 0.004, 8) },
  { id: 'wf-bruise', tool: 'polygon', label: 'Bruise (contusion)', color: '#6d28d9', strokeWidth: 2, visible: true, fillPattern: 'crosshatch', classIds: ['bruise'], points: [{ x: 0.62, y: 0.66 }, { x: 0.68, y: 0.64 }, { x: 0.7, y: 0.7 }, { x: 0.65, y: 0.74 }, { x: 0.61, y: 0.71 }] },
  { id: 'wf-laceration', tool: 'freeform', label: 'Laceration', color: '#dc2626', strokeWidth: 3, visible: true, classIds: ['laceration'], points: [{ x: 0.2, y: 0.4 }, { x: 0.22, y: 0.43 }, { x: 0.21, y: 0.46 }, { x: 0.24, y: 0.49 }, { x: 0.23, y: 0.52 }] },
  { id: 'wf-swelling', tool: 'polygon', label: 'Swelling', color: '#0369a1', strokeWidth: 3, visible: true, strokeStyle: 'dashed', classIds: ['swelling'], points: [{ x: 0.36, y: 0.74 }, { x: 0.43, y: 0.73 }, { x: 0.45, y: 0.8 }, { x: 0.4, y: 0.84 }, { x: 0.35, y: 0.8 }] },
  { id: 'wf-note', tool: 'callout', label: 'Tender here', color: '#7c3aed', strokeWidth: 3, visible: true, classIds: ['tenderness'], points: [{ x: 0.62, y: 0.3 }, { x: 0.55, y: 0.42 }], text: 'Tender here', fontSize: 44 },
], 'finding-inflammation');

const meta: Meta = {
  title: 'Clinical Drawing / Anatomy outlines',
  decorators: [moduleMetadata({ imports: [AnatomyGalleryStoryComponent, AnatomyCanvasStoryComponent, EmrClinicalAnnotationCanvasComponent] })],
  parameters: {
    docs: { description: { component: 'L5 anatomy outline recipes: one standalone SVG per view, served from the package assets and resolved through anatomyTemplateToImage.' } },
  },
};

export default meta;
type Story = StoryObj;

export const Gallery: Story = { render: () => ({ template: `<emr-anatomy-gallery-story />` }) };
export const DrawOnOutlines: Story = { render: () => ({ template: `<emr-anatomy-canvas-story />` }) };
export const DrawModePortrait: Story = { render: () => ({ template: `<emr-anatomy-canvas-story layout="draw" />` }) };

const canvasOnModel = `<div class="emr-story-surface"><emr-clinical-annotation-canvas [model]="model" /></div>`;

/** Sutured curved incision, a drain arrow and a callout on the abdomen, with the surgery symbols in the Symbol select. */
export const SurgicalSymbols: Story = { render: () => ({ template: canvasOnModel, props: { model: surgicalSymbolsState } }) };

/** Skin and wound findings on the whole-body outline: staples, bruise, laceration, swelling and a tenderness callout. */
export const WoundAndSkinFindings: Story = { render: () => ({ template: canvasOnModel, props: { model: woundFindingsState } }) };

/**
 * Full screen with Pan and lock. Pan is the selected tool, so the view starts unlocked; the play function enters full
 * screen and zooms in twice. Picking any drawing tool afterwards locks the view again.
 */
export const FullScreenPanAndLock: Story = {
  render: () => ({ template: canvasOnModel, props: { model: { ...woundFindingsState, selectedTool: 'pan' } } }),
  play: async ({ canvasElement }) => {
    const click = async (label: string) => {
      (canvasElement.querySelector(`[aria-label="${label}"]`) as HTMLElement | null)?.click();
      await new Promise(resolve => setTimeout(resolve, 150));
    };
    await click('Full screen');
    await click('Zoom in');
    await click('Zoom in');
  },
};
