import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroFolderOpen, heroClipboardDocumentList } from '@ng-icons/heroicons/outline';
import { HierarchyNode, HierarchyOrderIntent, HierarchyOrderViewModel } from '@drguptavivek/emr-controller';
import { EmrOrderDetailsComponent, OrderDetailChange } from './emr-order-details.component';

@Component({
  selector: 'emr-hierarchy-order-picker',
  standalone: true,
  imports: [NgIcon, NgTemplateOutlet, EmrOrderDetailsComponent],
  providers: [...provideIcons({ heroFolderOpen, heroClipboardDocumentList })],
  template: `
    <section class="emr-order-layout" [attr.aria-label]="model.title">
      <div class="emr-panel">
        <div class="emr-panel__header"><ng-icon class="emr-card-header-icon" name="heroFolderOpen" aria-hidden="true" /><h2 class="emr-panel__title">{{ model.title }}</h2></div>
        <div class="emr-panel__body">
          <div class="emr-patient-list__toolbar" role="search">
            <input class="emr-search-input" type="search" [value]="model.query" aria-label="Search order catalogue" placeholder="Search by test name or code"
              (input)="emit({ type: 'queryChanged', query: inputValue($event) })" (keydown.enter)="emit({ type: 'searchRequested' })" />
            <button class="emr-button" type="button" [disabled]="model.loading" (click)="emit({ type: 'searchRequested' })">Search</button>
          </div>
          @if (model.error) { <div class="emr-alert emr-tone-danger" role="alert"><div>{{ model.error }} <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="emit({ type: 'retryRequested' })">Retry</button></div></div> }
          @if (model.loading && model.roots.length === 0) { <div class="emr-empty">Loading catalogue…</div> }
          @if (!model.loading && model.roots.length === 0) { <div class="emr-empty">No catalogue items found.</div> }
          <ng-template #tree let-nodes>
            <ul class="emr-tree">
              @for (node of nodes; track node.id) {
                <li>
                  <div class="emr-tree__row">
                    @if (node.kind === 'group') {
                      <button class="emr-icon-button" type="button" [attr.aria-label]="(node.expanded ? 'Collapse ' : 'Expand ') + node.label"
                        [attr.aria-expanded]="node.expanded" (click)="emit({ type: 'nodeExpansionRequested', nodeId: node.id, expanded: !node.expanded })">{{ node.expanded ? '−' : '+' }}</button>
                    } @else { <span class="emr-nav-button__icon" aria-hidden="true">•</span> }
                    <span class="emr-tree__label"><strong>{{ node.label }}</strong>@if (node.code) { <span class="emr-field__hint"> {{ node.code }}</span> }</span>
                    @if (node.selectable && node.kind === 'group') {
                      <button class="emr-button emr-button--small emr-button--outline" type="button" [disabled]="node.disabled" (click)="emit({ type: 'groupPreviewRequested', nodeId: node.id })">Preview group</button>
                    }
                    @if (node.selectable && node.kind === 'item') {
                      <button class="emr-button emr-button--small emr-button--outline" type="button" [disabled]="node.disabled" (click)="emit({ type: 'itemAddRequested', nodeId: node.id })">Add</button>
                    }
                  </div>
                  @if (node.expanded && node.children?.length) { <ng-container *ngTemplateOutlet="tree; context: { $implicit: node.children }" /> }
                </li>
              }
            </ul>
          </ng-template>
          <ng-container *ngTemplateOutlet="tree; context: { $implicit: model.roots }" />
          @if (model.preview) {
            <section class="emr-preview" aria-labelledby="emr-order-preview-title">
              <strong id="emr-order-preview-title">Add {{ model.preview.groupLabel }}?</strong>
              <div>{{ model.preview.items.length }} items will be considered; {{ model.preview.duplicateIds.length }} already selected.</div>
              <ul>@for (item of model.preview.items; track item.catalogueId) { <li>{{ item.label }} @if (item.code) { ({{ item.code }}) }</li> }</ul>
              <div class="emr-chip-row">
                <button class="emr-button emr-button--small" type="button" (click)="emit({ type: 'groupAddConfirmed', groupId: model.preview.groupId })">Add group</button>
                <button class="emr-button emr-button--small emr-button--secondary" type="button" (click)="emit({ type: 'groupPreviewDismissed' })">Cancel</button>
              </div>
            </section>
          }
        </div>
      </div>
      <div class="emr-panel">
        <div class="emr-panel__header"><ng-icon class="emr-card-header-icon" name="heroClipboardDocumentList" aria-hidden="true" /><h2 class="emr-panel__title">Selected orders</h2><span class="emr-badge emr-tone-neutral">{{ model.selected.length }}</span></div>
        <div class="emr-panel__body">
          @if (model.selected.length === 0) { <div class="emr-empty">Choose an item from the catalogue.</div> }
          @for (order of model.selected; track order.id) {
            <emr-order-details [model]="order" (removeRequested)="emit({ type: 'orderRemoveRequested', orderId: $event })"
              (detailChanged)="detailChanged($event)" />
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrHierarchyOrderPickerComponent {
  @Input({ required: true }) model!: HierarchyOrderViewModel;
  @Output() readonly intent = new EventEmitter<HierarchyOrderIntent>();
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  emit(intent: HierarchyOrderIntent): void { this.intent.emit(intent); }
  detailChanged(change: OrderDetailChange): void { this.emit({ type: 'orderDetailChanged', ...change }); }
  nodeTrack(_: number, node: HierarchyNode): string { return node.id; }
}
