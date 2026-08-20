import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { EmrTone } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-badge',
  standalone: true,
  template: `<span class="emr-badge" [class]="'emr-badge emr-tone-' + tone"><ng-content /></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrBadgeComponent { @Input() tone: EmrTone = 'neutral'; }

@Component({
  selector: 'emr-chip',
  standalone: true,
  template: `<span class="emr-chip" [class]="'emr-chip emr-tone-' + tone"><ng-content /></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrChipComponent { @Input() tone: EmrTone = 'neutral'; }

@Component({
  selector: 'emr-alert',
  standalone: true,
  template: `<div class="emr-alert" [class]="'emr-alert emr-tone-' + tone" role="status"><div><div class="emr-alert__title">{{ title }}</div><div class="emr-alert__body"><ng-content /></div></div></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrAlertComponent {
  @Input() tone: EmrTone = 'info';
  @Input() title = '';
}

@Component({
  selector: 'emr-state-message',
  standalone: true,
  template: `<div class="emr-empty" [attr.role]="kind === 'error' ? 'alert' : 'status'"><div><strong>{{ title }}</strong>@if (message) { <div>{{ message }}</div> }<ng-content /></div></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrStateMessageComponent {
  @Input() kind: 'empty' | 'loading' | 'error' = 'empty';
  @Input() title = '';
  @Input() message = '';
}
