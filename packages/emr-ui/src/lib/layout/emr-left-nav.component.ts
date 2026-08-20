import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NavItem } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-left-nav',
  standalone: true,
  template: `
    <nav class="emr-left-nav" [class.emr-left-nav--collapsed]="collapsed" aria-label="Primary navigation">
      <div class="emr-left-nav__header">
        @if (!collapsed) { <span class="emr-left-nav__title">{{ title }}</span> }
        <button class="emr-icon-button" type="button" [attr.aria-label]="collapsed ? 'Open navigation' : 'Collapse navigation'"
          [attr.aria-expanded]="!collapsed" (click)="collapseToggled.emit(!collapsed)">{{ collapsed ? '›' : '‹' }}</button>
      </div>
      <ng-template #navList let-items let-level="level">
        <ul class="emr-nav-list" [class.emr-nav-children]="level > 0">
          @for (item of items; track item.id) {
            <li>
              <button class="emr-nav-button" type="button" [disabled]="item.disabled" [attr.aria-current]="activeId === item.id ? 'page' : null"
                [attr.aria-expanded]="item.children?.length ? isExpanded(item.id) : null" (click)="activate(item)">
                <span class="emr-nav-button__icon" aria-hidden="true">{{ item.icon || item.label.slice(0, 1) }}</span>
                @if (!collapsed) {
                  <span class="emr-nav-button__label">{{ item.label }}</span>
                  @if (item.badge) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + item.badge.tone">{{ item.badge.label }}</span> }
                  @if (item.children?.length) { <span aria-hidden="true">{{ isExpanded(item.id) ? '⌃' : '⌄' }}</span> }
                }
              </button>
              @if (!collapsed && item.children?.length && isExpanded(item.id)) {
                <ng-container *ngTemplateOutlet="navList; context: { $implicit: item.children, level: level + 1 }" />
              }
            </li>
          }
        </ul>
      </ng-template>
      <ng-container *ngTemplateOutlet="navList; context: { $implicit: items, level: 0 }" />
    </nav>
  `,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrLeftNavComponent {
  @Input() title = 'EMR';
  @Input() items: readonly NavItem[] = [];
  @Input() activeId = '';
  @Input() expandedIds: readonly string[] = [];
  @Input() collapsed = false;
  @Output() readonly collapseToggled = new EventEmitter<boolean>();
  @Output() readonly itemSelected = new EventEmitter<string>();
  @Output() readonly itemExpansionRequested = new EventEmitter<{ id: string; expanded: boolean }>();

  isExpanded(id: string): boolean { return this.expandedIds.includes(id); }
  activate(item: NavItem): void {
    if (item.children?.length) {
      this.itemExpansionRequested.emit({ id: item.id, expanded: !this.isExpanded(item.id) });
    } else {
      this.itemSelected.emit(item.id);
    }
  }
}
