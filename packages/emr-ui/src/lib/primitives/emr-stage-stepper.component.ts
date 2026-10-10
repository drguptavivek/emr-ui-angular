import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import type { EmrBadge } from '@drguptavivek/emr-controller';

export interface EmrStage {
  readonly id: string;
  readonly label: string;
  readonly status?: EmrBadge;
  readonly description?: string;
}

/**
 * Numbered stage navigation. Mechanical: the caller supplies stages, the active id and any
 * status badge; the stepper infers nothing about completion or order validity.
 * Emits `stageSelected` with the stage id. With `readOnly` the stages are plain list items.
 * Roving tabindex: one tab stop (active stage, else first); arrow keys / Home / End move focus.
 */
@Component({
  selector: 'emr-stage-stepper',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <nav class="emr-stage-stepper" [attr.aria-label]="ariaLabel()" [attr.data-orientation]="orientation()">
      <ol class="emr-stage-stepper__list">
        @for (stage of stages(); track stage.id; let index = $index) {
          <li class="emr-stage-stepper__item">
            @if (readOnly()) {
              <span class="emr-stage-stepper__stage" [id]="stageDomId(stage.id)"
                [class.emr-stage-stepper__stage--active]="stage.id === activeId()"
                [attr.aria-current]="stage.id === activeId() ? 'step' : null">
                <ng-container *ngTemplateOutlet="content; context: { $implicit: stage, index: index }" />
              </span>
            } @else {
              <button type="button" class="emr-stage-stepper__stage" [id]="stageDomId(stage.id)"
                [class.emr-stage-stepper__stage--active]="stage.id === activeId()"
                [attr.aria-current]="stage.id === activeId() ? 'step' : null"
                [attr.tabindex]="stage.id === tabStopId() ? 0 : -1"
                (focus)="focusedId.set(stage.id)"
                (keydown)="onKeydown($event, index)"
                (click)="stageSelected.emit(stage.id)">
                <ng-container *ngTemplateOutlet="content; context: { $implicit: stage, index: index }" />
              </button>
            }
          </li>
        }
      </ol>
    </nav>
    <ng-template #content let-stage let-index="index">
      <span class="emr-stage-stepper__number" aria-hidden="true">{{ index + 1 }}</span>
      <span class="emr-stage-stepper__text">
        <span class="emr-stage-stepper__label">{{ stage.label }}</span>
        @if (stage.description) { <span class="emr-stage-stepper__description">{{ stage.description }}</span> }
      </span>
      @if (stage.status; as status) {
        <span class="emr-stage-stepper__badge" [attr.data-tone]="status.tone">
          {{ status.label }}@if (status.assistiveText) { <span class="emr-sr-only"> ({{ status.assistiveText }})</span> }
        </span>
      }
    </ng-template>
  `,
  styles: [`
    emr-stage-stepper { display: block; color: var(--emr-text); }
    .emr-stage-stepper__list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; border: 1px solid var(--emr-border); background: var(--emr-surface-slate); }
    .emr-stage-stepper__item { flex: 1 1 auto; min-width: 0; border-inline-end: 1px solid var(--emr-border); }
    .emr-stage-stepper__item:last-child { border-inline-end: 0; }
    .emr-stage-stepper__stage { box-sizing: border-box; width: 100%; min-height: 44px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; border: 0; background: transparent; color: var(--emr-text); font: inherit; font-size: var(--emr-text-md); text-align: start; }
    button.emr-stage-stepper__stage { cursor: pointer; }
    .emr-stage-stepper__stage--active { background: var(--emr-surface-accent); color: var(--emr-primary); box-shadow: inset 0 -3px var(--emr-primary); }
    .emr-stage-stepper__number { flex: none; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: var(--emr-neutral-soft); color: var(--emr-text); font-size: var(--emr-text-xs); font-weight: 700; }
    .emr-stage-stepper__text { display: flex; flex-direction: column; min-width: 0; overflow-wrap: break-word; }
    .emr-stage-stepper__description { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-stage-stepper__badge { flex: none; margin-inline-start: auto; border-radius: 999px; padding: 4px 9px; font-size: var(--emr-text-xs); background: var(--emr-surface-soft); color: var(--emr-text); }
    .emr-stage-stepper__badge[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); }
    .emr-stage-stepper__badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-stage-stepper__badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-stage-stepper__badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-stage-stepper[data-orientation="vertical"] .emr-stage-stepper__list { flex-direction: column; flex-wrap: nowrap; }
    .emr-stage-stepper[data-orientation="vertical"] .emr-stage-stepper__item { flex: none; border-inline-end: 0; border-bottom: 1px solid var(--emr-border); }
    .emr-stage-stepper[data-orientation="vertical"] .emr-stage-stepper__item:last-child { border-bottom: 0; }
    .emr-stage-stepper__stage:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: -3px; }
    @media (max-width: 640px) { .emr-stage-stepper__item { flex-basis: 100%; border-inline-end: 0; border-bottom: 1px solid var(--emr-border); } .emr-stage-stepper__item:last-child { border-bottom: 0; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrStageStepperComponent {
  readonly stages = input.required<readonly EmrStage[]>();
  readonly activeId = input<string | undefined>(undefined);
  readonly ariaLabel = input('Stages');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly readOnly = input(false);
  readonly idPrefix = input<string | undefined>(undefined);
  readonly stageSelected = output<string>();

  protected readonly focusedId = signal<string | undefined>(undefined);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // One tab stop: last focused stage, else the active one, else the first.
  protected readonly tabStopId = computed(() => {
    const ids = this.stages().map(stage => stage.id);
    const pick = [this.focusedId(), this.activeId()].find(id => id !== undefined && ids.includes(id));
    return pick ?? ids[0];
  });

  private static nextId = 0;
  private readonly fallbackPrefix = `emr-stage-stepper-${EmrStageStepperComponent.nextId++}`;

  protected stageDomId(id: string): string { return `${this.idPrefix() ?? this.fallbackPrefix}-${id}`; }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const last = this.stages().length - 1;
    const delta: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let target: number;
    if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = last;
    else if (event.key in delta) target = Math.min(last, Math.max(0, index + delta[event.key]));
    else return;
    event.preventDefault();
    this.host.nativeElement.querySelectorAll<HTMLElement>('button.emr-stage-stepper__stage')[target]?.focus();
  }
}
