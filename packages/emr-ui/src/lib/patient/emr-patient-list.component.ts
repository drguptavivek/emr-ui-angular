import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { PatientListIntent, PatientListRow, PatientListViewModel } from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroIdentification } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'emr-patient-list',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroIdentification })],
  template: `
    <section class="emr-patient-list" aria-labelledby="emr-patient-list-title">
      <h2 class="emr-sr-only" id="emr-patient-list-title">Patient list</h2>
      <div class="emr-patient-list__toolbar" role="search">
        <input class="emr-search-input" type="search" aria-label="Search patients" [value]="state.query" placeholder="Search by name, MRN or visit"
          (input)="emit({ type: 'queryChanged', query: inputValue($event) })" (keydown.enter)="emit({ type: 'searchRequested' })" />
        <button class="emr-button" type="button" [disabled]="state.loading" (click)="emit({ type: 'searchRequested' })">Search</button>
      </div>
      @if (state.error) {
        <div class="emr-alert emr-tone-danger" role="alert"><div><strong>Patients could not be loaded</strong><div>{{ state.error }}</div><button class="emr-button emr-button--small emr-button--outline" type="button" (click)="emit({ type: 'retryRequested' })">Retry</button></div></div>
      } @else if (state.loading && state.rows.length === 0) {
        <div class="emr-empty" role="status">Loading patients…</div>
      } @else if (state.rows.length === 0) {
        <div class="emr-empty">No patients match this search.</div>
      } @else {
        <div class="emr-table-wrap">
          <table class="emr-table">
            <thead><tr><th>MRN / patient</th><th>Age / sex</th><th>Care area</th><th>Queue</th><th>Status</th></tr></thead>
            <tbody>
              @for (patient of state.rows; track patient.patientId) {
                <tr [attr.aria-selected]="state.selectedPatientId === patient.patientId">
                  <td><button class="emr-table__select emr-patient-list__identity" type="button" (click)="select(patient)"><span class="emr-patient-list__mrn">{{ patient.primaryIdentifier }}</span><span class="emr-patient-list__name">{{ patient.displayName }}</span>@if (patient.abha; as abha) { <span class="emr-patient-list__abha"><ng-icon name="heroIdentification" size="18" aria-hidden="true" /><span>{{ abha.label || 'ABHA' }} {{ abha.value }}</span></span> }</button></td>
                  <td>{{ patient.ageLabel }} / {{ patient.sexLabel }}</td>
                  <td>{{ patient.careSettingLabel }}<div class="emr-field__hint">{{ patient.locationLabel }}</div></td>
                  <td>{{ patient.queueLabel || '—' }}</td>
                  <td>@if (patient.status) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + patient.status.tone">{{ patient.status.label }}</span> }</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="emr-patient-cards">
          @for (patient of state.rows; track patient.patientId) {
            <button class="emr-patient-card" [class.emr-patient-card--selected]="state.selectedPatientId === patient.patientId" type="button" (click)="select(patient)">
              <span class="emr-patient-card__top"><span class="emr-patient-list__mrn">{{ patient.primaryIdentifier }}</span>@if (patient.status) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + patient.status.tone">{{ patient.status.label }}</span> }</span>
              <span class="emr-patient-list__name">{{ patient.displayName }}</span>
              @if (patient.abha; as abha) { <span class="emr-patient-list__abha"><ng-icon name="heroIdentification" size="18" aria-hidden="true" /><span>{{ abha.label || 'ABHA' }} {{ abha.value }}</span></span> }
              <span class="emr-patient-card__meta">{{ patient.ageLabel }} / {{ patient.sexLabel }}</span>
              <span class="emr-patient-card__meta">{{ patient.careSettingLabel }} · {{ patient.locationLabel }} @if (patient.queueLabel) { · {{ patient.queueLabel }} }</span>
            </button>
          }
        </div>
        <div class="emr-pagination">
          <button class="emr-button emr-button--small emr-button--secondary" type="button" [disabled]="state.page <= 1" (click)="emit({ type: 'pageChanged', page: state.page - 1 })">Previous</button>
          <span>Page {{ state.page }} · {{ state.total }} patients</span>
          <button class="emr-button emr-button--small emr-button--secondary" type="button" [disabled]="state.page * state.pageSize >= state.total" (click)="emit({ type: 'pageChanged', page: state.page + 1 })">Next</button>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrPatientListComponent {
  @Input({ required: true }) state!: PatientListViewModel;
  @Output() readonly intent = new EventEmitter<PatientListIntent>();
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  emit(intent: PatientListIntent): void { this.intent.emit(intent); }
  select(patient: PatientListRow): void { this.emit({ type: 'patientSelected', patientId: patient.patientId }); }
}
