import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { EmrTone, TimelineEvent, TimelineKindDefinition } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-timeline',
  standalone: true,
  template: `
    <div class="emr-timeline" [class.emr-timeline--horizontal]="orientation === 'horizontal'" [class.emr-timeline--vertical]="orientation === 'vertical'"
      role="list" [attr.aria-label]="ariaLabel" (keydown)="handleKeydown($event)">
      @for (event of events; track event.id; let index = $index) {
        <div class="emr-timeline__item" role="listitem">
          <button #eventButton class="emr-timeline__button" type="button" [attr.tabindex]="event.id === selectedId || (!selectedId && index === 0) ? 0 : -1"
            [attr.aria-current]="event.id === selectedId ? 'true' : null" (click)="eventSelected.emit(event.id)">
            <span class="emr-timeline__dot" [class]="'emr-timeline__dot emr-tone-' + toneFor(event.kindId)" aria-hidden="true"></span>
            <span class="emr-timeline__date">{{ event.dateLabel }} · {{ kindLabel(event.kindId) }}</span>
            <span class="emr-timeline__title">{{ event.title }}</span>
            @if (event.summary) { <span class="emr-timeline__summary">{{ event.summary }}</span> }
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrTimelineComponent {
  @Input() ariaLabel = 'Patient encounters';
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical';
  @Input() events: readonly TimelineEvent[] = [];
  @Input() kinds: readonly TimelineKindDefinition[] = [];
  @Input() selectedId = '';
  @Output() readonly eventSelected = new EventEmitter<string>();
  @ViewChildren('eventButton') private buttons!: QueryList<ElementRef<HTMLButtonElement>>;

  kindLabel(id: string): string { return this.kinds.find(kind => kind.id === id)?.label ?? id; }
  toneFor(id: string): EmrTone { return this.kinds.find(kind => kind.id === id)?.tone ?? 'neutral'; }
  handleKeydown(event: KeyboardEvent): void {
    const keys = this.orientation === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    if (![...keys, 'Home', 'End'].includes(event.key)) return;
    const buttons = this.buttons.toArray().map(item => item.nativeElement);
    // Keyboard events bubble from the focused button. Using the event target
    // keeps this component safe for SSR/hydration and avoids a global DOM read.
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    let next = current;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else if (event.key === keys[0]) next = Math.max(0, current - 1);
    else next = Math.min(buttons.length - 1, current + 1);
    buttons[next]?.focus();
  }
}
