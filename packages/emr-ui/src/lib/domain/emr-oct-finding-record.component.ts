import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroCheck, heroPencilSquare, heroPhoto, heroPlus, heroTrash } from '@ng-icons/heroicons/outline';
import type { ClinicalAssessmentStatus, OctEyeRecord, OctFinding, OctFrameRef, OctFindingRecordIntent, OctFindingRecordViewModel } from '@drguptavivek/emr-controller';

let nextOctRecordId = 0;

/** Names for the six no-value states. Fixed vocabulary, not a verdict: the controller still supplies every badge. */
const STATUS_LABEL: Record<ClinicalAssessmentStatus, string> = {
  'recorded': 'Recorded',
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  'declined': 'Declined',
  'unknown': 'Unknown'
};
const KIND_LABEL: Record<OctFrameRef['kind'], string> = { 'b-scan': 'B-scan', 'en-face': 'En face', 'thickness-map': 'Thickness map', 'report': 'Report' };
const SEVERITY_LABEL = { error: 'Error', warning: 'Warning', info: 'Note' } as const;

@Component({
  selector: 'emr-oct-finding-record',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroArrowPath, heroCheck, heroPencilSquare, heroPhoto, heroPlus, heroTrash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="oct" [attr.aria-labelledby]="titleId()" [attr.aria-busy]="model.loading ? 'true' : null">
      <header class="oct__head"><h3 class="oct__title" [id]="titleId()">{{ model.title }}</h3></header>

      <div aria-live="polite">@if (model.loading) { <p class="oct__live">Loading OCT record…</p> }</div>

      @if (model.error) {
        <div class="oct__error" role="alert">
          <span><strong>OCT record could not be loaded.</strong> {{ model.error }}</span>
          <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="intent.emit({ type: 'retryRequested' })"><ng-icon name="heroArrowPath" aria-hidden="true" /> Retry</button>
        </div>
      }

      @if (model.messages.length) {
        <ul class="oct__msgs" aria-label="Validation messages">
          @for (m of model.messages; track $index) {
            <li class="oct__msg" [class]="'oct__msg oct__msg--' + m.severity"><strong>{{ severity(m.severity) }}:</strong> {{ m.message }}</li>
          }
        </ul>
      }

      @if (!model.loading && !model.error) {
        @if (model.eyes.length) {
          <div class="oct__eyes" [style.--oct-cols]="cols()">
            @for (eye of model.eyes; track eye.eyeId) {
              <article class="oct__eye" [class.oct__eye--empty]="eye.status !== 'recorded'" [attr.aria-labelledby]="eyeId(eye) + '-h'">
                <header class="oct__eye-head">
                  <span class="oct__side" aria-hidden="true">{{ eye.shortLabel }}</span>
                  <h4 class="oct__eye-name" [id]="eyeId(eye) + '-h'">{{ eye.label }} ({{ eye.shortLabel }})</h4>
                  @if (eye.status !== 'recorded') { <span class="emr-badge emr-tone-neutral">{{ statusLabel(eye.status) }}</span> }
                </header>

                @if (eye.status !== 'recorded') {
                  <p class="oct__state" role="note"><strong>{{ statusLabel(eye.status) }}.</strong> No OCT record is shown for this eye.</p>
                } @else {
                  <div class="oct__sec" role="group" [attr.aria-label]="'Scan details, ' + eye.label">
                    @if (eye.metadata.length) {
                      <dl class="oct__meta">@for (item of eye.metadata; track item.label) { <div><dt>{{ item.label }}</dt><dd>{{ item.value }}</dd></div> }</dl>
                    } @else { <p class="oct__none">Scan details: Not supplied</p> }
                  </div>

                  <div class="oct__sec" role="group" [attr.aria-labelledby]="eyeId(eye) + '-fr'">
                    <h5 class="oct__sec-title" [id]="eyeId(eye) + '-fr'">Frames</h5>
                    @if (eye.frames.length) {
                      <ul class="oct__frames">
                        @for (f of eye.frames; track f.frameId) {
                          <li>
                            <button class="oct__frame" type="button" [attr.aria-pressed]="f.frameId === eye.selectedFrameId" [attr.aria-label]="frameName(f)"
                              (click)="intent.emit({ type: 'frameSelected', eyeId: eye.eyeId, frameId: f.frameId })">
                              <span class="oct__thumb">
                                @if (f.thumbnailUrl) { <img [src]="f.thumbnailUrl" alt="" loading="lazy" /> }
                                @else { <span class="oct__noimg"><ng-icon name="heroPhoto" aria-hidden="true" />No image supplied</span> }
                              </span>
                              <span class="oct__cap">{{ f.label }}</span>
                              <span class="oct__kind">{{ kind(f) }}@if (f.frameId === eye.selectedFrameId) { <span class="oct__sel"><ng-icon name="heroCheck" aria-hidden="true" />Selected</span> }</span>
                            </button>
                          </li>
                        }
                      </ul>
                      @if (selected(eye); as sel) {
                        <div class="oct__btns"><button class="emr-button emr-button--small emr-button--outline" type="button" [attr.aria-label]="'Open frame: ' + sel.label"
                          (click)="intent.emit({ type: 'frameOpenRequested', eyeId: eye.eyeId, frameId: sel.frameId })">Open selected frame</button></div>
                      }
                    } @else { <p class="oct__none">No frames supplied</p> }
                  </div>

                  <div class="oct__sec" role="group" [attr.aria-labelledby]="eyeId(eye) + '-me'">
                    <h5 class="oct__sec-title" [id]="eyeId(eye) + '-me'">Measurements</h5>
                    @if (eye.metrics.length) {
                      <div class="oct__table-wrap" tabindex="0" role="region" [attr.aria-label]="'Measurements, ' + eye.label">
                        <table class="oct__table">
                          <caption class="emr-sr-only">{{ eye.label }} OCT measurements</caption>
                          <thead><tr><th scope="col">Measurement</th><th scope="col">Value</th><th scope="col">Reference</th><th scope="col">Status</th></tr></thead>
                          <tbody>
                            @for (m of eye.metrics; track m.id) {
                              <tr>
                                <th scope="row">{{ m.label }}</th>
                                <td class="oct__val">{{ m.valueLabel }}</td>
                                <td>@if (m.referenceLabel) { {{ m.referenceLabel }} } @else { <span class="oct__muted">Not supplied</span> }</td>
                                <td>
                                  @if (m.status) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.status.tone">{{ m.status.label }}@if (m.status.assistiveText) { <span class="emr-sr-only"> {{ m.status.assistiveText }}</span> }</span> } @else { <span class="oct__muted">Not supplied</span> }
                                  @if (m.helpText) { <span class="oct__help">{{ m.helpText }}</span> }
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else { <p class="oct__none">Not supplied</p> }
                  </div>

                  <div class="oct__sec" role="group" [attr.aria-labelledby]="eyeId(eye) + '-fi'">
                    <div class="oct__sec-row">
                      <h5 class="oct__sec-title" [id]="eyeId(eye) + '-fi'">Findings</h5>
                      @if (!model.readOnly) {
                        <button class="emr-button emr-button--small emr-button--outline oct__add" type="button" [attr.aria-label]="'Add finding, ' + eye.label" (click)="intent.emit({ type: 'findingAddRequested', eyeId: eye.eyeId })"><ng-icon name="heroPlus" aria-hidden="true" />Add finding</button>
                      }
                    </div>
                    @if (eye.findings.length) {
                      <ul class="oct__finds">
                        @for (f of eye.findings; track f.id) {
                          <li class="oct__find">
                            <button class="oct__find-main" type="button" (click)="intent.emit({ type: 'findingSelected', eyeId: eye.eyeId, path: f.path })">
                              <span class="oct__find-top">
                                <span class="oct__find-label">{{ f.label }}</span>
                                @if (f.locationLabel) { <span class="oct__loc">{{ f.locationLabel }}</span> }
                              </span>
                              <span class="oct__tags">
                                @if (f.status !== 'recorded') { <span class="emr-badge emr-tone-neutral">{{ statusLabel(f.status) }}</span> }
                                @if (f.badge) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + f.badge.tone">{{ f.badge.label }}@if (f.badge.assistiveText) { <span class="emr-sr-only"> {{ f.badge.assistiveText }}</span> }</span> }
                                @if (f.code) { <span class="oct__code">{{ f.code.code }}</span> }
                              </span>
                              @if (f.note) { <span class="oct__note">{{ f.note }}</span> }
                              @if (frameLabel(eye, f); as fl) { <span class="oct__on">On frame: {{ fl }}</span> }
                            </button>
                            @if (!model.readOnly && !f.readOnly) {
                              <span class="oct__acts">
                                <button class="emr-icon-button" type="button" [attr.aria-label]="'Edit finding: ' + findingName(eye, f)" (click)="intent.emit({ type: 'findingEditRequested', eyeId: eye.eyeId, path: f.path })"><ng-icon name="heroPencilSquare" aria-hidden="true" /></button>
                                <button class="emr-icon-button oct__rm" type="button" [attr.aria-label]="'Remove finding: ' + findingName(eye, f)" (click)="intent.emit({ type: 'findingRemoveRequested', eyeId: eye.eyeId, path: f.path })"><ng-icon name="heroTrash" aria-hidden="true" /></button>
                              </span>
                            }
                          </li>
                        }
                      </ul>
                    } @else { <p class="oct__none">Not supplied</p> }
                  </div>

                  <div class="oct__sec" role="group" [attr.aria-labelledby]="eyeId(eye) + '-in'">
                    <h5 class="oct__sec-title" [id]="eyeId(eye) + '-in'">Interpretation</h5>
                    @if (eye.interpretation) { <p class="oct__interp">{{ eye.interpretation }}</p> } @else { <p class="oct__none">Not supplied</p> }
                  </div>
                }
              </article>
            }
          </div>
        } @else {
          <p class="oct__none" role="status">No eyes supplied</p>
        }
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);container-type:inline-size}
    .oct{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;display:grid;gap:12px;min-width:0}
    .oct__title{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .oct__live{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .oct__error{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;padding:10px 12px;border:1px solid var(--emr-danger);border-radius:8px;background:var(--emr-danger-soft)}
    .oct__msgs{margin:0;padding:0;list-style:none;display:grid;gap:6px}
    .oct__msg{padding:8px 12px;border-radius:8px;border:1px solid var(--emr-border);border-left-width:4px;background:var(--emr-surface-soft);font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .oct__msg--error{border-color:var(--emr-danger);background:var(--emr-danger-soft)}
    .oct__msg--warning{border-color:var(--emr-warning);background:var(--emr-warning-soft)}
    .oct__msg--info{border-color:var(--emr-info);background:var(--emr-info-soft)}
    .oct__eyes{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
    .oct__eye{grid-row:span 6;display:grid;grid-template-rows:subgrid;row-gap:12px;min-width:0;border:1px solid var(--emr-border);border-radius:10px;background:var(--emr-surface);padding:12px;break-inside:avoid}
    .oct__eye-head{display:flex;align-items:center;gap:8px;min-width:0}
    .oct__side{flex:none;display:inline-grid;place-items:center;min-width:var(--emr-control-height);height:var(--emr-compact-height);padding:0 8px;border-radius:8px;background:var(--emr-primary-soft);border:1px solid var(--emr-primary-border);font-family:var(--emr-font-mono);font-weight:var(--emr-weight-bold);font-size:var(--emr-text-md)}
    .oct__eye-name{margin:0;flex:1;font-size:var(--emr-text-lg);overflow-wrap:anywhere}
    .oct__state{grid-row:2/-1;margin:0;padding:12px;border:1px dashed var(--emr-border);border-radius:8px;background:var(--emr-surface-soft);color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .oct__sec{min-width:0;display:flex;flex-direction:column;gap:6px;align-items:stretch}
    .oct__sec-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .oct__sec-title{margin:0;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.06em;text-transform:uppercase;color:var(--emr-text-muted)}
    .oct__none,.oct__muted{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .oct__meta{margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px}
    .oct__meta dt{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);color:var(--emr-text-muted)}
    .oct__meta dd{margin:0;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .oct__frames{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
    .oct__frame{width:100%;height:100%;display:flex;flex-direction:column;gap:4px;text-align:left;font:inherit;color:inherit;background:var(--emr-surface);border:1px solid var(--emr-border);border-radius:8px;padding:6px;cursor:pointer;min-height:var(--emr-control-height)}
    .oct__frame[aria-pressed="true"]{border-color:var(--emr-primary);box-shadow:0 0 0 2px var(--emr-primary);background:var(--emr-primary-soft)}
    .oct__frame:focus-visible,.oct__find-main:focus-visible,.oct__table-wrap:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .oct__thumb{display:grid;place-items:center;aspect-ratio:4/3;border-radius:6px;background:var(--emr-neutral-soft);overflow:hidden}
    .oct__thumb img{width:100%;height:100%;object-fit:contain;display:block}
    .oct__noimg{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;text-align:center;color:var(--emr-text-muted);font-size:var(--emr-text-xs)}
    .oct__cap{font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium);overflow-wrap:anywhere}
    .oct__kind{display:flex;flex-wrap:wrap;gap:2px 8px;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .oct__frame[aria-pressed="true"] .oct__kind{color:var(--emr-text)}
    .oct__sel{display:inline-flex;align-items:center;gap:2px;font-weight:var(--emr-weight-bold);color:var(--emr-text)}
    .oct__btns{display:flex;gap:8px}
    .oct__table-wrap{overflow-x:auto;border:1px solid var(--emr-border);border-radius:8px}
    .oct__table{width:100%;border-collapse:collapse;font-size:var(--emr-text-md)}
    .oct__table th,.oct__table td{padding:8px;border-bottom:1px solid var(--emr-border);text-align:left;vertical-align:top}
    .oct__table thead th{background:var(--emr-surface-raised);font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .oct__table tbody tr:last-child th,.oct__table tbody tr:last-child td{border-bottom:0}
    .oct__table tbody th{font-weight:var(--emr-weight-medium)}
    .oct__val{font-family:var(--emr-font-mono);font-weight:var(--emr-weight-bold);white-space:nowrap}
    .oct__help{display:block;margin-top:2px;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .oct__add{flex:none}
    .oct__finds{margin:0;padding:0;list-style:none;display:grid;gap:6px}
    .oct__find{display:flex;align-items:stretch;gap:6px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .oct__find-main{flex:1;min-width:0;min-height:var(--emr-control-height);display:flex;flex-direction:column;gap:4px;text-align:left;font:inherit;color:inherit;background:transparent;border:0;border-radius:8px;padding:8px 10px;cursor:pointer}
    .oct__find-top{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px}
    .oct__find-label{font-weight:var(--emr-weight-bold);font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .oct__loc{font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .oct__tags{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center}
    .oct__tags:empty{display:none}
    .oct .emr-badge{white-space:normal;height:auto}
    .oct__code{font-family:var(--emr-font-mono);font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .oct__note{font-size:var(--emr-text-sm);overflow-wrap:anywhere}
    .oct__on{font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .oct__acts{flex:none;display:flex;align-items:flex-start;gap:4px;padding:4px 4px 4px 0}
    .oct__rm{color:var(--emr-danger)}
    .oct__interp{margin:0;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    @container (min-width:720px){.oct__eyes{grid-template-columns:repeat(var(--oct-cols,1),minmax(0,1fr))}}
    @container (max-width:719px){.oct__eye--empty{grid-row:span 2}}
    @media(max-width:480px){.oct{padding:8px}.oct__eye{padding:8px}.oct__table th,.oct__table td{padding:6px}.oct__frames{grid-template-columns:repeat(auto-fill,minmax(84px,1fr))}.oct__meta{grid-template-columns:minmax(0,1fr)}}
    @media print{.oct__btns,.oct__add,.oct__acts,.oct__error button{display:none}.oct__table-wrap{overflow:visible}}
  `],
})
export class EmrOctFindingRecordComponent {
  @Input({ required: true }) model!: OctFindingRecordViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<OctFindingRecordIntent>();

  private readonly uid = `emr-oct-${++nextOctRecordId}`;

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }
  eyeId(eye: OctEyeRecord): string { return `${this.uid}-${eye.eyeId}`; }
  /** Two eyes sit side by side when the host is wide enough; the container query above stacks them otherwise. */
  cols(): number { return Math.min(this.model.eyes.length, 2) || 1; }
  statusLabel(s: ClinicalAssessmentStatus): string { return STATUS_LABEL[s]; }
  severity(s: 'error' | 'warning' | 'info'): string { return SEVERITY_LABEL[s]; }
  kind(f: OctFrameRef): string { return KIND_LABEL[f.kind]; }
  selected(eye: OctEyeRecord): OctFrameRef | undefined { return eye.frames.find((f) => f.frameId === eye.selectedFrameId); }
  frameName(f: OctFrameRef): string { return `${f.label}. ${f.altText}${f.thumbnailUrl ? '' : '. No image supplied'}`; }
  frameLabel(eye: OctEyeRecord, f: OctFinding): string | undefined { return f.frameId ? eye.frames.find((x) => x.frameId === f.frameId)?.label : undefined; }
  findingName(eye: OctEyeRecord, f: OctFinding): string { return [f.label, f.locationLabel, eye.label].filter(Boolean).join(', '); }
}
