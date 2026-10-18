'use client';

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { toneColors, useEmrTheme } from './theme';
import { nextRowIndex, nextSortDirection, selectAllState, toggleId, toggleSelectAll } from './data-table.logic';
import type { EmrDataTableCell, EmrDataTableLabels, EmrDataTableProps } from './data-table.types';

export type * from './data-table.types';

const DEFAULTS: EmrDataTableLabels = {
  selectAll: 'Select all rows on this page',
  selectRow: 'Select row',
  filters: 'Active filters',
  removeFilter: 'Remove filter',
  addFilter: 'Add filter',
  savedFilters: 'Saved filters',
  saveFilter: 'Save current filter',
  exportCsv: 'Export CSV',
  density: 'Row density',
  comfortable: 'Comfortable',
  compact: 'Compact',
  bulkActions: 'Bulk actions',
  selectedCount: '{count} selected',
  sortedAscending: 'sorted ascending',
  sortedDescending: 'sorted descending',
  sortBy: 'Sort by',
  previous: 'Previous',
  next: 'Next',
  rowsPerPage: 'Rows per page',
  pageOf: 'Page {page} of {pageCount}',
  loading: 'Loading rows',
  emptyTitle: 'No rows to show',
  emptyMessage: 'Try removing a filter.',
  errorTitle: 'Could not load rows',
  retry: 'Retry',
  nativeUnavailable: 'This table is available on the web app.',
};

const SKELETON_ROWS = 5;
const hidden: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
const textAlign = { start: 'left', end: 'right', center: 'center' } as const;

/**
 * Web-only L4 dense table. Semantic <table>; the controller owns data, order, filters and paging, and
 * this component only emits intents. Rows are a roving-tabindex set (arrows move, Space selects, Enter opens).
 */
