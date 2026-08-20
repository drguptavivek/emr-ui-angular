import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroStar } from '@ng-icons/heroicons/outline';
import { EmrOption, FavouriteKind, FavouritesIntent, FavouritesViewModel, SelectedOrder } from '@drguptavivek/emr-controller';
import { EmrTextInputComponent } from '../primitives/emr-inputs.component';
import { EmrTabsComponent } from '../primitives/emr-tabs.component';

@Component({
  selector: 'emr-favourites-panel',
  standalone: true,
  imports: [EmrTabsComponent, EmrTextInputComponent, NgIcon],
  providers: [...provideIcons({ heroStar })],
  template: `
    @if (state.mode === 'list') {
      <emr-tabs ariaLabel="Favourite categories" [tabs]="tabs" [active]="state.activeKind" (tabChanged)="tabChanged($event)" />
      <div class="emr-favourites__toolbar">
        <input class="emr-search-input" type="search" aria-label="Search favourites" placeholder="Search favourites" [value]="state.query"
          (input)="emit({ type: 'queryChanged', query: inputValue($event) })" />
        <button class="emr-button" type="button" (click)="emit({ type: 'createRequested', kind: state.activeKind })">New</button>
      </div>
      @if (state.error) { <div class="emr-alert emr-tone-danger" role="alert"><div>{{ state.error }} <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="emit({ type: 'retryRequested' })">Retry</button></div></div> }
      @if (state.loading && state.items.length === 0) { <div class="emr-empty">Loading favourites…</div> }
      @if (!state.loading && state.items.length === 0) { <div class="emr-empty">No favourites in this category.</div> }
      @for (item of state.items; track item.id; let first = $first; let last = $last) {
        <article class="emr-favourite-card">
          <div class="emr-favourite-card__header"><ng-icon class="emr-card-header-icon" name="heroStar" aria-hidden="true" /><div class="emr-favourite-card__name">{{ item.name }}</div><span class="emr-badge emr-tone-neutral">{{ item.orderTemplates.length }}</span></div>
          @if (item.summary) { <div class="emr-favourite-card__summary">{{ item.summary }}</div> }
          <div class="emr-favourite-card__actions">
            <button class="emr-button emr-button--small" type="button" (click)="emit({ type: 'applyRequested', id: item.id })">Apply</button>
            <button class="emr-button emr-button--small emr-button--secondary" type="button" (click)="emit({ type: 'editRequested', id: item.id })">Edit</button>
            <button class="emr-button emr-button--small emr-button--ghost" type="button" [disabled]="first" (click)="emit({ type: 'moveRequested', id: item.id, direction: 'up' })">Move up</button>
            <button class="emr-button emr-button--small emr-button--ghost" type="button" [disabled]="last" (click)="emit({ type: 'moveRequested', id: item.id, direction: 'down' })">Move down</button>
            <button class="emr-button emr-button--small emr-button--danger" type="button" (click)="emit({ type: 'deleteRequested', id: item.id })">Delete</button>
          </div>
        </article>
      }
    }

    @if (state.mode === 'editor' && state.editor) {
      <div class="emr-stack">
        <button class="emr-button emr-button--small emr-button--ghost" type="button" (click)="emit({ type: 'backRequested' })">Back to favourites</button>
        <h3>{{ state.items.some(item => item.id === state.editor?.id) ? 'Edit favourite' : 'New favourite' }}</h3>
        <emr-text-input inputId="emr-favourite-name" label="Favourite name" [value]="state.editor.name"
          [error]="state.error ?? ''" (valueChange)="emit({ type: 'editorNameChanged', name: $event })" />
        <div>
          <strong>Included orders</strong>
          @if (state.editor.orderTemplates.length === 0) { <div class="emr-empty">No order templates included.</div> }
          @for (order of state.editor.orderTemplates; track order.id) {
            <div class="emr-list__item"><div><strong>{{ order.label }}</strong><div class="emr-field__hint">{{ order.kind }}</div></div><button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Remove ' + order.label" (click)="removeEditorOrder(order.id)">Remove</button></div>
          }
        </div>
        <button class="emr-button" type="button" [disabled]="state.loading" (click)="emit({ type: 'saveRequested' })">{{ state.loading ? 'Saving…' : 'Save favourite' }}</button>
      </div>
    }

    @if (state.mode === 'apply-result') {
      <div class="emr-stack">
        <button class="emr-button emr-button--small emr-button--ghost" type="button" (click)="emit({ type: 'backRequested' })">Back to favourites</button>
        <h3>Favourite applied</h3>
        @if (!state.applyIssues?.length) {
          <div class="emr-alert emr-tone-success" role="status"><div>All order templates were resolved successfully.</div></div>
        } @else {
          <div class="emr-alert emr-tone-warning" role="status"><div><strong>Some templates need attention</strong><ul>@for (issue of state.applyIssues; track issue.catalogueId) { <li>{{ issue.label }}: {{ issue.reason }} @if (issue.detail) { — {{ issue.detail }} }</li> }</ul></div></div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrFavouritesPanelComponent {
  @Input({ required: true }) state!: FavouritesViewModel;
  @Output() readonly intent = new EventEmitter<FavouritesIntent>();
  readonly tabs: readonly EmrOption[] = [
    { value: 'medication', label: 'Medications' },
    { value: 'laboratory', label: 'Laboratory' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'combination', label: 'Combinations' }
  ];
  emit(intent: FavouritesIntent): void { this.intent.emit(intent); }
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  tabChanged(kind: string): void { this.emit({ type: 'tabChanged', kind: kind as FavouriteKind }); }
  removeEditorOrder(id: string): void {
    const orders: readonly SelectedOrder[] = this.state.editor?.orderTemplates.filter(order => order.id !== id) ?? [];
    this.emit({ type: 'editorOrdersChanged', orders });
  }
}
