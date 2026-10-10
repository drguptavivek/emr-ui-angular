import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck, heroMagnifyingGlass, heroStar, heroXMark } from '@ng-icons/heroicons/outline';
import { heroStarSolid } from '@ng-icons/heroicons/solid';
/** Mirrors the controller's FAVOURITES_GROUP_ID. A runtime import would put the controller in the UI bundle and break SSR, which loads the bundle without it. */
const FAVOURITES_GROUP_ID = 'favourites';
import type { ImageTemplateOption, ImageTemplatePickerIntent, ImageTemplatePickerViewModel } from '@drguptavivek/emr-controller';

let nextPickerId = 0;

interface PickerView {
  readonly model: ImageTemplatePickerViewModel;
  readonly favs: readonly ImageTemplateOption[];
  readonly rest: readonly ImageTemplateOption[];
  readonly flat: readonly ImageTemplateOption[];
}

@Component({
  selector: 'emr-image-template-picker',
  standalone: true,
  imports: [NgIcon, NgTemplateOutlet],
  providers: [provideIcons({ heroCheck, heroMagnifyingGlass, heroStar, heroStarSolid, heroXMark })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tp" [attr.aria-labelledby]="titleId()" (keydown.escape)="intent.emit({ type: 'closeRequested' })" (focusin)="onFocusIn($event)">
      <header class="tp__head">
        <div class="tp__title">
          <h3 class="tp__name" [id]="titleId()">{{ model.title }}</h3>
          @if (model.totalLabel) { <p class="tp__total" role="status">{{ model.totalLabel }}</p> }
        </div>
        <button type="button" class="emr-icon-button" aria-label="Close" title="Close" (click)="intent.emit({ type: 'closeRequested' })">
          <ng-icon name="heroXMark" aria-hidden="true" />
        </button>
      </header>

      <div class="tp__search">
        <label class="emr-sr-only" [for]="uid + '-q'">Search {{ model.title }}</label>
        <ng-icon class="tp__glass" name="heroMagnifyingGlass" aria-hidden="true" />
        <input class="emr-search-input tp__input" type="search" autocomplete="off" placeholder="Search by name, side or view" [id]="uid + '-q'" [value]="model.query"
               (input)="onQuery($event)" />
      </div>

      <div class="tp__chips" role="group" [attr.aria-label]="'Filter ' + model.title">
        @if (showFavouritesChip()) {
          <button type="button" class="tp__chip" [attr.aria-pressed]="model.selectedGroupId === favouritesId"
                  (click)="intent.emit({ type: 'groupSelected', groupId: favouritesId })">
            <ng-icon name="heroStarSolid" class="tp__chip-star" aria-hidden="true" />Favourites<span class="tp__n">{{ model.favouriteIds?.length ?? 0 }}</span>
          </button>
        }
        <button type="button" class="tp__chip" [attr.aria-pressed]="!model.selectedGroupId" (click)="intent.emit({ type: 'groupSelected', groupId: null })">All</button>
        @for (g of model.groups; track g.id) {
          <button type="button" class="tp__chip" [attr.aria-pressed]="model.selectedGroupId === g.id" (click)="intent.emit({ type: 'groupSelected', groupId: g.id })">
            {{ g.label }}@if (g.count !== undefined) { <span class="tp__n">{{ g.count }}</span> }
          </button>
        }
      </div>

      @if (v.flat.length) {
        @if (v.favs.length) {
          <div class="tp__sec" role="group" [attr.aria-labelledby]="uid + '-fav'">
            <h4 class="tp__sub" [id]="uid + '-fav'"><ng-icon name="heroStarSolid" class="tp__sub-star" aria-hidden="true" />Favourites <span class="tp__n">{{ v.favs.length }}</span></h4>
            <ul class="tp__grid" role="list"><ng-container [ngTemplateOutlet]="tiles" [ngTemplateOutletContext]="{ $implicit: v.favs }" /></ul>
          </div>
        } @else if (showHint()) {
          <p class="tp__hint">Star a template to pin it here.</p>
        }
        @if (v.rest.length) {
          <div class="tp__sec" [attr.role]="v.favs.length ? 'group' : null" [attr.aria-labelledby]="v.favs.length ? uid + '-all' : null">
            @if (v.favs.length) { <h4 class="tp__sub" [id]="uid + '-all'">All templates <span class="tp__n">{{ v.rest.length }}</span></h4> }
            <ul class="tp__grid" role="list"><ng-container [ngTemplateOutlet]="tiles" [ngTemplateOutletContext]="{ $implicit: v.rest }" /></ul>
          </div>
        }
      } @else {
        <div class="emr-empty tp__empty">
          <p class="tp__empty-msg">{{ model.emptyMessage }}</p>
          <div class="tp__empty-actions">
            @if (model.query) { <button type="button" class="emr-button emr-button--outline emr-button--small" (click)="intent.emit({ type: 'queryChangeRequested', query: '' })">Clear search</button> }
            @if (model.selectedGroupId) { <button type="button" class="emr-button emr-button--outline emr-button--small" (click)="intent.emit({ type: 'groupSelected', groupId: null })">Show all</button> }
          </div>
        </div>
      }

      <ng-template #tiles let-list>
        @for (o of list; track o.id) {
          <li class="tp__item" [class.tp__item--sel]="o.id === model.selectedId">
            <button #tile type="button" class="tp__tile" [attr.data-id]="o.id" [attr.tabindex]="o.id === tabStopId ? 0 : -1"
                    [attr.aria-pressed]="o.id === model.selectedId" [attr.aria-disabled]="model.readOnly ? 'true' : null" [attr.aria-label]="tileName(o)"
                    (click)="select(o)" (keydown)="onKey($event, o.id)">
              <span class="tp__frame"><img [src]="o.imageUrl" [alt]="o.altText ?? o.label" loading="lazy" decoding="async" /></span>
              <span class="tp__label" [attr.title]="o.label">{{ o.label }}</span>
              @if (o.badges?.length) { <span class="tp__badges">@for (b of o.badges; track b) { <span class="tp__badge">{{ b }}</span> }</span> }
            </button>
            @if (o.id === model.selectedId) { <span class="tp__check" aria-hidden="true"><ng-icon name="heroCheck" /></span> }
            @if (canEditFavourites()) {
              <button type="button" class="tp__star" [attr.data-star]="o.id" [attr.tabindex]="o.id === tabStopId ? 0 : -1"
                      [attr.aria-pressed]="isFavourite(o.id)" [attr.aria-label]="(isFavourite(o.id) ? 'Remove ' : 'Add ') + o.label + (isFavourite(o.id) ? ' from favourites' : ' to favourites')"
                      (click)="toggleFavourite(o.id)">
                <span class="tp__star-bg"><ng-icon [name]="isFavourite(o.id) ? 'heroStarSolid' : 'heroStar'" aria-hidden="true" /></span>
              </button>
            }
          </li>
        }
      </ng-template>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);min-width:0}
    .tp{display:grid;gap:12px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;min-width:0}
    .tp__head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .tp__title{min-width:0}
    .tp__name{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .tp__total{margin:2px 0 0;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .tp__search{position:relative}
    .tp__glass{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--emr-text-muted);pointer-events:none;font-size:1.125rem}
    .tp__input{padding-left:38px}
    .tp__chips{display:flex;flex-wrap:wrap;gap:6px;padding:3px;margin:-3px;max-height:calc(3 * var(--emr-control-height) + 18px);overflow-y:auto}
    .tp__chip{display:inline-flex;align-items:center;gap:6px;min-height:var(--emr-control-height);padding:0 12px;border:1px solid var(--emr-border);border-radius:999px;background:var(--emr-surface);color:var(--emr-text);font:inherit;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium);cursor:pointer;white-space:nowrap}
    .tp__chip:hover{background:var(--emr-surface-raised)}
    .tp__chip[aria-pressed="true"]{background:var(--emr-primary-soft);border-color:var(--emr-primary);box-shadow:inset 0 0 0 1px var(--emr-primary);color:var(--emr-primary-contrast);font-weight:var(--emr-weight-bold)}
    .tp__chip-star,.tp__sub-star{color:var(--emr-warning)}
    .tp__n{color:var(--emr-text-muted);font-weight:var(--emr-weight-regular)}
    .tp__chip[aria-pressed="true"] .tp__n{color:inherit}
    .tp__sec{display:grid;gap:8px}
    .tp__sub{margin:0;display:flex;align-items:center;gap:6px;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold);text-transform:uppercase;letter-spacing:.06em;color:var(--emr-text-muted)}
    .tp__hint{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .tp__grid{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(120px,100%),1fr))}
    .tp__item{position:relative;min-width:0;display:grid}
    .tp__tile{display:grid;grid-template-rows:auto auto 1fr;align-content:start;gap:4px;width:100%;min-height:var(--emr-control-height);padding:6px;text-align:left;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);color:var(--emr-text);font:inherit;cursor:pointer}
    .tp__tile:hover{background:var(--emr-surface-raised)}
    .tp__tile[aria-disabled="true"]{cursor:default}
    .tp__tile[aria-disabled="true"]:hover{background:var(--emr-surface)}
    .tp__item--sel .tp__tile{border-color:var(--emr-primary);box-shadow:0 0 0 1px var(--emr-primary);background:var(--emr-primary-soft)}
    .tp__frame{display:block;aspect-ratio:1/1;background:var(--emr-surface-soft);border-radius:6px;overflow:hidden}
    .tp__frame img{display:block;width:100%;height:100%;object-fit:contain}
    .tp__label{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .tp__badges{display:flex;flex-wrap:wrap;align-content:flex-start;align-items:flex-start;gap:4px}
    .tp__badge{padding:2px 6px;border-radius:999px;background:var(--emr-neutral-soft);color:var(--emr-text);font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);line-height:1}
    .tp__check{position:absolute;top:10px;left:10px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--emr-primary-soft);color:var(--emr-primary-contrast);border:2px solid var(--emr-primary);font-size:.875rem;pointer-events:none}
    .tp__star{position:absolute;top:2px;right:2px;display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;background:transparent;color:var(--emr-text);cursor:pointer}
    .tp__star-bg{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--emr-surface);border:1px solid var(--emr-border);font-size:1rem}
    .tp__star:hover .tp__star-bg{background:var(--emr-surface-raised)}
    .tp__star[aria-pressed="true"] .tp__star-bg{color:var(--emr-warning);border-color:var(--emr-warning);background:var(--emr-warning-soft)}
    .tp__tile:focus-visible,.tp__star:focus-visible,.tp__chip:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .tp__empty{gap:8px;min-height:120px}
    .tp__empty-msg{margin:0}
    .tp__empty-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
    @media(max-width:480px){.tp{padding:12px}}
    @media print{:host{display:none}.tp__chips{max-height:none;overflow:visible}}
  `],
})
export class EmrImageTemplatePickerComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) model!: ImageTemplatePickerViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<ImageTemplatePickerIntent>();

  @ViewChildren('tile') private readonly tileRefs!: QueryList<ElementRef<HTMLButtonElement>>;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly uid = `emr-tpl-${++nextPickerId}`;
  protected readonly favouritesId = FAVOURITES_GROUP_ID;

  /** Roving tab stop (focus bookkeeping only). */
  private activeId?: string;
  /** After starring, the tile jumps sections and is re-created: restore focus to its star once the model changes. */
  private refocusStarId?: string;
  private refocusReady = false;
  private cache?: PickerView;

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }

  ngOnChanges(): void { if (this.refocusStarId) this.refocusReady = true; }

  ngAfterViewChecked(): void {
    if (!this.refocusStarId || !this.refocusReady) return;
    const id = this.refocusStarId;
    this.refocusStarId = undefined;
    this.refocusReady = false;
    this.starEl(id)?.focus();
  }

  protected get v(): PickerView {
    if (this.cache?.model === this.model) return this.cache;
    const options = this.model.options;
    const byId = new Map(options.map((o) => [o.id, o]));
    const favs = (this.model.favouriteIds ?? []).flatMap((id) => { const o = byId.get(id); return o ? [o] : []; });
    const favSet = new Set(favs.map((o) => o.id));
    const rest = options.filter((o) => !favSet.has(o.id));
    return (this.cache = { model: this.model, favs, rest, flat: [...favs, ...rest] });
  }

  protected get tabStopId(): string | undefined {
    const flat = this.v.flat;
    const pick = (id?: string) => (id && flat.some((o) => o.id === id) ? id : undefined);
    return pick(this.activeId) ?? pick(this.model.selectedId) ?? flat[0]?.id;
  }

  protected canEditFavourites(): boolean { return !!this.model.canEditFavourites && !this.model.readOnly; }
  protected showFavouritesChip(): boolean { return !!this.model.favouriteIds?.length || this.canEditFavourites(); }
  protected showHint(): boolean { return this.canEditFavourites() && !this.model.favouriteIds?.length; }
  protected isFavourite(id: string): boolean { return !!this.model.favouriteIds?.includes(id); }

  protected tileName(o: ImageTemplateOption): string { return o.badges?.length ? `${o.label}, ${o.badges.join(', ')}` : o.label; }

  protected onQuery(event: Event): void {
    this.intent.emit({ type: 'queryChangeRequested', query: (event.target as HTMLInputElement).value });
  }

  protected select(o: ImageTemplateOption): void {
    if (!this.model.readOnly) this.intent.emit({ type: 'templateSelected', templateId: o.id });
  }

  protected toggleFavourite(id: string): void {
    this.refocusStarId = id;
    this.refocusReady = false;
    this.intent.emit({ type: 'favouriteToggleRequested', templateId: id, favourite: !this.isFavourite(id) });
  }

  protected onFocusIn(event: FocusEvent): void {
    const el = event.target as HTMLElement;
    if (el.dataset['id']) this.activeId = el.dataset['id'];
    else if (el.dataset['star']) this.activeId = el.dataset['star'];
    // Focus moving anywhere else cancels a pending star refocus.
    if (this.refocusStarId && el.dataset['star'] !== this.refocusStarId) this.refocusStarId = undefined;
  }

  private tileEl(id: string): HTMLButtonElement | undefined { return this.tileRefs.find((r) => r.nativeElement.dataset['id'] === id)?.nativeElement; }
  private starEl(id: string): HTMLButtonElement | undefined {
    return [...this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.tp__star')].find((b) => b.dataset['star'] === id);
  }

  /** Columns in the row of the focused tile's own grid, measured from layout so it tracks the auto-fill width. */
  private columns(from: HTMLElement): number {
    const tiles = [...(from.closest('ul')?.querySelectorAll<HTMLElement>('.tp__item') ?? [])];
    const top = tiles[0]?.offsetTop;
    return Math.max(1, tiles.filter((t) => t.offsetTop === top).length);
  }

  protected onKey(event: KeyboardEvent, id: string): void {
    const { favs, flat } = this.v;
    const i = flat.findIndex((o) => o.id === id);
    if (i < 0) return;
    const F = favs.length;
    const cols = this.columns(event.currentTarget as HTMLElement);
    let t = i;
    switch (event.key) {
      case 'ArrowRight': t = Math.min(i + 1, flat.length - 1); break;
      case 'ArrowLeft': t = Math.max(i - 1, 0); break;
      case 'Home': t = 0; break;
      case 'End': t = flat.length - 1; break;
      case 'ArrowDown':
        if (i < F) t = i + cols < F ? i + cols : F < flat.length ? F + Math.min(i % cols, flat.length - F - 1) : i;
        else t = i + cols < flat.length ? i + cols : i;
        break;
      case 'ArrowUp':
        if (i >= F && i - cols < F) t = F ? Math.min(Math.floor((F - 1) / cols) * cols + ((i - F) % cols), F - 1) : i;
        else t = i - cols >= 0 ? i - cols : i;
        break;
      default: return;
    }
    event.preventDefault();
    this.activeId = flat[t].id;
    this.tileEl(flat[t].id)?.focus();
  }
}
