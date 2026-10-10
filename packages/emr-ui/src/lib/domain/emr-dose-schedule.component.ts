import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { DoseForm, DoseScheduleIntent, DoseScheduleViewModel, DoseSlot } from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrButtonComponent } from '../primitives/emr-button.component';

let nextDoseScheduleId = 0;

/** Forms whose amounts are counted items, so quarter fractions read naturally as ¼ ½ ¾. */
const COUNTED: readonly DoseForm[] = ['tablet', 'capsule', 'suppository', 'sachet', 'patch'];
const GLYPH: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
const FRACTION_ICON: Record<number, string> = { 0.25: 'tablet-quarter', 0.5: 'tablet-half', 0.75: 'tablet-three' };
const WHOLE = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const FRACTION_WORD: Record<number, string> = { 0.25: 'a quarter', 0.5: 'half', 0.75: 'three quarters' };

@Component({
  selector: 'emr-dose-schedule',
  standalone: true,
  imports: [EmrBadgeComponent, EmrButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ds" [attr.aria-labelledby]="titleId()">
      <header class="ds__head">
        <div class="ds__title">
          <p class="ds__eyebrow">{{ model.medication.formLabel }}</p>
          <h3 class="ds__name" [id]="titleId()">{{ model.medication.label }}@if (model.medication.strength) { <span class="ds__strength"> {{ model.medication.strength }}</span> }</h3>
        </div>
        @if (model.status) { <emr-badge [tone]="model.status.tone">{{ model.status.label }}@if (model.status.assistiveText) { <span class="emr-sr-only"> {{ model.status.assistiveText }}</span> }</emr-badge> }
      </header>

      <div class="ds__when">
        <span class="ds__freq">{{ model.frequency.label }}@if (showFrequencyCode) { <span class="ds__code"> ({{ model.frequency.code }})</span> }</span>
        @if (notation(model.slots); as n) {
          <span class="ds__notation"><span aria-hidden="true">{{ n }}</span><span class="emr-sr-only">Dose pattern: {{ sentence(model.slots) }}.</span></span>
        }
      </div>

      @if (model.site) {
        <p class="ds__site"><span class="ds__site-key">Site</span> <strong>{{ model.site.label }}@if (model.site.code) { ({{ model.site.code }}) }</strong></p>
      }

      @if (model.prn) {
        <p class="ds__prn"><strong>{{ model.prn.label }}</strong>@if (model.prn.maxLabel) { <span class="ds__max"> {{ model.prn.maxLabel }}</span> }</p>
      }

      @if (model.slots.length) {
        <dl class="ds__grid" [style.--ds-cols]="model.slots.length" [class.ds__grid--many]="model.slots.length > 3">
          @for (slot of model.slots; track slot.id) {
            <div class="ds__cell" [class.ds__cell--none]="isNone(slot)">
              <dt class="ds__slot">{{ slot.label }}@if (slot.timeHint) { <span class="ds__time">{{ slot.timeHint }}</span> }</dt>
              <dd class="ds__amount">
                @if (isNone(slot)) {
                  <span class="ds__dash" aria-hidden="true">—</span><span class="emr-sr-only">none</span>
                } @else {
                  <span class="ds__icons" aria-hidden="true">@for (ic of icons(slot); track $index) { <svg class="ds__icon" viewBox="0 0 24 24" focusable="false">@switch (ic) {
                    @case ('tablet') { <circle cx="12" cy="12" r="9" class="f"/><path d="M5 12h14"/> }
                    @case ('tablet-half') { <path d="M3 16a9 9 0 0 1 18 0z" class="f"/> }
                    @case ('tablet-quarter') { <path d="M5 20V6a14 14 0 0 1 14 14z" class="f"/> }
                    @case ('tablet-three') { <path d="M12 12V3a9 9 0 1 1-9 9z" class="f"/> }
                    @case ('capsule') { <rect x="2" y="8" width="20" height="8" rx="4" class="f"/><path d="M12 8v8"/> }
                    @case ('drop') { <path d="M12 3c3.5 4.5 6 7.5 6 10.5a6 6 0 0 1-12 0C6 10.5 8.5 7.5 12 3z" class="f"/> }
                    @case ('tube') { <path d="M7 3h10v3H7zM7 6h10l-2 13H9zM10 19h4v3h-4z" class="f"/> }
                    @case ('spoon') { <ellipse cx="9" cy="9" rx="6" ry="4" transform="rotate(-45 9 9)" class="f"/><path d="M13 13l7 7"/> }
                    @case ('spray') { <path d="M9 10h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM11 10V6h4v4M15 6h-6M4 5l2 1M4 9l2-.5M3 13l2.5-1" class="f"/> }
                    @case ('inhaler') { <path d="M7 3h6v13H7zM7 13h11a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" class="f"/> }
                    @case ('syringe') { <path d="M15 4l5 5M13 6l5 5-8 8H5v-5zM3 21l3-3" class="f"/> }
                    @case ('patch') { <rect x="4" y="4" width="16" height="16" rx="4" class="f"/><rect x="9" y="9" width="6" height="6" rx="1"/> }
                    @case ('sachet') { <path d="M5 3h14v18H5zM5 6h14M5 18h14" class="f"/> }
                    @case ('suppository') { <path d="M4 12c0-3 4-6 10-6l6 6-6 6c-6 0-10-3-10-6z" class="f"/> }
                  }</svg> }</span>
                  @if (slot.amountLabel) {
                    <span class="ds__label">{{ slot.amountLabel }}</span>
                  } @else {
                    <span class="ds__num">{{ format(slot.amount) }}</span>
                    @if (unitText(slot.amount); as u) { <span class="ds__unit">{{ u }}</span> }
                    @if (word(slot.amount); as w) { <span class="ds__word">{{ w }}</span> }
                  }
                  @if (slot.householdLabel) { <span class="ds__house">{{ slot.householdLabel }}</span> }
                }
              </dd>
            </div>
          }
        </dl>
      }

      @if (hasMeta()) {
        <dl class="ds__meta">
          @if (model.route) { <div><dt>Route</dt><dd>{{ model.route }}</dd></div> }
          @if (model.foodRelation) { <div><dt>Food</dt><dd>{{ model.foodRelation }}</dd></div> }
          @if (model.duration) { <div><dt>Duration</dt><dd>{{ model.duration }}</dd></div> }
          @if (model.startLabel) { <div><dt>Start</dt><dd>{{ model.startLabel }}</dd></div> }
        </dl>
      }

      @if (model.taper?.length) {
        <div class="ds__taper-wrap">
          <table class="ds__taper">
            <caption>Reducing schedule</caption>
            <thead><tr><th scope="col">Period</th><th scope="col">How often</th>@if (taperHasPattern()) { <th scope="col">Dose pattern</th> }</tr></thead>
            <tbody>
              @for (step of model.taper; track step.id) {
                <tr>
                  <th scope="row">{{ step.periodLabel }}</th>
                  <td>{{ step.frequencyLabel }}</td>
                  @if (taperHasPattern()) { <td class="ds__pat">@if (step.slots && notation(step.slots); as n) { <span aria-hidden="true">{{ n }}</span><span class="emr-sr-only">{{ sentence(step.slots) }}</span> } @else { <span aria-hidden="true">—</span><span class="emr-sr-only">not given</span> }</td> }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (model.separationNote) { <p class="ds__note" role="note">{{ model.separationNote }}</p> }

      @if (model.instructions?.length) {
        <ul class="ds__instr">@for (line of model.instructions; track $index) { <li>{{ line }}</li> }</ul>
      }

      @if (!model.readOnly && (model.canEdit || model.canShowInstructions)) {
        <div class="ds__actions">
          @if (model.canShowInstructions) { <emr-button variant="outline" (clicked)="intent.emit({ type: 'instructionsRequested' })">Show instructions</emr-button> }
          @if (model.canEdit) { <emr-button variant="secondary" (clicked)="intent.emit({ type: 'editRequested' })">Edit schedule</emr-button> }
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .ds{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;display:grid;gap:12px;break-inside:avoid}
    .ds__head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .ds__title{min-width:0}
    .ds__eyebrow{margin:0 0 2px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);letter-spacing:.08em;text-transform:uppercase}
    .ds__name{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .ds__strength{font-weight:var(--emr-weight-regular);color:var(--emr-text-muted)}
    .ds__when{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px}
    .ds__freq{font-size:var(--emr-text-xl);font-weight:var(--emr-weight-bold)}
    .ds__code{font-size:var(--emr-text-md);font-weight:var(--emr-weight-regular);color:var(--emr-text-muted)}
    .ds__notation{font-family:var(--emr-font-mono);font-size:var(--emr-text-xl);font-weight:var(--emr-weight-bold);letter-spacing:.04em;border:1px solid var(--emr-border);border-radius:8px;padding:2px 10px;background:var(--emr-surface-soft)}
    .ds__site{margin:0;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;padding:8px 12px;border-radius:8px;border:1px solid var(--emr-info);background:var(--emr-info-soft);font-size:var(--emr-text-lg)}
    .ds__site-key{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.06em;text-transform:uppercase;color:var(--emr-text-muted)}
    .ds__prn{margin:0;padding:8px 12px;border-radius:8px;border:1px solid var(--emr-warning);background:var(--emr-warning-soft);font-size:var(--emr-text-lg)}
    .ds__max{display:block;font-size:var(--emr-text-md)}
    .ds__grid{margin:0;display:grid;grid-template-columns:repeat(var(--ds-cols),minmax(0,1fr));gap:8px}
    .ds__cell{display:flex;flex-direction:column;min-height:120px;border:1px solid var(--emr-primary-border);border-radius:8px;background:var(--emr-primary-soft);padding:8px;min-width:0}
    .ds__cell--none{background:var(--emr-surface-soft);border-color:var(--emr-border);color:var(--emr-text-muted)}
    .ds__slot{margin:0;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .ds__time{display:block;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-regular)}
    .ds__amount{margin:0;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2px;min-width:0}
    .ds__icons{display:flex;flex-wrap:wrap;justify-content:center;gap:2px;margin-bottom:2px}
    .ds__icon{width:1.75rem;height:1.75rem;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
    .ds__icon .f{fill:currentColor;fill-opacity:.18}
    .ds__num{font-size:var(--emr-text-2xl);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight)}
    .ds__unit{font-size:var(--emr-text-sm)}
    .ds__word{font-size:var(--emr-text-xs)}
    .ds__label{font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .ds__house{font-size:var(--emr-text-sm);overflow-wrap:anywhere}
    .ds__dash{font-size:var(--emr-text-2xl);line-height:var(--emr-leading-tight)}
    .ds__meta{margin:0;display:flex;flex-wrap:wrap;gap:8px 24px}
    .ds__meta dt{font-size:var(--emr-text-xs);color:var(--emr-text-muted);font-weight:var(--emr-weight-bold)}
    .ds__meta dd{margin:0;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .ds__taper-wrap{overflow-x:auto}
    .ds__taper{width:100%;border-collapse:collapse;font-size:var(--emr-text-md)}
    .ds__taper caption{text-align:left;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);color:var(--emr-text-muted);padding-bottom:4px}
    .ds__taper th,.ds__taper td{padding:8px;border-bottom:1px solid var(--emr-border);text-align:left;vertical-align:top}
    .ds__taper thead th{background:var(--emr-surface-raised);font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .ds__taper .ds__pat{font-family:var(--emr-font-mono);font-weight:var(--emr-weight-bold)}
    .ds__note{margin:0;padding:8px 12px;border-radius:8px;background:var(--emr-info-soft);font-size:var(--emr-text-md)}
    .ds__instr{margin:0;padding-left:20px;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .ds__actions{display:flex;flex-wrap:wrap;gap:8px}
    @media(max-width:480px){.ds{padding:12px}.ds__grid--many{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media print{.ds__actions{display:none}.ds__taper-wrap{overflow:visible}}
  `],
})
export class EmrDoseScheduleComponent {
  @Input({ required: true }) model!: DoseScheduleViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<DoseScheduleIntent>();

  private readonly uid = `emr-dose-${++nextDoseScheduleId}`;

  /**
   * Hide the frequency code when it repeats the site code: "Once daily (OD)" beside
   * "Right eye (OD)" puts one abbreviation on the card with two meanings. Words still show.
   */
  protected get showFrequencyCode(): boolean {
    const code = this.model.frequency.code;
    return !!code && code.toUpperCase() !== this.model.site?.code?.toUpperCase();
  }

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }

  hasMeta(): boolean { const m = this.model; return !!(m.route || m.foodRelation || m.duration || m.startLabel); }

  taperHasPattern(): boolean { return !!this.model.taper?.some((s) => s.slots?.length); }

  /** No amount and no descriptive label: this slot is not taken. */
  isNone(slot: DoseSlot): boolean { return slot.amount === null && !slot.amountLabel; }

  private counted(): boolean { return COUNTED.includes(this.model.medication.form); }

  /** Splits into whole + quarter glyph; null when the amount is not a clean quarter step. */
  private parts(n: number): { whole: number; frac: number } | null {
    const whole = Math.floor(n);
    const frac = Math.round((n - whole) * 100) / 100;
    return frac === 0 || GLYPH[frac] ? { whole, frac } : null;
  }

  format(n: number | null): string {
    if (n === null) return '';
    const p = this.counted() ? this.parts(n) : null;
    if (!p || !p.frac) return String(n);
    return p.whole ? `${p.whole}${GLYPH[p.frac]}` : GLYPH[p.frac];
  }

  /** Words for fractional counted amounts only ('one and a half'); whole numbers are already clear. */
  word(n: number | null): string {
    const p = n === null || !this.counted() ? null : this.parts(n);
    if (!p || !p.frac) return '';
    const w = FRACTION_WORD[p.frac];
    return p.whole ? `${WHOLE[p.whole] ?? p.whole} and ${w}` : w;
  }

  unitText(n: number | null): string {
    const u = this.model.unit;
    return n === null || !u ? '' : n <= 1 ? u.one : u.other;
  }

  private slotText(s: DoseSlot): string {
    if (s.amountLabel) return s.amountLabel;
    if (s.amount === null) return 'none';
    return [this.format(s.amount), this.unitText(s.amount)].filter(Boolean).join(' ');
  }

  sentence(slots: readonly DoseSlot[]): string { return slots.map((s) => `${s.label} ${this.slotText(s)}`).join(', '); }

  /** '1 - 0 - 1', formatted straight from the supplied amounts. Empty when any slot is only described in words. */
  notation(slots: readonly DoseSlot[]): string {
    if (slots.length < 2 || slots.some((s) => s.amount === null && s.amountLabel)) return '';
    return slots.map((s) => (s.amount === null ? '0' : this.format(s.amount))).join(' - ');
  }

  icons(slot: DoseSlot): string[] {
    const form = this.model.medication.form;
    const n = slot.amount;
    const countable = n !== null && n > 0 && n <= 6;
    switch (form) {
      case 'tablet': {
        const p = countable ? this.parts(n) : null;
        if (!p) return ['tablet'];
        return [...Array<string>(p.whole).fill('tablet'), ...(p.frac ? [FRACTION_ICON[p.frac]] : [])];
      }
      case 'capsule': return Array<string>(countable ? Math.ceil(n) : 1).fill('capsule');
      case 'drop': return Array<string>(countable ? Math.ceil(n) : 1).fill('drop');
      case 'liquid': return ['spoon'];
      case 'ointment': case 'cream': case 'gel': return ['tube'];
      case 'injection': return ['syringe'];
      case 'spray': case 'inhaler': case 'patch': case 'sachet': case 'suppository': return [form];
      default: return ['capsule'];
    }
  }
}
