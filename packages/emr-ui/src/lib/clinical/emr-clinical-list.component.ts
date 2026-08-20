import { ChangeDetectionStrategy, Component, Directive, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroQueueList } from '@ng-icons/heroicons/outline';
import { ClinicalListItem } from '@drguptavivek/emr-controller';

export type ClinicalListAction =
  | { type: 'addRequested' }
  | { type: 'selected'; id: string }
  | { type: 'editRequested'; id: string }
  | { type: 'removeRequested'; id: string };

@Component({
  selector: 'emr-clinical-list',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroQueueList })],
  template: `
    <section [attr.aria-labelledby]="headingId">
      <div class="emr-panel__header">
        <ng-icon class="emr-card-header-icon" name="heroQueueList" aria-hidden="true" />
        <h2 class="emr-panel__title" [id]="headingId">{{ title }}</h2>
        @if (allowAdd) { <button class="emr-button emr-button--small" type="button" (click)="action.emit({ type: 'addRequested' })">Add</button> }
      </div>
      @if (items.length === 0) {
        <div class="emr-empty">{{ emptyMessage }}</div>
      } @else {
        <div class="emr-list">
          @for (item of items; track item.id) {
            <article class="emr-list__item">
              <button class="emr-table__select" type="button" (click)="action.emit({ type: 'selected', id: item.id })">
                <span class="emr-list__title">{{ item.title }}</span>
                @if (item.subtitle) { <span class="emr-list__subtitle">{{ item.subtitle }}</span> }
                @if (item.detail) { <span class="emr-list__detail">{{ item.detail }}</span> }
                @if (item.badges?.length) {
                  <span class="emr-chip-row">@for (badge of item.badges; track badge.label) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + badge.tone">{{ badge.label }}</span> }</span>
                }
              </button>
              @if (!item.readOnly) {
                <div class="emr-list__actions">
                  <button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Edit ' + item.title" (click)="action.emit({ type: 'editRequested', id: item.id })">Edit</button>
                  <button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Remove ' + item.title" (click)="action.emit({ type: 'removeRequested', id: item.id })">Remove</button>
                </div>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrClinicalListComponent {
  @Input() headingId = 'emr-clinical-list-title';
  @Input() title = 'Clinical information';
  @Input() emptyMessage = 'Status not supplied.';
  @Input() items: readonly ClinicalListItem[] = [];
  @Input() allowAdd = true;
  @Output() readonly action = new EventEmitter<ClinicalListAction>();
}

@Directive()
abstract class DomainListBase {
  @Input() items: readonly ClinicalListItem[] = [];
  @Input() allowAdd = true;
  /** Empty collections have no clinical meaning; the controller supplies the status wording. */
  @Input() emptyMessage = 'Status not supplied.';
  @Output() readonly action = new EventEmitter<ClinicalListAction>();
}

@Component({
  selector: 'emr-medication-list', standalone: true, imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list headingId="emr-medication-list-title" title="Medications" [emptyMessage]="emptyMessage" [items]="items" [allowAdd]="allowAdd" (action)="action.emit($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrMedicationListComponent extends DomainListBase {}

@Component({
  selector: 'emr-allergy-list', standalone: true, imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list headingId="emr-allergy-list-title" title="Allergies" [emptyMessage]="emptyMessage" [items]="items" [allowAdd]="allowAdd" (action)="action.emit($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrAllergyListComponent extends DomainListBase {}

@Component({
  selector: 'emr-chronic-disease-list', standalone: true, imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list headingId="emr-chronic-list-title" title="Chronic diseases" [emptyMessage]="emptyMessage" [items]="items" [allowAdd]="allowAdd" (action)="action.emit($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrChronicDiseaseListComponent extends DomainListBase {}

@Component({
  selector: 'emr-personal-history-list', standalone: true, imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list headingId="emr-history-list-title" title="Significant personal history" [emptyMessage]="emptyMessage" [items]="items" [allowAdd]="allowAdd" (action)="action.emit($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrPersonalHistoryListComponent extends DomainListBase {}
