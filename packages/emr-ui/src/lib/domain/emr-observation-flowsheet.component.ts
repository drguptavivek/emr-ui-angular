import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import type { ClinicalAssessmentStatus } from '@drguptavivek/emr-controller';
import type {
  FlowsheetCell, FlowsheetCellMap, FlowsheetIntent, FlowsheetRow, FlowsheetViewModel
} from '@drguptavivek/emr-controller';
import { EmrStateMessageComponent } from '../primitives/emr-feedback.component';

let nextFlowsheetId = 0;

/** Wording for the no-value states. Only used when the controller supplies a status but no value text. */
const STATUS_WORDS: Record<ClinicalAssessmentStatus, string> = {
  recorded: 'Not supplied',
  'not-assessed': 'Not assessed',
  'unable-to-assess': 'Unable to assess',
  'not-applicable': 'Not applicable',
  declined: 'Declined',
  unknown: 'Unknown'
};

/** One header cell over a run of adjacent columns; `label` is null for ungrouped columns. */
type HeadGroup = { readonly key: string; readonly label: string | null; readonly span: number };

type Item =
  | { readonly kind: 'group'; readonly key: string; readonly label: string }
  | { readonly kind: 'row'; readonly key: string; readonly row: FlowsheetRow };

@Component({
  selector: 'emr-observation-flowsheet',
  standalone: true,
  imports: [NgTemplateOutlet, EmrStateMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="fs" [attr.aria-labelledby]="titleId()" [attr.aria-busy]="model.loading ? 'true' : null">
      <header class="fs__head">
        <h3 class="fs__title" [id]="titleId()">{{ model.title }}</h3>
        @if (!model.readOnly && !model.loading && !model.error) {
          <button type="button" class="emr-button emr-button--outline emr-button--small fs__add" (click)="intent.emit({ type: 'columnAddRequested' })">Add column</button>
        }
      </header>

      @if (model.loading) {
        <emr-state-message kind="loading" title="Loading" message="Loading observations." />
      } @else if (model.error) {
        <emr-state-message kind="error" title="Could not load observations" [message]="model.error" />
        <div class="fs__retry"><button type="button" class="emr-button emr-button--outline emr-button--small" (click)="intent.emit({ type: 'retryRequested' })">Try again</button></div>
      } @else if (!model.rows.length || !model.columns.length) {
        <emr-state-message kind="empty" [title]="model.emptyMessage" />
      } @else {
        <div class="fs__scroll" role="region" tabindex="0" [attr.aria-labelledby]="titleId()">
          <table class="fs__table">
            <caption class="emr-sr-only">{{ model.title }}. Time runs across the columns; scroll sideways for more.</caption>
            <thead>
              @if (headGroups.length) {
                <tr class="fs__cgrow">
                  <th scope="col" rowspan="2" class="fs__corner">Observation</th>
                  @if (showRef) { <th scope="col" rowspan="2" class="fs__refh">Reference range</th> }
                  @for (g of headGroups; track g.key) {
                    @if (g.label !== null) {
                      <th scope="colgroup" [attr.colspan]="g.span" class="fs__cgh">{{ g.label }}</th>
                    } @else {
                      <td [attr.colspan]="g.span" class="fs__cgh fs__cgh--none"></td>
                    }
                  }
                </tr>
              }
              <tr>
                @if (!headGroups.length) {
                  <th scope="col" class="fs__corner">Observation</th>
                  @if (showRef) { <th scope="col" class="fs__refh">Reference range</th> }
                }
                @for (col of model.columns; track col.id) {
                  <th scope="col" class="fs__colh" [class.fs__colh--current]="col.current">
                    @if (!model.readOnly) {
                      <button type="button" class="fs__hbtn" (click)="intent.emit({ type: 'columnSelected', columnId: col.id })">
                        <ng-container *ngTemplateOutlet="colLabel; context: { $implicit: col }" />
                      </button>
                    } @else {
                      <span class="fs__hbtn fs__hbtn--static"><ng-container *ngTemplateOutlet="colLabel; context: { $implicit: col }" /></span>
                    }
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (item of items; track item.key) {
                @if (item.kind === 'group') {
                  <tr class="fs__group"><th scope="rowgroup" [attr.colspan]="span" class="fs__grouph">{{ item.label }}</th></tr>
                } @else {
                  <ng-container *ngTemplateOutlet="bodyRow; context: { $implicit: item.row, cells: model.cells }" />
                }
              }
            </tbody>
            @if (model.footerRows?.length) {
              <tfoot>
                @for (row of model.footerRows; track row.id) {
                  <ng-container *ngTemplateOutlet="bodyRow; context: { $implicit: row, cells: model.footerCells }" />
                }
              </tfoot>
            }
          </table>
        </div>
      }
    </section>

    <ng-template #colLabel let-col>
      <span class="fs__cl">{{ col.label }}</span>
      @if (col.sublabel) { <span class="fs__csub">{{ col.sublabel }}</span> }
      @if (col.current) { <span class="fs__now">Current</span> }
    </ng-template>

    <ng-template #rowLabel let-row>
      <span class="fs__rl">{{ row.label }}</span>
      @if (row.unitLabel) { <span class="fs__unit">{{ row.unitLabel }}</span> }
    </ng-template>

    <ng-template #bodyRow let-row let-cells="cells">
      <tr class="fs__row">
        <th scope="row" class="fs__rowh">
          @if (!model.readOnly) {
            <button type="button" class="fs__hbtn fs__hbtn--row" (click)="intent.emit({ type: 'rowSelected', rowId: row.id })">
              <ng-container *ngTemplateOutlet="rowLabel; context: { $implicit: row }" />
            </button>
          } @else {
            <span class="fs__hbtn fs__hbtn--row fs__hbtn--static"><ng-container *ngTemplateOutlet="rowLabel; context: { $implicit: row }" /></span>
          }
        </th>
        @if (showRef) {
          <td class="fs__ref">
            @if (row.referenceLabel) { {{ row.referenceLabel }} } @else { <span aria-hidden="true">—</span><span class="emr-sr-only">No reference range supplied</span> }
          </td>
        }
        @for (col of model.columns; track col.id) {
          <td class="fs__cell" [class.fs__cell--current]="col.current">
            @let cell = cellOf(cells, row.id, col.id);
            @if (cell?.editable && !model.readOnly) {
              <button type="button" class="fs__cbtn" [class.fs__cbtn--selected]="isSelected(row.id, col.id)"
                [attr.aria-current]="isSelected(row.id, col.id) ? 'true' : null"
                [attr.aria-label]="cellName(row, col.label, cell)"
                (click)="intent.emit({ type: 'cellSelected', rowId: row.id, columnId: col.id })">
                <ng-container *ngTemplateOutlet="cellBody; context: { $implicit: cell }" />
              </button>
            } @else {
              <div class="fs__cstatic" [class.fs__cstatic--selected]="isSelected(row.id, col.id)">
                <ng-container *ngTemplateOutlet="cellBody; context: { $implicit: cell }" />
              </div>
            }
          </td>
        }
      </tr>
    </ng-template>

    <ng-template #cellBody let-cell>
      @if (cell) {
        @if (cell.valueLabel !== null) {
          <span class="fs__val">{{ cell.valueLabel }}</span>
        } @else {
          <span class="fs__none">{{ statusWord(cell.status) }}</span>
        }
        @if (cell.flag; as flag) {
          <span class="emr-badge emr-tone-{{ flag.tone }} fs__flag">{{ flag.label }}@if (flag.assistiveText) { <span class="emr-sr-only"> {{ flag.assistiveText }}</span> }</span>
        }
        @if (cell.note) { <span class="fs__note">{{ cell.note }}</span> }
      } @else {
        <span class="fs__none">Not supplied</span>
      }
    </ng-template>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .fs{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;min-width:0}
    .fs__head{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .fs__title{margin:0;font-size:var(--emr-text-lg);line-height:var(--emr-leading-tight)}
    .fs__retry{display:flex}
    .fs__scroll{position:relative;overflow:auto;max-height:min(70vh,40rem);border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);scroll-behavior:smooth;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
    .fs__scroll:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .fs__table{border-collapse:separate;border-spacing:0;font-size:var(--emr-text-sm);line-height:var(--emr-leading-tight);width:max-content;min-width:100%}
    .fs__table th,.fs__table td{border-bottom:1px solid var(--emr-border);border-right:1px solid var(--emr-border);padding:0;text-align:left;vertical-align:middle;background:var(--emr-surface)}
    .fs__table thead th,.fs__table thead td{position:sticky;top:0;z-index:2;background:var(--emr-surface-raised);font-size:var(--emr-text-xs)}
    .fs__cgh{height:2.25rem;padding:4px 8px!important;text-align:center!important;white-space:nowrap;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);text-transform:uppercase;letter-spacing:.06em;box-shadow:inset 0 -2px 0 var(--emr-primary)}
    .fs__cgh--none{box-shadow:none}
    .fs__cgrow + tr th{top:2.25rem}
    .fs__table tfoot th,.fs__table tfoot td{position:sticky;bottom:0;z-index:2;background:var(--emr-surface-raised);font-weight:var(--emr-weight-bold)}
    .fs__table tfoot th.fs__rowh{z-index:3}
    .fs__corner,.fs__rowh{position:sticky;left:0;z-index:1;min-width:8.5rem;max-width:12rem;box-shadow:1px 0 0 var(--emr-border)}
    thead .fs__corner{z-index:3;padding:8px;color:var(--emr-text-muted)}
    .fs__refh{padding:8px;min-width:6rem;color:var(--emr-text-muted)}
    .fs__ref{padding:4px 8px;min-width:6rem;color:var(--emr-text-muted);font-family:var(--emr-font-mono);font-size:var(--emr-text-xs);white-space:nowrap}
    .fs__colh{min-width:5.5rem;text-align:center!important}
    .fs__colh--current,.fs__cell--current{box-shadow:inset 3px 0 0 var(--emr-primary)}
    .fs__colh--current{background:var(--emr-primary-soft)!important}
    .fs__colh--current .fs__csub{color:var(--emr-text)}
    .fs__cell--current{background:var(--emr-surface-soft)!important}
    .fs__hbtn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:100%;min-height:44px;padding:4px 8px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}
    .fs__hbtn--row{align-items:flex-start;text-align:left}
    .fs__hbtn--static{cursor:default}
    .fs__hbtn:not(.fs__hbtn--static):hover{background:var(--emr-primary-soft)}
    .fs__hbtn:focus-visible,.fs__cbtn:focus-visible{outline:3px solid var(--emr-focus);outline-offset:-3px}
    .fs__cl,.fs__rl{font-weight:var(--emr-weight-bold);overflow-wrap:anywhere}
    .fs__rl{font-size:var(--emr-text-sm)}
    .fs__csub,.fs__unit{color:var(--emr-text-muted);font-weight:var(--emr-weight-regular);font-size:var(--emr-text-xs)}
    .fs__now{font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);text-transform:uppercase;letter-spacing:.06em;color:var(--emr-primary)}
    .fs__grouph{position:sticky;left:0;padding:6px 8px!important;background:var(--emr-surface-accent)!important;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);text-transform:uppercase;letter-spacing:.06em;color:var(--emr-text)}
    .fs__cell{min-width:5.5rem;text-align:center}
    .fs__cbtn,.fs__cstatic{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:100%;min-height:44px;padding:4px 8px;font:inherit;color:inherit}
    .fs__cbtn{border:0;background:transparent;cursor:pointer;box-shadow:inset 0 0 0 1px var(--emr-border);border-radius:6px}
    .fs__cbtn:hover{background:var(--emr-primary-soft)}
    .fs__cbtn--selected,.fs__cstatic--selected{background:var(--emr-primary-soft);box-shadow:inset 0 0 0 2px var(--emr-primary)}
    .fs__val{font-family:var(--emr-font-mono);font-weight:var(--emr-weight-medium);font-size:var(--emr-text-sm);overflow-wrap:anywhere}
    .fs__none{color:var(--emr-text-muted);font-style:italic;font-size:var(--emr-text-xs)}
    .fs__flag{height:auto;min-height:0;padding:2px 6px;font-size:var(--emr-text-2xs);white-space:normal}
    .fs__note{color:var(--emr-text-muted);font-size:var(--emr-text-2xs);max-width:9rem;overflow-wrap:anywhere}
    @media(max-width:480px){.fs__corner,.fs__rowh{min-width:6.5rem;max-width:8rem}.fs__head{flex-wrap:wrap}}
    @media(prefers-reduced-motion:reduce){.fs__scroll{scroll-behavior:auto}}
    @media print{.fs__add,.fs__retry{display:none}.fs__scroll{overflow:visible;max-height:none}.fs__table{width:100%}.fs__table th,.fs__table td{position:static!important}}
  `],
})
export class EmrObservationFlowsheetComponent implements OnChanges {
  @Input({ required: true }) model!: FlowsheetViewModel;
  @Input() headingId?: string;
  @Output() readonly intent = new EventEmitter<FlowsheetIntent>();

  private readonly uid = `emr-flowsheet-${++nextFlowsheetId}`;
  items: readonly Item[] = [];
  showRef = false;
  span = 1;
  headGroups: readonly HeadGroup[] = [];

  ngOnChanges(): void {
    const groups = new Map((this.model.groups ?? []).map((g) => [g.id, g.label]));
    this.items = this.model.rows.flatMap((row, i, rows): Item[] => {
      const g = row.groupId;
      const head: Item[] = g && groups.has(g) && g !== rows[i - 1]?.groupId ? [{ kind: 'group', key: `g:${g}:${i}`, label: groups.get(g)! }] : [];
      return [...head, { kind: 'row', key: row.id, row }];
    });
    this.showRef = [...this.model.rows, ...(this.model.footerRows ?? [])].some((r) => !!r.referenceLabel);
    this.span = 1 + (this.showRef ? 1 : 0) + this.model.columns.length;
    this.headGroups = this.groupColumns();
  }

  /**
   * Header cells for `columnGroups`, one per run of adjacent columns in the same group, walked in
   * column order so the header can never drift from the cells. Empty when no groups are supplied.
   */
  private groupColumns(): readonly HeadGroup[] {
    const groups = this.model.columnGroups ?? [];
    if (!groups.length) return [];
    const groupOf = new Map(groups.flatMap((g) => g.columnIds.map((id) => [id, g] as const)));
    const runs: HeadGroup[] = [];
    this.model.columns.forEach((col, i) => {
      const g = groupOf.get(col.id);
      const last = runs[runs.length - 1];
      if (last && groupOf.get(this.model.columns[i - 1].id) === g) {
        runs[runs.length - 1] = { ...last, span: last.span + 1 };
      } else {
        runs.push({ key: `${g?.id ?? '-'}:${i}`, label: g?.label ?? null, span: 1 });
      }
    });
    return runs;
  }

  titleId(): string { return this.headingId ?? `${this.uid}-heading`; }

  cellOf(map: FlowsheetCellMap | undefined, rowId: string, columnId: string): FlowsheetCell | undefined {
    return map?.[rowId]?.[columnId];
  }

  isSelected(rowId: string, columnId: string): boolean {
    const s = this.model.selectedCell;
    return !!s && s.rowId === rowId && s.columnId === columnId;
  }

  statusWord(status: ClinicalAssessmentStatus | undefined): string {
    return status ? STATUS_WORDS[status] : 'Not supplied';
  }

  /** Name for an editable cell button: row, column, then everything the cell shows. */
  cellName(row: FlowsheetRow, columnLabel: string, cell: FlowsheetCell | undefined): string {
    if (!cell) return `${row.label}, ${columnLabel}: Not supplied`;
    const parts = [
      cell.valueLabel ?? this.statusWord(cell.status),
      cell.flag ? [cell.flag.label, cell.flag.assistiveText].filter(Boolean).join(' ') : '',
      cell.note ?? ''
    ].filter(Boolean);
    return `${row.label}, ${columnLabel}: ${parts.join(', ')}`;
  }
}
