import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ConsentReceiptViewModel } from '@drguptavivek/emr-controller';

const DEFAULT_LABELS = { patient: 'Patient', purpose: 'Purpose', decision: 'Decision' };
export type EmrConsentReceiptLabels = typeof DEFAULT_LABELS;

let nextId = 0;

/**
 * L4 consent receipt: a read-only, printable summary (semantic h1 / dl / tables). Deliberately has NO
 * `intent` output: it offers no actions, so the app prints it by placing it in an `.emr-print` context
 * (or Ctrl+P). Nothing is collapsed or clipped, so paper carries every decision.
 */
@Component({
  selector: 'emr-consent-receipt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <article class="cp" [attr.aria-labelledby]="titleId">
      <h1 class="cp__title" [id]="titleId">{{ m.title }}</h1>
      <dl class="cp__ids">
        <dt>{{ l.patient }}</dt><dd class="cp__strong">{{ m.patientName }}</dd>
        @for (i of m.identifiers; track $index) { <dt>{{ i.label }}</dt><dd>{{ i.display }}</dd> }
      </dl>
      <p class="cp__muted">{{ m.dateLabel }} · {{ m.noticeVersionLabel }}</p>
      @for (c of m.categories; track $index) {
        <table class="cp__table">
          <caption>{{ c.label }}</caption>
          <thead><tr><th scope="col">{{ l.purpose }}</th><th scope="col">{{ l.decision }}</th></tr></thead>
          <tbody>
            @for (p of c.purposes; track $index) {
              <tr>
                <th scope="row">{{ p.label }}</th>
                <td>{{ p.decisionLabel }}@if (p.statusBadge; as b) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}@if (b.assistiveText) { <span class="emr-sr-only"> {{ b.assistiveText }}</span> }</span> }</td>
              </tr>
            }
          </tbody>
        </table>
      }
      <p class="cp__body">{{ m.howToChange }}</p>
      @if (m.footer) { <p class="cp__muted">{{ m.footer }}</p> }
    </article>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .cp{display:grid;gap:12px;max-width:100%;padding:16px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .cp__title{margin:0;font-size:var(--emr-text-xl);font-weight:var(--emr-weight-bold)}
    .cp__ids{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;font-size:var(--emr-text-md)}
    .cp__ids dt{color:var(--emr-text-muted)}
    .cp__ids dd{margin:0;overflow-wrap:anywhere}
    .cp__strong{font-weight:var(--emr-weight-bold)}
    .cp__body{margin:0;font-size:var(--emr-text-md)}
    .cp__muted{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .cp__table{width:100%;border-collapse:collapse;font-size:var(--emr-text-md)}
    .cp__table caption{text-align:start;font-weight:var(--emr-weight-bold);padding:6px 0}
    .cp__table th,.cp__table td{padding:6px 8px;text-align:start;vertical-align:top;border-bottom:1px solid var(--emr-border);overflow-wrap:anywhere}
    .cp__table tbody th{font-weight:400}
    .cp__table td .emr-badge{margin-inline-start:8px}
    .cp__table tr{break-inside:avoid}
    @media print{.cp{border:0;padding:0}}
    :host-context(.emr-print) .cp{border:0;padding:0}
  `]
})
export class EmrConsentReceiptComponent {
  readonly model = input.required<ConsentReceiptViewModel>();
  readonly labels = input<Partial<EmrConsentReceiptLabels>>({});

  readonly titleId = `emr-consent-receipt-${++nextId}-title`;
  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));
}
