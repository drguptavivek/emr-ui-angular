import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { EmrOption } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-tabs',
  standalone: true,
  template: `
    <div class="emr-tabs" role="tablist" [attr.aria-label]="ariaLabel">
      @for (tab of tabs; track tab.value) {
        <button class="emr-tab" type="button" role="tab" [disabled]="tab.disabled" [attr.aria-selected]="active === tab.value"
          [attr.tabindex]="active === tab.value ? 0 : -1" (click)="tabChanged.emit(tab.value)" (keydown)="onKeydown($event, tab.value)">{{ tab.label }}</button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrTabsComponent {
  @Input() ariaLabel = 'Sections';
  @Input() tabs: readonly EmrOption[] = [];
  @Input() active = '';
  @Output() readonly tabChanged = new EventEmitter<string>();

  onKeydown(event: KeyboardEvent, value: string): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const enabled = this.tabs.filter(tab => !tab.disabled);
    if (!enabled.length) return;
    const current = Math.max(0, enabled.findIndex(tab => tab.value === value));
    const targetIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? enabled.length - 1
        : event.key === 'ArrowRight'
          ? (current + 1) % enabled.length
          : (current - 1 + enabled.length) % enabled.length;
    const target = enabled[targetIndex];
    if (!target) return;
    event.preventDefault();
    this.tabChanged.emit(target.value);
    const tablist = (event.currentTarget as HTMLElement).parentElement;
    const buttons = tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)');
    buttons?.item(targetIndex).focus();
  }
}
