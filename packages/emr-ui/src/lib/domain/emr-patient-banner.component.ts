import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import type { PatientAlert, PatientBannerIntent, PatientBannerViewModel } from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroChevronDown, heroChevronUp } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'emr-patient-banner',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroChevronDown, heroChevronUp })],
  template: `
    @let m = model();
    <section class="emr-patient-banner" [attr.aria-label]="'Current patient: ' + m.displayName">
      <div class="emr-patient-banner__primary">
        <div class="emr-patient-banner__identity">
          <h2 class="emr-patient-banner__name">{{ m.displayName }}</h2>
          <div class="emr-patient-banner__demographics">
            {{ primaryIdentifier() }} · {{ m.ageLabel }} · {{ m.sexLabel }}@if (m.weightLabel) { · Weight {{ m.weightLabel }} }
          </div>
          @if (m.bedLabel || m.wardLabel || m.lengthOfStayLabel) {
            <div class="emr-patient-banner__location">
              @if (m.bedLabel) { <strong>{{ m.bedLabel }}</strong> }
              @if (m.wardLabel) { <span>{{ m.wardLabel }}</span> }
              @if (m.lengthOfStayLabel) { <span>{{ m.lengthOfStayLabel }}</span> }
            </div>
          }
        </div>
        <div class="emr-patient-banner__badges" aria-label="Patient status">
          @if (m.criticality) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.criticality.tone">{{ m.criticality.label }}</span>
          }
          @if (m.vip) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.vip.tone">{{ m.vip.label }}</span>
          }
          <span class="emr-badge emr-tone-info">{{ m.careSettingLabel }}</span>
        </div>
        <div class="emr-patient-banner__safety" aria-label="Safety alerts">
          @if (m.codeStatus) {
            <span [class]="'emr-badge emr-tone-' + m.codeStatus.tone">{{ m.codeStatus.label }}@if (m.codeStatus.assistiveText) { <span class="emr-sr-only"> {{ m.codeStatus.assistiveText }}</span> }</span>
          }
          @if (m.isolation) {
            <span [class]="'emr-badge emr-tone-' + m.isolation.tone">{{ m.isolation.label }}@if (m.isolation.assistiveText) { <span class="emr-sr-only"> {{ m.isolation.assistiveText }}</span> }</span>
          }
          @if (m.allergyStatus) {
            <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.allergyStatus.tone">{{ m.allergyStatus.label }}</span>
          }
          @if (m.allergies.length) {
            @for (allergy of m.allergies.slice(0, 2); track allergy.id) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + allergy.tone">Allergy: {{ allergy.label }}</span>
            }
            @if (m.allergies.length > 2) { <span class="emr-badge emr-tone-danger">+{{ m.allergies.length - 2 }} allergies</span> }
          }
        </div>
        <button class="emr-icon-button" type="button" [attr.aria-expanded]="m.expanded" [attr.aria-controls]="m.expanded ? detailsElementId() : null"
          [attr.aria-label]="m.expanded ? 'Hide patient details' : 'Show patient details'" (click)="intent.emit({ type: 'expandedChangeRequested', expanded: !m.expanded })">
          <ng-icon [name]="m.expanded ? 'heroChevronUp' : 'heroChevronDown'" size="20" aria-hidden="true" />
        </button>
      </div>
      @if (m.expanded) {
        <div class="emr-patient-banner__secondary" [id]="detailsElementId()">
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">Current encounter</span>
            <strong>{{ m.careSettingLabel }} · {{ m.locationLabel }}</strong>
            @if (m.encounterLabel) { <div>{{ m.encounterLabel }}</div> }
            @if (m.admittedOnLabel) { <div class="emr-field__hint">Admitted: {{ m.admittedOnLabel }}</div> }
            @if (m.admittingClinicianLabel) { <div class="emr-field__hint">Admitting clinician: {{ m.admittingClinicianLabel }}</div> }
            @for (identifier of m.identifiers; track identifier.label) {
              <div class="emr-field__hint">{{ identifier.label }}: {{ identifier.value }}</div>
            }
          </div>
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">Chronic diseases</span>
            <div class="emr-chip-row">@if (m.chronicDiseaseStatus) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.chronicDiseaseStatus.tone">{{ m.chronicDiseaseStatus.label }}</span> } @for (item of m.chronicDiseases; track item.id) { <span class="emr-chip" [class]="'emr-chip emr-tone-' + item.tone">{{ item.label }}</span> }</div>
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
  readonly model = input.required<PatientBannerViewModel>();
  readonly idPrefix = input('emr-patient-banner');
  readonly intent = output<PatientBannerIntent>();
  readonly detailsElementId = computed(() => `${this.idPrefix()}-details`);
  readonly primaryIdentifier = computed(() => this.model().identifiers[0]?.value ?? this.model().patientId);
  readonly combinedAlerts = computed<readonly PatientAlert[]>(() => [...this.model().allergies, ...this.model().alerts]);
}
