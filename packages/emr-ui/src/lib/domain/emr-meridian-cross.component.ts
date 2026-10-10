import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { ClinicalAssessmentStatus, CrossMeridian, MeridianCrossEye, MeridianCrossIntent, MeridianCrossViewModel } from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';

let nextMeridianCrossId = 0;

const STATUS_TEXT: Record<Exclude<ClinicalAssessmentStatus, 'recorded'>, string> = {
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown'
};

/** Drawing geometry in SVG user units (viewBox 0 0 300 240). Presentation only: no clinical value is computed. */
const CX = 150;
const CY = 120;
const HALF = 74;
const LABEL_OFFSET = 84;
const r2 = (n: number): number => Math.round(n * 100) / 100;

interface DrawnMeridian { x1: number; y1: number; x2: number; y2: number; lx: number; ly: number; anchor: string; dy: string; text: string; ax: number; ay: number; axisAnchor: string; axisDy: string; axisText: string }

@Component({
  selector: 'emr-meridian-cross',
  standalone: true,
  imports: [EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc" [attr.aria-labelledby]="titleId()" [attr.aria-describedby]="summaryId()">
      <header class="mc__head">
        <p class="mc__eyebrow">{{ model.kind === 'retinoscopy' ? 'Retinoscopy cross' : 'Optical cross' }}</p>
        <h3 class="mc__title" [id]="titleId()">{{ model.title }}</h3>
        <p class="emr-sr-only" [id]="summaryId()">{{ model.summaryText }}</p>
      </header>

      <div class="mc__eyes" [style.--mc-cols]="model.eyes.length > 1 ? 2 : 1">
        @for (eye of model.eyes; track eye.eyeId) {
          <article class="mc__eye" [attr.aria-labelledby]="eyeId(eye)">
            <div class="mc__eye-head">
              @if (model.readOnly) {
                <h4 class="mc__eye-name" [id]="eyeId(eye)"><span class="mc__side">{{ eye.shortLabel }}</span> {{ eye.label }}</h4>
              } @else {
                <h4 class="mc__eye-name" [id]="eyeId(eye)">
                  <button type="button" class="mc__pick" (click)="intent.emit({ type: 'eyeSelected', eyeId: eye.eyeId })"><span class="mc__side">{{ eye.shortLabel }}</span> {{ eye.label }}</button>
                </h4>
                <button type="button" class="emr-button emr-button--outline emr-button--small mc__edit" (click)="intent.emit({ type: 'editRequested', eyeId: eye.eyeId })">Edit<span class="emr-sr-only"> {{ eye.label }}</span></button>
              }
              @if (eye.flag) { <emr-badge [tone]="eye.flag.tone">{{ eye.flag.label }}@if (eye.flag.assistiveText) { <span class="emr-sr-only"> {{ eye.flag.assistiveText }}</span> }</emr-badge> }
            </div>

            @if (eye.status === 'recorded' && eye.meridians) {
              <svg class="mc__svg" viewBox="0 0 300 240" role="img" [attr.aria-labelledby]="svgTitleId(eye)" focusable="false">
                <title [id]="svgTitleId(eye)">{{ eye.label }}: {{ spoken(eye) }}</title>
                <circle class="mc__ring" cx="150" cy="120" r="74" />
                @for (m of drawn(eye); track $index) {
                  <line class="mc__line" [attr.x1]="m.x1" [attr.y1]="m.y1" [attr.x2]="m.x2" [attr.y2]="m.y2" />
                  <text class="mc__pow" [attr.x]="m.lx" [attr.y]="m.ly" [attr.text-anchor]="m.anchor" [attr.dy]="m.dy">{{ m.text }}</text>
                  <text class="mc__axis" aria-hidden="true" [attr.x]="m.ax" [attr.y]="m.ay" [attr.text-anchor]="m.axisAnchor" [attr.dy]="m.axisDy">{{ m.axisText }}</text>
                }
                <circle class="mc__dot" cx="150" cy="120" r="3.5" />
              </svg>
            } @else {
              <p class="mc__state" [class.mc__state--missing]="eye.status === 'recorded'">
                @if (eye.status === 'recorded') { Not supplied } @else { {{ statusText(eye.status) }} }
              </p>
            }

            @if (eye.captionLines?.length) {
              <ul class="mc__caps">@for (line of eye.captionLines; track $index) { <li>{{ line }}</li> }</ul>
            }
          </article>
        }
      </div>

      <p class="mc__foot">
        @if (model.kind === 'retinoscopy') {
          Retinoscopy cross: values are shown as supplied; working distance and gross or net are stated in each eye's captions. Axes follow the TABO convention as the examiner sees the eye.
        } @else {
          Optical cross: powers are shown as supplied, each at the end of its meridian. Axes follow the TABO convention as the examiner sees the eye: 0° at the viewer's right, counter-clockwise.
        }
      </p>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .mc{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;display:grid;gap:12px;break-inside:avoid}
    .mc__eyebrow{margin:0 0 2px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);letter-spacing:.08em;text-transform:uppercase}
    .mc__title{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .mc__eyes{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
    .mc__eye{border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-soft);padding:8px 12px 12px;display:flex;flex-direction:column;gap:8px;min-width:0}
    .mc__eye-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:var(--emr-control-height)}
    .mc__eye-name{margin:0;flex:1;min-width:0;font-size:var(--emr-text-lg);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .mc__side{display:inline-block;min-width:2.25rem;margin-right:4px;padding:2px 6px;border-radius:6px;border:1px solid var(--emr-primary-border);background:var(--emr-primary-soft);color:var(--emr-primary-contrast);font-family:var(--emr-font-mono);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold);text-align:center}
    .mc__pick{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:0;min-height:var(--emr-control-height);cursor:pointer;font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .mc__pick:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px;border-radius:6px}
    .mc__svg{display:block;width:100%;max-width:340px;height:auto;margin-inline:auto}
    .mc__ring{fill:none;stroke:var(--emr-border);stroke-width:1.5;stroke-dasharray:3 4}
    .mc__line{stroke:var(--emr-text);stroke-width:3;stroke-linecap:round}
    .mc__dot{fill:var(--emr-text)}
    .mc__pow{fill:var(--emr-text);font-family:var(--emr-font-mono);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}.mc__axis{fill:var(--emr-text);font-weight:var(--emr-weight-regular);font-family:var(--emr-font-mono);font-size:var(--emr-text-sm)}
    .mc__state{margin:0;display:grid;place-items:center;min-height:180px;border:1px dashed var(--emr-border);border-radius:8px;text-align:center;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold);padding:8px}
    .mc__state--missing{color:var(--emr-text-muted);font-weight:var(--emr-weight-regular)}
    .mc__caps{margin:0;padding:0;list-style:none;display:grid;gap:2px;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .mc__foot{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-xs)}
    @media(min-width:560px){.mc__eyes{grid-template-columns:repeat(var(--mc-cols),minmax(0,1fr))}}
    @media(max-width:480px){.mc{padding:12px}}
    @media print{.mc__edit{display:none}}
  `],
})
export class EmrMeridianCrossComponent {
  @Input({ required: true }) model!: MeridianCrossViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<MeridianCrossIntent>();

  private readonly uid = `emr-mc-${++nextMeridianCrossId}`;

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }
  summaryId(): string { return `${this.uid}-summary`; }
  eyeId(eye: MeridianCrossEye): string { return `${this.uid}-eye-${eye.eyeId}`; }
  svgTitleId(eye: MeridianCrossEye): string { return `${this.uid}-svg-${eye.eyeId}`; }

  statusText(status: ClinicalAssessmentStatus): string {
    return status === 'recorded' ? '' : STATUS_TEXT[status];
  }

  spoken(eye: MeridianCrossEye): string {
    return (eye.meridians ?? []).map((m) => m.assistiveLabel).join('; ');
  }

  /** TABO: 0 degrees to the viewer's right, counter-clockwise; SVG y points down, hence the minus on sine. */
  drawn(eye: MeridianCrossEye): DrawnMeridian[] {
    return (eye.meridians ?? []).map((m: CrossMeridian) => {
      const rad = (m.axisDeg * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      return {
        x1: r2(CX - c * HALF), y1: r2(CY + s * HALF),
        x2: r2(CX + c * HALF), y2: r2(CY - s * HALF),
        lx: r2(CX + c * LABEL_OFFSET), ly: r2(CY - s * LABEL_OFFSET),
        anchor: c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle',
        dy: s > 0.7 ? '-0.2em' : s < -0.7 ? '0.9em' : '0.35em',
        text: m.powerLabel,
        // The supplied axis, printed at the opposite end of the same meridian (formatting only).
        ax: r2(CX - c * LABEL_OFFSET), ay: r2(CY + s * LABEL_OFFSET),
        axisAnchor: c > 0.3 ? 'end' : c < -0.3 ? 'start' : 'middle',
        axisDy: s > 0.7 ? '0.9em' : s < -0.7 ? '-0.2em' : '0.35em',
        axisText: `${m.axisDeg}°`
      };
    });
  }
}
