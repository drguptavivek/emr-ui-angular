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
    <section class="emr-patient-banner" [attr.aria-label]="'Current patient: ' + model.displayName">
      <div class="emr-patient-banner__primary">
        <div class="emr-patient-banner__identity">
          <h2 class="emr-patient-banner__name">{{ model.displayName }}</h2>
          <div class="emr-patient-banner__demographics">
            {{ primaryIdentifier() }} · {{ model.ageLabel }} · {{ model.sexLabel }}
          </div>
        </div>
        <div class="emr-patient-banner__badges" aria-label="Patient status">
          @if (model.criticality) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + model.criticality.tone">{{ model.criticality.label }}</span>
          }
          @if (model.vip) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + model.vip.tone">{{ model.vip.label }}</span>
          }
          <span class="emr-badge emr-tone-info">{{ model.careSettingLabel }}</span>
        </div>
        <div class="emr-patient-banner__safety" aria-label="Safety alerts">
          @if (model.allergyStatus) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + model.allergyStatus.tone">{{ model.allergyStatus.label }}</span>
          }
          @if (model.allergies.length) {
            @for (allergy of model.allergies.slice(0, 2); track allergy.id) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + allergy.tone">Allergy: {{ allergy.label }}</span>
            }
            @if (model.allergies.length > 2) { <span class="emr-badge emr-tone-danger">+{{ model.allergies.length - 2 }} allergies</span> }
          }
        </div>
        <button class="emr-icon-button" type="button" [attr.aria-expanded]="model.expanded" [attr.aria-controls]="model.expanded ? detailsElementId() : null"
          [attr.aria-label]="model.expanded ? 'Hide patient details' : 'Show patient details'" (click)="expandedChangeRequested.emit(!model.expanded)">
          <ng-icon [name]="model.expanded ? 'heroChevronUp' : 'heroChevronDown'" size="20" aria-hidden="true" />
        </button>
      </div>
      @if (model.expanded) {
        <div class="emr-patient-banner__secondary" [id]="detailsElementId()">
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">Current encounter</span>
            <strong>{{ model.careSettingLabel }} · {{ model.locationLabel }}</strong>
            @if (model.encounterLabel) { <div>{{ model.encounterLabel }}</div> }
            @for (identifier of model.identifiers; track identifier.label) {
              <div class="emr-field__hint">{{ identifier.label }}: {{ identifier.value }}</div>
            }
          </div>
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">Chronic diseases</span>
            <div class="emr-chip-row">@if (model.chronicDiseaseStatus) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + model.chronicDiseaseStatus.tone">{{ model.chronicDiseaseStatus.label }}</span> } @for (item of model.chronicDiseases; track item.id) { <span class="emr-chip" [class]="'emr-chip emr-tone-' + item.tone">{{ item.label }}</span> }</div>
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
  @Input({ required: true }) model!: PatientBannerViewModel;
  @Input() idPrefix = 'emr-patient-banner';
  @Output() readonly expandedChangeRequested = new EventEmitter<boolean>();
  detailsElementId(): string { return `${this.idPrefix}-details`; }
  primaryIdentifier(): string { return this.model.identifiers[0]?.value ?? this.model.patientId; }
  combinedAlerts(): readonly PatientAlert[] { return [...this.model.allergies, ...this.model.alerts]; }
}
