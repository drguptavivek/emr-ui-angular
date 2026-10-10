import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, inject
} from '@angular/core';
import type { EmrTone, ObservationTrendIntent, ObservationTrendViewModel, TrendPoint } from '@drguptavivek/emr-controller';

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
}

interface View {
  readonly w: number; readonly h: number; readonly ml: number; readonly mt: number; readonly plotW: number; readonly plotH: number;
  readonly bands: readonly { id: string; label: string; tone: EmrTone; y: number; height: number }[];
  readonly curves: readonly { id: string; label: string; d: string; lx: number; ly: number }[];
  readonly lines: readonly { id: string; tone: EmrTone; dashed: boolean; d: string }[];
  readonly markers: readonly Marker[];
  readonly xt: readonly { x: number; label: string; anchor: string }[];
  readonly yt: readonly { y: number; label: string }[];
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
              <span class="tr__keytext">{{ s.label }}</span>
            </li>
          }
          @for (b of model.bands; track b.id) {
            <li class="tr__key emr-tone-{{ b.tone }}">
              <svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true" focusable="false"><rect x="1" y="1" width="28" height="12" class="tr__bandsw" /></svg>
              <span class="tr__keytext">{{ b.label }}</span>
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
              <g class="emr-tone-{{ b.tone }}" [attr.clip-path]="'url(#' + uid + '-clip)'">
                <rect class="tr__band" [attr.x]="view.ml" [attr.y]="b.y" [attr.width]="view.plotW" [attr.height]="b.height" />
              </g>
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
          <thead><tr><th scope="col">Series</th><th scope="col">Time</th><th scope="col">Value</th><th scope="col">Flag</th></tr></thead>
          <tbody>
            @for (m of view.markers; track m.domId) {
              <tr><th scope="row">{{ m.seriesLabel }}</th><td>{{ m.point.xLabel }}</td><td>{{ m.point.valueLabel }}</td><td>{{ m.point.flag ? m.point.flag.label + (m.point.flag.assistiveText ? ', ' + m.point.flag.assistiveText : '') : 'None' }}</td></tr>
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
    .tr__bandsw{fill:currentColor;fill-opacity:.2;stroke:currentColor;stroke-width:1}
    .tr__refsw{stroke:var(--emr-text-muted);stroke-width:1.5;stroke-dasharray:1 3;stroke-linecap:round}
    .tr__plot{position:relative;min-width:0;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);overflow:hidden}
    .tr__svg{display:block;max-width:100%}
    .tr__overlay{position:absolute;inset:0;pointer-events:none}
    .tr__band{fill:currentColor;fill-opacity:.14}

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
  view: View = { w: 640, h: 320, ml: 56, mt: 12, plotW: 568, plotH: 272, bands: [], curves: [], lines: [], markers: [], xt: [], yt: [] };
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
    const mt = 12;
    const plotW = Math.max(w - ml - 16, 10);
    const plotH = h - mt - 36;
    const dx = m.xMax - m.xMin || 1;
    const dy = m.yMax - m.yMin || 1;
    const px = (x: number): number => ml + ((x - m.xMin) / dx) * plotW;
    const py = (y: number): number => mt + plotH - ((y - m.yMin) / dy) * plotH;
    const dense = m.series.some((s) => s.points.length > 60);
    const r = dense ? 2 : 5;

    const markers = m.series.flatMap((s, seriesIdx) => s.points.map((p, idx): Marker => {
      const x = px(p.x); const y = py(p.y);
      const flag = p.flag ? `, ${p.flag.label}${p.flag.assistiveText ? ' ' + p.flag.assistiveText : ''}` : '';
      return {
        domId: `${this.uid}-p-${seriesIdx}-${idx}`, seriesId: s.id, seriesIdx, idx, point: p, seriesLabel: s.label, tone: s.tone, px: x, py: y,
        d: shapePath(seriesIdx, x, y, r), ringD: shapePath(seriesIdx, x, y, r + 5), name: `${s.label}, ${p.xLabel}: ${p.valueLabel}${flag}`
      };
    }));
    const xt = m.xTicks.map((t) => {
      const x = px(t.x);
      return { x, label: t.label, anchor: x < ml + 14 ? 'start' : x > w - 30 ? 'end' : 'middle' };
    });
    return {
      w, h, ml, mt, plotW, plotH,
      bands: (m.bands ?? []).map((b) => {
        const top = py(Math.max(b.yFrom, b.yTo)); const bottom = py(Math.min(b.yFrom, b.yTo));
        return { id: b.id, label: b.label, tone: b.tone, y: top, height: Math.max(bottom - top, 0) };
      }),
      curves: (m.referenceCurves ?? []).map((c) => {
        const last = c.points[c.points.length - 1];
        return { id: c.id, label: c.label, d: c.points.map((p, i) => `${i ? 'L' : 'M'}${f(px(p.x))} ${f(py(p.y))}`).join(''), lx: last ? px(last.x) - 4 : 0, ly: last ? py(last.y) - 4 : 0 };
      }),
      lines: m.series.filter((s) => s.points.length > 1).map((s) => ({
        id: s.id, tone: s.tone, dashed: !!s.dashed, d: s.points.map((p, i) => `${i ? 'L' : 'M'}${f(px(p.x))} ${f(py(p.y))}`).join('')
      })),
      markers, xt,
      yt: m.yTicks.map((t) => ({ y: py(t.y), label: t.label }))
    };
  }
}
