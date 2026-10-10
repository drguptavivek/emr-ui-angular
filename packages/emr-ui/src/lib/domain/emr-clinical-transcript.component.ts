import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroExclamationTriangle, heroMicrophone, heroPencilSquare, heroSparkles, heroStop } from '@ng-icons/heroicons/outline';
import type { EvidenceSpan, NoteCaptureIntent, NoteCaptureViewModel, TranscriptSegment } from '@drguptavivek/emr-controller';

let nextTranscriptId = 0;

/** One highlighted passage inside a segment, with the numbers of the fields it feeds. */
interface SpanView { readonly id: string; readonly on: boolean; readonly marks: readonly number[]; readonly describedBy: string; }
interface Piece { readonly text: string; readonly span?: SpanView; }
interface FeedView { readonly n: number; readonly label: string; }
interface SegmentView { readonly segment: TranscriptSegment; readonly pieces: readonly Piece[]; readonly feeds: readonly FeedView[]; }
interface DescriptionView { readonly id: string; readonly text: string; }

/**
 * Left half of evidence-linked note capture: the transcript. Evidence spans are inline buttons that carry
 * the same field numbers the suggestion list shows, so a passage and the fields it feeds can be matched by
 * number as well as by highlight. It owns only what is being typed or edited right now; every highlight and
 * every verdict comes from the model.
 */
