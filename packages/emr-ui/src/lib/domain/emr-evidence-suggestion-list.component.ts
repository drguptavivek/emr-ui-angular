import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowUturnLeft, heroCheck, heroClock, heroExclamationCircle, heroInformationCircle, heroLink, heroPencil, heroPencilSquare, heroXMark } from '@ng-icons/heroicons/outline';
import type { ClinicalFieldValue, EmrValidationMessage, FieldSuggestion, NoteCaptureIntent, NoteCaptureViewModel } from '@drguptavivek/emr-controller';

let nextSuggestionListId = 0;

interface Snippet { readonly text: string; readonly time: string; }
interface RowView { readonly s: FieldSuggestion; readonly n: number; readonly on: boolean; readonly snippets: readonly Snippet[]; }
interface GroupView { readonly id: string; readonly label?: string; readonly rows: readonly RowView[]; }
type EditKind = 'select' | 'number' | 'date' | 'multiline' | 'text';

const STATUS: Record<FieldSuggestion['status'], { label: string; tone: string; icon: string }> = {
  pending: { label: 'Needs review', tone: 'warning', icon: 'heroClock' },
  accepted: { label: 'Accepted', tone: 'success', icon: 'heroCheck' },
  edited: { label: 'Edited', tone: 'info', icon: 'heroPencil' },
  rejected: { label: 'Rejected', tone: 'neutral', icon: 'heroXMark' },
};

/**
 * Right half of evidence-linked note capture: the suggested field values. Each row carries the same field
 * number the transcript shows beside the passage it came from, plus the quoted passage itself, so the link
 * is readable without the transcript on screen. Selecting a row asks the controller to highlight its
 * passages; nothing is applied to the form from here.
 */
