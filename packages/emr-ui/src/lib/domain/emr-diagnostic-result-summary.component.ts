import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import {
  DiagnosticResultIntent,
  DiagnosticResultViewModel
} from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-diagnostic-result-summary',
  standalone: true,
  template: `
    <section class="emr-diagnostic-summary" [attr.aria-labelledby]="headingId" [attr.aria-busy]="model.loading">
      <header class="emr-diagnostic-summary__header">
        <div>
          <span class="emr-diagnostic-summary__eyebrow">Diagnostic result</span>
          <h2 class="emr-panel__title" [id]="headingId">{{ model.title }}</h2>
          @if (model.subtitle) { <p class="emr-diagnostic-summary__subtitle">{{ model.subtitle }}</p> }
        </div>
        @if (model.status) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + model.status.tone">{{ model.status.label }}</span> }
      </header>

      @if (model.loading) {
        <div class="emr-diagnostic-summary__state" role="status">Loading result details…</div>
      } @else if (model.error) {
        <div class="emr-diagnostic-summary__state emr-diagnostic-summary__state--error" role="alert">
          <strong>Result details could not be loaded</strong><span>{{ model.error }}</span>
          <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="emit({ type: 'retryRequested', resultId: model.id })">Retry</button>
        </div>
      } @else {
        @if (model.metadata.length) {
          <dl class="emr-diagnostic-summary__metadata" aria-label="Result metadata">
            @for (item of model.metadata; track item.label) { <div><dt>{{ item.label }}</dt><dd>{{ item.value }}</dd></div> }
          </dl>
        }

        @if (model.metrics.length) {
          <div class="emr-diagnostic-summary__table-wrap">
            <table class="emr-diagnostic-summary__table">
              <caption class="emr-sr-only">{{ model.title }} measurements</caption>
              <thead><tr><th scope="col">Measurement</th><th scope="col">Value</th><th scope="col">Reference</th><th scope="col">Record status</th></tr></thead>
              <tbody>
                @for (metric of model.metrics; track metric.id) {
                  <tr>
                    <th scope="row">{{ metric.label }}</th>
                    <td>{{ metric.valueLabel }}</td>
                    <td>{{ metric.referenceLabel || '—' }}</td>
                    <td>
                      @if (metric.status) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + metric.status.tone">{{ metric.status.label }}</span> } @else { <span class="emr-diagnostic-summary__muted">Not supplied</span> }
                      @if (metric.helpText) { <span class="emr-diagnostic-summary__help">{{ metric.helpText }}</span> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="emr-diagnostic-summary__accessible-list" aria-label="Measurements, compact view">
            @for (metric of model.metrics; track metric.id) { <div><strong>{{ metric.label }}</strong><span>{{ metric.valueLabel }}</span></div> }
          </div>
        } @else {
          <div class="emr-diagnostic-summary__state" role="status">No measurements recorded.</div>
        }

        @if (model.interpretation) { <div class="emr-diagnostic-summary__note"><span>Supplied note</span><p>{{ model.interpretation }}</p></div> }
        @if (model.trendSummary) { <div class="emr-diagnostic-summary__note"><span>Supplied trend note</span><p>{{ model.trendSummary }}</p></div> }

        @if (model.attachments?.length) {
          <div class="emr-diagnostic-summary__attachments" [attr.aria-labelledby]="attachmentsHeadingId()">
            <h3 [id]="attachmentsHeadingId()">Available files</h3>
            <div class="emr-button-row">
              @for (attachment of model.attachments; track attachment.id) {
                <button class="emr-button emr-button--small emr-button--secondary" type="button" [disabled]="attachment.disabled"
                  [attr.aria-label]="attachment.assistiveDescription || attachment.label"
                  (click)="emit({ type: 'attachmentRequested', resultId: model.id, attachmentId: attachment.id })">{{ attachment.label }}</button>
              }
            </div>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .emr-diagnostic-summary { display: block; border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); padding: 20px; color: var(--emr-text); }
    .emr-diagnostic-summary__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .emr-diagnostic-summary__eyebrow { color: var(--emr-primary); font-size:var(--emr-text-xs); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .emr-diagnostic-summary__subtitle { margin: 4px 0 0; color: var(--emr-text-muted); font-size:var(--emr-text-md); }
    .emr-diagnostic-summary__metadata { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px 16px; margin: 0 0 18px; border-bottom: 1px solid var(--emr-border); padding-bottom: 16px; }
    .emr-diagnostic-summary__metadata div { min-width: 0; }
    .emr-diagnostic-summary__metadata dt { color: var(--emr-text-muted); font-size:var(--emr-text-xs); font-weight: 700; }
    .emr-diagnostic-summary__metadata dd { margin: 3px 0 0; overflow-wrap: anywhere; color: var(--emr-text); font-size:var(--emr-text-md); }
    .emr-diagnostic-summary__table-wrap { overflow-x: auto; }
    .emr-diagnostic-summary__table { width: 100%; min-width: 560px; border-collapse: collapse; font-size:var(--emr-text-md); }
    .emr-diagnostic-summary__table th, .emr-diagnostic-summary__table td { border-bottom: 1px solid var(--emr-border); padding: 10px; text-align: left; vertical-align: top; }
    .emr-diagnostic-summary__table thead th { background: var(--emr-surface-blue); color: var(--emr-text-muted); font-size:var(--emr-text-xs); letter-spacing: .02em; text-transform: uppercase; }
    .emr-diagnostic-summary__table tbody th { color: var(--emr-text); font-weight: 700; }
    .emr-diagnostic-summary__table tbody td { color: var(--emr-text); }
    .emr-diagnostic-summary__help { display: block; margin-top: 4px; color: var(--emr-text-muted); font-size:var(--emr-text-xs); }
    .emr-diagnostic-summary__muted { color: var(--emr-text-muted); font-size:var(--emr-text-sm); }
    .emr-diagnostic-summary__accessible-list { display: none; }
    .emr-diagnostic-summary__note { margin-top: 16px; border-left: 3px solid var(--emr-primary); background: var(--emr-surface-soft); padding: 10px 12px; }
    .emr-diagnostic-summary__note span { color: var(--emr-primary); font-size:var(--emr-text-xs); font-weight: 700; text-transform: uppercase; }
    .emr-diagnostic-summary__note p { margin: 4px 0 0; line-height: 1.45; }
    .emr-diagnostic-summary__attachments { margin-top: 18px; border-top: 1px solid var(--emr-border); padding-top: 14px; }
    .emr-diagnostic-summary__attachments h3 { margin: 0 0 10px; color: var(--emr-text-muted); font-size:var(--emr-text-sm); }
    .emr-diagnostic-summary__state { display: grid; gap: 8px; border-radius: 8px; background: var(--emr-surface-soft); padding: 16px; color: var(--emr-text); }
    .emr-diagnostic-summary__state--error { background: var(--emr-danger-soft); color: var(--emr-danger); }
    @media (max-width: 640px) {
      .emr-diagnostic-summary { padding: 14px; }
      .emr-diagnostic-summary__header { flex-direction: column; }
      .emr-diagnostic-summary__table-wrap { display: none; }
      .emr-diagnostic-summary__accessible-list { display: grid; gap: 8px; }
      .emr-diagnostic-summary__accessible-list div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; border-bottom: 1px solid var(--emr-border); padding: 10px 0; }
      .emr-diagnostic-summary__accessible-list strong { overflow-wrap: anywhere; color: var(--emr-text); }
      .emr-diagnostic-summary__accessible-list span { color: var(--emr-text-muted); text-align: right; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrDiagnosticResultSummaryComponent {
  @Input({ required: true }) model!: DiagnosticResultViewModel;
  @Input() headingId = 'emr-diagnostic-result-heading';
  @Output() readonly intent = new EventEmitter<DiagnosticResultIntent>();

  attachmentsHeadingId(): string { return `${this.headingId}-attachments`; }
  emit(intent: DiagnosticResultIntent): void { this.intent.emit(intent); }
}