@Component({
  selector: 'emr-clinical-transcript',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroExclamationTriangle, heroMicrophone, heroPencilSquare, heroSparkles, heroStop })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ct" [attr.aria-labelledby]="titleId()">
      <header class="ct__head">
        <div class="ct__title">
          <p class="ct__eyebrow">{{ model.title }}</p>
          <h3 class="ct__name" [id]="titleId()">Transcript</h3>
        </div>
        @if (!model.readOnly) {
          <button type="button" class="emr-button emr-button--small emr-button--outline" [disabled]="!model.canSummarise || !!model.summarising"
            [attr.aria-busy]="model.summarising ? 'true' : null" (click)="intent.emit({ type: 'summariseRequested' })">
            <ng-icon name="heroSparkles" size="18" aria-hidden="true" />{{ model.summarising ? 'Summarising…' : 'Summarise into fields' }}
          </button>
        }
      </header>

      <div class="ct__bar">
        <p class="ct__status" role="status" [class.ct__status--live]="model.dictation.status === 'listening'" [class.ct__status--bad]="model.dictation.status === 'error'">
          <ng-icon [name]="model.dictation.status === 'error' ? 'heroExclamationTriangle' : 'heroMicrophone'" size="18" aria-hidden="true" />
          <span>{{ model.dictation.label }}</span>
        </p>
        @if (!model.readOnly) {
          <div class="ct__dictate">
            <button type="button" class="emr-button emr-button--small emr-button--outline" [disabled]="!model.dictation.canStart" (click)="intent.emit({ type: 'dictationStartRequested' })">
              <ng-icon name="heroMicrophone" size="18" aria-hidden="true" />Start dictation
            </button>
            <button type="button" class="emr-button emr-button--small emr-button--outline" [disabled]="!model.dictation.canStop" (click)="intent.emit({ type: 'dictationStopRequested' })">
              <ng-icon name="heroStop" size="18" aria-hidden="true" />Stop
            </button>
          </div>
        }
      </div>
      @if (model.dictation.error) { <p class="ct__error" role="alert"><ng-icon name="heroExclamationTriangle" size="18" aria-hidden="true" /><span>{{ model.dictation.error }}</span></p> }

      <div #scroll class="ct__scroll" role="region" tabindex="0" aria-label="Transcript entries">
        @if (views.length) {
          <ol class="ct__segs" role="list">
            @for (v of views; track v.segment.id; let i = $index) {
              <li class="ct__seg">
                <div class="ct__meta">
                  @if (v.segment.timeLabel) { <span class="ct__time">{{ v.segment.timeLabel }}</span> }
                  @if (v.segment.speakerLabel) { <span class="ct__speaker">{{ v.segment.speakerLabel }}</span> }
                  <span class="ct__src">{{ v.segment.source === 'typed' ? 'Typed' : 'Spoken' }}</span>
                  @if (v.segment.editable && !model.readOnly && editingId !== v.segment.id) {
                    <button type="button" class="emr-icon-button ct__edit" [attr.aria-label]="'Edit text of ' + entryName(v.segment, i)" (click)="startEdit(v.segment)">
                      <ng-icon name="heroPencilSquare" size="18" aria-hidden="true" />
                    </button>
                  }
                </div>
                @if (editingId === v.segment.id) {
                  <form class="ct__editor" (submit)="$event.preventDefault(); saveEdit(v.segment)">
                    <label class="emr-sr-only" [for]="uid + '-edit'">Edit text of {{ entryName(v.segment, i) }}</label>
                    <textarea class="emr-control" rows="3" [id]="uid + '-edit'" [value]="editDraft" (input)="editDraft = $any($event.target).value"></textarea>
                    <p class="ct__note">Saving removes the evidence links from this entry, because the wording changes.</p>
                    <div class="ct__row">
                      <button type="submit" class="emr-button emr-button--small" [disabled]="!editDraft.trim()">Save text</button>
                      <button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="editingId = null">Cancel</button>
                    </div>
                  </form>
                } @else {
                  <p class="ct__text">@for (p of v.pieces; track $index) {@if (p.span; as sp) {<button type="button" class="ct__span" [class.ct__span--on]="sp.on" [attr.data-on]="sp.on" [attr.aria-pressed]="sp.on" [attr.aria-describedby]="sp.describedBy" (click)="intent.emit({ type: 'spanSelected', spanId: sp.id })">{{ p.text }}@for (m of sp.marks; track m) {<span class="ct__mark" aria-hidden="true">{{ m }}</span>}</button>} @else {{{ p.text }}}}</p>
                  @if (v.feeds.length) {
                    <p class="ct__feeds"><strong>Feeds {{ v.feeds.length }} {{ v.feeds.length === 1 ? 'field' : 'fields' }}</strong>
                      @for (f of v.feeds; track f.n) { <span class="ct__feed"><span class="ct__mark ct__mark--on" aria-hidden="true">{{ f.n }}</span>{{ f.label }}</span> }
                    </p>
                  }
                }
              </li>
            }
          </ol>
        } @else {
          <p class="emr-empty ct__empty">Nothing captured yet. Start dictation or type a note below.</p>
        }
        @for (d of descriptions; track d.id) { <span class="emr-sr-only" [id]="d.id">{{ d.text }}</span> }
      </div>

      @if (!model.readOnly) {
        <form class="ct__type" (submit)="$event.preventDefault(); append()">
          <label class="ct__type-label" [for]="uid + '-type'">Type a note</label>
          <textarea class="emr-control" rows="2" [id]="uid + '-type'" [value]="draft" placeholder="Type a finding to add to the transcript"
            (input)="draft = $any($event.target).value" (keydown.control.enter)="append()" (keydown.meta.enter)="append()"></textarea>
          <button type="submit" class="emr-button emr-button--small" [disabled]="!draft.trim()">Add to transcript</button>
        </form>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);min-width:0}
    ng-icon{flex:none}
    .ct{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;display:grid;gap:12px;min-width:0}
    .ct__head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
    .ct__title{min-width:0}
    .ct__eyebrow{margin:0 0 2px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);letter-spacing:.08em;text-transform:uppercase;overflow-wrap:anywhere}
    .ct__name{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight)}
    .ct__bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
    .ct__status{margin:0;display:inline-flex;align-items:center;gap:6px;min-height:var(--emr-compact-height);padding:0 12px;border-radius:999px;background:var(--emr-neutral-soft);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .ct__status--live{background:var(--emr-info-soft);color:var(--emr-info);outline:2px solid var(--emr-info);outline-offset:-2px}
    .ct__status--bad{background:var(--emr-danger-soft);color:var(--emr-danger)}
    .ct__dictate,.ct__row{display:flex;flex-wrap:wrap;gap:8px}
    .ct__error{margin:0;display:flex;gap:8px;align-items:flex-start;padding:8px 12px;border-radius:8px;border-left:4px solid var(--emr-danger);background:var(--emr-danger-soft);color:var(--emr-danger);font-size:var(--emr-text-md);font-weight:var(--emr-weight-medium)}
    .ct__scroll{max-height:var(--ct-max,30rem);overflow:auto;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-soft);padding:4px 12px}
    .ct__scroll:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:2px}
    .ct__segs{list-style:none;margin:0;padding:0}
    .ct__seg{padding:10px 0;border-bottom:1px solid var(--emr-border)}
    .ct__seg:last-child{border-bottom:0}
    .ct__meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-bottom:2px;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .ct__time{font-family:var(--emr-font-mono);font-weight:var(--emr-weight-bold);color:var(--emr-text)}
    .ct__speaker{font-weight:var(--emr-weight-bold);color:var(--emr-text)}
    .ct__src{border:1px solid var(--emr-border);border-radius:999px;padding:0 8px;line-height:1.6}
    .ct__edit{margin-left:auto;height:var(--emr-control-height)}
    .ct__text{margin:0;font-size:var(--emr-text-lg);line-height:2;overflow-wrap:anywhere;white-space:pre-wrap}
    .ct__span{font:inherit;color:inherit;line-height:1.6;text-align:inherit;cursor:pointer;margin:0 1px;padding:2px 3px;border:0;border-bottom:2px dotted var(--emr-info);border-radius:4px 4px 0 0;background:var(--emr-info-soft)}
    .ct__span:hover{background:var(--emr-warning-soft);border-bottom-style:solid}
    .ct__span:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:2px}
    .ct__span--on{background:var(--emr-warning-soft);border-bottom:4px solid var(--emr-warning);box-shadow:0 0 0 2px var(--emr-text)}
    .ct__mark{display:inline-flex;align-items:center;justify-content:center;min-width:1.5em;height:1.5em;padding:0 .35em;margin-left:.3em;border-radius:999px;border:1px solid var(--emr-info);background:var(--emr-surface);color:var(--emr-info);font-family:var(--emr-font-family);font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);line-height:1;vertical-align:middle}
    .ct__span--on .ct__mark,.ct__mark--on{background:var(--emr-text);border-color:var(--emr-text);color:var(--emr-surface)}
    .ct__feeds{margin:4px 0 0;display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;padding:6px 10px;border-radius:8px;border-left:4px solid var(--emr-warning);background:var(--emr-warning-soft);font-size:var(--emr-text-md)}
    .ct__feed{display:inline-flex;align-items:center;gap:2px}
    .ct__feed .ct__mark{margin-left:0;margin-right:.35em}
    .ct__editor{display:grid;gap:8px}
    .ct__note{margin:0;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .ct__empty{min-height:96px}
    .ct__type{display:grid;gap:6px;grid-template-columns:minmax(0,1fr) auto;align-items:end}
    .ct__type-label{grid-column:1 / -1;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    @media(max-width:480px){.ct{padding:12px}.ct__type{grid-template-columns:minmax(0,1fr)}.ct__dictate,.ct__dictate button{flex:1 1 auto}.ct__text{font-size:var(--emr-text-md)}}
    @media print{.ct__scroll{max-height:none;overflow:visible}.ct__bar button,.ct__dictate,.ct__type,.ct__edit,.ct__head button{display:none}.ct__span--on{box-shadow:none;border:2px solid currentColor}}
  `],
})
export class EmrClinicalTranscriptComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) model!: NoteCaptureViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<NoteCaptureIntent>();

  @ViewChild('scroll') private scroll?: ElementRef<HTMLElement>;

  protected readonly uid = `emr-transcript-${++nextTranscriptId}`;
  protected views: readonly SegmentView[] = [];
  protected descriptions: readonly DescriptionView[] = [];
  protected draft = '';
  protected editDraft = '';
  protected editingId: string | null = null;
  private reveal = false;
  private lastHighlight = '';

  /** 'entry 2 (Typed)' style name, so icon-only buttons stay distinguishable when time labels are blank. */
  entryName(segment: TranscriptSegment, index: number): string {
    return `entry ${index + 1}${segment.timeLabel ? ` at ${segment.timeLabel}` : ''}`;
  }

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }

  ngOnChanges(): void {
    const { segments, spans, suggestions, highlightedSpanIds } = this.model;
    const number = new Map(suggestions.map((s, i) => [s.id, i + 1] as const));
    const label = new Map(suggestions.map((s) => [s.id, s.fieldLabel] as const));
    const on = new Set(highlightedSpanIds);
    const descriptions: DescriptionView[] = [];

    this.views = segments.map((segment) => {
      const mine = spans.filter((s) => s.segmentId === segment.id);
      const pieces = this.split(segment.text, mine, (span): SpanView => {
        const known = span.suggestionIds.filter((id) => number.has(id));
        const describedBy = `${this.uid}-d${descriptions.length}`;
        descriptions.push({
          id: describedBy,
          text: known.length ? `Feeds ${known.length} ${known.length === 1 ? 'field' : 'fields'}: ${known.map((id) => label.get(id)).join(', ')}.` : 'Feeds no fields.'
        });
        return { id: span.id, on: on.has(span.id), marks: known.map((id) => number.get(id) ?? 0), describedBy };
      });
      const fed = new Set(pieces.flatMap((p) => (p.span?.on ? mine.find((s) => s.id === p.span?.id)?.suggestionIds ?? [] : [])));
      const feeds = suggestions.filter((s) => fed.has(s.id)).map((s) => ({ n: number.get(s.id) ?? 0, label: s.fieldLabel }));
      return { segment, pieces, feeds };
    });
    this.descriptions = descriptions;

    const key = highlightedSpanIds.join('|');
    if (key !== this.lastHighlight) { this.lastHighlight = key; this.reveal = key !== ''; }
  }

  /** Brings the first highlighted passage into view inside the transcript's own scroll area. Never scrolls the page. */
  ngAfterViewChecked(): void {
    if (!this.reveal) return;
    this.reveal = false;
    const region = this.scroll?.nativeElement;
    const target = region?.querySelector<HTMLElement>('[data-on="true"]');
    if (!region || !target) return;
    const r = region.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (t.top < r.top || t.bottom > r.bottom) region.scrollTop += t.top - r.top - (r.height - t.height) / 2;
  }

  append(): void {
    const text = this.draft.trim();
    if (!text || this.model.readOnly) return;
    this.intent.emit({ type: 'textAppendRequested', text });
    this.draft = '';
  }

  startEdit(segment: TranscriptSegment): void { this.editDraft = segment.text; this.editingId = segment.id; }

  saveEdit(segment: TranscriptSegment): void {
    const text = this.editDraft.trim();
    this.editingId = null;
    if (text && text !== segment.text) this.intent.emit({ type: 'segmentEditRequested', segmentId: segment.id, text });
  }

  /** Cuts one segment's text at its supplied span offsets. Offsets that fall outside the text, or overlap an earlier span, are skipped. */
  private split(text: string, spans: readonly EvidenceSpan[], view: (span: EvidenceSpan) => SpanView): Piece[] {
    const pieces: Piece[] = [];
    let cursor = 0;
    for (const span of [...spans].sort((a, b) => a.start - b.start)) {
      const start = Math.max(span.start, cursor);
      const end = Math.min(span.end, text.length);
      if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || end <= start) continue;
      if (start > cursor) pieces.push({ text: text.slice(cursor, start) });
      pieces.push({ text: text.slice(start, end), span: view(span) });
      cursor = end;
    }
    if (cursor < text.length) pieces.push({ text: text.slice(cursor) });
    return pieces;
  }
}