@Component({
  selector: 'emr-evidence-suggestion-list',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroArrowUturnLeft, heroCheck, heroClock, heroExclamationCircle, heroInformationCircle, heroLink, heroPencil, heroPencilSquare, heroXMark })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sl" [attr.aria-labelledby]="titleId()">
      <header class="sl__head">
        <div class="sl__title">
          <p class="sl__eyebrow">{{ model.title }}</p>
          <h3 class="sl__name" [id]="titleId()">Suggested fields</h3>
          <p class="sl__count">{{ model.suggestions.length }} {{ model.suggestions.length === 1 ? 'suggestion' : 'suggestions' }} · {{ pending }} to review</p>
        </div>
        <div class="sl__tools">
          @if (!model.readOnly) {
            <button type="button" class="emr-button emr-button--small" [disabled]="!pending" (click)="intent.emit({ type: 'acceptAllPendingRequested' })">
              <ng-icon name="heroCheck" size="18" aria-hidden="true" />Accept all pending ({{ pending }})
            </button>
          }
          <button type="button" class="emr-button emr-button--small emr-button--outline" [disabled]="!highlighted" (click)="intent.emit({ type: 'highlightClearRequested' })">
            <ng-icon name="heroXMark" size="18" aria-hidden="true" />Clear highlight
          </button>
        </div>
      </header>

      <p class="sl__linked" role="status" [class.sl__linked--on]="highlighted">
        @if (highlighted) {
          <ng-icon name="heroLink" size="18" aria-hidden="true" /><span>Highlighted: {{ linkedText }}. The matching passage is marked in the transcript.</span>
        }
      </p>
      @if (model.summarising) { <p class="sl__busy" role="status"><ng-icon name="heroClock" size="18" aria-hidden="true" />Summarising the transcript…</p> }
      @if (model.summariseError) { <p class="sl__error" role="alert"><ng-icon name="heroExclamationCircle" size="18" aria-hidden="true" /><span>{{ model.summariseError }}</span></p> }

      <div #scroll class="sl__scroll" role="region" tabindex="0" aria-label="Suggested field list">
        @for (g of groups; track g.id) {
          <section class="sl__group" [attr.aria-labelledby]="g.label ? g.id : null">
            @if (g.label) { <h4 class="sl__group-name" [id]="g.id">{{ g.label }}</h4> }
            <ol class="sl__list" role="list">
              @for (r of g.rows; track r.s.id) {
                <li class="sl__row" [class.sl__row--on]="r.on" [class.sl__row--rejected]="r.s.status === 'rejected'" [attr.data-on]="r.on" [attr.aria-labelledby]="rowId(r.s, 'title')">
                  <span class="sl__num" [class.sl__num--on]="r.on" aria-hidden="true">{{ r.n }}</span>
                  <div class="sl__body">
                    <div class="sl__top">
                      <p class="sl__label" [id]="rowId(r.s, 'title')">
                        <button type="button" class="sl__select" [attr.aria-pressed]="r.on" (click)="intent.emit({ type: 'suggestionSelected', suggestionId: r.s.id })">{{ r.s.fieldLabel }}<span class="emr-sr-only">, show evidence in transcript</span></button>
                      </p>
                      <span class="sl__badges">
                        @if (r.s.confidence; as c) { <span class="emr-badge" [class]="'emr-badge emr-tone-' + c.tone">{{ c.label }}@if (c.assistiveText) { <span class="emr-sr-only"> {{ c.assistiveText }}</span> }</span> }
                        <span class="emr-badge" [class]="'emr-badge emr-tone-' + status(r.s).tone"><ng-icon [name]="status(r.s).icon" size="14" aria-hidden="true" />{{ status(r.s).label }}</span>
                      </span>
                    </div>

                    @if (r.s.status === 'edited' && r.s.editedValueLabel) {
                      <p class="sl__was"><span class="sl__key">Suggested</span><s>{{ r.s.valueLabel }}</s></p>
                      <p class="sl__value"><span class="sl__key">Edited</span><strong>{{ r.s.editedValueLabel }}</strong></p>
                    } @else {
                      <p class="sl__value" [class.sl__value--rejected]="r.s.status === 'rejected'"><strong>{{ r.s.valueLabel }}</strong></p>
                    }

                    @for (m of r.s.messages ?? []; track $index) {
                      <p class="sl__msg" [class.sl__msg--error]="m.severity === 'error'"><ng-icon [name]="icon(m)" size="16" aria-hidden="true" /><span><span class="emr-sr-only">{{ m.severity }}: </span>{{ m.message }}</span></p>
                    }

                    <div class="sl__evidence">
                      <p class="sl__ev-head"><ng-icon name="heroLink" size="16" aria-hidden="true" />{{ evidenceText(r.s) }}</p>
                      @for (q of r.snippets; track $index) { <p class="sl__quote"><q>{{ q.text }}</q> <span class="sl__time">{{ q.time }}</span></p> }
                    </div>

                    @if (editingId === r.s.id) {
                      <form class="sl__edit" (submit)="$event.preventDefault(); save(r.s)">
                        <label class="sl__edit-label" [for]="rowId(r.s, 'edit')">New value for {{ r.s.fieldLabel }}</label>
                        @switch (kind(r.s)) {
                          @case ('select') {
                            <select class="emr-select" [id]="rowId(r.s, 'edit')" (change)="draft = $any($event.target).value">
                              @for (o of r.s.options ?? []; track o.value) { <option [value]="o.value" [selected]="o.value === draft" [disabled]="!!o.disabled">{{ o.label }}</option> }
                            </select>
                          }
                          @case ('number') { <input class="emr-control" type="number" inputmode="decimal" step="any" [id]="rowId(r.s, 'edit')" [value]="draft" (input)="draft = $any($event.target).value" (keydown.escape)="cancel(r.s)" /> }
                          @case ('date') { <input class="emr-control" type="date" [id]="rowId(r.s, 'edit')" [value]="draft" (input)="draft = $any($event.target).value" (keydown.escape)="cancel(r.s)" /> }
                          @case ('multiline') { <textarea class="emr-control" rows="3" [id]="rowId(r.s, 'edit')" [value]="draft" (input)="draft = $any($event.target).value" (keydown.escape)="cancel(r.s)"></textarea> }
                          @default { <input class="emr-control" type="text" [id]="rowId(r.s, 'edit')" [value]="draft" (input)="draft = $any($event.target).value" (keydown.escape)="cancel(r.s)" /> }
                        }
                        <div class="sl__actions">
                          <button type="submit" class="emr-button emr-button--small" [disabled]="!valid(r.s)" [attr.aria-label]="'Save edited value for ' + r.s.fieldLabel"><ng-icon name="heroCheck" size="18" aria-hidden="true" />Save</button>
                          <button type="button" class="emr-button emr-button--small emr-button--ghost" [attr.aria-label]="'Cancel editing ' + r.s.fieldLabel" (click)="cancel(r.s)">Cancel</button>
                        </div>
                      </form>
                    } @else if (!model.readOnly) {
                      <div class="sl__actions">
                        @if (r.s.status === 'pending') {
                          <button type="button" class="emr-button emr-button--small" [attr.aria-label]="'Accept suggestion for ' + r.s.fieldLabel" (click)="intent.emit({ type: 'suggestionAccepted', suggestionId: r.s.id })"><ng-icon name="heroCheck" size="18" aria-hidden="true" />Accept</button>
                        }
                        @if (r.s.status !== 'rejected') {
                          <button type="button" class="emr-button emr-button--small emr-button--outline" [attr.aria-label]="'Edit suggestion for ' + r.s.fieldLabel" [attr.data-edit]="r.s.id" (click)="startEdit(r.s)"><ng-icon name="heroPencilSquare" size="18" aria-hidden="true" />Edit</button>
                          <button type="button" class="emr-button emr-button--small emr-button--danger" [attr.aria-label]="'Reject suggestion for ' + r.s.fieldLabel" (click)="intent.emit({ type: 'suggestionRejected', suggestionId: r.s.id })"><ng-icon name="heroXMark" size="18" aria-hidden="true" />Reject</button>
                        }
                        @if (r.s.status !== 'pending') {
                          <button type="button" class="emr-button emr-button--small emr-button--ghost" [attr.aria-label]="'Reopen suggestion for ' + r.s.fieldLabel" (click)="intent.emit({ type: 'suggestionReopened', suggestionId: r.s.id })"><ng-icon name="heroArrowUturnLeft" size="18" aria-hidden="true" />Reopen</button>
                        }
                      </div>
                    }
                  </div>
                </li>
              }
            </ol>
          </section>
        } @empty {
          <p class="emr-empty sl__empty">No suggestions yet. Add to the transcript, then choose Summarise into fields.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);min-width:0}
    ng-icon{flex:none}
    .sl{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;display:grid;gap:12px;min-width:0}
    .sl__head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px 12px;flex-wrap:wrap}
    .sl__title{min-width:0}
    .sl__eyebrow{margin:0 0 2px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);letter-spacing:.08em;text-transform:uppercase;overflow-wrap:anywhere}
    .sl__name{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight)}
    .sl__count{margin:2px 0 0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .sl__tools{display:flex;flex-wrap:wrap;gap:8px}
    .sl__linked{margin:0;display:flex;align-items:center;gap:8px;font-size:var(--emr-text-md)}
    .sl__linked:empty{display:none}
    .sl__linked--on{padding:8px 12px;border-radius:8px;border-left:4px solid var(--emr-warning);background:var(--emr-warning-soft);font-weight:var(--emr-weight-medium)}
    .sl__busy{margin:0;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:var(--emr-info-soft);color:var(--emr-info);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .sl__error{margin:0;display:flex;gap:8px;align-items:flex-start;padding:8px 12px;border-radius:8px;border-left:4px solid var(--emr-danger);background:var(--emr-danger-soft);color:var(--emr-danger);font-size:var(--emr-text-md);font-weight:var(--emr-weight-medium)}
    .sl__scroll{max-height:var(--sl-max,34rem);overflow:auto;display:grid;gap:12px;align-content:start;padding:2px}
    .sl__scroll:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:2px}
    .sl__group-name{margin:0 0 6px;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.08em;text-transform:uppercase;color:var(--emr-text-muted)}
    .sl__list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
    .sl__row{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;padding:10px 12px;border:1px solid var(--emr-border);border-left:4px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .sl__row--on{background:var(--emr-warning-soft);border-color:var(--emr-text);border-left:8px solid var(--emr-warning);box-shadow:0 0 0 1px var(--emr-text)}
    .sl__num{display:inline-flex;align-items:center;justify-content:center;min-width:1.75em;height:1.75em;padding:0 .4em;border-radius:999px;border:1px solid var(--emr-info);background:var(--emr-surface);color:var(--emr-info);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold);line-height:1}
    .sl__num--on{background:var(--emr-text);border-color:var(--emr-text);color:var(--emr-surface)}
    .sl__body{min-width:0;display:grid;gap:6px}
    .sl__top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:6px 10px}
    .sl__label{margin:0;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .sl__select{all:unset;cursor:pointer}
    .sl__select::after{content:'';position:absolute;inset:0;border-radius:8px}
    .sl__select:focus-visible::after{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:2px}
    .sl__badges{display:flex;flex-wrap:wrap;gap:6px;pointer-events:none}
    .sl__value,.sl__was{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;font-size:var(--emr-text-lg);overflow-wrap:anywhere}
    .sl__was{font-size:var(--emr-text-md);color:var(--emr-text-muted)}
    .sl__value--rejected strong{text-decoration:line-through;color:var(--emr-text-muted)}
    .sl__key{font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);letter-spacing:.06em;text-transform:uppercase;color:var(--emr-text-muted)}
    .sl__msg{margin:0;display:flex;gap:6px;align-items:flex-start;font-size:var(--emr-text-md);color:var(--emr-warning);font-weight:var(--emr-weight-medium)}
    .sl__msg--error{color:var(--emr-danger)}
    .sl__evidence{display:grid;gap:2px;padding-left:10px;border-left:2px solid var(--emr-info)}
    .sl__ev-head{margin:0;display:flex;align-items:center;gap:6px;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);color:var(--emr-text-muted);letter-spacing:.02em}
    .sl__quote{margin:0;font-size:var(--emr-text-md);line-height:var(--emr-leading-normal);overflow-wrap:anywhere}
    .sl__quote q{font-style:italic}
    .sl__time{margin-left:6px;font-family:var(--emr-font-mono);font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .sl__actions{display:flex;flex-wrap:wrap;gap:8px;position:relative;z-index:1}
    .sl__edit{display:grid;gap:8px;position:relative;z-index:1}
    .sl__edit-label{font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .sl__empty{min-height:120px}
    @media(max-width:480px){.sl{padding:12px}.sl__actions .emr-button{flex:1 1 auto}.sl__tools,.sl__tools .emr-button{flex:1 1 auto}}
    @media print{.sl__scroll{max-height:none;overflow:visible}.sl__actions,.sl__edit,.sl__tools{display:none}.sl__row{break-inside:avoid}}
  `],
})
export class EmrEvidenceSuggestionListComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) model!: NoteCaptureViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<NoteCaptureIntent>();

  @ViewChild('scroll') private scroll?: ElementRef<HTMLElement>;

  protected readonly uid = `emr-suggestions-${++nextSuggestionListId}`;
  protected groups: readonly GroupView[] = [];
  protected pending = 0;
  protected highlighted = false;
  protected linkedText = '';
  protected editingId: string | null = null;
  protected draft = '';
  private reveal = false;
  private lastHighlight = '';
  private refocus: string | null = null;

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }
  rowId(s: FieldSuggestion, part: string): string { return `${this.uid}-${this.model.suggestions.indexOf(s)}-${part}`; }
  status(s: FieldSuggestion) { return STATUS[s.status]; }
  icon(m: EmrValidationMessage): string { return m.severity === 'info' ? 'heroInformationCircle' : 'heroExclamationCircle'; }

  evidenceText(s: FieldSuggestion): string {
    const n = s.spanIds.length;
    return n ? `Evidence: ${n} ${n === 1 ? 'passage' : 'passages'} in the transcript` : 'No transcript evidence';
  }

  ngOnChanges(): void {
    const { suggestions, spans, segments, highlightedSuggestionIds, highlightedSpanIds } = this.model;
    const on = new Set(highlightedSuggestionIds);
    const spanById = new Map(spans.map((s) => [s.id, s] as const));
    const segmentById = new Map(segments.map((s) => [s.id, s] as const));
    const rows = suggestions.map((s, i): RowView => ({
      s, n: i + 1, on: on.has(s.id),
      snippets: s.spanIds.flatMap((id) => {
        const span = spanById.get(id);
        const segment = span ? segmentById.get(span.segmentId) : undefined;
        const text = span && segment ? segment.text.slice(span.start, span.end).trim() : '';
        return text ? [{ text, time: segment?.timeLabel ?? '' }] : [];
      }),
    }));

    const groups: { id: string; label?: string; rows: RowView[] }[] = [];
    for (const row of rows) {
      let group = groups.find((g) => g.label === row.s.sectionLabel);
      if (!group) { group = { id: `${this.uid}-g${groups.length}`, label: row.s.sectionLabel, rows: [] }; groups.push(group); }
      group.rows.push(row);
    }
    this.groups = groups;
    this.pending = suggestions.filter((s) => s.status === 'pending').length;
    this.highlighted = highlightedSuggestionIds.length > 0 || highlightedSpanIds.length > 0;
    const shown = rows.filter((r) => r.on);
    this.linkedText = shown.length ? shown.map((r) => `${r.n} ${r.s.fieldLabel}`).join(', ') : 'no fields link to this passage';

    const key = highlightedSuggestionIds.join('|');
    if (key !== this.lastHighlight) { this.lastHighlight = key; this.reveal = key !== ''; }
  }

  /** Keeps the highlighted row visible inside the list's own scroll area, and returns focus to Edit after an edit closes. */
  ngAfterViewChecked(): void {
    const region = this.scroll?.nativeElement;
    if (this.refocus) {
      const edit = region?.querySelector<HTMLElement>(`[data-edit="${this.refocus}"]`);
      this.refocus = null;
      edit?.focus();
    }
    if (!this.reveal) return;
    this.reveal = false;
    const target = region?.querySelector<HTMLElement>('[data-on="true"]');
    if (!region || !target) return;
    const r = region.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (t.top < r.top || t.bottom > r.bottom) region.scrollTop += t.top - r.top - (r.height - t.height) / 2;
  }

  kind(s: FieldSuggestion): EditKind {
    if (s.valueType === 'select' && s.options?.length) return 'select';
    if (s.valueType === 'integer' || s.valueType === 'decimal') return 'number';
    if (s.valueType === 'date') return 'date';
    return s.valueType === 'multiline' ? 'multiline' : 'text';
  }

  startEdit(s: FieldSuggestion): void {
    const current = s.status === 'edited' ? s.editedValue : s.value;
    this.draft = typeof current === 'string' || typeof current === 'number' ? String(current) : s.status === 'edited' ? s.editedValueLabel ?? s.valueLabel : s.valueLabel;
    if (this.kind(s) === 'select' && !s.options?.some((o) => o.value === this.draft)) this.draft = s.options?.[0]?.value ?? '';
    this.editingId = s.id;
  }

  cancel(s: FieldSuggestion): void { this.editingId = null; this.refocus = s.id; }

  valid(s: FieldSuggestion): boolean {
    const text = this.draft.trim();
    return this.kind(s) === 'number' ? text !== '' && Number.isFinite(Number(text)) : text !== '';
  }

  save(s: FieldSuggestion): void {
    if (!this.valid(s)) return;
    const text = this.draft.trim();
    const value: ClinicalFieldValue = this.kind(s) === 'number' ? Number(text) : text;
    this.editingId = null;
    this.refocus = s.id;
    this.intent.emit({ type: 'suggestionEdited', suggestionId: s.id, value });
  }
}
