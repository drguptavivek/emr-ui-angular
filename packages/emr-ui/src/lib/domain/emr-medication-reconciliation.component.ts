import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type {
  MedicationReconciliationIntent, MedicationReconciliationViewModel, ReconMedication, ReconRow
} from '@drguptavivek/emr-controller';
import { EmrButtonComponent } from '../primitives/emr-button.component';
import { EmrBadgeComponent, EmrStateMessageComponent } from '../primitives/emr-feedback.component';

let nextReconId = 0;

@Component({
  selector: 'emr-medication-reconciliation',
  standalone: true,
  imports: [NgTemplateOutlet, EmrBadgeComponent, EmrButtonComponent, EmrStateMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-recon" [attr.aria-labelledby]="titleId()" [attr.aria-busy]="model.loading ? 'true' : null">
      <header class="emr-recon__head">
        <h3 class="emr-recon__title" [id]="titleId()">{{ model.title }}</h3>
        @if (model.summary?.length) {
          <ul class="emr-recon__summary" aria-label="Summary">
            @for (badge of model.summary; track $index) {
              <li><emr-badge [tone]="badge.tone">{{ badge.label }}@if (badge.assistiveText) { <span class="emr-sr-only"> {{ badge.assistiveText }}</span> }</emr-badge></li>
            }
          </ul>
        }
      </header>

      @if (model.loading) {
        <emr-state-message kind="loading" title="Loading medicines" />
      } @else if (model.error) {
        <emr-state-message kind="error" title="Medicines could not be loaded" [message]="model.error">
          <div class="emr-recon__retry"><emr-button variant="outline" (clicked)="intent.emit({ type: 'retryRequested' })">Try again</emr-button></div>
        </emr-state-message>
      } @else {
        @if (!model.readOnly) {
          <div class="emr-recon__actions">
            <emr-button variant="outline" (clicked)="intent.emit({ type: 'addMedicationRequested', side: 'left' })">Add medicine to {{ model.leftLabel }}</emr-button>
            <emr-button variant="outline" (clicked)="intent.emit({ type: 'addMedicationRequested', side: 'right' })">Add medicine to {{ model.rightLabel }}</emr-button>
          </div>
        }

        @if (!model.rows.length) {
          <emr-state-message kind="empty" [title]="model.emptyMessage" />
        } @else {
          <div class="emr-table-wrap emr-recon__tablewrap">
            <table class="emr-table emr-recon__table">
              <caption class="emr-sr-only">{{ model.title }}: {{ model.leftLabel }} compared with {{ model.rightLabel }}</caption>
              <thead><tr>
                <th scope="col">{{ model.leftLabel }}</th>
                <th scope="col">{{ model.rightLabel }}</th>
                <th scope="col">Decision</th>
              </tr></thead>
              <tbody>
                @for (row of model.rows; track row.id) {
                  <tr [class.emr-recon__row--selected]="isSelected(row)" [attr.aria-current]="isSelected(row) ? 'true' : null" (click)="select(row)" (focusin)="select(row)">
                    <th scope="row">@if (isSelected(row)) { <span class="emr-sr-only">Selected. </span> }<ng-container *ngTemplateOutlet="med; context: { $implicit: row.left, label: model.leftLabel }" /></th>
                    <td><ng-container *ngTemplateOutlet="med; context: { $implicit: row.right, label: model.rightLabel }" /></td>
                    <td><ng-container *ngTemplateOutlet="decision; context: { $implicit: row, key: uid + '-t-' + row.id, bare: true }" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <ul class="emr-recon__cards">
            @for (row of model.rows; track row.id) {
              <li class="emr-recon__card" [class.emr-recon__row--selected]="isSelected(row)" [attr.aria-current]="isSelected(row) ? 'true' : null" (click)="select(row)" (focusin)="select(row)">
                @if (isSelected(row)) { <span class="emr-sr-only">Selected. </span> }
                <div class="emr-recon__side"><p class="emr-recon__side-label">{{ model.leftLabel }}</p><ng-container *ngTemplateOutlet="med; context: { $implicit: row.left, label: model.leftLabel }" /></div>
                <div class="emr-recon__side"><p class="emr-recon__side-label">{{ model.rightLabel }}</p><ng-container *ngTemplateOutlet="med; context: { $implicit: row.right, label: model.rightLabel }" /></div>
                <ng-container *ngTemplateOutlet="decision; context: { $implicit: row, key: uid + '-c-' + row.id, bare: false }" />
              </li>
            }
          </ul>
        }

        @if (!model.readOnly) {
          <div class="emr-recon__footer">
            <emr-button variant="primary" [disabled]="!model.canComplete" (clicked)="intent.emit({ type: 'completeRequested' })">Complete reconciliation</emr-button>
          </div>
        }
      }
    </section>

    <ng-template #med let-m let-label="label">
      @if (m) {
        <button type="button" class="emr-recon__name" (click)="intent.emit({ type: 'medicationDetailRequested', medicationId: m.id })">{{ m.nameLabel }}</button>
        @if (m.code && m.code.display !== m.nameLabel) { <span class="emr-recon__coded">{{ m.code.display }}</span> }
        <span class="emr-recon__dose">{{ m.doseSummary || 'Not supplied' }}</span>
        @if (m.lastTakenLabel || m.badges?.length) {
          <span class="emr-recon__meta">
            @if (m.lastTakenLabel) { <span class="emr-recon__taken">Last taken: {{ m.lastTakenLabel }}</span> }
            @for (badge of m.badges; track $index) { <emr-badge [tone]="badge.tone">{{ badge.label }}@if (badge.assistiveText) { <span class="emr-sr-only"> {{ badge.assistiveText }}</span> }</emr-badge> }
          </span>
        }
      } @else {
        <span class="emr-recon__absent">Not on {{ label }}</span>
      }
    </ng-template>

    <ng-template #decision let-row let-key="key" let-bare="bare">
      <div class="emr-recon__decision" [class.emr-recon__decision--bare]="bare">
        <label class="emr-field" [for]="key + '-decision'">
          <span class="emr-field__label emr-recon__decision-label">Decision for {{ rowName(row) }}</span>
          <select class="emr-select" [id]="key + '-decision'" [attr.aria-readonly]="locked(row) ? 'true' : null" (change)="onDecision(row, $event)">
            <option value="" [selected]="!row.decision">Not decided</option>
            @for (option of row.decisionOptions; track option.value) {
              <option [value]="option.value" [selected]="option.value === row.decision" [disabled]="option.disabled">{{ option.label }}</option>
            }
          </select>
        </label>
        @if (row.reasonRequired) {
          <label class="emr-field emr-recon__reason" [for]="key + '-reason'">
            <span class="emr-field__label">Reason for {{ rowName(row) }} <span class="emr-field__required" aria-hidden="true">*</span></span>
            <textarea class="emr-control emr-recon__textarea" rows="2" required [id]="key + '-reason'" [value]="row.reason ?? ''" [readOnly]="locked(row)"
              [attr.aria-invalid]="reasonInvalid(row) ? 'true' : null" [attr.aria-describedby]="row.messages?.length ? key + '-messages' : null"
              (input)="onReason(row, $event)"></textarea>
          </label>
          @if (row.reason) { <p class="emr-recon__reason-print"><strong>Reason:</strong> {{ row.reason }}</p> }
        }
        @if (row.messages?.length) {
          <div class="emr-recon__messages" [id]="key + '-messages'">
            @for (message of row.messages; track $index) {
              <p [class]="'emr-recon__message emr-recon__message--' + message.severity" [attr.role]="message.severity === 'error' ? 'alert' : 'status'">
                <strong>{{ severityWord(message.severity) }}:</strong> {{ message.message }}
              </p>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    emr-medication-reconciliation{display:block;color:var(--emr-text);container-type:inline-size}
    .emr-recon{display:grid;gap:12px;font-family:var(--emr-font-family)}
    .emr-recon__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px}
    .emr-recon__title{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight)}
    .emr-recon__summary{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px}
    .emr-recon__actions,.emr-recon__footer{display:flex;flex-wrap:wrap;gap:8px}
    .emr-recon__actions emr-button,.emr-recon__footer emr-button{min-width:0;max-width:100%}
    .emr-recon__actions .emr-button,.emr-recon__footer .emr-button{height:auto;min-height:var(--emr-control-height);padding-block:6px;white-space:normal;text-align:center;line-height:var(--emr-leading-tight)}
    .emr-recon__footer{justify-content:flex-end}
    .emr-recon__retry{margin-top:12px}
    .emr-recon .emr-table-wrap{display:block}
    .emr-recon__table{table-layout:fixed}
    .emr-recon__table th:nth-child(1),.emr-recon__table th:nth-child(2){width:35%}
    .emr-recon__table th:nth-child(3){width:30%}
    .emr-recon__table tbody th{font-size:var(--emr-text-md);font-weight:var(--emr-weight-regular);text-transform:none;letter-spacing:0;color:var(--emr-text);background:var(--emr-surface)}
    .emr-recon__table td,.emr-recon__table tbody th{overflow-wrap:anywhere}
    .emr-recon__table tbody tr:last-child th{border-bottom:0}
    .emr-recon__row--selected td,.emr-recon__row--selected th{background:var(--emr-primary-soft)!important}
    .emr-recon__table .emr-recon__row--selected th{box-shadow:inset 4px 0 0 var(--emr-primary)}
    .emr-recon__name{display:inline-flex;align-items:center;min-height:var(--emr-control-height);max-width:100%;margin:0;padding:0;border:0;background:none;color:var(--emr-primary);font:inherit;font-weight:var(--emr-weight-bold);text-align:left;text-decoration:underline;cursor:pointer;overflow-wrap:anywhere}
    .emr-recon__name:focus-visible,.emr-recon__textarea:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .emr-recon__coded,.emr-recon__taken,.emr-recon__absent{display:block;color:var(--emr-text);font-size:var(--emr-text-sm)}
    .emr-recon__absent{display:flex;align-items:center;min-height:var(--emr-control-height);font-style:italic}
    .emr-recon__dose{display:block;font-size:var(--emr-text-md)}
    .emr-recon__meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-top:4px}
    .emr-recon__decision{display:grid;gap:8px;min-width:0}
    .emr-recon__decision--bare .emr-recon__decision-label{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .emr-recon__reason{gap:4px}
    .emr-recon__reason .emr-field__label{font-size:var(--emr-text-sm)}
    .emr-recon__textarea{resize:vertical;min-height:calc(var(--emr-control-height) * 1.6)}
    .emr-recon__reason-print{display:none;margin:0}
    .emr-recon__messages{display:grid;gap:4px}
    .emr-recon__message{margin:0;padding:6px 8px;border-radius:6px;border-left:4px solid currentColor;font-size:var(--emr-text-sm);overflow-wrap:anywhere}
    .emr-recon__message--error{background:var(--emr-danger-soft);color:var(--emr-danger)}
    .emr-recon__message--warning{background:var(--emr-warning-soft);color:var(--emr-warning)}
    .emr-recon__message--info{background:var(--emr-info-soft);color:var(--emr-info)}
    .emr-recon__cards{display:none;margin:0;padding:0;list-style:none;gap:10px}
    .emr-recon__card{display:grid;gap:10px;padding:12px;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface);min-width:0}
    .emr-recon__card.emr-recon__row--selected{border-color:var(--emr-primary);border-width:2px;background:var(--emr-primary-soft)}
    .emr-recon__side{min-width:0;padding-bottom:10px;border-bottom:1px solid var(--emr-border)}
    .emr-recon__side-label{margin:0;color:var(--emr-text);font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.06em;text-transform:uppercase}
    @container (max-width: 720px){
      .emr-recon .emr-table-wrap{display:none}
      .emr-recon__cards{display:grid}
    }
    @media print{
      .emr-recon__actions,.emr-recon__footer{display:none}
      .emr-recon__card,.emr-recon__table tr{break-inside:avoid}
      .emr-recon .emr-table-wrap{display:block;overflow:visible}
      .emr-recon__cards{display:none}
      .emr-recon__reason{display:none}
      .emr-recon__reason-print{display:block}
    }
    .emr-print .emr-recon__actions,.emr-print .emr-recon__footer{display:none}
    .emr-print .emr-recon .emr-table-wrap{display:block;overflow:visible}
    .emr-print .emr-recon__cards{display:none}
    .emr-print .emr-recon__reason{display:none}
    .emr-print .emr-recon__reason-print{display:block}
  `],
})
export class EmrMedicationReconciliationComponent {
  @Input({ required: true }) model!: MedicationReconciliationViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<MedicationReconciliationIntent>();

  protected readonly uid = `emr-recon-${++nextReconId}`;

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }

  isSelected(row: ReconRow): boolean { return row.id === this.model.selectedRowId; }

  locked(row: ReconRow): boolean { return !!(this.model.readOnly || row.readOnly); }

  /** Accessible name for the row's controls: the left medicine, else the right one. */
  rowName(row: ReconRow): string {
    const m: ReconMedication | undefined = row.left ?? row.right;
    return m?.nameLabel ?? 'medicine';
  }

  /** Marks the reason invalid only when the controller addressed an error to a node named 'reason'. */
  reasonInvalid(row: ReconRow): boolean {
    return !!row.messages?.some((m) => m.severity === 'error' && m.path[m.path.length - 1] === 'reason');
  }

  severityWord(severity: 'error' | 'warning' | 'info'): string {
    return severity === 'error' ? 'Error' : severity === 'warning' ? 'Warning' : 'Note';
  }

  select(row: ReconRow): void {
    if (!this.isSelected(row)) this.intent.emit({ type: 'rowSelected', rowId: row.id });
  }

  /** A native select has no readonly: keep it focusable and announced, but revert any change. Choosing "Not decided" is not an intent. */
  onDecision(row: ReconRow, event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.locked(row) || !select.value) { select.value = row.decision ?? ''; return; }
    this.intent.emit({ type: 'decisionChangeRequested', path: row.path, decision: select.value });
  }

  onReason(row: ReconRow, event: Event): void {
    this.intent.emit({ type: 'reasonChangeRequested', path: row.path, reason: (event.target as HTMLTextAreaElement).value });
  }
}
