import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroCheckCircle, heroExclamationTriangle, heroLockClosed, heroPencilSquare } from '@ng-icons/heroicons/outline';
import type { CaptureStatusBarIntent, CaptureStatusBarViewModel } from '@drguptavivek/emr-controller';

let nextCaptureStatusId = 0;

type StateKind = 'saving' | 'failed' | 'conflict' | 'dirty' | 'saved' | 'clean';
const STATE_TEXT: Record<StateKind, string> = {
  saving: 'Saving…',
  failed: 'Not saved',
  conflict: 'Not saved: conflict',
  dirty: 'Unsaved changes',
  saved: 'Saved',
  clean: 'No changes'
};
const STATE_ICON: Record<StateKind, string> = {
  saving: 'heroArrowPath',
  failed: 'heroExclamationTriangle',
  conflict: 'heroExclamationTriangle',
  dirty: 'heroPencilSquare',
  saved: 'heroCheckCircle',
  clean: 'heroCheckCircle'
};

@Component({
  selector: 'emr-capture-status-bar',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroArrowPath, heroCheckCircle, heroExclamationTriangle, heroLockClosed, heroPencilSquare })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="cs" [attr.aria-labelledby]="titleId()">
      <h3 class="emr-sr-only" [id]="titleId()">Record status</h3>

      <div class="cs__row">
        <div class="cs__state" role="status" [attr.aria-busy]="model.session.saving ? 'true' : null" [class]="'cs__state--' + kind()">
          <ng-icon [name]="icon()" aria-hidden="true" />
          <span><strong>{{ stateText() }}</strong>@if (model.session.savedAt) { <span class="cs__muted"> · {{ kind() === 'saved' ? '' : 'Last saved ' }}{{ model.savedAtLabel || 'time not supplied' }}</span> }</span>
        </div>

        <p class="cs__author">
          <span class="cs__key">Author</span>
          @if (model.attributionLabel) { {{ model.attributionLabel }} }
          @else if (model.attribution; as a) {
            Recorded by {{ a.recordedBy }}@if (a.role) { ({{ a.role }}) }@if (a.amendedBy) { · Amended by {{ a.amendedBy }} }
          }
          @else { <span class="cs__muted">Not supplied</span> }
        </p>

        @if (model.readOnly) { <span class="emr-badge emr-tone-neutral"><ng-icon name="heroLockClosed" aria-hidden="true" /> Read-only</span> }

        @if (model.signature; as sig) {
          <span class="cs__sig">
            <span class="cs__key">Signature</span>
            <span class="emr-badge" [class]="'emr-tone-' + sig.status.tone">{{ sig.status.label }}@if (sig.status.assistiveText) { <span class="emr-sr-only"> {{ sig.status.assistiveText }}</span> }</span>
            @if (!model.readOnly && sig.canSign) { <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="intent.emit({ type: 'signRequested' })">Sign</button> }
            @if (!model.readOnly && sig.canAmend) { <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="intent.emit({ type: 'amendRequested' })">Amend</button> }
          </span>
        }

        @if (canAct()) {
          <span class="cs__actions">
            <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="intent.emit({ type: 'discardRequested' })">Discard changes</button>
            <button class="emr-button emr-button--small" type="button" (click)="intent.emit({ type: 'saveRequested' })">{{ model.session.error ? 'Retry save' : 'Save' }}</button>
          </span>
        }
      </div>

      @if (model.session.error) {
        <p class="cs__alert cs__alert--danger" role="alert"><ng-icon name="heroExclamationTriangle" aria-hidden="true" /> <span><strong>Save failed.</strong> {{ model.session.error }}</span></p>
      }

      @if (model.session.conflict; as c) {
        <div class="cs__alert cs__alert--warning" role="alert">
          <ng-icon name="heroExclamationTriangle" aria-hidden="true" />
          <div class="cs__conflict">
            <p class="cs__line"><strong>Someone else changed this record.</strong>
              {{ conflictSentence(c) }}</p>
            @if (model.conflictLabels?.length) {
              <ul class="cs__paths" aria-label="Fields in conflict">@for (l of model.conflictLabels; track $index) { <li>{{ l }}</li> }</ul>
            }
            <span class="cs__actions cs__actions--start">
              @if (!model.readOnly) {
                <button class="emr-button emr-button--small" type="button" (click)="intent.emit({ type: 'conflictResolutionRequested', resolution: 'keepLocal' })">Keep my version</button>
                <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="intent.emit({ type: 'conflictResolutionRequested', resolution: 'keepRemote' })">Keep their version</button>
                <button class="emr-button emr-button--small emr-button--outline" type="button" (click)="intent.emit({ type: 'conflictResolutionRequested', resolution: 'merge' })">Merge</button>
              }
              <button class="emr-button emr-button--small emr-button--ghost" type="button" (click)="intent.emit({ type: 'conflictDetailRequested' })">Show differences</button>
            </span>
          </div>
        </div>
      }

      @if (model.signature?.signatories?.length) {
        <ul class="cs__signers" aria-label="Signatories">
          @for (s of model.signature!.signatories; track s.id) {
            <li class="cs__signer">
              <span class="cs__who"><strong>{{ s.displayName }}</strong><span class="cs__muted">{{ s.roleLabel }}</span></span>
              <span class="emr-badge" [class]="'emr-tone-' + s.status.tone">{{ s.status.label }}@if (s.status.assistiveText) { <span class="emr-sr-only"> {{ s.status.assistiveText }}</span> }</span>
              <span class="cs__when"><span class="cs__key">Signed</span> {{ s.signedAtLabel || 'Not supplied' }}</span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .cs{border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);padding:8px 12px;display:grid;gap:8px;break-inside:avoid}
    .cs__row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;min-width:0}
    .cs__state{display:inline-flex;align-items:center;gap:6px;min-height:var(--emr-compact-height);font-size:var(--emr-text-md)}
    .cs__state--dirty{color:var(--emr-warning)}
    .cs__state--failed,.cs__state--conflict{color:var(--emr-danger)}
    .cs__state--saved{color:var(--emr-success)}
    .cs__state ng-icon{flex:none;font-size:1.25rem}
    .cs__state strong{font-weight:var(--emr-weight-bold)}
    .cs__state .cs__muted{color:var(--emr-text-muted);font-weight:var(--emr-weight-regular)}
    .cs__muted{color:var(--emr-text-muted)}
    .cs__author{margin:0;font-size:var(--emr-text-md);min-width:0;overflow-wrap:anywhere}
    .cs__key{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.06em;text-transform:uppercase;color:var(--emr-text-muted);margin-inline-end:4px}
    .cs__sig{display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px}
    .cs__actions{margin-inline-start:auto;display:inline-flex;flex-wrap:wrap;gap:8px}
    .cs__actions--start{margin-inline-start:0}
    .cs__alert{margin:0;display:flex;gap:8px;align-items:flex-start;padding:8px 12px;border-radius:8px;border:1px solid;background:var(--emr-surface);color:var(--emr-text);font-size:var(--emr-text-md)}
    .cs__alert ng-icon{flex:none;margin-top:2px;font-size:1.25rem}
    .cs__alert--danger{border-color:var(--emr-danger);background:var(--emr-danger-soft)}
    .cs__alert--warning{border-color:var(--emr-warning);background:var(--emr-warning-soft)}
    .cs__conflict{display:grid;gap:8px;min-width:0}
    .cs__line{margin:0}
    .cs__paths{margin:0;padding-inline-start:20px}
    .cs__signers{list-style:none;margin:0;padding:8px 0 0;border-top:1px solid var(--emr-border);display:grid;gap:4px}
    .cs__signer{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-height:var(--emr-compact-height);font-size:var(--emr-text-md)}
    .cs__who{flex:1 1 14rem;min-width:0;overflow-wrap:anywhere;display:flex;flex-wrap:wrap;gap:0 8px}
    .cs__when{color:var(--emr-text-muted)}
    @media (max-width:480px){.cs__actions{margin-inline-start:0;width:100%}.cs__actions .emr-button{flex:1 1 auto}}
  `]
})
export class EmrCaptureStatusBarComponent {
  @Input({ required: true }) model!: CaptureStatusBarViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<CaptureStatusBarIntent>();

  private readonly generatedId = `emr-capture-status-${++nextCaptureStatusId}`;
  titleId(): string { return this.headingId ?? this.generatedId; }

  /** Precedence is display-only: what to say first, not a verdict about the record. */
  kind(): StateKind {
    const s = this.model.session;
    if (s.saving) return 'saving';
    if (s.error) return 'failed';
    if (s.conflict) return 'conflict';
    if (s.dirty) return 'dirty';
    return s.savedAt ? 'saved' : 'clean';
  }
  stateText(): string { return STATE_TEXT[this.kind()]; }
  icon(): string { return STATE_ICON[this.kind()]; }

  /** Revision numbers are printed as supplied; the component never compares them. */
  conflictSentence(c: NonNullable<CaptureStatusBarViewModel['session']['conflict']>): string {
    const by = c.remoteAuthor ? ` by ${c.remoteAuthor}` : '';
    return `Their version is revision ${c.remoteRevision}${by}; yours was based on revision ${c.localRevision}.`;
  }

  /** Save and discard only while there is something to save and nothing blocks it. */
  canAct(): boolean {
    const s = this.model.session;
    return !this.model.readOnly && !s.saving && !s.conflict && (s.dirty || !!s.error);
  }
}
