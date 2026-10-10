import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChildren } from '@angular/core';
import type { TimeAxisIntent, TimeAxisTick, TimeAxisViewModel } from '@drguptavivek/emr-controller';

let nextTimeAxisId = 0;

/**
 * Horizontal time scale for inpatient charts. Renders controller-supplied ticks in fixed-width
 * columns so a flowsheet or trend can be stacked underneath and line up: set
 * `--emr-time-axis-col` to the column width below (default 5.5rem, the flowsheet's) and
 * `--emr-time-axis-lead` to the width of any row-header gutter (default 0).
 * Arrow keys, Home and End move between ticks (roving tab stop); Enter, Space or click selects.
 */
@Component({
  selector: 'emr-time-axis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section class="ta" [attr.aria-labelledby]="titleId()">
      <header class="ta__head">
        <h3 class="ta__title" [class.emr-sr-only]="!m.title" [id]="titleId()">{{ m.title || 'Time axis' }}</h3>
        <div class="ta__controls">
          @if (!m.readOnly && m.steps?.length) {
            <label class="ta__step">
              <span class="ta__steplabel">Step</span>
              <select class="emr-select" (change)="stepChanged($event)">
                @for (s of m.steps; track s.id) { <option [value]="s.id" [selected]="s.id === m.selectedStepId">{{ s.label }}</option> }
              </select>
            </label>
          } @else if (m.stepLabel) {
            <span class="ta__steplabel">Step: {{ m.stepLabel }}</span>
          }
          @if (!m.readOnly) {
            <button type="button" class="emr-button emr-button--outline emr-button--small" [disabled]="!m.canShiftEarlier"
              (click)="intent.emit({ type: 'shiftEarlierRequested' })"><span aria-hidden="true">‹ </span>Earlier</button>
            <button type="button" class="emr-button emr-button--outline emr-button--small" [disabled]="!m.canShiftLater"
              (click)="intent.emit({ type: 'shiftLaterRequested' })">Later<span aria-hidden="true"> ›</span></button>
          }
        </div>
      </header>

      @if (!m.ticks.length) {
        <p class="ta__empty">No times supplied.</p>
      } @else if (m.readOnly) {
        <div class="ta__scroll" role="region" tabindex="0" [attr.aria-labelledby]="titleId()">
          <ol class="ta__strip">
            @for (t of m.ticks; track t.id) {
              <li class="ta__tick" [class.ta__tick--current]="t.current" [class.ta__tick--selected]="t.id === m.selectedTickId"
                [attr.aria-current]="t.current ? 'time' : null">
                <ng-container *ngTemplateOutlet="tickBody; context: { $implicit: t, selected: t.id === m.selectedTickId }" />
              </li>
            }
          </ol>
        </div>
      } @else {
        <div class="ta__scroll">
          <div class="ta__strip" role="listbox" aria-orientation="horizontal" [attr.aria-labelledby]="titleId()" (keydown)="onKey($event)">
            @for (t of m.ticks; track t.id) {
              <div #tick class="ta__tick ta__tick--option" role="option" [id]="uid + '-' + t.id"
                [class.ta__tick--current]="t.current" [class.ta__tick--selected]="t.id === m.selectedTickId"
                [attr.aria-selected]="t.id === m.selectedTickId ? 'true' : 'false'"
                [attr.aria-current]="t.current ? 'time' : null"
                [attr.tabindex]="t.id === tabStopId() ? 0 : -1"
                (focus)="focusedId.set(t.id)" (click)="select(t)">
                <ng-container *ngTemplateOutlet="tickBody; context: { $implicit: t, selected: false }" />
              </div>
            }
          </div>
        </div>
      }
    </section>

    <ng-template #tickBody let-t let-selected="selected">
      <span class="ta__label">{{ t.label }}</span>
      @if (t.sublabel) { <span class="ta__sub">{{ t.sublabel }}</span> }
      @if (t.current) { <span class="ta__now">Current</span> }
      <!-- Options announce selection via aria-selected; the read-only list says it in words. -->
      @if (selected) { <span class="emr-sr-only">, selected</span> }
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .ta{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;min-width:0}
    .ta__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
    .ta__title{margin:0;font-size:var(--emr-text-lg);line-height:var(--emr-leading-tight)}
    .ta__controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
    .ta__step{display:inline-flex;align-items:center;gap:6px}
    .ta__step .emr-select{width:auto}
    .ta__steplabel{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .ta__empty{margin:0;color:var(--emr-text-muted);font-style:italic;font-size:var(--emr-text-sm)}
    .ta__scroll{overflow-x:auto;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-raised);overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
    .ta__scroll:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .ta__strip{display:flex;width:max-content;margin:0;padding:0 0 0 var(--emr-time-axis-lead, 0px);list-style:none}
    .ta__tick{flex:0 0 var(--emr-time-axis-col, 5.5rem);width:var(--emr-time-axis-col, 5.5rem);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:44px;padding:4px 6px;border-right:1px solid var(--emr-border);text-align:center;font-size:var(--emr-text-xs);line-height:var(--emr-leading-tight)}
    .ta__strip > .ta__tick:first-child{border-left:1px solid var(--emr-border)}
    .ta__tick--option{cursor:pointer}
    .ta__tick--option:hover{background:var(--emr-primary-soft)}
    .ta__tick--option:focus-visible{outline:3px solid var(--emr-focus);outline-offset:-3px}
    .ta__tick--current{box-shadow:inset 3px 0 0 var(--emr-primary);background:var(--emr-primary-soft)}
    .ta__tick--selected{box-shadow:inset 0 0 0 2px var(--emr-primary);background:var(--emr-primary-soft)}
    .ta__tick--current.ta__tick--selected{box-shadow:inset 3px 0 0 var(--emr-primary),inset 0 0 0 2px var(--emr-primary)}
    .ta__label{font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .ta__sub{color:var(--emr-text-muted);overflow-wrap:anywhere}
    .ta__tick--current .ta__sub,.ta__tick--selected .ta__sub{color:var(--emr-text)}
    .ta__now{font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);text-transform:uppercase;letter-spacing:.06em;color:var(--emr-primary)}
    @media print{.ta__controls .emr-button{display:none}.ta__scroll{overflow:visible}}
  `],
})
export class EmrTimeAxisComponent {
  readonly model = input.required<TimeAxisViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<TimeAxisIntent>();

  protected readonly uid = `emr-time-axis-${++nextTimeAxisId}`;
  /** Tick the user last focused; only moves focus, never selection. */
  protected readonly focusedId = signal<string | null>(null);
  private readonly tickEls = viewChildren<ElementRef<HTMLElement>>('tick');

  /** The single tab stop: last focused tick, else the selected one, else "now", else the first. */
  protected readonly tabStopId = computed(() => {
    const { ticks, selectedTickId } = this.model();
    const has = (id: string | null | undefined) => !!id && ticks.some((t) => t.id === id);
    const focused = this.focusedId();
    if (has(focused)) return focused;
    if (has(selectedTickId)) return selectedTickId;
    return ticks.find((t) => t.current)?.id ?? ticks[0]?.id;
  });

  protected titleId(): string { return this.headingId() ?? `${this.uid}-heading`; }

  protected select(tick: TimeAxisTick): void {
    this.intent.emit({ type: 'tickSelected', tickId: tick.id });
  }

  protected stepChanged(event: Event): void {
    this.intent.emit({ type: 'stepChangeRequested', stepId: (event.target as HTMLSelectElement).value });
  }

  protected onKey(event: KeyboardEvent): void {
    const ticks = this.model().ticks;
    const i = ticks.findIndex((t) => t.id === this.tabStopId());
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = Math.min(i + 1, ticks.length - 1); break;
      case 'ArrowLeft': next = Math.max(i - 1, 0); break;
      case 'Home': next = 0; break;
      case 'End': next = ticks.length - 1; break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (i >= 0) this.select(ticks[i]);
        return;
      default: return;
    }
    event.preventDefault();
    this.focusedId.set(ticks[next].id);
    this.tickEls()[next]?.nativeElement.focus();
  }
}
