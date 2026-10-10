import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck } from '@ng-icons/heroicons/outline';
import type { ClinicalAssessmentStatus, GazePosition, MotilityCell, MotilityEye, OcularMotilityIntent, OcularMotilityViewModel } from '@drguptavivek/emr-controller';

let nextMotilityId = 0;

const STATUS_TEXT: Record<Exclude<ClinicalAssessmentStatus, 'recorded'>, string> = {
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown'
};

/** Rows of the 3x3 grid in the order the positions are declared: no mirroring, the supplied label sits in every cell. */
const ROWS: readonly (readonly GazePosition[])[] = [
  ['up-right', 'up', 'up-left'],
  ['right', 'primary', 'left'],
  ['down-right', 'down', 'down-left']
];

@Component({
  selector: 'emr-ocular-motility-chart',
  standalone: true,
  imports: [NgIcon, NgTemplateOutlet],
  providers: [...provideIcons({ heroCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt" [attr.aria-labelledby]="titleId()" [attr.aria-describedby]="summaryId()">
      <header>
        <h3 class="mt__title" [id]="titleId()">{{ model.title }}</h3>
        <p class="emr-sr-only" [id]="summaryId()">{{ model.summaryText }}</p>
      </header>

      <div class="mt__eyes" [style.--mt-cols]="shown().length > 1 ? 2 : 1">
        @for (eye of shown(); track eye.eyeId) {
          <div class="mt__eye">
            <table class="mt__grid">
              <caption class="mt__cap"><span class="mt__side">{{ eye.shortLabel }}</span> {{ eye.label }}</caption>
              <tbody>
                @for (row of rows; track $index) {
                  <tr>
                    @for (pos of row; track pos) {
                      <td>
                        @if (model.readOnly) {
                          <div class="mt__cell" [class.mt__cell--sel]="isSelected(eye, pos)">
                            <ng-container *ngTemplateOutlet="inner; context: { eye: eye, pos: pos }" />
                          </div>
                        } @else {
                          <button type="button" class="mt__cell mt__btn" [class.mt__cell--sel]="isSelected(eye, pos)"
                            [attr.aria-pressed]="isSelected(eye, pos)" [attr.aria-label]="label(eye, pos)"
                            (click)="intent.emit({ type: 'cellSelected', eyeId: eye.eyeId, position: pos })">
                            <ng-container *ngTemplateOutlet="inner; context: { eye: eye, pos: pos }" />
                          </button>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      @if (selectedEye(); as sel) {
        @if (!model.readOnly) {
          <div class="mt__actions">
            <button type="button" class="emr-button emr-button--outline emr-button--small"
              (click)="intent.emit({ type: 'cellEditRequested', eyeId: sel.eye.eyeId, position: sel.position })">Edit {{ sel.eye.label }}, {{ model.positionLabels[sel.position] }}</button>
          </div>
        }
      }
    </section>

    <ng-template #inner let-eye="eye" let-pos="pos">
      <span class="mt__pos">{{ positionLabel(pos) }}</span>
      @if (cell(eye, pos); as c) {
        @if (c.status === 'recorded' && c.valueLabel !== null) {
          <span class="mt__val" [class.mt__val--long]="c.valueLabel.length > 6">{{ c.valueLabel }}</span>
        } @else if (c.status === 'recorded') {
          <span class="mt__state mt__state--missing">Not supplied</span>
        } @else {
          <span class="mt__state">{{ statusText(c.status) }}</span>
        }
        @if (c.badge) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + c.badge.tone">{{ c.badge.label }}@if (c.badge.assistiveText) { <span class="emr-sr-only"> {{ c.badge.assistiveText }}</span> }</span> }
        @if (c.note) { <span class="mt__note">{{ c.note }}</span> }
      } @else {
        <span class="mt__state mt__state--missing">Not supplied</span>
      }
      @if (isSelected(eye, pos)) { <ng-icon class="mt__check" name="heroCheck" aria-hidden="true" /><span class="emr-sr-only">Selected</span> }
    </ng-template>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .mt{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;display:grid;gap:12px;break-inside:avoid}
    .mt__title{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight);overflow-wrap:break-word}
    .mt__eyes{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
    .mt__eye{min-width:0;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-soft);padding:2px}
    .mt__grid{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:6px}
    .mt__grid td{padding:0;vertical-align:top;height:1px}
    .mt__cap{caption-side:top;text-align:left;padding:6px 6px 0;margin-bottom:6px;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold);overflow-wrap:break-word}
    .mt__side{display:inline-block;min-width:2.25rem;margin-right:4px;padding:2px 6px;border-radius:6px;border:1px solid var(--emr-primary-border);background:var(--emr-primary-soft);color:var(--emr-primary-contrast);font-family:var(--emr-font-mono);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold);text-align:center}
    .mt__cell{position:relative;box-sizing:border-box;width:100%;height:100%;min-height:var(--emr-control-height);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:2px;padding:6px 4px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);color:var(--emr-text);font:inherit;text-align:center;min-width:0}
    .mt__btn{cursor:pointer}
    .mt__btn:hover{background:var(--emr-primary-soft)}
    .mt__btn:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .mt__cell--sel{border:3px solid var(--emr-primary);padding:4px 2px;background:var(--emr-primary-soft)}
    .mt__cell--sel .mt__pos,.mt__cell--sel .mt__state--missing,.mt__btn:hover .mt__pos,.mt__btn:hover .mt__state--missing{color:var(--emr-text)}
    .mt__pos{font-size:var(--emr-text-xs);color:var(--emr-text-muted);overflow-wrap:break-word;line-height:var(--emr-leading-tight)}
    .mt__val{font-family:var(--emr-font-mono);font-size:var(--emr-text-xl);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight);overflow-wrap:break-word}
    .mt__val--long{font-family:var(--emr-font-family);font-size:var(--emr-text-md)}
    .mt__state{font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight);overflow-wrap:break-word}
    .mt__state--missing{font-weight:var(--emr-weight-regular);color:var(--emr-text-muted)}
    .mt__note{font-size:var(--emr-text-xs);line-height:var(--emr-leading-tight);overflow-wrap:break-word}
    .mt__check{position:absolute;top:2px;right:2px;width:1rem;height:1rem;color:var(--emr-primary)}
    .mt__cell .emr-badge{height:auto;min-height:0;white-space:normal;text-align:center;padding:2px 6px;font-size:var(--emr-text-xs)}
    .mt__actions{display:flex;flex-wrap:wrap;gap:8px}
    @media(min-width:560px){.mt__eyes{grid-template-columns:repeat(var(--mt-cols),minmax(0,1fr))}}
    @media(max-width:480px){.mt{padding:12px}}
    @media print{.mt__actions{display:none}}
  `],
})
export class EmrOcularMotilityChartComponent {
  @Input({ required: true }) model!: OcularMotilityViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<OcularMotilityIntent>();

  protected readonly rows = ROWS;

  protected positionLabel(pos: GazePosition): string { return this.model.positionLabels[pos]; }
  private readonly uid = `emr-mt-${++nextMotilityId}`;

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }
  summaryId(): string { return `${this.uid}-summary`; }

  /** Binocular layout is one grid, drawn from the first supplied eye entry. */
  shown(): readonly MotilityEye[] { return this.model.layout === 'binocular' ? this.model.eyes.slice(0, 1) : this.model.eyes; }

  cell(eye: MotilityEye, pos: GazePosition): MotilityCell | undefined { return eye.cells[pos]; }

  isSelected(eye: MotilityEye, pos: GazePosition): boolean {
    const s = this.model.selected;
    return !!s && s.eyeId === eye.eyeId && s.position === pos;
  }

  selectedEye(): { eye: MotilityEye; position: GazePosition } | null {
    const s = this.model.selected;
    const eye = s ? this.shown().find((e) => e.eyeId === s.eyeId) : undefined;
    return s && eye ? { eye, position: s.position } : null;
  }

  statusText(status: ClinicalAssessmentStatus): string { return status === 'recorded' ? '' : STATUS_TEXT[status]; }

  /** Accessible name: "<eye> <position>: <value>", plus badge and note when supplied. */
  label(eye: MotilityEye, pos: GazePosition): string {
    const c = eye.cells[pos];
    const value = !c ? 'Not supplied' : c.status !== 'recorded' ? STATUS_TEXT[c.status] : (c.valueLabel ?? 'Not supplied');
    const extra = [c?.badge?.label, c?.badge?.assistiveText, c?.note].filter(Boolean).join(', ');
    return `${eye.label} ${this.model.positionLabels[pos]}: ${value}${extra ? `, ${extra}` : ''}`;
  }
}
