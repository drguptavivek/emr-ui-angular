import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, inject
} from '@angular/core';
import { clipTrendBand, resolveTrendAxis } from './observation-trend.logic';
import type { EmrTone, ObservationTrendIntent, ObservationTrendViewModel, TrendBand, TrendPoint, TrendScale } from '@drguptavivek/emr-controller';

let nextTrendId = 0;
const f = (n: number): string => n.toFixed(1);

/** One drawn marker. Everything here is pixel geometry plus supplied labels; no clinical values are derived. */
interface Marker {
  readonly domId: string;
  readonly seriesId: string;
  readonly seriesIdx: number;
  readonly idx: number;
  readonly point: TrendPoint;
  readonly seriesLabel: string;
  readonly tone: EmrTone;
  readonly px: number;
  readonly py: number;
  readonly d: string;
  readonly ringD: string;
  readonly name: string;
  /** Supplied unit plus, on a dual-axis chart, which axis; for the screen-reader table. */
  readonly unitAxis: string;
}

interface View {
  readonly w: number; readonly h: number; readonly ml: number; readonly mt: number; readonly plotW: number; readonly plotH: number;
  readonly bands: readonly { id: string; tone: EmrTone; hatchId: string | null; y: number; height: number; edges: readonly number[]; edgeLabel?: string; labelY?: number }[];
  readonly curves: readonly { id: string; label: string; d: string; lx: number; ly: number }[];
  readonly lines: readonly { id: string; tone: EmrTone; dashed: boolean; d: string }[];
  readonly markers: readonly Marker[];
  readonly xt: readonly { x: number; label: string; anchor: string }[];
  readonly yt: readonly { y: number; label: string }[];
  readonly yt2: readonly { y: number; label: string }[];
  readonly minor: readonly number[];
}

/** Marker outline by series order, so series differ by shape and not only by colour. */
function shapePath(shape: number, x: number, y: number, r: number): string {
  switch (shape % 4) {
    case 0: return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;
    case 1: return `M${f(x - r)} ${f(y - r)}h${f(2 * r)}v${f(2 * r)}h${f(-2 * r)}z`;
    case 2: return `M${f(x)} ${f(y - r * 1.3)}L${f(x + r * 1.3)} ${f(y)}L${f(x)} ${f(y + r * 1.3)}L${f(x - r * 1.3)} ${f(y)}z`;
    default: return `M${f(x)} ${f(y - r * 1.2)}L${f(x + r * 1.2)} ${f(y + r)}L${f(x - r * 1.2)} ${f(y + r)}z`;
  }
}

