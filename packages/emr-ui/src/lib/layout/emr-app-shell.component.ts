import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'emr-app-shell',
  standalone: true,
  template: `
    <div class="emr-root emr-shell" [class.emr-theme-dark]="theme === 'dark'" [class.emr-theme-light]="theme === 'light'">
      <aside><ng-content select="[emrShellNavigation]" /></aside>
      <main class="emr-shell__main"><ng-content /></main>
      <ng-content select="[emrShellOverlay]" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrAppShellComponent {
  @Input() theme: 'light' | 'dark' = 'light';
}
