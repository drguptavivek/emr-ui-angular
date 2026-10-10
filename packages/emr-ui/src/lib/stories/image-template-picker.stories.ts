import { Component, Input, OnInit, signal } from '@angular/core';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { anatomyTemplateToImage, filterImageTemplates } from '@drguptavivek/emr-controller';
import type { AnatomyTemplateRecipe, ImageTemplateGroup, ImageTemplateOption, ImageTemplatePickerIntent, ImageTemplatePickerViewModel } from '@drguptavivek/emr-controller';
import { EmrImageTemplatePickerComponent } from '../structures/emr-image-template-picker.component';
import { ANATOMY_RECIPES } from '../recipes/anatomy';

const ASSET_BASE = '/assets/anatomy';

const GROUP_LABELS: Record<string, string> = {
  'whole-body': 'Whole body', 'head-scalp': 'Head & scalp', 'ent': 'ENT', 'dental-oral': 'Dental & oral',
  'eye-external': 'Eye — external', 'anterior-segment': 'Eye — anterior segment', 'cornea': 'Eye — cornea',
  'retina': 'Eye — retina', 'optic-disc': 'Eye — optic disc', 'ocular-motility': 'Eye — motility',
  'genital-perineal': 'Genital & perineal', 'wound-procedure': 'Wound & procedure',
};
const titleCase = (value: string) => value.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

const LATERALITY: Record<AnatomyTemplateRecipe['laterality'], string | undefined> = {
  left: 'Left', right: 'Right', bilateral: 'Both', midline: 'Midline', 'not-applicable': undefined,
};

const toOption = (r: AnatomyTemplateRecipe): ImageTemplateOption => {
  const image = anatomyTemplateToImage(r, ASSET_BASE);
  const side = LATERALITY[r.laterality];
  return { ...image, groupId: r.group, badges: [...(side ? [side] : []), titleCase(r.view)] };
};

const ALL: readonly ImageTemplateOption[] = ANATOMY_RECIPES.map(toOption);
const GROUPS: readonly ImageTemplateGroup[] = [...new Set(ANATOMY_RECIPES.map((r) => r.group))].map((id) => ({
  id, label: GROUP_LABELS[id] ?? titleCase(id), count: ANATOMY_RECIPES.filter((r) => r.group === id).length,
}));

const idsOf = (...groups: string[]) => ANATOMY_RECIPES.filter((r) => groups.includes(r.group)).map((r) => r.id);
const RETINA_FAVOURITES = idsOf('retina', 'optic-disc', 'cornea');
const SURGEON_FAVOURITES = [...idsOf('abdomen'), 'incision-sites-abdomen', 'drain-stoma-sites'].filter((id, i, a) => a.indexOf(id) === i);

/** Story host: holds query, group, selection and favourites in signals and filters with the shared helper. */
@Component({
  selector: 'emr-image-template-picker-story',
  standalone: true,
  imports: [EmrImageTemplatePickerComponent],
  template: `
    <div class="emr-story-surface">
      <div [style.max-width]="maxWidth">
        <emr-image-template-picker [model]="model()" (intent)="onIntent($event)" />
      </div>
      <p class="story-note" aria-live="polite">Last intent: {{ last() }}</p>
    </div>
  `,
  styles: [`.story-note{margin:12px 0 0;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}`],
})
class PickerStoryHost implements OnInit {
  @Input() query = '';
  @Input() groupId?: string;
  @Input() selectedId?: string;
  @Input() readOnly = false;
  @Input() canEditFavourites = true;
  @Input() favourites: readonly string[] = [];
  @Input() maxWidth = '';

  protected readonly q = signal('');
  protected readonly g = signal<string | undefined>(undefined);
  protected readonly sel = signal<string | undefined>(undefined);
  protected readonly favs = signal<readonly string[]>([]);
  protected readonly last = signal('none');

  ngOnInit(): void {
    this.q.set(this.query);
    this.g.set(this.groupId);
    this.sel.set(this.selectedId);
    this.favs.set(this.favourites);
  }

  protected model(): ImageTemplatePickerViewModel {
    const options = filterImageTemplates(ALL, this.q(), this.g(), GROUPS, this.favs());
    return {
      title: 'Choose an outline',
      options, groups: GROUPS,
      selectedGroupId: this.g(), query: this.q(), selectedId: this.sel(),
      totalLabel: `${options.length} of ${ALL.length} outlines`,
      emptyMessage: 'No outlines match your search.',
      readOnly: this.readOnly,
      favouriteIds: this.favs(), canEditFavourites: this.canEditFavourites,
    };
  }

  protected onIntent(i: ImageTemplatePickerIntent): void {
    this.last.set(JSON.stringify(i));
    switch (i.type) {
      case 'queryChangeRequested': this.q.set(i.query); break;
      case 'groupSelected': this.g.set(i.groupId ?? undefined); break;
      case 'templateSelected': this.sel.set(i.templateId); break;
      case 'favouriteToggleRequested':
        this.favs.update((list) => (i.favourite ? [...list.filter((id) => id !== i.templateId), i.templateId] : list.filter((id) => id !== i.templateId)));
        break;
      case 'closeRequested': break;
    }
  }
}

const meta: Meta<PickerStoryHost> = {
  title: 'EMR / Annotation / Template gallery',
  component: PickerStoryHost,
  decorators: [moduleMetadata({ imports: [PickerStoryHost] })],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled, generic gallery picker for choosing a background image visually instead of from a long dropdown. The controller supplies the already-filtered options, the groups, the favourites and the selection (the shared `filterImageTemplates` helper does the filtering); the component renders square thumbnails and emits query, group, selection, favourite and close intents.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<PickerStoryHost>;

export const AnatomyGallery: Story = { args: { favourites: [] } };
export const Filtered: Story = { args: { query: 'right' } };
export const GroupSelected: Story = { args: { groupId: 'retina' } };
export const NoMatches: Story = { args: { query: 'zebra stripes' } };
export const WithSelection: Story = { args: { groupId: 'retina', selectedId: 'retina-posterior-pole-od' } };
export const ReadOnly: Story = { args: { groupId: 'retina', selectedId: 'retina-posterior-pole-od', readOnly: true, favourites: ['retina-peripheral-od'] } };
export const RetinaSpecialistFavourites: Story = { args: { favourites: RETINA_FAVOURITES, selectedId: 'retina-posterior-pole-od' } };
export const SurgeonFavourites: Story = { args: { favourites: SURGEON_FAVOURITES } };
export const Mobile: Story = { args: { favourites: ['retina-posterior-pole-od', 'abdomen-plain'], selectedId: 'abdomen-plain', maxWidth: '360px' } };