@Component({
  selector: 'emr-observation-trend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tr" [attr.aria-labelledby]="titleId()">
      <h3 class="tr__title" [id]="titleId()">{{ model.title }}</h3>
      @if (model.xGranularityLabel || model.granularityOptions?.length) {
        <div class="tr__bar">
          @if (model.xGranularityLabel) { <span class="tr__gran">{{ model.xGranularityLabel }}</span> }
          @if (model.granularityOptions?.length) {
            <div class="tr__seg" role="group" [attr.aria-label]="model.title + ', time scale'">
              @for (g of model.granularityOptions; track g.id) {
                <button type="button" class="tr__segbtn" [attr.aria-pressed]="!!g.selected" (click)="intent.emit({ type: 'granularityChangeRequested', granularityId: g.id })">{{ g.label }}</button>
              }
            </div>
          }
        </div>
      }
      @if (!hasData) {
        <div class="emr-empty" role="status">{{ model.emptyMessage }}</div>
      } @else {
        <ul class="tr__legend">
          @for (s of model.series; track s.id; let i = $index) {
            <li class="tr__key emr-tone-{{ s.tone }}">
              <svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false">
                <line x1="1" y1="7" x2="29" y2="7" class="tr__sw" [attr.stroke-dasharray]="s.dashed ? '6 4' : null" />
                <path class="tr__mk" [attr.d]="shapePath(i, 15, 7, 4)" />
              </svg>
              <span class="tr__keytext">{{ s.label }}{{ axisNote(s) }}</span>
            </li>
          }
          @for (b of model.bands; track b.id; let i = $index) {
            <li class="tr__key emr-tone-{{ b.tone }}">
              <svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false">
                @if (b.pattern === 'hatched') {
                  <defs><pattern [id]="uid + '-lh' + i" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="tr__hatch" /></pattern></defs>
                }
                <rect x="1" y="1" width="28" height="12" class="tr__bandsw" [class.tr__bandsw--hatch]="b.pattern === 'hatched'" [style.fill]="b.pattern === 'hatched' ? 'url(#' + uid + '-lh' + i + ')' : null" />
                <!-- An edge on the swatch only where the band has a bound, so open-ended bands read as open. -->
                @if (b.yTo !== undefined) { <line x1="1" y1="1" x2="29" y2="1" class="tr__bandedge" /> }
                @if (b.yFrom !== undefined) { <line x1="1" y1="13" x2="29" y2="13" class="tr__bandedge" /> }
              </svg>
              <span class="tr__keytext">{{ b.label }}{{ axisNote(b) }}</span>
            </li>
          }
          @for (c of model.referenceCurves; track c.id) {
            <li class="tr__key">
              <svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false"><line x1="1" y1="7" x2="29" y2="7" class="tr__refsw" /></svg>
              <span class="tr__keytext">{{ c.label }}</span>
            </li>
          }
        </ul>

        <div class="tr__plot">
          <svg class="tr__svg" role="img" [attr.width]="view.w" [attr.height]="view.h" [attr.viewBox]="'0 0 ' + view.w + ' ' + view.h" [attr.aria-labelledby]="uid + '-t ' + uid + '-d'">
            <title [id]="uid + '-t'">{{ model.title }}</title>
            <desc [id]="uid + '-d'">{{ model.summaryText }}</desc>
            <defs><clipPath [id]="uid + '-clip'"><rect [attr.x]="view.ml" [attr.y]="view.mt" [attr.width]="view.plotW" [attr.height]="view.plotH" /></clipPath></defs>
            @for (b of view.bands; track b.id) {
              <!-- The hatch pattern lives inside the toned group so its currentColor resolves to the band's tone. -->
              <g class="emr-tone-{{ b.tone }}" [attr.clip-path]="'url(#' + uid + '-clip)'">
                @if (b.hatchId) {
                  <defs><pattern [id]="b.hatchId" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" class="tr__hatch" /></pattern></defs>
                }
                <rect class="tr__band" [class.tr__band--hatch]="!!b.hatchId" [style.fill]="b.hatchId ? 'url(#' + b.hatchId + ')' : null" [attr.x]="view.ml" [attr.y]="b.y" [attr.width]="view.plotW" [attr.height]="b.height" />
                @for (e of b.edges; track $index) {
                  <line class="tr__bound" [attr.x1]="view.ml" [attr.x2]="view.ml + view.plotW" [attr.y1]="e" [attr.y2]="e" />
                }
                @if (b.edgeLabel && b.labelY !== undefined) {
                  <text class="tr__edgelabel" text-anchor="end" [attr.x]="view.ml + view.plotW - 4" [attr.y]="b.labelY < view.mt + 14 ? b.labelY + 12 : b.labelY - 4">{{ b.edgeLabel }}</text>
                }
              </g>
            }
            @for (x of view.minor; track $index) {
              <line class="tr__minor" [attr.x1]="x" [attr.x2]="x" [attr.y1]="view.mt" [attr.y2]="view.mt + view.plotH" />
            }
            @for (t of view.yt; track t.y) {
              <line class="tr__grid" [attr.x1]="view.ml" [attr.x2]="view.ml + view.plotW" [attr.y1]="t.y" [attr.y2]="t.y" />
              <text class="tr__tick" text-anchor="end" [attr.x]="view.ml - 8" [attr.y]="t.y" dy=".32em">{{ t.label }}</text>
            }
            @for (t of view.xt; track t.x) {
              <line class="tr__axis" [attr.x1]="t.x" [attr.x2]="t.x" [attr.y1]="view.mt + view.plotH" [attr.y2]="view.mt + view.plotH + 5" />
              <text class="tr__tick" [attr.text-anchor]="t.anchor" [attr.x]="t.x" [attr.y]="view.mt + view.plotH + 20">{{ t.label }}</text>
            }
            <line class="tr__axis" [attr.x1]="view.ml" [attr.x2]="view.ml" [attr.y1]="view.mt" [attr.y2]="view.mt + view.plotH" />
            <line class="tr__axis" [attr.x1]="view.ml" [attr.x2]="view.ml + view.plotW" [attr.y1]="view.mt + view.plotH" [attr.y2]="view.mt + view.plotH" />
            <text class="tr__ylabel" text-anchor="middle" [attr.transform]="'translate(14 ' + (view.mt + view.plotH / 2) + ') rotate(-90)'">{{ model.yLabel }}</text>
            @if (model.secondaryAxis; as ax) {
              <line class="tr__axis" [attr.x1]="view.ml + view.plotW" [attr.x2]="view.ml + view.plotW" [attr.y1]="view.mt" [attr.y2]="view.mt + view.plotH" />
              @for (t of view.yt2; track t.y) {
                <line class="tr__axis" [attr.x1]="view.ml + view.plotW" [attr.x2]="view.ml + view.plotW + 5" [attr.y1]="t.y" [attr.y2]="t.y" />
                <text class="tr__tick" text-anchor="start" [attr.x]="view.ml + view.plotW + 8" [attr.y]="t.y" dy=".32em">{{ t.label }}</text>
              }
              <text class="tr__ylabel" text-anchor="middle" [attr.transform]="'translate(' + (view.w - 14) + ' ' + (view.mt + view.plotH / 2) + ') rotate(90)'">{{ ax.yLabel }}</text>
            }
            <g [attr.clip-path]="'url(#' + uid + '-clip)'">
              @for (c of view.curves; track c.id) { <path class="tr__ref" [attr.d]="c.d" /> }
              @for (l of view.lines; track l.id) {
                <path class="tr__line emr-tone-{{ l.tone }}" [attr.d]="l.d" [attr.stroke-dasharray]="l.dashed ? '6 4' : null" />
              }
            </g>
            @for (c of view.curves; track c.id) { <text class="tr__reflabel" text-anchor="end" [attr.x]="c.lx" [attr.y]="c.ly">{{ c.label }}</text> }
          </svg>

          <svg class="tr__overlay" [attr.width]="view.w" [attr.height]="view.h" [attr.viewBox]="'0 0 ' + view.w + ' ' + view.h" focusable="false">
            <g class="tr__list" role="listbox" tabindex="0" [attr.aria-label]="listName()" [attr.aria-activedescendant]="activeDomId()"
               (focus)="onFocus()" (blur)="focused = false" (keydown)="onKey($event)">
              @for (m of view.markers; track m.domId) {
                <g role="option" class="tr__pt emr-tone-{{ m.tone }}" [id]="m.domId" [attr.aria-label]="m.name" [attr.aria-selected]="m.point.id === model.selectedPointId"
                   (click)="pick(m)" (mouseenter)="hover = m.domId" (mouseleave)="hover = null">
                  @if (m.point.id === model.selectedPointId) { <path class="tr__sel" [attr.d]="m.ringD" /> }
                  @if (m.point.flag) { <path class="tr__flagring" [attr.d]="m.ringD" /> }
                  @if (focused && m.domId === activeDomId()) { <path class="tr__focus" [attr.d]="m.ringD" /> }
                  <path class="tr__marker" [class.tr__marker--on]="m.point.id === model.selectedPointId || !!m.point.flag" [attr.d]="m.d" />
                  <circle class="tr__hit" [attr.cx]="m.px" [attr.cy]="m.py" r="12" />
                </g>
              }
            </g>
          </svg>

          @if (tip(); as m) {
            <div class="tr__tip" aria-hidden="true" [class.tr__tip--below]="m.py < 76" [style.left.px]="tipLeft(m)" [style.top.px]="m.py < 76 ? m.py + 14 : m.py - 14">
              <strong>{{ m.seriesLabel }}</strong>
              <span>{{ m.point.xLabel }}</span>
              <span class="tr__tipval">{{ m.point.valueLabel }}</span>
              @if (m.point.flag; as flag) { <span class="emr-badge emr-tone-{{ flag.tone }} tr__tipflag">{{ flag.label }}</span> }
            </div>
          }
        </div>

        <div class="emr-sr-only"><table>
          <caption>{{ model.title }}. {{ model.summaryText }}</caption>
          <thead><tr><th scope="col">Series</th><th scope="col">Unit and axis</th><th scope="col">Time</th><th scope="col">Value</th><th scope="col">Flag</th></tr></thead>
          <tbody>
            @for (m of view.markers; track m.domId) {
              <tr><th scope="row">{{ m.seriesLabel }}</th><td>{{ m.unitAxis }}</td><td>{{ m.point.xLabel }}</td><td>{{ m.point.valueLabel }}</td><td>{{ m.point.flag ? m.point.flag.label + (m.point.flag.assistiveText ? ', ' + m.point.flag.assistiveText : '') : 'None' }}</td></tr>
            }
          </tbody>
        </table></div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family);min-width:0}
    .tr{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;min-width:0;break-inside:avoid}
    .tr__title{margin:0;font-size:var(--emr-text-lg);line-height:var(--emr-leading-tight)}
    .tr__legend{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4px 16px}
    .tr__key{display:inline-flex;align-items:center;gap:6px;background:none!important;font-size:var(--emr-text-sm)}
    .tr__keytext{color:var(--emr-text)}
    .tr__sw{stroke:currentColor;stroke-width:2}
    .tr__mk{fill:var(--emr-surface);stroke:currentColor;stroke-width:2}
    .tr__bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
    .tr__gran{color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold)}
    .tr__seg{display:inline-flex;border:1px solid var(--emr-border);border-radius:8px;overflow:hidden}
    .tr__segbtn{min-height:32px;padding:4px 12px;border:0;border-left:1px solid var(--emr-border);background:var(--emr-surface);color:var(--emr-text);font:inherit;font-size:var(--emr-text-sm);cursor:pointer}
    .tr__segbtn:first-child{border-left:0}
    .tr__segbtn:hover{background:var(--emr-primary-soft)}
    .tr__segbtn:focus-visible{outline:3px solid var(--emr-focus);outline-offset:-3px}
    .tr__segbtn[aria-pressed="true"]{background:var(--emr-primary-soft);box-shadow:inset 0 -3px 0 var(--emr-primary);font-weight:var(--emr-weight-bold)}
    .tr__bandsw{fill:currentColor;fill-opacity:.2}
    .tr__bandsw--hatch{fill-opacity:1}
    .tr__bandedge{stroke:currentColor;stroke-width:2}
    .tr__hatch{stroke:currentColor;stroke-width:1.5;stroke-opacity:.55}
    .tr__refsw{stroke:var(--emr-text-muted);stroke-width:1.5;stroke-dasharray:1 3;stroke-linecap:round}
    .tr__plot{position:relative;min-width:0;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);overflow:hidden}
    .tr__svg{display:block;max-width:100%}
    .tr__overlay{position:absolute;inset:0;pointer-events:none}
    .tr__band{fill:currentColor;fill-opacity:.14}
    .tr__band--hatch{fill-opacity:1}
    .tr__bound{stroke:currentColor;stroke-width:1;stroke-dasharray:4 3}
    .tr__edgelabel{fill:currentColor;font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);paint-order:stroke;stroke:var(--emr-surface);stroke-width:3px;stroke-linejoin:round}
    .tr__minor{stroke:var(--emr-border);stroke-width:1;stroke-dasharray:2 4}

    .tr__grid{stroke:var(--emr-border);stroke-width:1}
    .tr__axis{stroke:var(--emr-text-muted);stroke-width:1}
    .tr__tick{fill:var(--emr-text-muted);font-size:var(--emr-text-xs)}
    .tr__ylabel{fill:var(--emr-text-muted);font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold)}
    .tr__ref{fill:none;stroke:var(--emr-text-muted);stroke-width:1.25;stroke-dasharray:1 3;stroke-linecap:round}
    .tr__reflabel{fill:var(--emr-text-muted);font-size:var(--emr-text-2xs)}
    .tr__line{fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round;stroke-linecap:round;background:none}
    .tr__pt{pointer-events:none;background:none}
    .tr__hit{fill:transparent;pointer-events:all;cursor:pointer}
    .tr__marker{fill:var(--emr-surface);stroke:currentColor;stroke-width:2}
    .tr__marker--on{fill:currentColor}
    .tr__flagring,.tr__sel{fill:none;stroke:currentColor;stroke-width:1.5}
    .tr__sel{stroke-width:3}
    .tr__focus{fill:none;stroke:var(--emr-focus);stroke-width:3}
    .tr__list{pointer-events:none;outline:none}
    .tr__list:focus-visible{outline:none}
    .tr__tip{position:absolute;z-index:2;transform:translate(-50%,-100%);display:grid;gap:2px;min-width:7rem;padding:6px 10px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface-raised);box-shadow:var(--emr-shadow);font-size:var(--emr-text-xs);pointer-events:none;white-space:nowrap}
    .tr__tip--below{transform:translate(-50%,0)}
    .tr__tipval{font-family:var(--emr-font-mono);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .tr__tipflag{justify-self:start;height:auto;min-height:0;padding:2px 6px;font-size:var(--emr-text-2xs)}
    @media print{.tr__tip{display:none}.tr__plot{overflow:visible}}
  `],
})
export class EmrObservationTrendComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) model!: ObservationTrendViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<ObservationTrendIntent>();

  readonly uid = `emr-trend-${++nextTrendId}`;
  readonly shapePath = shapePath;
  view: View = { w: 640, h: 320, ml: 56, mt: 12, plotW: 568, plotH: 272, bands: [], curves: [], lines: [], markers: [], xt: [], yt: [], yt2: [], minor: [] };
  hasData = false;
  focused = false;
  hover: string | null = null;
  private active: string | null = null;
  private width = 640;
  private observer?: ResizeObserver;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnChanges(): void {
    this.hasData = this.model.series.some((s) => s.points.length > 0);
    this.view = this.layout(this.width);
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width) - 2;
      if (w > 120 && w !== this.width) { this.width = w; this.view = this.layout(w); this.cdr.markForCheck(); }
    });
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  /** Legend suffix naming the axis, only on a dual-axis chart. */
  axisNote(item: { readonly axis?: TrendBand['axis'] }): string {
    if (!this.model.secondaryAxis) return '';
    return resolveTrendAxis(item, this.model).axis === 'secondary' ? ' (right axis)' : ' (left axis)';
  }

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }

  listName(): string {
    return `${this.model.title} data points. Left and right arrows move along a series, up and down switch series, Enter selects.`;
  }

  activeDomId(): string | null {
    const ms = this.view.markers;
    if (!ms.length) return null;
    return (ms.find((m) => m.domId === this.active) ?? ms.find((m) => m.point.id === this.model.selectedPointId) ?? ms[0]).domId;
  }

  /** The marker whose tooltip is showing: hovered first, else the keyboard-active one while focused. */
  tip(): Marker | undefined {
    const id = this.hover ?? (this.focused ? this.activeDomId() : null);
    return id ? this.view.markers.find((m) => m.domId === id) : undefined;
  }

  tipLeft(m: Marker): number { return Math.min(Math.max(m.px, 70), this.view.w - 70); }

  onFocus(): void { this.focused = true; this.active = this.activeDomId(); }

  pick(m: Marker): void {
    this.active = m.domId;
    this.hover = m.domId;
    if (!this.model.readOnly) this.intent.emit({ type: 'pointSelected', seriesId: m.seriesId, pointId: m.point.id });
  }

  onKey(e: KeyboardEvent): void {
    const ms = this.view.markers;
    const cur = ms.find((m) => m.domId === this.activeDomId());
    if (!cur) return;
    const same = ms.filter((m) => m.seriesIdx === cur.seriesIdx);
    let next: Marker | undefined;
    switch (e.key) {
      case 'ArrowRight': next = same[cur.idx + 1] ?? cur; break;
      case 'ArrowLeft': next = same[cur.idx - 1] ?? cur; break;
      case 'Home': next = same[0]; break;
      case 'End': next = same[same.length - 1]; break;
      case 'ArrowDown': case 'ArrowUp': {
        const others = ms.filter((m) => m.seriesIdx === cur.seriesIdx + (e.key === 'ArrowDown' ? 1 : -1));
        // Nearest point on the neighbouring series by drawn position.
        next = others.reduce<Marker | undefined>((best, m) => (!best || Math.abs(m.px - cur.px) < Math.abs(best.px - cur.px) ? m : best), undefined) ?? cur;
        break;
      }
      case 'Enter': case ' ': e.preventDefault(); this.pick(cur); return;
      default: return;
    }
    e.preventDefault();
    this.hover = null;
    this.active = next.domId;
  }

  /** Pure geometry: maps supplied x/y to pixels for the measured width. */
  private layout(w: number): View {
    const m = this.model;
    const h = w < 520 ? 250 : 320;
    const ml = w < 520 ? 46 : 56;
    const mr = m.secondaryAxis ? ml : 16;
    const mt = 12;
    const plotW = Math.max(w - ml - mr, 10);
    const plotH = h - mt - 36;
    const dx = m.xMax - m.xMin || 1;
    const px = (x: number): number => ml + ((x - m.xMin) / dx) * plotW;
    const yOf = (sc: Pick<TrendScale, 'yMin' | 'yMax'>) => {
      const dy = sc.yMax - sc.yMin || 1;
      return (y: number): number => mt + plotH - ((y - sc.yMin) / dy) * plotH;
    };
    const py = yOf(m);
    const dual = !!m.secondaryAxis;
    const py2 = m.secondaryAxis ? yOf(m.secondaryAxis) : py;
    const dense = m.series.some((s) => s.points.length > 60);
    const r = dense ? 2 : 5;

    const markers = m.series.flatMap((s, seriesIdx) => {
      const sc = resolveTrendAxis(s, m); const sy = yOf(sc);
      const unitAxis = (s.unitLabel ?? sc.yLabel) + (dual ? (sc.axis === 'secondary' ? ', right axis' : ', left axis') : '');
      return s.points.map((p, idx): Marker => {
        const x = px(p.x); const y = sy(p.y);
        const flag = p.flag ? `, ${p.flag.label}${p.flag.assistiveText ? ' ' + p.flag.assistiveText : ''}` : '';
        return {
          domId: `${this.uid}-p-${seriesIdx}-${idx}`, seriesId: s.id, seriesIdx, idx, point: p, seriesLabel: s.label, tone: s.tone, px: x, py: y,
          d: shapePath(seriesIdx, x, y, r), ringD: shapePath(seriesIdx, x, y, r + 5), name: `${s.label}, ${p.xLabel}: ${p.valueLabel}${flag}`, unitAxis
        };
      });
    });
    const xt = m.xTicks.map((t) => {
      const x = px(t.x);
      return { x, label: t.label, anchor: x < ml + 14 ? 'start' : x > ml + plotW - 14 ? 'end' : 'middle' };
    });
    return {
      w, h, ml, mt, plotW, plotH,
      bands: (m.bands ?? []).flatMap((b, i) => {
        const sc = resolveTrendAxis(b, m); const by = yOf(sc);
        const ext = clipTrendBand(b, sc);
        if (!ext) return [];
        const top = by(ext.hi);
        return [{
          id: b.id, tone: b.tone, hatchId: b.pattern === 'hatched' ? `${this.uid}-h${i}` : null, y: top, height: Math.max(by(ext.lo) - top, 0),
          edges: ext.edges.map(by), edgeLabel: b.edgeLabel, labelY: ext.labelAt === undefined ? undefined : by(ext.labelAt)
        }];
      }),
      curves: (m.referenceCurves ?? []).map((c) => {
        const last = c.points[c.points.length - 1];
        return { id: c.id, label: c.label, d: c.points.map((p, i) => `${i ? 'L' : 'M'}${f(px(p.x))} ${f(py(p.y))}`).join(''), lx: last ? px(last.x) - 4 : 0, ly: last ? py(last.y) - 4 : 0 };
      }),
      lines: m.series.filter((s) => s.points.length > 1).map((s) => {
        const sy = yOf(resolveTrendAxis(s, m));
        return { id: s.id, tone: s.tone, dashed: !!s.dashed, d: s.points.map((p, i) => `${i ? 'L' : 'M'}${f(px(p.x))} ${f(sy(p.y))}`).join('') };
      }),
      markers, xt,
      yt: m.yTicks.map((t) => ({ y: py(t.y), label: t.label })),
      yt2: (m.secondaryAxis?.yTicks ?? []).map((t) => ({ y: py2(t.y), label: t.label })),
      minor: (m.xMinorTicks ?? []).map((t) => px(t.x))
    };
  }
}
