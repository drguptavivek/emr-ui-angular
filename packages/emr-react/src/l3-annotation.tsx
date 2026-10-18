'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  AnnotationListIntent,
  AnnotationListItem,
  AnnotationListViewModel,
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFormIntent,
  ImageTemplateOption,
  ImageTemplatePickerIntent,
  ImageTemplatePickerViewModel,
  RepeatableGroupDefinition,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { clampedTarget } from './l1-interactive.logic';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import { useEmrLabels } from './labels';
import { EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrTypedField, type EmrCustomRenderers } from './typed-field';
import { isFieldShown } from './typed-field.logic';
import {
  FAVOURITES_GROUP_ID,
  annotationFullSummary,
  annotationLayerGlyph,
  annotationLayerToolName,
  annotationListTabStopId,
  annotationPrimaryLabel,
  annotationSecondaryLabel,
  canEditTemplateFavourites,
  filterImageTemplates,
  hasToolbarPen,
  isRepeatableStacked,
  isTemplateFavourite,
  partitionImageTemplates,
  repeatableControlId,
  repeatableFieldSpanPercent,
  repeatableFocusFieldId,
  showFavouritePinHint,
  showFavouritesFilterChip,
  templateGridNextIndex,
  templateTabStopId,
  templateTileLabel,
  toolbarActiveTabStop,
  toolbarEnabledKeys,
  toolbarPenLabel,
  toolbarRovingNextKey,
  toolbarToolGlyph,
  toolbarToolTitle,
} from './l3-annotation.logic';

export {
  FAVOURITES_GROUP_ID,
  filterImageTemplates,
  partitionImageTemplates,
};

type PressState = PressableStateCallbackType & { focused?: boolean };
type FocusableHandle = { focus(): void } | null;

// ---------------------------------------------------------------------------
// 1. EmrRepeatableGroup
// ---------------------------------------------------------------------------

export type ClinicalRepeatableBlockDefinition = RepeatableGroupDefinition;

export interface EmrRepeatableGroupProps {
  definition: ClinicalRepeatableBlockDefinition;
  model?: readonly RepeatableItemState[];
  readOnly?: boolean;
  idPrefix?: string;
  customRenderers?: EmrCustomRenderers;
  onIntent: (intent: ClinicalFormIntent) => void;
}

/**
 * L3. Standalone repeatable field group: header with Add button, empty state, and one card per
 * repeated item with Remove and a 12-column responsive `EmrTypedField` grid.
 */
