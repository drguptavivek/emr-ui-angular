'use client';

import { useId, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { toneColors, useEmrTheme } from './theme';
import type { EmrPickedFile, EmrUploadQueueLabels, EmrUploadQueueProps } from './upload-queue.types';

export type * from './upload-queue.types';

const DEFAULTS: EmrUploadQueueLabels = {
  dropHint: 'Drag files here, or',
  browse: 'Choose files',
  queue: 'Queued files',
  empty: 'No files queued.',
  remove: 'Remove',
  retry: 'Retry',
  publish: 'Publish',
  progress: 'Upload progress',
  progressValue: '{percent}% uploaded',
  nativeUnavailable: '',
};

const toPicked = (list: FileList | null): EmrPickedFile[] =>
  Array.from(list ?? []).map(file => ({ name: file.name, size: file.size, type: file.type, file }));

/**
 * Web-only L4 upload queue. Semantic DOM: a labelled file input, a drop zone, a list of queued items.
 * It never reads or uploads files — File objects go to the app through `filesPicked`.
 */
export function EmrUploadQueue({ model, onIntent, labels }: EmrUploadQueueProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  // Unique per instance: two queues on one page must not share input or description ids.
  const uid = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const font: CSSProperties = { fontFamily: t.fontFamily, fontSize: t.textSm, color: t.text };
  const ring = (key: string): CSSProperties => (focusKey === key ? { outline: `3px solid ${t.focus}`, outlineOffset: 2 } : {});
  const focusProps = (key: string) => ({ onFocus: () => setFocusKey(key), onBlur: () => setFocusKey(k => (k === key ? null : k)) });
  const btn = (key: string, enabled = true): CSSProperties => ({
    ...font, minHeight: Math.max(t.controlHeight, 44), minWidth: 44, padding: '0 14px', borderRadius: 6,
    border: `1px solid ${t.border}`, background: t.surface, cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.5, ...ring(key),
  });

  const send = (files: EmrPickedFile[]) => { if (files.length) onIntent?.({ type: 'filesPicked', files }); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    send(toPicked(e.dataTransfer.files).slice(0, model.multiple ? undefined : 1));
  };

  return (
    <section aria-label={model.label} style={{ ...font, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 20, borderRadius: 8,
          border: `2px dashed ${over ? t.primary : t.border}`, background: over ? t.primarySoft : t.surfaceSoft,
        }}
      >
        <span>{l.dropHint}</span>
        <input
          ref={input} id={`${uid}-input`} type="file" accept={model.accept} multiple={model.multiple}
          aria-label={model.label} aria-describedby={model.acceptDescription ? `${uid}-desc` : undefined}
          onChange={e => { send(toPicked(e.target.files)); e.target.value = ''; }}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
          tabIndex={-1}
        />
        <button type="button" onClick={() => input.current?.click()} style={btn('browse')} {...focusProps('browse')}>{l.browse}</button>
        {model.acceptDescription ? <span id={`${uid}-desc`} style={{ color: t.textMuted, fontSize: t.textXs }}>{model.acceptDescription}</span> : null}
      </div>

      <ul aria-label={l.queue} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {model.items.length === 0 ? <li style={{ color: t.textMuted }}>{l.empty}</li> : null}
        {model.items.map(item => {
          const c = toneColors(t, item.status.tone);
          const pct = item.progress === undefined ? undefined : Math.min(100, Math.max(0, item.progress));
          return (
            <li key={item.id} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, background: t.surface, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, overflowWrap: 'anywhere', flex: '1 1 160px' }}>{item.name}</span>
                <span style={{ color: t.textMuted }}>{item.sizeLabel}</span>
                <span role="status" aria-label={item.status.assistiveText} style={{ ...c, fontSize: t.textXs, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{item.status.label}</span>
                {item.error ? (
                  <button type="button" onClick={() => onIntent?.({ type: 'retryRequested', id: item.id })} style={btn(`retry-${item.id}`)} {...focusProps(`retry-${item.id}`)}>{l.retry}</button>
                ) : null}
                <button type="button" aria-label={`${l.remove} ${item.name}`} onClick={() => onIntent?.({ type: 'removeRequested', id: item.id })} style={btn(`rm-${item.id}`)} {...focusProps(`rm-${item.id}`)}>{l.remove}</button>
              </div>
              {pct !== undefined ? (
                <progress
                  value={pct} max={100} aria-label={`${l.progress}: ${item.name}`}
                  aria-valuetext={l.progressValue.replace('{percent}', String(Math.round(pct)))}
                  style={{ width: '100%', accentColor: t.primary }}
                />
              ) : null}
              {item.error ? <div role="alert" style={{ color: t.danger }}>{item.error}</div> : null}
            </li>
          );
        })}
      </ul>

      <div>
        <button
          type="button" aria-disabled={!model.canPublish}
          onClick={() => { if (model.canPublish) onIntent?.({ type: 'publishRequested' }); }}
          style={{ ...btn('publish', model.canPublish), ...(model.canPublish ? { background: t.primary, color: t.primaryContrast, borderColor: t.primary } : null) }}
          {...focusProps('publish')}
        >{l.publish}</button>
      </div>
    </section>
  );
}
