import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { PatientAlert, PatientBannerViewModel } from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroChevronDown, heroChevronUp } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'emr-patient-banner',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroChevronDown, heroChevronUp })],
  template: `
    <section class="emr-patient-banner" [attr.aria-label]="'Current patient: ' + patient.displayName">
      <div class="emr-patient-banner__primary">
        <div class="emr-patient-banner__identity">
          <h2 class="emr-patient-banner__name">{{ patient.displayName }}</h2>
          <div class="emr-patient-banner__demographics">
            {{ primaryIdentifier() }} · {{ patient.ageLabel }} · {{ patient.sexLabel }}
          </div>
        </div>
        <div class="emr-patient-banner__badges" aria-label="Patient status">
          @if (patient.criticality) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + patient.criticality.tone">{{ patient.criticality.label }}</span>
          }
          @if (patient.vip) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + patient.vip.tone">{{ patient.vip.label }}</span>
          }
          <span class="emr-badge emr-tone-info">{{ patient.careSettingLabel }}</span>
        </div>
        <div class="emr-patient-banner__safety" aria-label="Safety alerts">
          @if (patient.allergyStatus) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + patient.allergyStatus.tone">{{ patient.allergyStatus.label }}</span>
          }
          @if (patient.allergies.length) {
            @for (allergy of patient.allergies.slice(0, 2); track allergy.id) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + allergy.tone">Allergy: {{ allergy.label }}</span>
            }
            @if (patient.allergies.length > 2) { <span class="emr-badge emr-tone-danger">+{{ patient.allergies.length - 2 }} allergies</span> }
          }
        </div>
        <button class="emr-icon-button" type="button" [attr.aria-expanded]="patient.expanded" [attr.aria-controls]="patient.expanded ? detailsId : null"
          [attr.aria-label]="patient.expanded ? 'Hide patient details' : 'Show patient details'" (click)="expandedChangeRequested.emit(!patient.expanded)">
          <ng-icon [name]="patient.expanded ? 'heroChevronUp' : 'heroChevronDown'" size="20" aria-hidden="true" />
        </button>
      </div>
      @if (patient.expanded) {
        <div class="emr-patient-banner__secondary" [id]="detailsId">
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">Current encounter</span>
            <strong>{{ patient.careSettingLabel }} · {{ patient.locationLabel }}</strong>
            @if (patient.encounterLabel) { <div>{{ patient.encounterLabel }}</div> }
            @for (identifier of patient.identifiers; track identifier.label) {
              <div class="emr-field__hint">{{ identifier.label }}: {{ identifier.value }}</div>
            }
          </div>
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">Chronic diseases</span>
            <div class="emr-chip-row">@if (patient.chronicDiseaseStatus) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + patient.chronicDiseaseStatus.tone">{{ patient.chronicDiseaseStatus.label }}</span> } @for (item of patient.chronicDiseases; track item.id) { <span class="emr-chip" [class]="'emr-chip emr-tone-' + item.tone">{{ item.label }}</span> }</div>
          </div>
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">Additional alerts</span>
            <div class="emr-chip-row">@for (item of combinedAlerts(); track item.id) { <span class="emr-chip" [class]="'emr-chip emr-tone-' + item.tone">{{ item.label }}</span> } @if (!combinedAlerts().length) { <span class="emr-field__hint">Additional alert status not supplied.</span> }</div>
          </div>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrPatientBannerComponent {
  @Input({ required: true }) patient!: PatientBannerViewModel;
  @Input() detailsId = 'emr-patient-banner-details';
  @Output() readonly expandedChangeRequested = new EventEmitter<boolean>();
  primaryIdentifier(): string { return this.patient.identifiers[0]?.value ?? this.patient.patientId; }
  combinedAlerts(): readonly PatientAlert[] { return [...this.patient.allergies, ...this.patient.alerts]; }
}