export function EmrRepeatableGroup({
  definition,
  model = [],
  readOnly = false,
  idPrefix = '',
  customRenderers,
  onIntent,
}: EmrRepeatableGroupProps) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const [width, setWidth] = useState(0);
  const stacked = isRepeatableStacked(width);
  const headingId = `${idPrefix ? idPrefix + '-' : ''}${definition.id}-heading`;

  const renderField = (item: RepeatableItemState, field: ClinicalFieldDefinition) => {
    const state: ClinicalFieldState | undefined = item.fields[field.id];
    if (!isFieldShown(state)) return null;
    const itemReadOnly = !!(readOnly || item.readOnly);
    return (
      <View
        key={field.id}
        style={[styles.repeatCell, { width: repeatableFieldSpanPercent(field.span, stacked) }]}
      >
        <EmrTypedField
          definition={field}
          model={state}
          controlId={repeatableControlId(definition.id, item.id, field.id, idPrefix)}
          readOnly={itemReadOnly}
          customRenderers={customRenderers}
          onFocus={() =>
            onIntent({
              type: 'fieldFocused',
              fieldId: repeatableFocusFieldId(definition.id, item.id, field.id),
            })
          }
          onValueChange={value =>
            onIntent({
              type: 'repeatItemEditRequested',
              groupId: definition.id,
              itemId: item.id,
              fieldId: field.id,
              value,
            })
          }
          onStatusChange={status =>
            onIntent({
              type: 'repeatItemStatusEditRequested',
              groupId: definition.id,
              itemId: item.id,
              fieldId: field.id,
              status,
            })
          }
        />
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.repeatable, { borderColor: t.border, backgroundColor: t.surfaceSlate }]}
    >
      <View style={styles.repeatHeading}>
        <View style={styles.flex}>
          <Text
            role="heading"
            aria-level={3}
            nativeID={headingId}
            style={{
              color: t.text,
              fontSize: t.textLg,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: fontFamily(t),
            }}
          >
            {definition.label}
          </Text>
          {definition.description ? (
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>
              {definition.description}
            </Text>
          ) : null}
        </View>
        <EmrButton
          variant="outline"
          small
          label={definition.addLabel ?? labels.add}
          disabled={readOnly}
          onPress={() => onIntent({ type: 'repeatItemAddRequested', groupId: definition.id })}
        />
      </View>
      {model.length === 0 ? (
        <Text
          style={{
            color: t.textMuted,
            fontSize: t.textMd,
            fontFamily: fontFamily(t),
            marginTop: 12,
          }}
        >
          {labels.noEntries}
        </Text>
      ) : (
        model.map((item, index) => {
          const itemLabel = item.label ?? labels.entry(index + 1);
          return (
            <View
              key={item.id}
              style={[styles.repeatItem, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <View style={styles.repeatHeading}>
                <Text
                  style={{
                    color: t.text,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(600),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {itemLabel}
                </Text>
                <EmrButton
                  variant="ghost"
                  small
                  label={labels.remove}
                  accessibilityLabel={`${labels.remove} ${itemLabel}`}
                  disabled={readOnly || item.readOnly}
                  onPress={() =>
                    onIntent({
                      type: 'repeatItemRemoveRequested',
                      groupId: definition.id,
                      itemId: item.id,
                    })
                  }
                />
              </View>
              <View style={styles.repeatGrid}>
                {definition.fields.map(field => renderField(item, field))}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrAnnotationToolbar
// ---------------------------------------------------------------------------

export const TOOLBAR_DEFAULTS = {
  toolbarAria: 'Annotation tools',
  toolsGroup: 'Tools',
  penGroup: 'Pen',
  penPrefix: 'Pen',
  penFallback: 'Pen colour and width',
  penPanelAria: 'Pen colour and width',
  colourGroup: 'Colour',
  widthGroup: 'Line width',
  historyGroup: 'History',
  undo: 'Undo',
  redo: 'Redo',
  zoomGroup: 'Zoom',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  zoomFit: 'Fit to view',
  zoomReset: 'Reset zoom',
  zoomResetAria: (zoomLabel: string) => `Reset zoom, currently ${zoomLabel}`,
  saveGroup: 'Save',
  save: 'Save annotations',
};

export type EmrAnnotationToolbarLabels = typeof TOOLBAR_DEFAULTS;

export interface EmrAnnotationToolbarProps {
  model: AnnotationToolbarViewModel;
  headingId?: string;
  labels?: Partial<typeof TOOLBAR_DEFAULTS>;
  onIntent: (intent: AnnotationToolbarIntent) => void;
}

/**
 * L3. Dense, wrapping row of 44px icon buttons for any annotation surface.
 * Single Tab stop on web with arrow/Home/End roving focus.
 */
export function EmrAnnotationToolbar({
  model,
  headingId,
  labels,
  onIntent,
}: EmrAnnotationToolbarProps) {
  const t = useEmrTheme();
  const l = { ...TOOLBAR_DEFAULTS, ...labels };
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, FocusableHandle>>({});

  const locked = !!model.readOnly;
  const hasPen = hasToolbarPen(model);
  const selectedColour = model.colours.find(c => c.id === model.selectedColourId);
  const selectedWidth = model.widths.find(w => w.id === model.selectedWidthId);

  useEffect(() => {
    if (locked) setOpen(false);
  }, [locked]);

  const enabledKeys = useMemo(() => toolbarEnabledKeys(model), [model]);
  const activeKey = toolbarActiveTabStop(model, focusedKey);

  const onButtonKey = (e: WebKeyEvent, key: string) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      buttonRefs.current['pen']?.focus();
      return;
    }
    const next = toolbarRovingNextKey(e.key, key, enabledKeys);
    if (!next) return;
    e.preventDefault();
    setFocusedKey(next);
    buttonRefs.current[next]?.focus();
  };

  const pickPenOption = (intent: AnnotationToolbarIntent) => {
    onIntent(intent);
    setOpen(false);
    buttonRefs.current['pen']?.focus();
  };

  const toolbarBtn = ({
    btnKey,
    ariaLabel,
    title,
    pressed,
    expanded,
    disabled,
    onPress,
    children,
  }: {
    btnKey: string;
    ariaLabel: string;
    title?: string;
    pressed?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    onPress: () => void;
    children: React.ReactNode;
  }) => {
    const active = pressed || expanded;
    return (
      <Pressable
        key={btnKey}
        ref={el => {
          buttonRefs.current[btnKey] = el;
        }}
        role="button"
        aria-label={ariaLabel}
        aria-pressed={pressed}
        aria-expanded={expanded}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={onPress}
        onFocus={() => setFocusedKey(btnKey)}
        {...webProps({
          title: title ?? ariaLabel,
          tabIndex: btnKey === activeKey ? 0 : -1,
          onKeyDown: (e: WebKeyEvent) => onButtonKey(e, btnKey),
        })}
        style={(st: PressState) => [
          styles.tbBtn,
          { minWidth: t.controlHeight, height: t.controlHeight },
          focusRing(t, st.focused),
          disabled ? styles.disabled : null,
        ]}
      >
        <View
          style={[
            styles.tbFace,
            {
              backgroundColor: active ? t.primarySoft : 'transparent',
              borderColor: active ? t.primary : 'transparent',
            },
          ]}
        >
          {children}
        </View>
        {active ? <View style={[styles.tbActiveBar, { backgroundColor: t.primary }]} /> : null}
      </Pressable>
    );
  };

  const glyphText = (glyph: string, active?: boolean, mono?: boolean) => (
    <Text
      aria-hidden
      style={{
        color: active ? t.primaryContrast : t.text,
        fontSize: mono ? t.textXs : t.textMd,
        fontWeight: fontWeight(t.weightBold),
        fontFamily: mono ? t.fontMono : fontFamily(t),
      }}
    >
      {glyph}
    </Text>
  );

  const penSummary = toolbarPenLabel(model, l.penFallback, l.penPrefix);

  return (
    <View style={styles.tbWrap}>
      <View
        role="toolbar"
        aria-orientation="horizontal"
        aria-label={headingId ? undefined : l.toolbarAria}
        aria-labelledby={headingId}
        style={[styles.tb, { borderColor: t.border, backgroundColor: t.surface }]}
      >
        {model.tools.length > 0 ? (
          <View role="group" aria-label={l.toolsGroup} style={styles.tbGroup}>
            {model.tools.map(tool => {
              const selected = tool.id === model.selectedToolId;
              return toolbarBtn({
                btnKey: `t:${tool.id}`,
                ariaLabel: tool.label,
                title: toolbarToolTitle(tool),
                pressed: selected,
                disabled: locked || !!tool.disabled,
                onPress: () => onIntent({ type: 'toolSelected', toolId: tool.id }),
                children: glyphText(toolbarToolGlyph(tool), selected),
              });
            })}
          </View>
        ) : null}

        {hasPen ? (
          <View role="group" aria-label={l.penGroup} style={styles.tbGroup}>
            {toolbarBtn({
              btnKey: 'pen',
              ariaLabel: penSummary,
              title: penSummary,
              expanded: open,
              disabled: locked,
              onPress: () => setOpen(prev => !prev),
              children: (
                <View style={styles.tbPenFace}>
                  <View
                    aria-hidden
                    style={[
                      styles.tbDot,
                      {
                        backgroundColor: selectedColour?.hex ?? t.text,
                        borderColor: t.textMuted,
                      },
                    ]}
                  />
                  <View
                    aria-hidden
                    style={[
                      styles.tbBar,
                      {
                        height: Math.max(1, Math.min(8, selectedWidth?.px ?? 2)),
                        backgroundColor: open ? t.primaryContrast : t.text,
                      },
                    ]}
                  />
                </View>
              ),
            })}
          </View>
        ) : null}

        <View role="group" aria-label={l.historyGroup} style={styles.tbGroup}>
          {toolbarBtn({
            btnKey: 'undo',
            ariaLabel: l.undo,
            disabled: locked || !model.canUndo,
            onPress: () => onIntent({ type: 'undoRequested' }),
            children: glyphText('↺'),
          })}
          {toolbarBtn({
            btnKey: 'redo',
            ariaLabel: l.redo,
            disabled: locked || !model.canRedo,
            onPress: () => onIntent({ type: 'redoRequested' }),
            children: glyphText('↻'),
          })}
        </View>

        <View role="group" aria-label={l.zoomGroup} style={styles.tbGroup}>
          {toolbarBtn({
            btnKey: 'zoomOut',
            ariaLabel: l.zoomOut,
            disabled: !!model.zoomLocked,
            onPress: () => onIntent({ type: 'zoomOutRequested' }),
            children: glyphText('−'),
          })}
          {toolbarBtn({
            btnKey: 'zoomReset',
            ariaLabel: l.zoomResetAria(model.zoomLabel),
            title: l.zoomReset,
            disabled: !!model.zoomLocked,
            onPress: () => onIntent({ type: 'zoomResetRequested' }),
            children: glyphText(model.zoomLabel, false, true),
          })}
          {toolbarBtn({
            btnKey: 'zoomIn',
            ariaLabel: l.zoomIn,
            disabled: !!model.zoomLocked,
            onPress: () => onIntent({ type: 'zoomInRequested' }),
            children: glyphText('+'),
          })}
          {toolbarBtn({
            btnKey: 'zoomFit',
            ariaLabel: l.zoomFit,
            disabled: !!model.zoomLocked,
            onPress: () => onIntent({ type: 'zoomFitRequested' }),
            children: glyphText('⤢'),
          })}
        </View>

        <View role="group" aria-label={l.saveGroup} style={styles.tbGroup}>
          {toolbarBtn({
            btnKey: 'save',
            ariaLabel: model.saveLabel ?? l.save,
            disabled: locked || !model.canSave,
            onPress: () => onIntent({ type: 'saveRequested' }),
            children: glyphText('⬇'),
          })}
        </View>
      </View>

      {open && !locked && hasPen ? (
        <View
          nativeID={panelId}
          role="group"
          aria-label={l.penPanelAria}
          style={[styles.tbPanel, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          {model.colours.length > 0 ? (
            <View role="group" aria-label={l.colourGroup} style={styles.tbGroup}>
              {model.colours.map(c => {
                const selected = c.id === model.selectedColourId;
                return (
                  <Pressable
                    key={c.id}
                    role="button"
                    aria-label={c.label}
                    aria-pressed={selected}
                    onPress={() => pickPenOption({ type: 'colourSelected', colourId: c.id })}
                    {...webProps({ title: c.label })}
                    style={(st: PressState) => [
                      styles.tbBtn,
                      { minWidth: t.controlHeight, height: t.controlHeight },
                      focusRing(t, st.focused),
                    ]}
                  >
                    <View
                      style={[
                        styles.tbSwatchOuter,
                        { borderColor: selected ? t.primary : 'transparent' },
                      ]}
                    >
                      <View
                        style={[
                          styles.tbSwatch,
                          { backgroundColor: c.hex, borderColor: t.textMuted },
                        ]}
                      >
                        {selected ? (
                          <View style={[styles.tbTick, { backgroundColor: t.surface }]}>
                            <Text
                              aria-hidden
                              style={{
                                color: t.text,
                                fontSize: t.text2xs,
                                fontWeight: fontWeight(t.weightBold),
                              }}
                            >
                              ✓
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    {selected ? (
                      <View style={[styles.tbActiveBar, { backgroundColor: t.primary }]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {model.widths.length > 0 ? (
            <View role="group" aria-label={l.widthGroup} style={styles.tbGroup}>
              {model.widths.map(w => {
                const selected = w.id === model.selectedWidthId;
                return (
                  <Pressable
                    key={w.id}
                    role="button"
                    aria-label={w.label}
                    aria-pressed={selected}
                    onPress={() => pickPenOption({ type: 'widthSelected', widthId: w.id })}
                    {...webProps({ title: w.label })}
                    style={(st: PressState) => [
                      styles.tbBtn,
                      { minWidth: t.controlHeight, height: t.controlHeight },
                      focusRing(t, st.focused),
                    ]}
                  >
                    <View
                      style={[
                        styles.tbFace,
                        {
                          backgroundColor: selected ? t.primarySoft : 'transparent',
                          borderColor: selected ? t.primary : 'transparent',
                        },
                      ]}
                    >
                      <View
                        aria-hidden
                        style={[
                          styles.tbBarWide,
                          {
                            height: Math.max(1, Math.min(10, w.px)),
                            backgroundColor: selected ? t.primaryContrast : t.text,
                          },
                        ]}
                      />
                    </View>
                    {selected ? (
                      <View style={[styles.tbActiveBar, { backgroundColor: t.primary }]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrAnnotationList
// ---------------------------------------------------------------------------

export const LIST_DEFAULTS = {
  listAria: 'Annotations',
  locked: 'Locked',
  hidden: 'Hidden',
  showTitle: 'Show drawing',
  hideTitle: 'Hide drawing',
  lockTitle: 'Lock drawing',
  unlockTitle: 'Unlock drawing',
  moveUpTitle: 'Move up',
  moveDownTitle: 'Move down',
  deleteTitle: 'Delete drawing',
  showDrawing: (num: number, name: string) => `Show drawing ${num}, ${name}`,
  lockDrawing: (num: number, name: string) => `Lock drawing ${num}, ${name}`,
  moveUpDrawing: (num: number, name: string) => `Move drawing ${num} up, ${name}`,
  moveDownDrawing: (num: number, name: string) => `Move drawing ${num} down, ${name}`,
  deleteDrawing: (num: number, name: string) => `Delete drawing ${num}, ${name}`,
};

export type EmrAnnotationListLabels = typeof LIST_DEFAULTS;

export interface EmrAnnotationListProps {
  model: AnnotationListViewModel;
  headingId?: string;
  labels?: Partial<typeof LIST_DEFAULTS>;
  onIntent: (intent: AnnotationListIntent) => void;
}

/**
 * L3. Numbered list of annotation layers with colour swatch, class/label, tool icon, and
 * 44px action buttons (visibility, lock, reorder, delete). Plain legend when `model.readOnly`.
 */
export function EmrAnnotationList({
  model,
  headingId,
  labels,
  onIntent,
}: EmrAnnotationListProps) {
  const t = useEmrTheme();
  const l = { ...LIST_DEFAULTS, ...labels };
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const mainRefs = useRef<FocusableHandle[]>([]);
  const tabStopId = annotationListTabStopId(model, focusedId);
  const font = fontFamily(t);

  const onMainKey = (e: WebKeyEvent, index: number) => {
    const target = clampedTarget(e.key, index, model.items.length);
    if (target === null) return;
    e.preventDefault();
    const nextItem = model.items[target];
    if (nextItem) setFocusedId(nextItem.layer.id);
    mainRefs.current[target]?.focus();
  };

  if (model.items.length === 0) {
    return (
      <View
        role="status"
        style={[styles.alEmpty, { borderColor: t.border, backgroundColor: t.surface }]}
      >
        <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
          {model.emptyMessage}
        </Text>
      </View>
    );
  }

  const rowActionBtn = ({
    key,
    rowId,
    ariaLabel,
    title,
    pressed,
    eyeToggle,
    danger,
    disabled,
    glyph,
    onPress,
  }: {
    key: string;
    rowId: string;
    ariaLabel: string;
    title: string;
    pressed?: boolean;
    eyeToggle?: boolean;
    danger?: boolean;
    disabled?: boolean;
    glyph: string;
    onPress: () => void;
  }) => {
    const highlighted = pressed && !eyeToggle;
    return (
      <Pressable
        key={key}
        role="button"
        aria-label={ariaLabel}
        aria-pressed={pressed}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={onPress}
        onFocus={() => setFocusedId(rowId)}
        {...webProps({
          title,
          tabIndex: rowId === tabStopId ? 0 : -1,
        })}
        style={(st: PressState) => [
          styles.alActionBtn,
          { width: t.controlHeight, height: t.controlHeight },
          focusRing(t, st.focused),
          disabled ? styles.disabled : null,
        ]}
      >
        <View
          style={[
            styles.alActionFace,
            {
              backgroundColor: highlighted ? t.primarySoft : 'transparent',
              borderColor: highlighted ? t.primaryBorder : 'transparent',
            },
          ]}
        >
          <Text
            aria-hidden
            style={{
              color: danger ? t.danger : t.text,
              fontSize: t.textMd,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            {glyph}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      role="list"
      aria-label={headingId ? undefined : l.listAria}
      aria-labelledby={headingId}
      style={[styles.al, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      {model.items.map((it: AnnotationListItem, index: number) => {
        const selected = it.layer.id === model.selectedLayerId;
        const hidden = !it.layer.visible;
        const first = index === 0;
        const last = index === model.items.length - 1;
        const primary = annotationPrimaryLabel(it);
        const secondary = annotationSecondaryLabel(it);
        const summary = annotationFullSummary(it);
        const toolLabel = annotationLayerToolName(it.layer.tool);
        const toolGlyph = annotationLayerGlyph(it.layer.tool);

        return (
          <View
            key={it.layer.id}
            role="listitem"
            aria-current={selected ? true : undefined}
            style={[
              styles.alRow,
              !last ? { borderBottomWidth: 1, borderBottomColor: t.border } : null,
              selected
                ? {
                    backgroundColor: t.primarySoft,
                    borderLeftWidth: 4,
                    borderLeftColor: t.primary,
                  }
                : null,
            ]}
          >
            <Pressable
              ref={el => {
                mainRefs.current[index] = el;
              }}
              role="button"
              aria-label={`${it.number}. ${summary}, ${toolLabel}${it.locked ? `, ${l.locked}` : ''}${hidden ? `, ${l.hidden}` : ''}`}
              onPress={() => onIntent({ type: 'layerSelected', layerId: it.layer.id })}
              onFocus={() => setFocusedId(it.layer.id)}
              {...webProps({
                title: summary,
                tabIndex: it.layer.id === tabStopId ? 0 : -1,
                onKeyDown: (e: WebKeyEvent) => onMainKey(e, index),
              })}
              style={(st: PressState) => [
                styles.alMain,
                { minHeight: t.controlHeight },
                focusRing(t, st.focused),
              ]}
            >
              <View
                aria-hidden
                style={[styles.alNo, { borderColor: t.border, backgroundColor: t.surface }]}
              >
                <Text
                  style={{
                    color: t.text,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: t.fontMono,
                  }}
                >
                  {it.number}
                </Text>
              </View>

              <View
                aria-hidden
                style={[
                  styles.alSwatch,
                  {
                    backgroundColor: it.layer.color,
                    borderColor: t.textMuted,
                    borderStyle: hidden ? 'dashed' : 'solid',
                  },
                ]}
              />

              <View style={styles.alTxt}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: t.text,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
                    fontStyle: hidden ? 'italic' : 'normal',
                    fontFamily: font,
                  }}
                >
                  {primary}
                  {secondary ? (
                    <Text style={{ fontWeight: fontWeight(t.weightRegular) }}>{` · ${secondary}`}</Text>
                  ) : null}
                </Text>
                {it.description ? (
                  <Text
                    numberOfLines={1}
                    style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}
                  >
                    {it.description}
                  </Text>
                ) : null}
              </View>

              <View role="img" aria-label={toolLabel} style={styles.alTool}>
                <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
                  {toolGlyph}
                </Text>
              </View>

              {it.locked ? (
                <View role="img" aria-label={l.locked} style={styles.alTool}>
                  <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textSm }}>
                    🔒
                  </Text>
                </View>
              ) : null}

              {model.readOnly && hidden ? (
                <View role="img" aria-label={l.hidden} style={styles.alTool}>
                  <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textSm }}>
                    ⊘
                  </Text>
                </View>
              ) : null}
            </Pressable>

            {!model.readOnly ? (
              <View style={styles.alActions}>
                {rowActionBtn({
                  key: 'vis',
                  rowId: it.layer.id,
                  ariaLabel: l.showDrawing(it.number, primary),
                  title: it.layer.visible ? l.hideTitle : l.showTitle,
                  pressed: it.layer.visible,
                  eyeToggle: true,
                  glyph: it.layer.visible ? '👁' : '⊘',
                  onPress: () =>
                    onIntent({ type: 'layerVisibilityToggleRequested', layerId: it.layer.id }),
                })}

                {model.canLock
                  ? rowActionBtn({
                      key: 'lock',
                      rowId: it.layer.id,
                      ariaLabel: l.lockDrawing(it.number, primary),
                      title: it.locked ? l.unlockTitle : l.lockTitle,
                      pressed: !!it.locked,
                      glyph: it.locked ? '🔒' : '🔓',
                      onPress: () =>
                        onIntent({ type: 'layerLockToggleRequested', layerId: it.layer.id }),
                    })
                  : null}

                {selected ? (
                  <>
                    {rowActionBtn({
                      key: 'up',
                      rowId: it.layer.id,
                      ariaLabel: l.moveUpDrawing(it.number, primary),
                      title: l.moveUpTitle,
                      disabled: first,
                      glyph: '▲',
                      onPress: () =>
                        onIntent({
                          type: 'layerMoveRequested',
                          layerId: it.layer.id,
                          direction: 'up',
                        }),
                    })}
                    {rowActionBtn({
                      key: 'down',
                      rowId: it.layer.id,
                      ariaLabel: l.moveDownDrawing(it.number, primary),
                      title: l.moveDownTitle,
                      disabled: last,
                      glyph: '▼',
                      onPress: () =>
                        onIntent({
                          type: 'layerMoveRequested',
                          layerId: it.layer.id,
                          direction: 'down',
                        }),
                    })}
                  </>
                ) : null}

                {rowActionBtn({
                  key: 'del',
                  rowId: it.layer.id,
                  ariaLabel: l.deleteDrawing(it.number, primary),
                  title: l.deleteTitle,
                  danger: true,
                  glyph: '🗑',
                  onPress: () =>
                    onIntent({ type: 'layerRemoveRequested', layerId: it.layer.id }),
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrImageTemplatePicker
// ---------------------------------------------------------------------------

export const PICKER_DEFAULTS = {
  close: 'Close',
  searchPlaceholder: 'Search by name, side or view',
  searchAria: (title: string) => `Search ${title}`,
  filterAria: (title: string) => `Filter ${title}`,
  favourites: 'Favourites',
  all: 'All',
  allTemplates: 'All templates',
  starHint: 'Star a template to pin it here.',
  clearSearch: 'Clear search',
  showAll: 'Show all',
  addFavourite: (label: string) => `Add ${label} to favourites`,
  removeFavourite: (label: string) => `Remove ${label} from favourites`,
};

export type EmrImageTemplatePickerLabels = typeof PICKER_DEFAULTS;

export interface EmrImageTemplatePickerProps {
  model: ImageTemplatePickerViewModel;
  headingId?: string;
  labels?: Partial<typeof PICKER_DEFAULTS>;
  onIntent: (intent: ImageTemplatePickerIntent) => void;
}

const TILE_MIN_WIDTH = 120;
const TILE_GAP = 8;

/**
 * L3. Controlled gallery picker for choosing a background image template visually,
 * with search, group filter chips, pinned Favourites section, and square thumbnail tiles.
 */
export function EmrImageTemplatePicker({
  model,
  headingId,
  labels,
  onIntent,
}: EmrImageTemplatePickerProps) {
  const t = useEmrTheme();
  const l = { ...PICKER_DEFAULTS, ...labels };
  const uid = useId();
  const resolvedHeadingId = headingId ?? `${uid}-heading`;
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const tileRefs = useRef<Record<string, FocusableHandle>>({});
  const font = fontFamily(t);

  const { favs, rest, flat } = useMemo(() => partitionImageTemplates(model), [model]);
  const tabStop = templateTabStopId(flat, model.selectedId, focusedId);
  const canEditFavs = canEditTemplateFavourites(model);
  const columns = Math.max(
    1,
    containerWidth > 0 ? Math.floor((containerWidth + TILE_GAP) / (TILE_MIN_WIDTH + TILE_GAP)) : 3,
  );
  const tileWidth =
    containerWidth > 0
      ? (containerWidth - TILE_GAP * (columns - 1)) / columns
      : TILE_MIN_WIDTH;

  const onTileKey = (e: WebKeyEvent, id: string) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onIntent({ type: 'closeRequested' });
      return;
    }
    const i = flat.findIndex(o => o.id === id);
    const nextIdx = templateGridNextIndex(e.key, i, flat.length, favs.length, columns);
    if (nextIdx === null) return;
    e.preventDefault();
    const nextOption = flat[nextIdx];
    if (nextOption) {
      setFocusedId(nextOption.id);
      tileRefs.current[nextOption.id]?.focus();
    }
  };

  const renderChip = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
    count?: number,
    starPrefix?: boolean,
  ) => (
    <Pressable
      key={key}
      role="button"
      aria-pressed={selected}
      onPress={onPress}
      style={(st: PressState) => [
        styles.tpChip,
        {
          minHeight: t.controlHeight,
          borderColor: selected ? t.primary : t.border,
          backgroundColor: selected ? t.primarySoft : t.surface,
        },
        focusRing(t, st.focused),
      ]}
    >
      {starPrefix ? (
        <Text aria-hidden style={{ color: t.warning, fontSize: t.textSm }}>
          ★
        </Text>
      ) : null}
      <Text
        style={{
          color: selected ? t.primaryContrast : t.text,
          fontSize: t.textSm,
          fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
          fontFamily: font,
        }}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <Text
          style={{
            color: selected ? t.primaryContrast : t.textMuted,
            fontSize: t.textSm,
            fontFamily: font,
          }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );

  const renderTile = (option: ImageTemplateOption) => {
    const selected = option.id === model.selectedId;
    const isFav = isTemplateFavourite(model, option.id);
    return (
      <View
        key={option.id}
        role="listitem"
        style={[styles.tpItem, { width: tileWidth }]}
      >
        <Pressable
          ref={el => {
            tileRefs.current[option.id] = el;
          }}
          role="button"
          aria-pressed={selected}
          aria-disabled={model.readOnly || undefined}
          aria-label={templateTileLabel(option)}
          onPress={() => {
            if (!model.readOnly) onIntent({ type: 'templateSelected', templateId: option.id });
          }}
          onFocus={() => setFocusedId(option.id)}
          {...webProps({
            tabIndex: option.id === tabStop ? 0 : -1,
            onKeyDown: (e: WebKeyEvent) => onTileKey(e, option.id),
          })}
          style={(st: PressState) => [
            styles.tpTile,
            {
              minHeight: t.controlHeight,
              borderColor: selected ? t.primary : t.border,
              borderWidth: selected ? 2 : 1,
              backgroundColor: selected ? t.primarySoft : t.surface,
            },
            focusRing(t, st.focused),
          ]}
        >
          <View style={[styles.tpFrame, { backgroundColor: t.surfaceSoft }]}>
            {option.imageUrl ? (
              <Image
                source={{ uri: option.imageUrl }}
                accessibilityLabel={option.altText ?? option.label}
                resizeMode="contain"
                style={styles.tpImg}
              />
            ) : null}
          </View>
          <Text
            numberOfLines={2}
            style={{
              color: t.text,
              fontSize: t.textSm,
              fontWeight: fontWeight(t.weightMedium),
              fontFamily: font,
            }}
          >
            {option.label}
          </Text>
          {option.badges?.length ? (
            <View style={styles.tpBadges}>
              {option.badges.map(badge => (
                <View key={badge} style={[styles.tpBadge, { backgroundColor: t.neutralSoft }]}>
                  <Text
                    style={{
                      color: t.text,
                      fontSize: t.text2xs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: font,
                    }}
                  >
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Pressable>

        {selected ? (
          <View
            aria-hidden
            pointerEvents="none"
            style={[
              styles.tpCheck,
              { backgroundColor: t.primarySoft, borderColor: t.primary },
            ]}
          >
            <Text
              style={{
                color: t.primaryContrast,
                fontSize: t.textXs,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              ✓
            </Text>
          </View>
        ) : null}

        {canEditFavs ? (
          <Pressable
            role="button"
            aria-pressed={isFav}
            aria-label={isFav ? l.removeFavourite(option.label) : l.addFavourite(option.label)}
            onPress={() =>
              onIntent({
                type: 'favouriteToggleRequested',
                templateId: option.id,
                favourite: !isFav,
              })
            }
            onFocus={() => setFocusedId(option.id)}
            {...webProps({ tabIndex: option.id === tabStop ? 0 : -1 })}
            style={(st: PressState) => [
              styles.tpStar,
              { width: t.controlHeight, height: t.controlHeight },
              focusRing(t, st.focused),
            ]}
          >
            <View
              style={[
                styles.tpStarBg,
                {
                  backgroundColor: isFav ? t.warningSoft : t.surface,
                  borderColor: isFav ? t.warning : t.border,
                },
              ]}
            >
              <Text
                aria-hidden
                style={{
                  color: isFav ? t.warning : t.text,
                  fontSize: t.textMd,
                }}
              >
                {isFav ? '★' : '☆'}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View
      role="region"
      aria-labelledby={resolvedHeadingId}
      style={[styles.tp, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.tpHead}>
        <View style={styles.flex}>
          <Text
            role="heading"
            aria-level={3}
            nativeID={resolvedHeadingId}
            style={{
              color: t.text,
              fontSize: t.textXl,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            {model.title}
          </Text>
          {model.totalLabel ? (
            <Text
              role="status"
              style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font, marginTop: 2 }}
            >
              {model.totalLabel}
            </Text>
          ) : null}
        </View>
        <Pressable
          role="button"
          aria-label={l.close}
          onPress={() => onIntent({ type: 'closeRequested' })}
          {...webProps({ title: l.close })}
          style={(st: PressState) => [
            styles.tpCloseBtn,
            {
              width: t.controlHeight,
              height: t.controlHeight,
              borderColor: t.border,
              backgroundColor: t.surface,
            },
            focusRing(t, st.focused),
          ]}
        >
          <Text aria-hidden style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
            ✕
          </Text>
        </Pressable>
      </View>

      <ThemedInput
        role="searchbox"
        aria-label={l.searchAria(model.title)}
        placeholder={l.searchPlaceholder}
        value={model.query}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={query => onIntent({ type: 'queryChangeRequested', query })}
      />

      <View role="group" aria-label={l.filterAria(model.title)} style={styles.tpChips}>
        {showFavouritesFilterChip(model)
          ? renderChip(
              FAVOURITES_GROUP_ID,
              l.favourites,
              model.selectedGroupId === FAVOURITES_GROUP_ID,
              () => onIntent({ type: 'groupSelected', groupId: FAVOURITES_GROUP_ID }),
              model.favouriteIds?.length ?? 0,
              true,
            )
          : null}
        {renderChip(
          '__all__',
          l.all,
          !model.selectedGroupId,
          () => onIntent({ type: 'groupSelected', groupId: null }),
        )}
        {model.groups.map(g =>
          renderChip(
            g.id,
            g.label,
            model.selectedGroupId === g.id,
            () => onIntent({ type: 'groupSelected', groupId: g.id }),
            g.count,
          ),
        )}
      </View>

      <View
        onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
        style={styles.tpBody}
      >
        {flat.length > 0 ? (
          <>
            {favs.length > 0 ? (
              <View role="group" aria-labelledby={`${uid}-fav`} style={styles.tpSec}>
                <View style={styles.tpSubRow}>
                  <Text aria-hidden style={{ color: t.warning, fontSize: t.textSm }}>
                    ★
                  </Text>
                  <Text
                    nativeID={`${uid}-fav`}
                    style={[
                      styles.tpSubText,
                      {
                        color: t.textMuted,
                        fontSize: t.textSm,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: font,
                      },
                    ]}
                  >
                    {`${l.favourites} ${favs.length}`}
                  </Text>
                </View>
                <View role="list" style={styles.tpGrid}>
                  {favs.map(renderTile)}
                </View>
              </View>
            ) : showFavouritePinHint(model) ? (
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                {l.starHint}
              </Text>
            ) : null}

            {rest.length > 0 ? (
              <View
                role={favs.length > 0 ? 'group' : undefined}
                aria-labelledby={favs.length > 0 ? `${uid}-all` : undefined}
                style={styles.tpSec}
              >
                {favs.length > 0 ? (
                  <Text
                    nativeID={`${uid}-all`}
                    style={[
                      styles.tpSubText,
                      {
                        color: t.textMuted,
                        fontSize: t.textSm,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: font,
                      },
                    ]}
                  >
                    {`${l.allTemplates} ${rest.length}`}
                  </Text>
                ) : null}
                <View role="list" style={styles.tpGrid}>
                  {rest.map(renderTile)}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <View role="status" style={styles.tpEmpty}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font, textAlign: 'center' }}>
              {model.emptyMessage}
            </Text>
            <View style={styles.tpEmptyActions}>
              {model.query ? (
                <EmrButton
                  small
                  variant="outline"
                  label={l.clearSearch}
                  onPress={() => onIntent({ type: 'queryChangeRequested', query: '' })}
                />
              ) : null}
              {model.selectedGroupId ? (
                <EmrButton
                  small
                  variant="outline"
                  label={l.showAll}
                  onPress={() => onIntent({ type: 'groupSelected', groupId: null })}
                />
              ) : null}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const REPEAT_GAP = 16;

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: 4 },
  disabled: { opacity: 0.52 },

  // EmrRepeatableGroup
  repeatable: { borderWidth: 1, borderRadius: 8, padding: 16 },
  repeatHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  repeatItem: { marginTop: 12, padding: 12, borderWidth: 1, borderRadius: 8, gap: 12 },
  repeatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -REPEAT_GAP / 2,
    rowGap: REPEAT_GAP,
  },
  repeatCell: { paddingHorizontal: REPEAT_GAP / 2, minWidth: 0 },

  // EmrAnnotationToolbar
  tbWrap: { position: 'relative' },
  tb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderRadius: 8,
  },
  tbGroup: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  tbBtn: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbFace: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbPenFace: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  tbDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  tbBar: { width: 16, borderRadius: 2 },
  tbBarWide: { width: 18, borderRadius: 2 },
  tbActiveBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 1,
    height: 3,
    borderRadius: 2,
  },
  tbPanel: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  tbSwatchOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbTick: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // EmrAnnotationList
  al: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  alRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  alMain: {
    flex: 1,
    flexBasis: 150,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 8,
  },
  alNo: {
    minWidth: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  alSwatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  alTxt: { flex: 1, minWidth: 0, gap: 2 },
  alTool: { alignItems: 'center', justifyContent: 'center' },
  alActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', paddingRight: 4 },
  alActionBtn: { alignItems: 'center', justifyContent: 'center' },
  alActionFace: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alEmpty: {
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },

  // EmrImageTemplatePicker
  tp: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12, minWidth: 0 },
  tpHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  tpCloseBtn: { borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tpChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 999,
  },
  tpBody: { gap: 12 },
  tpSec: { gap: 8 },
  tpSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tpSubText: { textTransform: 'uppercase', letterSpacing: 0.6 },
  tpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  tpItem: { position: 'relative', minWidth: 0 },
  tpTile: {
    width: '100%',
    padding: 6,
    borderRadius: 8,
    gap: 4,
  },
  tpFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpImg: { width: '100%', height: '100%' },
  tpBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tpBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  tpCheck: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpStar: {
    position: 'absolute',
    top: 2,
    right: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpStarBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpEmpty: {
    minHeight: 120,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tpEmptyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
