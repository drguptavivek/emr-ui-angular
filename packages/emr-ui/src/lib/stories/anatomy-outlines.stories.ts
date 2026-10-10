import { Component, signal } from '@angular/core';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { anatomyTemplateToImage } from '@drguptavivek/emr-controller';
import type { AnatomyTemplateRecipe, EmrClinicalAnnotationCanvasState } from '@drguptavivek/emr-controller';
import { EmrClinicalAnnotationCanvasComponent } from '../domain/emr-clinical-annotation-canvas.component';
import { ANATOMY_RECIPES } from '../recipes/anatomy';

/** Where Storybook serves the outline SVGs (see .storybook/main.ts staticDirs). */
const ASSET_BASE = '/assets/anatomy';

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

/** The annotation canvas with every outline as a selectable background; the host keeps the latest state. */
@Component({
  selector: 'emr-anatomy-canvas-story',
  standalone: true,
  imports: [EmrClinicalAnnotationCanvasComponent],
  template: `<div class="emr-story-surface"><emr-clinical-annotation-canvas [model]="model()" /></div>`,
})
class AnatomyCanvasStoryComponent {
  readonly model = signal<EmrClinicalAnnotationCanvasState>({
    instanceId: 'anatomy-outline-demo',
    title: 'Anatomical drawing',
    description: 'Choose any standard outline and mark findings. Outlines are schematic and unreviewed.',
    imageTemplates: ANATOMY_RECIPES.map(recipe => ({ ...anatomyTemplateToImage(recipe, ASSET_BASE), label: `${recipe.group} — ${recipe.label}` })),
    availableLabels: [
      { id: 'lesion', label: 'Lesion', color: '#dc2626' },
      { id: 'wound', label: 'Wound', color: '#b45309' },
      { id: 'tenderness', label: 'Tenderness', color: '#7c3aed' },
      { id: 'scar', label: 'Scar', color: '#475569' },
    ],
    selectedImageId: 'whole-body-anterior',
    selectedLabelId: 'lesion',
    selectedTool: 'circle',
    brushColor: '#dc2626',
    brushWidth: 3,
    layers: [],
    textContent: 'Finding',
  });
}

const meta: Meta = {
  title: 'Clinical Drawing / Anatomy outlines',
  decorators: [moduleMetadata({ imports: [AnatomyGalleryStoryComponent, AnatomyCanvasStoryComponent] })],
  parameters: {
    docs: { description: { component: 'L5 anatomy outline recipes: one standalone SVG per view, served from the package assets and resolved through anatomyTemplateToImage.' } },
  },
};

export default meta;
type Story = StoryObj;

export const Gallery: Story = { render: () => ({ template: `<emr-anatomy-gallery-story />` }) };
export const DrawOnOutlines: Story = { render: () => ({ template: `<emr-anatomy-canvas-story />` }) };