export function EmrDataTable({ model, onIntent, labels }: EmrDataTableProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const loading = model.status === 'loading';
  const failed = model.status === 'error';
  const compact = model.density === 'compact';
  const rowIds = model.rows.map(r => r.id);
  const selected = model.selectedIds;
  const all = selectAllState(rowIds, selected);
  const activeRow = Math.min(active, Math.max(rowIds.length - 1, 0));
  const font = { fontFamily: t.fontFamily, fontSize: t.textSm, color: t.text };
  const pad = compact ? '4px 10px' : '8px 12px';

  const ring = (key: string, offset = 2): CSSProperties =>
    focusKey === key ? { outline: `3px solid ${t.focus}`, outlineOffset: offset } : {};
  const focusProps = (key: string) => ({
    onFocus: (e: { target: unknown; currentTarget: unknown }) => { if (e.target === e.currentTarget) setFocusKey(key); },
    onBlur: () => setFocusKey(k => (k === key ? null : k)),
  });

  const btn = (key: string, over?: CSSProperties): CSSProperties => ({
    ...font, minHeight: t.controlHeight, padding: '0 12px', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${t.border}`, background: t.surface, ...ring(key), ...over,
  });
  const button = (key: string, label: string, onClick: () => void, opts: { disabled?: boolean; pressed?: boolean; popup?: boolean; expanded?: boolean } = {}) => (
    <button
      key={key} type="button" onClick={onClick} disabled={opts.disabled}
      aria-pressed={opts.pressed} aria-haspopup={opts.popup ? 'menu' : undefined} aria-expanded={opts.expanded}
      style={btn(key, { ...(opts.pressed ? { background: t.primarySoft, borderColor: t.primaryBorder } : null), ...(opts.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : null) })}
      {...focusProps(key)}
    >{label}</button>
  );

  const checkbox = (key: string, label: string, state: 'none' | 'some' | 'all', onChange: () => void) => (
    <input
      type="checkbox" aria-label={label} checked={state === 'all'}
      aria-checked={state === 'some' ? 'mixed' : state === 'all'}
      ref={el => { if (el) el.indeterminate = state === 'some'; }}
      onChange={onChange} onClick={e => e.stopPropagation()}
      style={{ width: 24, height: 24, margin: 0, cursor: 'pointer', accentColor: t.primary, ...ring(key) }}
      {...focusProps(key)}
    />
  );

  const cellView = (c: EmrDataTableCell | undefined): ReactNode => {
    if (c === undefined) return null;
    if (typeof c === 'string') return c;
    return (
      <>
        {c.text}
        {c.badge ? (
          <span style={{ ...toneColors(t, c.badge.tone), marginLeft: c.text ? 8 : 0, padding: '2px 8px', borderRadius: 999, fontSize: t.textXs, fontWeight: t.weightMedium, whiteSpace: 'nowrap', border: `1px solid ${t.border}` }}>
            {c.badge.label}
            {c.badge.assistiveText ? <span style={hidden}>{` (${c.badge.assistiveText})`}</span> : null}
          </span>
        ) : null}
      </>
    );
  };

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, i: number, id: string) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === ' ') { e.preventDefault(); onIntent({ type: 'selectionChanged', selectedIds: toggleId(selected, id) }); return; }
    if (e.key === 'Enter') { e.preventDefault(); onIntent({ type: 'rowActivated', id }); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const n = nextRowIndex(i, rowIds.length, e.key);
    setActive(n);
    rowRefs.current[n]?.focus();
  };

  const th: CSSProperties = { position: 'sticky', top: 0, zIndex: 1, background: t.surfaceRaised, borderBottom: `2px solid ${t.border}`, padding: pad, fontWeight: t.weightBold, whiteSpace: 'nowrap' };
  const rowHeight = compact ? 32 : 44;
  const colCount = model.columns.length + 1;
  const empty = !loading && !failed && model.rows.length === 0;
  const msg = (role: 'status' | 'alert', title: string, body?: string, extra?: ReactNode) => (
    <div role={role} style={{ ...font, padding: 32, textAlign: 'center', display: 'grid', gap: 8, justifyItems: 'center' }}>
      <strong>{title}</strong>
      {body ? <span style={{ color: t.textMuted }}>{body}</span> : null}
      {extra}
    </div>
  );

  return (
    <div style={{ ...font, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <ul aria-label={l.filters} style={{ display: 'contents', listStyle: 'none', margin: 0, padding: 0 }}>
          {model.filters.map(f => (
            <li key={f.id} style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${t.primaryBorder}`, background: t.primarySoft, borderRadius: 999, paddingLeft: 12 }}>
              <span><strong>{f.label}:</strong> {f.valueLabel}</span>
              <button
                type="button" aria-label={`${l.removeFilter}: ${f.label} ${f.valueLabel}`}
                onClick={() => onIntent({ type: 'filterRemoved', id: f.id })}
                style={{ ...font, minWidth: 32, minHeight: t.controlHeight, border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 999, ...ring(`f${f.id}`, -3) }}
                {...focusProps(`f${f.id}`)}
              ><span aria-hidden>×</span></button>
            </li>
          ))}
        </ul>
        {button('addFilter', l.addFilter, () => onIntent({ type: 'filterAddRequested' }))}
        <div style={{ position: 'relative' }} onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false); }}>
          {button('saved', l.savedFilters, () => setMenuOpen(o => !o), { popup: true, expanded: menuOpen })}
          {menuOpen ? (
            <ul role="menu" aria-label={l.savedFilters} style={{ position: 'absolute', zIndex: 3, top: '100%', left: 0, minWidth: 220, margin: '4px 0 0', padding: 4, listStyle: 'none', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, boxShadow: `0 4px 12px ${t.shadow}` }}>
              {[...model.savedFilters.map(s => ({ id: s.id, label: s.label, run: () => onIntent({ type: 'savedFilterSelected', id: s.id }) })),
                { id: '__save', label: l.saveFilter, run: () => onIntent({ type: 'saveFilterRequested' }) }].map(item => (
                <li key={item.id} role="none">
                  <button
                    type="button" role="menuitem"
                    onClick={() => { setMenuOpen(false); item.run(); }}
                    style={{ ...font, display: 'block', width: '100%', textAlign: 'left', minHeight: t.controlHeight, padding: '0 12px', border: 0, background: 'transparent', cursor: 'pointer', ...ring(`m${item.id}`, -3) }}
                    {...focusProps(`m${item.id}`)}
                  >{item.label}</button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div role="group" aria-label={l.bulkActions} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {model.bulkActions.map(a => button(`b${a.id}`, a.label, () => onIntent({ type: 'bulkActionRequested', id: a.id }), { disabled: selected.length === 0 }))}
          <span role="status" style={{ color: t.textMuted }}>{selected.length ? l.selectedCount.replace('{count}', String(selected.length)) : ''}</span>
        </div>
        <div style={{ flex: 1 }} />
        {button('export', l.exportCsv, () => onIntent({ type: 'exportRequested', format: 'csv' }))}
        <div role="group" aria-label={l.density} style={{ display: 'flex', gap: 4 }}>
          {button('dc', l.comfortable, () => onIntent({ type: 'densityChanged', density: 'comfortable' }), { pressed: !compact })}
          {button('dk', l.compact, () => onIntent({ type: 'densityChanged', density: 'compact' }), { pressed: compact })}
        </div>
      </div>

      <div aria-busy={loading} style={{ overflow: 'auto', maxHeight: '70vh', border: `1px solid ${t.border}`, borderRadius: 6, background: t.surface }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <caption style={hidden}>{model.caption}</caption>
          <thead>
            <tr>
              <th scope="col" style={{ ...th, width: 48 }}>
                {checkbox('all', l.selectAll, all, () => onIntent({ type: 'selectionChanged', selectedIds: toggleSelectAll(rowIds, selected) }))}
              </th>
              {model.columns.map(c => {
                const dir = model.sort?.columnId === c.id ? model.sort.direction : undefined;
                return (
                  <th
                    key={c.id} scope="col" style={{ ...th, textAlign: textAlign[c.align ?? 'start'], width: c.width }}
                    aria-sort={c.sortable ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : undefined}
                  >
                    {c.sortable ? (
                      <button
                        type="button" onClick={() => onIntent({ type: 'sortChanged', columnId: c.id, direction: nextSortDirection(model.sort, c.id) })}
                        style={{ ...font, fontWeight: t.weightBold, minHeight: t.controlHeight - 8, padding: '0 4px', border: 0, background: 'transparent', cursor: 'pointer', ...ring(`s${c.id}`) }}
                        {...focusProps(`s${c.id}`)}
                      >
                        <span style={hidden}>{l.sortBy} </span>{c.label}
                        <span aria-hidden> {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}</span>
                        {dir ? <span style={hidden}>, {dir === 'asc' ? l.sortedAscending : l.sortedDescending}</span> : null}
                      </button>
                    ) : c.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <tr key={i} aria-hidden>
                  {Array.from({ length: colCount }, (_, j) => (
                    <td key={j} style={{ padding: pad, height: rowHeight, borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ height: 12, width: j === 0 ? 24 : '70%', borderRadius: 4, background: t.neutralSoft }} />
                    </td>
                  ))}
                </tr>
              ))
              : failed || empty ? null
              : model.rows.map((r, i) => {
                const on = selected.includes(r.id);
                return (
                  <tr
                    key={r.id} ref={el => { rowRefs.current[i] = el; }} tabIndex={i === activeRow ? 0 : -1}
                    onFocus={e => { if (e.target === e.currentTarget) { setActive(i); setFocusKey(`r${r.id}`); } }}
                    onBlur={() => setFocusKey(k => (k === `r${r.id}` ? null : k))}
                    onKeyDown={e => onRowKey(e, i, r.id)}
                    onClick={e => { if (!(e.target as HTMLElement).closest('input,button')) onIntent({ type: 'rowActivated', id: r.id }); }}
                    style={{ cursor: 'pointer', background: on ? t.primarySoft : undefined, ...ring(`r${r.id}`, -3) }}
                  >
                    <td style={{ padding: pad, height: rowHeight, borderBottom: `1px solid ${t.border}` }}>
                      {checkbox(`c${r.id}`, l.selectRow, on ? 'all' : 'none', () => onIntent({ type: 'selectionChanged', selectedIds: toggleId(selected, r.id) }))}
                    </td>
                    {model.columns.map(c => (
                      <td key={c.id} style={{ padding: pad, height: rowHeight, borderBottom: `1px solid ${t.border}`, textAlign: textAlign[c.align ?? 'start'] }}>{cellView(r.cells[c.id])}</td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
        {loading ? <span role="status" style={hidden}>{l.loading}</span> : null}
        {empty ? msg('status', l.emptyTitle, l.emptyMessage) : null}
        {failed ? msg('alert', l.errorTitle, model.error, button('retry', l.retry, () => onIntent({ type: 'retryRequested' }))) : null}
      </div>

      <nav aria-label={model.caption} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <span style={{ color: t.textMuted }}>{model.summaryLabel}</span>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          {l.rowsPerPage}
          <select
            value={model.pageSize} onChange={e => onIntent({ type: 'pageSizeChanged', pageSize: Number(e.target.value) })}
            style={btn('ps', { padding: '0 8px' })} {...focusProps('ps')}
          >
            {model.pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {button('prev', l.previous, () => onIntent({ type: 'pageChanged', page: model.page - 1 }), { disabled: model.page <= 1 })}
        <span aria-live="polite">{l.pageOf.replace('{page}', String(model.page)).replace('{pageCount}', String(model.pageCount))}</span>
        {button('next', l.next, () => onIntent({ type: 'pageChanged', page: model.page + 1 }), { disabled: model.page >= model.pageCount })}
      </nav>
    </div>
  );
}
