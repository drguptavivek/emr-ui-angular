'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  DocumentCandidate,
  DocumentPreviewManifest,
  DocumentPreviewPage,
  DocumentUploadIntent,
  DocumentUploadQueueViewModel,
  DocumentViewerIntent,
  DocumentViewerViewModel,
  EmrOption,
  FavouriteApplyIssue,
  FavouriteEntry,
  FavouriteKind,
  FavouritesIntent,
  FavouritesViewModel,
  GroupAddPreview,
  HierarchyNode,
  HierarchyOrderIntent,
  HierarchyOrderViewModel,
  OrderDetailsIntent,
  PatientDocumentRecord,
  PatientDocumentSortField,
  PatientDocumentsEffect,
  PatientDocumentsIntent,
  PatientDocumentsViewModel,
  RightFlyoutIntent,
  SelectedDocumentSource,
  SelectedOrder,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrAlert, EmrCard, EmrStateMessage } from './l1-display';
import { EmrCheckbox, EmrTextInput } from './l1-inputs';
import { EmrTabs } from './l1-interactive';
import { useContainerWidth } from './l4-lists-shared';
import {
  documentPaginationState,
  flattenVisibleHierarchyNodes,
  formatDocumentSortValue,
  isExistingFavourite,
  isOrderNodeSelected,
  orderBooleanDetail,
  orderErrorFor,
  orderStringDetail,
  parseDocumentSortValue,
  resolveDocumentRowAction,
  stepViewerRotation,
  stepViewerZoom,
  uploadQueueAnnouncement,
  viewerPageIndices,
  viewerZoomPercent,
  withoutEditorOrder,
} from './l4-orders-documents.logic';
import { EmrSheet, type EmrSheetIntent } from './l4-shell-sheet';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrFieldFrame } from './typed-field';

export type {
  DocumentCandidate,
  DocumentPreviewManifest,
  DocumentPreviewPage,
  DocumentUploadIntent,
  DocumentUploadQueueViewModel,
  DocumentViewerIntent,
  DocumentViewerViewModel,
  FavouriteApplyIssue,
  FavouriteEntry,
  FavouriteKind,
  FavouritesIntent,
  FavouritesViewModel,
  GroupAddPreview,
  HierarchyNode,
  HierarchyOrderIntent,
  HierarchyOrderViewModel,
  OrderDetailsIntent,
  PatientDocumentRecord,
  PatientDocumentSortField,
  PatientDocumentsEffect,
  PatientDocumentsIntent,
  PatientDocumentsViewModel,
  RightFlyoutIntent,
  SelectedDocumentSource,
  SelectedOrder,
};

/** Alias types matching prompt/story terminology alongside controller exports. */
export type OrderItemDetailViewModel = SelectedOrder;
export type OrderDetailFieldChanged = OrderDetailsIntent;
export type HierarchyOrderPickerViewModel = HierarchyOrderViewModel;
export type HierarchyOrderPickerIntent = HierarchyOrderIntent;
export type FavouritesPanelViewModel = FavouritesViewModel;
export type FavouritesPanelIntent = FavouritesIntent;

export interface OrderDetailChange {
  orderId: string;
  field: string;
  value: string | boolean | null;
}

type PressState = PressableStateCallbackType & { focused?: boolean };

// ---------------------------------------------------------------------------
// 1. EmrRightFlyout
// ---------------------------------------------------------------------------

export const FLYOUT_DEFAULTS = {
  back: 'Back',
  close: 'Close',
  closeAria: 'Close panel',
  panel: 'Panel',
};

export type EmrRightFlyoutLabels = typeof FLYOUT_DEFAULTS;

/**
 * L4 right flyout panel. Delegates to `EmrSheet` so side-panel / bottom-sheet
 * responsive behavior, Escape handling, and focus management stay consistent.
 */
export function EmrRightFlyout({
  open,
  title,
  headingId: _headingId,
  showBack,
  showFooter = true,
  footer,
  wideBreakpoint,
  labels,
  onIntent,
  children,
}: {
  open: boolean;
  title?: string;
  headingId?: string;
  showBack?: boolean;
  showFooter?: boolean;
  footer?: ReactNode;
  wideBreakpoint?: number;
  labels?: Partial<EmrRightFlyoutLabels>;
  onIntent: (intent: EmrSheetIntent) => void;
  children?: ReactNode;
}) {
  return (
    <EmrSheet
      open={open}
      title={title}
      showBack={showBack}
      footer={showFooter ? footer : undefined}
      wideBreakpoint={wideBreakpoint}
      labels={labels}
      onIntent={onIntent}
    >
      {children}
    </EmrSheet>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrOrderDetails
// ---------------------------------------------------------------------------

export const ORDER_DETAILS_DEFAULTS = {
  remove: 'Remove',
  removeAria: (label: string) => `Remove ${label}`,
  urgency: 'Urgency',
  fasting: 'Fasting required',
  notes: 'Notes',
  bodySite: 'Body site',
  laterality: 'Laterality',
  contrast: 'Contrast requested',
  clinicalIndication: 'Clinical indication',
  urgencyRoutine: 'Routine',
  urgencyUrgent: 'Urgent',
  urgencyStat: 'STAT',
  lateralityNotApplicable: 'Not applicable',
  lateralityRight: 'Right',
  lateralityLeft: 'Left',
  lateralityBilateral: 'Bilateral',
};

export type EmrOrderDetailsLabels = typeof ORDER_DETAILS_DEFAULTS;

/**
 * L4 editable detail fields (`checkbox`, `select`, `text`) for a single selected clinical order.
 */
export function EmrOrderDetails({
  model,
  headingId,
  urgencyOptions,
  lateralityOptions,
  labels,
  onIntent,
}: {
  model: OrderItemDetailViewModel;
  headingId?: string;
  urgencyOptions?: readonly EmrOption[];
  lateralityOptions?: readonly EmrOption[];
  labels?: Partial<EmrOrderDetailsLabels>;
  onIntent: (intent: OrderDetailFieldChanged) => void;
}) {
  const t = useEmrTheme();
  const l = { ...ORDER_DETAILS_DEFAULTS, ...labels };
  const family = fontFamily(t);

  const resolvedUrgencyOptions: readonly EmrOption[] = urgencyOptions ?? [
    { value: 'routine', label: l.urgencyRoutine },
    { value: 'urgent', label: l.urgencyUrgent },
    { value: 'stat', label: l.urgencyStat },
  ];

  const resolvedLateralityOptions: readonly EmrOption[] = lateralityOptions ?? [
    { value: 'not-applicable', label: l.lateralityNotApplicable },
    { value: 'right', label: l.lateralityRight },
    { value: 'left', label: l.lateralityLeft },
    { value: 'bilateral', label: l.lateralityBilateral },
  ];

  const changed = (field: string, value: string | boolean | null) =>
    onIntent({ type: 'detailChangeRequested', orderId: model.id, field, value });

  const urgencyError = orderErrorFor(model, 'urgency');
  const lateralityError = orderErrorFor(model, 'laterality');

  return (
    <View
      role="article"
      aria-labelledby={headingId}
      style={[styles.orderCard, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleRow}>
          <Text
            nativeID={headingId}
            role="heading"
            style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
          >
            {model.label}
          </Text>
          {model.code ? (
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{model.code}</Text>
          ) : null}
        </View>
        <EmrButton
          small
          variant="ghost"
          label={l.remove}
          accessibilityLabel={l.removeAria(model.label)}
          onPress={() => onIntent({ type: 'removeRequested', orderId: model.id })}
        />
      </View>

      <View style={styles.orderFields}>
        <EmrFieldFrame controlId={`${model.id}-urgency`} label={l.urgency} error={urgencyError}>
          <EmrSelect
            label={l.urgency}
            options={resolvedUrgencyOptions}
            value={orderStringDetail(model, 'urgency')}
            invalid={Boolean(urgencyError)}
            onChange={value => changed('urgency', value)}
          />
        </EmrFieldFrame>

        {model.kind === 'laboratory' ? (
          <>
            <EmrCheckbox
              controlId={`${model.id}-fasting`}
              label={l.fasting}
              value={orderBooleanDetail(model, 'fasting')}
              onValueChange={checked => changed('fasting', checked)}
            />
            <EmrTextInput
              controlId={`${model.id}-notes`}
              label={l.notes}
              value={orderStringDetail(model, 'notes') ?? ''}
              error={orderErrorFor(model, 'notes')}
              onValueChange={value => changed('notes', value ?? '')}
            />
          </>
        ) : null}

        {model.kind === 'radiology' ? (
          <>
            <EmrTextInput
              controlId={`${model.id}-site`}
              label={l.bodySite}
              value={orderStringDetail(model, 'bodySite') ?? ''}
              error={orderErrorFor(model, 'bodySite')}
              onValueChange={value => changed('bodySite', value ?? '')}
            />
            <EmrFieldFrame controlId={`${model.id}-laterality`} label={l.laterality} error={lateralityError}>
              <EmrSelect
                label={l.laterality}
                options={resolvedLateralityOptions}
                value={orderStringDetail(model, 'laterality')}
                invalid={Boolean(lateralityError)}
                onChange={value => changed('laterality', value)}
              />
            </EmrFieldFrame>
            <EmrCheckbox
              controlId={`${model.id}-contrast`}
              label={l.contrast}
              value={orderBooleanDetail(model, 'contrast')}
              onValueChange={checked => changed('contrast', checked)}
            />
            <EmrTextInput
              controlId={`${model.id}-indication`}
              label={l.clinicalIndication}
              value={orderStringDetail(model, 'clinicalIndication') ?? ''}
              error={orderErrorFor(model, 'clinicalIndication')}
              onValueChange={value => changed('clinicalIndication', value ?? '')}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrHierarchyOrderPicker
// ---------------------------------------------------------------------------

export const HIERARCHY_PICKER_DEFAULTS = {
  ...ORDER_DETAILS_DEFAULTS,
  searchAria: 'Search order catalogue',
  searchPlaceholder: 'Search by test name or code',
  search: 'Search',
  retry: 'Retry',
  errorTitle: 'Catalogue error',
  loading: 'Loading catalogue…',
  empty: 'No catalogue items found.',
  expand: 'Expand',
  collapse: 'Collapse',
  previewGroup: 'Preview group',
  add: 'Add',
  added: 'Selected',
  previewTitle: (groupLabel: string) => `Add ${groupLabel}?`,
  previewSummary: (itemCount: number, duplicateCount: number) =>
    `${itemCount} items will be considered; ${duplicateCount} already selected.`,
  addGroup: 'Add group',
  cancel: 'Cancel',
  selectedOrders: 'Selected orders',
  emptySelected: 'Choose an item from the catalogue.',
};

export type EmrHierarchyOrderPickerLabels = typeof HIERARCHY_PICKER_DEFAULTS;

const PICKER_WIDE_MIN = 720;

/**
 * L4 hierarchical order catalogue browser with expand/collapse tree, group preview,
 * and embedded `EmrOrderDetails` cards for selected orders.
 */
export function EmrHierarchyOrderPicker({
  model,
  headingId,
  labels,
  onIntent,
}: {
  model: HierarchyOrderPickerViewModel;
  headingId?: string;
  labels?: Partial<EmrHierarchyOrderPickerLabels>;
  onIntent: (intent: HierarchyOrderPickerIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...HIERARCHY_PICKER_DEFAULTS, ...labels };
  const family = fontFamily(t);
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= PICKER_WIDE_MIN;
  const visibleNodes = flattenVisibleHierarchyNodes(model.roots);

  const toggleItemSelection = (node: HierarchyNode) => {
    const existing = model.selected.find(o => o.catalogueId === node.id);
    if (existing) {
      onIntent({ type: 'orderRemoveRequested', orderId: existing.id });
    } else {
      onIntent({ type: 'itemAddRequested', nodeId: node.id });
    }
  };

  return (
    <View
      role="region"
      aria-label={model.title}
      aria-labelledby={headingId}
      onLayout={onLayout}
      style={[styles.pickerLayout, { flexDirection: wide ? 'row' : 'column' }]}
    >
      <View style={styles.pickerColumn}>
        <EmrCard>
          <View style={styles.stack}>
            <Text
              nativeID={headingId}
              role="heading"
              style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
            >
              {model.title}
            </Text>

            <View style={styles.toolbarRow}>
              <View style={styles.flex}>
                <ThemedInput
                  value={model.query}
                  aria-label={l.searchAria}
                  placeholder={l.searchPlaceholder}
                  returnKeyType="search"
                  inputMode="search"
                  onChangeText={query => onIntent({ type: 'queryChanged', query })}
                  onSubmitEditing={() => onIntent({ type: 'searchRequested' })}
                />
              </View>
              <EmrButton
                label={l.search}
                disabled={model.loading}
                onPress={() => onIntent({ type: 'searchRequested' })}
              />
            </View>

            {model.error ? (
              <EmrAlert tone="danger" title={l.errorTitle}>
                <View style={styles.inlineWrap}>
                  <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: family }}>{model.error}</Text>
                  <EmrButton
                    small
                    variant="outline"
                    label={l.retry}
                    onPress={() => onIntent({ type: 'retryRequested' })}
                  />
                </View>
              </EmrAlert>
            ) : null}

            {model.loading && model.roots.length === 0 ? (
              <EmrStateMessage kind="loading" title={l.loading} />
            ) : null}

            {!model.loading && model.roots.length === 0 ? (
              <EmrStateMessage kind="empty" title={l.empty} />
            ) : null}

            {visibleNodes.length > 0 ? (
              <View role="list" style={styles.treeList}>
                {visibleNodes.map(({ node, depth }) => {
                  const isGroup = node.kind === 'group';
                  const selected = !isGroup && isOrderNodeSelected(model.selected, node.id);
                  return (
                    <View
                      key={node.id}
                      role="listitem"
                      style={[
                        styles.treeRow,
                        {
                          paddingLeft: depth * 18,
                          borderBottomColor: t.border,
                        },
                      ]}
                    >
                      {isGroup ? (
                        <Pressable
                          role="button"
                          aria-expanded={Boolean(node.expanded)}
                          aria-label={`${node.expanded ? l.collapse : l.expand} ${node.label}`}
                          onPress={() =>
                            onIntent({
                              type: 'nodeExpansionRequested',
                              nodeId: node.id,
                              expanded: !node.expanded,
                            })
                          }
                          style={({ focused }: PressState) => [
                            styles.expandButton,
                            focusRing(t, focused),
                            {
                              minWidth: t.controlHeight,
                              minHeight: t.controlHeight,
                              borderColor: t.border,
                              backgroundColor: t.surfaceRaised,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: t.text,
                              fontSize: t.textMd,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: family,
                            }}
                          >
                            {node.expanded ? '−' : '+'}
                          </Text>
                        </Pressable>
                      ) : node.selectable ? (
                        <Pressable
                          role="checkbox"
                          aria-checked={selected}
                          aria-disabled={node.disabled}
                          aria-label={node.label}
                          disabled={node.disabled}
                          onPress={() => toggleItemSelection(node)}
                          style={({ focused }: PressState) => [
                            styles.nodeCheckHit,
                            focusRing(t, focused),
                            { minWidth: t.controlHeight, minHeight: t.controlHeight },
                          ]}
                        >
                          <View
                            aria-hidden
                            style={[
                              styles.nodeCheckBox,
                              {
                                borderColor: selected ? t.primary : t.border,
                                backgroundColor: selected ? t.primary : t.surface,
                              },
                            ]}
                          >
                            {selected ? (
                              <Text
                                style={{
                                  color: t.surface,
                                  fontSize: t.textSm,
                                  fontWeight: fontWeight(t.weightBold),
                                }}
                              >
                                ✓
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      ) : (
                        <View style={[styles.nodeBullet, { minWidth: t.controlHeight, minHeight: t.controlHeight }]}>
                          <Text aria-hidden style={{ color: t.textMuted, fontSize: t.textMd }}>
                            •
                          </Text>
                        </View>
                      )}

                      <View style={styles.treeLabelWrap}>
                        <Text
                          style={{
                            color: t.text,
                            fontSize: t.textMd,
                            fontWeight: fontWeight(t.weightBold),
                            fontFamily: family,
                          }}
                        >
                          {node.label}
                        </Text>
                        {node.code ? (
                          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
                            {node.code}
                          </Text>
                        ) : null}
                      </View>

                      {node.selectable && isGroup ? (
                        <EmrButton
                          small
                          variant="outline"
                          label={l.previewGroup}
                          disabled={node.disabled}
                          onPress={() => onIntent({ type: 'groupPreviewRequested', nodeId: node.id })}
                        />
                      ) : null}

                      {node.selectable && !isGroup ? (
                        <EmrButton
                          small
                          variant="outline"
                          label={selected ? l.added : l.add}
                          disabled={node.disabled}
                          onPress={() => onIntent({ type: 'itemAddRequested', nodeId: node.id })}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {model.preview ? (
              <View
                role="region"
                aria-label={l.previewTitle(model.preview.groupLabel)}
                style={[styles.previewBox, { borderColor: t.primaryBorder, backgroundColor: t.surfaceAccent }]}
              >
                <Text
                  role="heading"
                  style={{
                    color: t.text,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: family,
                  }}
                >
                  {l.previewTitle(model.preview.groupLabel)}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
                  {l.previewSummary(model.preview.items.length, model.preview.duplicateIds.length)}
                </Text>
                <View role="list" style={styles.tightStack}>
                  {model.preview.items.map(item => (
                    <Text
                      key={item.catalogueId}
                      role="listitem"
                      style={{ color: t.text, fontSize: t.textSm, fontFamily: family }}
                    >
                      • {item.label}
                      {item.code ? ` (${item.code})` : ''}
                    </Text>
                  ))}
                </View>
                <View style={styles.inlineWrap}>
                  <EmrButton
                    small
                    label={l.addGroup}
                    onPress={() => onIntent({ type: 'groupAddConfirmed', groupId: model.preview!.groupId })}
                  />
                  <EmrButton
                    small
                    variant="outline"
                    label={l.cancel}
                    onPress={() => onIntent({ type: 'groupPreviewDismissed' })}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </EmrCard>
      </View>

      <View style={styles.pickerColumn}>
        <EmrCard>
          <View style={styles.stack}>
            <View style={styles.orderHeader}>
              <Text
                role="heading"
                style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
              >
                {l.selectedOrders}
              </Text>
              <EmrBadgeView badge={{ label: String(model.selected.length), tone: 'neutral' }} />
            </View>

            {model.selected.length === 0 ? (
              <EmrStateMessage kind="empty" title={l.emptySelected} />
            ) : (
              <View style={styles.stack}>
                {model.selected.map(order => (
                  <EmrOrderDetails
                    key={order.id}
                    model={order}
                    labels={labels}
                    onIntent={detailIntent => {
                      if (detailIntent.type === 'removeRequested') {
                        onIntent({ type: 'orderRemoveRequested', orderId: detailIntent.orderId });
                      } else {
                        onIntent({
                          type: 'orderDetailChanged',
                          orderId: detailIntent.orderId,
                          field: detailIntent.field,
                          value: detailIntent.value,
                        });
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </EmrCard>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrFavouritesPanel
// ---------------------------------------------------------------------------

export const FAVOURITES_DEFAULTS = {
  tabsAria: 'Favourite categories',
  tabMedications: 'Medications',
  tabLaboratory: 'Laboratory',
  tabRadiology: 'Radiology',
  tabCombinations: 'Combinations',
  searchAria: 'Search favourites',
  searchPlaceholder: 'Search favourites',
  newFavourite: 'New',
  errorTitle: 'Favourites error',
  retry: 'Retry',
  loading: 'Loading favourites…',
  empty: 'No favourites in this category.',
  apply: 'Apply',
  edit: 'Edit',
  moveUp: 'Move up',
  moveDown: 'Move down',
  delete: 'Delete',
  backToFavourites: 'Back to favourites',
  editTitle: 'Edit favourite',
  newTitle: 'New favourite',
  favouriteName: 'Favourite name',
  includedOrders: 'Included orders',
  noOrderTemplates: 'No order templates included.',
  remove: 'Remove',
  removeOrderAria: (label: string) => `Remove ${label}`,
  saving: 'Saving…',
  saveFavourite: 'Save favourite',
  appliedTitle: 'Favourite applied',
  appliedSuccess: 'All order templates were resolved successfully.',
  appliedWarningTitle: 'Some templates need attention',
};

export type EmrFavouritesPanelLabels = typeof FAVOURITES_DEFAULTS;

/**
 * L4 tabbed favourites list, editor, and apply-result panel.
 */
export function EmrFavouritesPanel({
  model,
  headingId,
  labels,
  onIntent,
}: {
  model: FavouritesPanelViewModel;
  headingId?: string;
  labels?: Partial<EmrFavouritesPanelLabels>;
  onIntent: (intent: FavouritesPanelIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...FAVOURITES_DEFAULTS, ...labels };
  const family = fontFamily(t);

  const tabs: readonly EmrOption[] = [
    { value: 'medication', label: l.tabMedications },
    { value: 'laboratory', label: l.tabLaboratory },
    { value: 'radiology', label: l.tabRadiology },
    { value: 'combination', label: l.tabCombinations },
  ];

  if (model.mode === 'editor' && model.editor) {
    const editor = model.editor;
    const isExisting = isExistingFavourite(model.items, editor.id);
    return (
      <View role="region" aria-labelledby={headingId} style={styles.stack}>
        <View style={styles.inlineWrap}>
          <EmrButton
            small
            variant="ghost"
            label={l.backToFavourites}
            onPress={() => onIntent({ type: 'backRequested' })}
          />
        </View>
        <Text
          nativeID={headingId}
          role="heading"
          style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
        >
          {isExisting ? l.editTitle : l.newTitle}
        </Text>
        <EmrTextInput
          controlId="emr-favourite-name"
          label={l.favouriteName}
          value={editor.name}
          error={model.error || undefined}
          onValueChange={name => onIntent({ type: 'editorNameChanged', name: name ?? '' })}
        />
        <View style={styles.stack}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>
            {l.includedOrders}
          </Text>
          {editor.orderTemplates.length === 0 ? (
            <EmrStateMessage kind="empty" title={l.noOrderTemplates} />
          ) : (
            <View role="list" style={styles.tightStack}>
              {editor.orderTemplates.map(order => (
                <View
                  key={order.id}
                  role="listitem"
                  style={[styles.templateRow, { borderColor: t.border, backgroundColor: t.surface }]}
                >
                  <View style={styles.flex}>
                    <Text
                      style={{
                        color: t.text,
                        fontSize: t.textMd,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: family,
                      }}
                    >
                      {order.label}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{order.kind}</Text>
                  </View>
                  <EmrButton
                    small
                    variant="ghost"
                    label={l.remove}
                    accessibilityLabel={l.removeOrderAria(order.label)}
                    onPress={() =>
                      onIntent({
                        type: 'editorOrdersChanged',
                        orders: withoutEditorOrder(editor.orderTemplates, order.id),
                      })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.inlineWrap}>
          <EmrButton
            label={model.loading ? l.saving : l.saveFavourite}
            disabled={model.loading}
            onPress={() => onIntent({ type: 'saveRequested' })}
          />
        </View>
      </View>
    );
  }

  if (model.mode === 'apply-result') {
    const issues = model.applyIssues ?? [];
    return (
      <View role="region" aria-labelledby={headingId} style={styles.stack}>
        <View style={styles.inlineWrap}>
          <EmrButton
            small
            variant="ghost"
            label={l.backToFavourites}
            onPress={() => onIntent({ type: 'backRequested' })}
          />
        </View>
        <Text
          nativeID={headingId}
          role="heading"
          style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
        >
          {l.appliedTitle}
        </Text>
        {issues.length === 0 ? (
          <EmrAlert tone="success" title={l.appliedSuccess} />
        ) : (
          <EmrAlert tone="warning" title={l.appliedWarningTitle}>
            <View role="list" style={styles.tightStack}>
              {issues.map(issue => (
                <Text
                  key={issue.catalogueId}
                  role="listitem"
                  style={{ color: t.text, fontSize: t.textSm, fontFamily: family }}
                >
                  • {issue.label}: {issue.reason}
                  {issue.detail ? ` — ${issue.detail}` : ''}
                </Text>
              ))}
            </View>
          </EmrAlert>
        )}
      </View>
    );
  }

  return (
    <View role="region" aria-labelledby={headingId} style={styles.stack}>
      <EmrTabs
        ariaLabel={l.tabsAria}
        tabs={tabs}
        active={model.activeKind}
        onTabChange={kind => onIntent({ type: 'tabChanged', kind: kind as FavouriteKind })}
      />

      <View style={styles.toolbarRow}>
        <View style={styles.flex}>
          <ThemedInput
            value={model.query}
            aria-label={l.searchAria}
            placeholder={l.searchPlaceholder}
            inputMode="search"
            onChangeText={query => onIntent({ type: 'queryChanged', query })}
          />
        </View>
        <EmrButton
          label={l.newFavourite}
          onPress={() => onIntent({ type: 'createRequested', kind: model.activeKind })}
        />
      </View>

      {model.error ? (
        <EmrAlert tone="danger" title={l.errorTitle}>
          <View style={styles.inlineWrap}>
            <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: family }}>{model.error}</Text>
            <EmrButton small variant="outline" label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} />
          </View>
        </EmrAlert>
      ) : null}

      {model.loading && model.items.length === 0 ? <EmrStateMessage kind="loading" title={l.loading} /> : null}

      {!model.loading && model.items.length === 0 ? <EmrStateMessage kind="empty" title={l.empty} /> : null}

      {model.items.map((item, index) => {
        const first = index === 0;
        const last = index === model.items.length - 1;
        return (
          <View
            key={item.id}
            role="article"
            style={[styles.orderCard, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderTitleRow}>
                <Text aria-hidden style={{ color: t.warning, fontSize: t.textMd }}>
                  ★
                </Text>
                <Text
                  style={{
                    color: t.text,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: family,
                  }}
                >
                  {item.name}
                </Text>
              </View>
              <EmrBadgeView badge={{ label: String(item.orderTemplates.length), tone: 'neutral' }} />
            </View>
            {item.summary ? (
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{item.summary}</Text>
            ) : null}
            <View style={styles.inlineWrap}>
              <EmrButton small label={l.apply} onPress={() => onIntent({ type: 'applyRequested', id: item.id })} />
              <EmrButton
                small
                variant="outline"
                label={l.edit}
                onPress={() => onIntent({ type: 'editRequested', id: item.id })}
              />
              <EmrButton
                small
                variant="ghost"
                label={l.moveUp}
                disabled={first}
                onPress={() => onIntent({ type: 'moveRequested', id: item.id, direction: 'up' })}
              />
              <EmrButton
                small
                variant="ghost"
                label={l.moveDown}
                disabled={last}
                onPress={() => onIntent({ type: 'moveRequested', id: item.id, direction: 'down' })}
              />
              <EmrButton
                small
                variant="outline"
                label={l.delete}
                onPress={() => onIntent({ type: 'deleteRequested', id: item.id })}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 5. EmrDocumentUploadQueue
// ---------------------------------------------------------------------------

export const DOC_QUEUE_DEFAULTS = {
  chooseSingle: 'Choose document',
  chooseMultiple: 'Choose documents',
  dropzoneHint: 'Standard file selection · no files are uploaded by this component',
  selectedDocumentsAria: 'Selected documents',
  retry: 'Retry',
  cancel: 'Cancel',
  remove: 'Remove',
  empty: 'No documents selected.',
};

export type EmrDocumentUploadQueueLabels = typeof DOC_QUEUE_DEFAULTS;

const DEFAULT_SAMPLE_SOURCES: readonly SelectedDocumentSource[] = [
  {
    fileName: 'clinical-attachment.pdf',
    size: 184320,
    mediaType: 'PDF',
    sourceToken: 'synthetic-picked-source',
  },
];

/**
 * L4 controlled document upload queue for `DocumentUploadQueueViewModel`.
 * Never reads or uploads bytes itself; emits `DocumentUploadIntent` actions.
 */
export function EmrDocumentUploadQueue({
  model,
  headingId = 'emr-document-upload-heading',
  sampleFiles = DEFAULT_SAMPLE_SOURCES,
  labels,
  onIntent,
}: {
  model: DocumentUploadQueueViewModel;
  headingId?: string;
  /** Optional synthetic sources emitted when the picker trigger is pressed without a native file dialog. */
  sampleFiles?: readonly SelectedDocumentSource[];
  labels?: Partial<EmrDocumentUploadQueueLabels>;
  onIntent: (intent: DocumentUploadIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...DOC_QUEUE_DEFAULTS, ...labels };
  const family = fontFamily(t);
  const emit = (intent: DocumentUploadIntent) => {
    if (!model.disabled) onIntent(intent);
  };
  const announcement = uploadQueueAnnouncement(model.candidates);

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      style={[styles.queueCard, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.tightStack}>
        <Text
          nativeID={headingId}
          role="heading"
          style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
        >
          {model.label}
        </Text>
        {model.acceptDescription ? (
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{model.acceptDescription}</Text>
        ) : null}
      </View>

      <View
        style={[
          styles.dropzone,
          {
            borderColor: t.primaryBorder,
            backgroundColor: t.surfaceAccent,
            opacity: model.disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: t.primary,
            fontSize: t.textMd,
            fontWeight: fontWeight(t.weightBold),
            fontFamily: family,
          }}
        >
          {model.multiple ? l.chooseMultiple : l.chooseSingle}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{l.dropzoneHint}</Text>
        <View style={styles.inlineWrap}>
          <EmrButton
            variant="outline"
            label={model.multiple ? l.chooseMultiple : l.chooseSingle}
            disabled={model.disabled}
            onPress={() =>
              emit({
                type: 'filesSelected',
                files: model.multiple ? sampleFiles : sampleFiles.slice(0, 1),
              })
            }
          />
        </View>
      </View>

      {model.error ? (
        <Text role="alert" style={{ color: t.danger, fontSize: t.textSm, fontFamily: family }}>
          {model.error}
        </Text>
      ) : null}

      <View aria-live="polite" style={styles.srOnly}>
        <Text>{announcement}</Text>
      </View>

      {model.candidates.length > 0 ? (
        <View role="list" aria-label={l.selectedDocumentsAria} style={styles.tightStack}>
          {model.candidates.map(candidate => {
            const isError = candidate.status === 'error';
            const isProcessing = candidate.status === 'processing';
            return (
              <View
                key={candidate.id}
                role="listitem"
                style={[styles.candidateRow, { borderTopColor: t.border }]}
              >
                <View style={styles.candidateMain}>
                  <View style={styles.flex}>
                    <Text
                      style={{
                        color: t.text,
                        fontSize: t.textMd,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: family,
                      }}
                    >
                      {candidate.fileName}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
                      {candidate.mediaTypeLabel} · {candidate.sizeLabel}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: isError ? t.danger : t.text,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(t.weightMedium),
                      fontFamily: family,
                    }}
                  >
                    {candidate.statusLabel}
                    {candidate.progress !== undefined ? ` · ${candidate.progress}%` : ''}
                  </Text>

                  <View style={styles.inlineWrap}>
                    {isError ? (
                      <EmrButton
                        small
                        variant="outline"
                        label={l.retry}
                        disabled={model.disabled}
                        onPress={() => emit({ type: 'candidateRetryRequested', candidateId: candidate.id })}
                      />
                    ) : null}
                    {isProcessing ? (
                      <EmrButton
                        small
                        variant="ghost"
                        label={l.cancel}
                        disabled={model.disabled}
                        onPress={() => emit({ type: 'candidateCancelRequested', candidateId: candidate.id })}
                      />
                    ) : null}
                    {!isProcessing ? (
                      <EmrButton
                        small
                        variant="ghost"
                        label={l.remove}
                        disabled={model.disabled}
                        onPress={() => emit({ type: 'candidateRemoveRequested', candidateId: candidate.id })}
                      />
                    ) : null}
                  </View>
                </View>

                {candidate.error ? (
                  <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: family }}>{candidate.error}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: family }}>{l.empty}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 6. EmrPatientDocuments
// ---------------------------------------------------------------------------

export const PATIENT_DOCS_DEFAULTS = {
  totalDocuments: (total: number) => `${total} document${total === 1 ? '' : 's'}`,
  searchAria: 'Search documents',
  searchPlaceholder: 'Search name, category, folder or file',
  filterCategory: 'Filter category',
  allCategories: 'All categories',
  filterFolder: 'Filter folder',
  allFolders: 'All folders',
  sortDocuments: 'Sort documents',
  sortNewest: 'Newest first',
  sortOldest: 'Oldest first',
  sortTitleAsc: 'Title A to Z',
  sortTitleDesc: 'Title Z to A',
  sortFolderAsc: 'Folder A to Z',
  sortFolderDesc: 'Folder Z to A',
  loading: 'Loading documents…',
  errorTitle: 'Documents could not be loaded',
  retry: 'Retry',
  empty: 'No documents match this search.',
  colDocument: 'Document',
  colDate: 'Date',
  colCategory: 'Category',
  colFolder: 'Folder',
  colStatus: 'Status',
  colActions: 'Actions',
  none: '—',
  preview: 'Preview',
  download: 'Download',
  delete: 'Delete',
  paginationAria: 'Document pages',
  previous: 'Previous',
  next: 'Next',
  pageSummary: (page: number, total: number) => `Page ${page} · ${total} documents`,
};

export type EmrPatientDocumentsLabels = typeof PATIENT_DOCS_DEFAULTS;

const DOCS_WIDE_MIN = 700;

/**
 * L4 searchable, filterable, sortable patient document library.
 * Wide table layout at >= 700px container width via `onLayout`, card list below.
 */
export function EmrPatientDocuments({
  model,
  headingId,
  wideFrom = DOCS_WIDE_MIN,
  labels,
  onIntent,
}: {
  model: PatientDocumentsViewModel;
  headingId?: string;
  wideFrom?: number;
  labels?: Partial<EmrPatientDocumentsLabels>;
  onIntent: (intent: PatientDocumentsIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...PATIENT_DOCS_DEFAULTS, ...labels };
  const family = fontFamily(t);
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= wideFrom;
  const resolvedHeadingId = headingId ?? `emr-patient-documents-heading-${model.instanceId}`;
  const pager = documentPaginationState(model.page, model.pageSize, model.total);

  const sortOptions: readonly EmrOption[] = [
    { value: 'createdAt:desc', label: l.sortNewest },
    { value: 'createdAt:asc', label: l.sortOldest },
    { value: 'title:asc', label: l.sortTitleAsc },
    { value: 'title:desc', label: l.sortTitleDesc },
    { value: 'folder:asc', label: l.sortFolderAsc },
    { value: 'folder:desc', label: l.sortFolderDesc },
  ];

  const categoryOptions: readonly EmrOption[] = model.categoryOptions?.length
    ? [{ value: 'all', label: l.allCategories }, ...model.categoryOptions]
    : [];

  const folderOptions: readonly EmrOption[] = model.folderOptions?.length
    ? [{ value: 'all', label: l.allFolders }, ...model.folderOptions]
    : [];

  const renderActions = (doc: PatientDocumentRecord) => (
    <View style={styles.inlineWrap}>
      {doc.canPreview ? (
        <EmrButton
          small
          variant="ghost"
          label={l.preview}
          onPress={() => onIntent({ type: 'previewRequested', documentId: doc.id })}
        />
      ) : null}
      {doc.canDownload ? (
        <EmrButton
          small
          variant="ghost"
          label={l.download}
          onPress={() => onIntent({ type: 'downloadRequested', documentId: doc.id })}
        />
      ) : null}
      {doc.canDelete ? (
        <EmrButton
          small
          variant="ghost"
          label={l.delete}
          onPress={() => onIntent({ type: 'deleteRequested', documentId: doc.id })}
        />
      ) : null}
    </View>
  );

  const renderSelectButton = (doc: PatientDocumentRecord) => (
    <Pressable
      role="button"
      onPress={() => onIntent(resolveDocumentRowAction(doc))}
      style={({ focused }: PressState) => [
        styles.docSelectButton,
        focusRing(t, focused),
        { minHeight: t.controlHeight },
      ]}
    >
      <Text
        style={{
          color: t.text,
          fontSize: t.textMd,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: family,
        }}
      >
        {doc.title}
      </Text>
      <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
        {doc.fileName} · {doc.mediaTypeLabel} · {doc.sizeLabel}
      </Text>
    </Pressable>
  );

  let content: ReactNode;
  if (model.loading) {
    content = <EmrStateMessage kind="loading" title={l.loading} />;
  } else if (model.error) {
    content = (
      <EmrStateMessage kind="error" title={l.errorTitle} message={model.error}>
        <EmrButton small variant="outline" label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} />
      </EmrStateMessage>
    );
  } else if (model.documents.length === 0) {
    content = <EmrStateMessage kind="empty" title={l.empty} />;
  } else {
    content = (
      <>
        {wide ? (
          <View role="table" aria-label={model.label}>
            <View
              role="row"
              style={[styles.docTableRow, { borderBottomColor: t.border, backgroundColor: t.surfaceAccent }]}
            >
              <View role="columnheader" style={[styles.docCell, { flexGrow: 2.2 }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>
                  {l.colDocument}
                </Text>
              </View>
              <View role="columnheader" style={[styles.docCell, { flexGrow: 1.2 }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>
                  {l.colDate}
                </Text>
              </View>
              <View role="columnheader" style={[styles.docCell, { flexGrow: 1 }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>
                  {l.colCategory}
                </Text>
              </View>
              <View role="columnheader" style={[styles.docCell, { flexGrow: 1.2 }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>
                  {l.colFolder}
                </Text>
              </View>
              <View role="columnheader" style={[styles.docCell, { flexGrow: 1 }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>
                  {l.colStatus}
                </Text>
              </View>
              <View role="columnheader" style={[styles.docCell, { flexGrow: 1.4 }]}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: family }}>
                  {l.colActions}
                </Text>
              </View>
            </View>

            {model.documents.map(doc => {
              const selected = model.selectedDocumentId === doc.id;
              return (
                <View
                  key={doc.id}
                  role="row"
                  style={[
                    styles.docTableRow,
                    {
                      borderBottomColor: t.border,
                      backgroundColor: selected ? t.surfaceAccent : undefined,
                    },
                  ]}
                >
                  <View role="cell" style={[styles.docCell, { flexGrow: 2.2 }]}>
                    {renderSelectButton(doc)}
                  </View>
                  <View role="cell" style={[styles.docCell, { flexGrow: 1.2 }]}>
                    <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: family }}>{doc.createdAtLabel}</Text>
                    {doc.authorLabel ? (
                      <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>{doc.authorLabel}</Text>
                    ) : null}
                  </View>
                  <View role="cell" style={[styles.docCell, { flexGrow: 1 }]}>
                    <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: family }}>{doc.categoryLabel}</Text>
                  </View>
                  <View role="cell" style={[styles.docCell, { flexGrow: 1.2 }]}>
                    <Text style={{ color: t.text, fontSize: t.textMd, fontFamily: family }}>{doc.folderLabel}</Text>
                  </View>
                  <View role="cell" style={[styles.docCell, { flexGrow: 1 }]}>
                    {doc.status ? (
                      <EmrBadgeView badge={doc.status} />
                    ) : (
                      <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: family }}>{l.none}</Text>
                    )}
                  </View>
                  <View role="cell" style={[styles.docCell, { flexGrow: 1.4 }]}>
                    {renderActions(doc)}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View role="list" aria-label={model.label} style={styles.stack}>
            {model.documents.map(doc => {
              const selected = model.selectedDocumentId === doc.id;
              return (
                <View
                  key={doc.id}
                  role="listitem"
                  style={[
                    styles.docCard,
                    {
                      borderColor: selected ? t.primary : t.border,
                      backgroundColor: selected ? t.surfaceAccent : t.surface,
                    },
                  ]}
                >
                  {renderSelectButton(doc)}
                  <View style={styles.docCardMeta}>
                    <View style={styles.docMetaItem}>
                      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: family }}>{l.colDate}</Text>
                      <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: family }}>{doc.createdAtLabel}</Text>
                    </View>
                    <View style={styles.docMetaItem}>
                      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: family }}>{l.colCategory}</Text>
                      <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: family }}>{doc.categoryLabel}</Text>
                    </View>
                    <View style={styles.docMetaItem}>
                      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: family }}>{l.colFolder}</Text>
                      <Text style={{ color: t.text, fontSize: t.textSm, fontFamily: family }}>{doc.folderLabel}</Text>
                    </View>
                  </View>
                  {doc.status ? <EmrBadgeView badge={doc.status} /> : null}
                  {renderActions(doc)}
                </View>
              );
            })}
          </View>
        )}

        <View role="navigation" aria-label={l.paginationAria} style={styles.pagerRow}>
          <EmrButton
            small
            variant="outline"
            label={l.previous}
            disabled={!pager.canPrevious}
            onPress={() => onIntent({ type: 'pageChanged', page: model.page - 1 })}
          />
          <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
            {l.pageSummary(model.page, model.total)}
          </Text>
          <EmrButton
            small
            variant="outline"
            label={l.next}
            disabled={!pager.canNext}
            onPress={() => onIntent({ type: 'pageChanged', page: model.page + 1 })}
          />
        </View>
      </>
    );
  }

  return (
    <View
      role="region"
      aria-labelledby={resolvedHeadingId}
      onLayout={onLayout}
      style={[styles.queueCard, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.tightStack}>
        <Text
          nativeID={resolvedHeadingId}
          role="heading"
          style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
        >
          {model.label}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
          {l.totalDocuments(model.total)}
        </Text>
      </View>

      <View style={[styles.docsToolbar, { flexDirection: wide ? 'row' : 'column' }]}>
        <View style={styles.flex}>
          <ThemedInput
            value={model.query}
            aria-label={l.searchAria}
            placeholder={l.searchPlaceholder}
            inputMode="search"
            onChangeText={query => onIntent({ type: 'queryChanged', query })}
          />
        </View>
        {categoryOptions.length > 0 ? (
          <View style={styles.filterCell}>
            <EmrSelect
              label={l.filterCategory}
              options={categoryOptions}
              value={model.category ?? 'all'}
              onChange={category => onIntent({ type: 'categoryChanged', category: category ?? 'all' })}
            />
          </View>
        ) : null}
        {folderOptions.length > 0 ? (
          <View style={styles.filterCell}>
            <EmrSelect
              label={l.filterFolder}
              options={folderOptions}
              value={model.folder ?? 'all'}
              onChange={folder => onIntent({ type: 'folderChanged', folder: folder ?? 'all' })}
            />
          </View>
        ) : null}
        <View style={styles.filterCell}>
          <EmrSelect
            label={l.sortDocuments}
            options={sortOptions}
            value={formatDocumentSortValue(model.sort)}
            onChange={raw => {
              const parsed = parseDocumentSortValue(raw);
              if (parsed) onIntent({ type: 'sortChanged', ...parsed });
            }}
          />
        </View>
      </View>

      {content}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 7. EmrDocumentViewer
// ---------------------------------------------------------------------------

export const DOC_VIEWER_DEFAULTS = {
  eyebrow: 'Document viewer',
  fallbackTitle: 'Document preview',
  documentPosition: (current: number, total: number) => `Document ${current} of ${total}`,
  close: 'Close',
  closeAria: 'Close document viewer',
  metaCategory: 'Category',
  metaFolder: 'Folder',
  metaDate: 'Date',
  metaPosition: 'Position',
  toolbarAria: 'Document navigation and view controls',
  previousDocument: 'Previous document',
  nextDocument: 'Next document',
  page: 'Page',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  zoomOutAria: 'Zoom out',
  zoomInAria: 'Zoom in',
  reset: 'Reset',
  rotateCcwAria: 'Rotate counter-clockwise',
  rotateCwAria: 'Rotate clockwise',
  loadingPage: 'Loading document page…',
  errorTitle: 'Unable to load this page',
  retry: 'Retry',
  noPage: 'No page is available.',
  keyboardHint:
    'Use arrow keys for documents, Page Up/Down for PDF pages, +/−/0 for zoom and R/Shift+R to rotate.',
};

export type EmrDocumentViewerLabels = typeof DOC_VIEWER_DEFAULTS;

/**
 * L4 modal raster document viewer with document/page navigation and local transient zoom/rotation state.
 */
export function EmrDocumentViewer({
  model,
  headingId = 'emr-document-viewer-heading',
  inline = false,
  labels,
  onIntent,
}: {
  model: DocumentViewerViewModel;
  headingId?: string;
  /** When true, renders the dialog surface inline inside its container rather than a portal Modal. */
  inline?: boolean;
  labels?: Partial<EmrDocumentViewerLabels>;
  onIntent: (intent: DocumentViewerIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...DOC_VIEWER_DEFAULTS, ...labels };
  const family = fontFamily(t);

  const [mounted, setMounted] = useState(Platform.OS !== 'web');
  useEffect(() => setMounted(true), []);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const assetId = model.page?.assetId;
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [assetId]);

  if (!model.open) return null;

  const titleId = `${headingId}-${model.instanceId}`;
  const pages = viewerPageIndices(model.currentDocument?.pageCount);
  const pageOptions: readonly EmrOption[] = pages.map(pageIdx => ({
    value: String(pageIdx),
    label: `${l.page} ${pageIdx + 1}`,
  }));

  const close = () => onIntent({ type: 'closeRequested' });

  const webKeys =
    Platform.OS === 'web'
      ? {
          onKeyDown: (e: { key?: string; shiftKey?: boolean; preventDefault?: () => void }) => {
            if (e.key === 'Escape') {
              e.preventDefault?.();
              close();
            } else if (e.key === 'ArrowLeft' && model.canPreviousDocument) {
              e.preventDefault?.();
              onIntent({ type: 'previousDocumentRequested' });
            } else if (e.key === 'ArrowRight' && model.canNextDocument) {
              e.preventDefault?.();
              onIntent({ type: 'nextDocumentRequested' });
            } else if (e.key === 'PageUp' && model.canPreviousPage) {
              e.preventDefault?.();
              onIntent({ type: 'previousPageRequested' });
            } else if (e.key === 'PageDown' && model.canNextPage) {
              e.preventDefault?.();
              onIntent({ type: 'nextPageRequested' });
            } else if (e.key === '+' || e.key === '=') {
              e.preventDefault?.();
              setZoom(z => stepViewerZoom(z, 0.25));
            } else if (e.key === '-' || e.key === '_') {
              e.preventDefault?.();
              setZoom(z => stepViewerZoom(z, -0.25));
            } else if (e.key === '0') {
              e.preventDefault?.();
              setZoom(1);
              setRotation(0);
            } else if (e.key?.toLowerCase() === 'r') {
              e.preventDefault?.();
              setRotation(r => stepViewerRotation(r, e.shiftKey ? -90 : 90));
            }
          },
        }
      : null;

  const surface = (
    <View
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      tabIndex={-1}
      {...webKeys}
      style={[
        styles.viewerContainer,
        {
          backgroundColor: t.background,
          borderColor: t.border,
          borderWidth: inline ? 1 : 0,
          borderRadius: inline ? 12 : 0,
        },
      ]}
    >
      <View style={styles.viewerHeader}>
        <View style={styles.flex}>
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.text2xs,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: family,
              textTransform: 'uppercase',
            }}
          >
            {l.eyebrow}
          </Text>
          <Text
            nativeID={titleId}
            role="heading"
            style={{ color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold), fontFamily: family }}
          >
            {model.currentDocument?.title || l.fallbackTitle}
          </Text>
          {model.currentDocument ? (
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
              {model.currentDocument.fileName} · {model.currentDocument.kind}
            </Text>
          ) : null}
        </View>

        <View style={styles.inlineWrap}>
          <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
            {l.documentPosition(model.documentIndex + 1, model.documentCount)}
          </Text>
          <EmrButton small variant="ghost" label={l.close} accessibilityLabel={l.closeAria} onPress={close} />
        </View>
      </View>

      {model.currentDocument ? (
        <View style={[styles.viewerMeta, { borderColor: t.border, backgroundColor: t.surface }]}>
          <View style={styles.docMetaItem}>
            <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(650), fontFamily: family }}>
              {l.metaCategory}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: family }}>
              {model.currentDocument.categoryLabel}
            </Text>
          </View>
          <View style={styles.docMetaItem}>
            <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(650), fontFamily: family }}>
              {l.metaFolder}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: family }}>
              {model.currentDocument.folderLabel}
            </Text>
          </View>
          <View style={styles.docMetaItem}>
            <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(650), fontFamily: family }}>
              {l.metaDate}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: family }}>
              {model.currentDocument.createdAtLabel}
            </Text>
          </View>
          <View style={styles.docMetaItem}>
            <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(650), fontFamily: family }}>
              {l.metaPosition}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: family }}>
              {model.documentIndex + 1} / {model.documentCount}
            </Text>
          </View>
        </View>
      ) : null}

      <View role="toolbar" aria-label={l.toolbarAria} style={styles.viewerToolbar}>
        <EmrButton
          small
          variant="outline"
          label={l.previousDocument}
          disabled={!model.canPreviousDocument}
          onPress={() => onIntent({ type: 'previousDocumentRequested' })}
        />
        <EmrButton
          small
          variant="outline"
          label={l.nextDocument}
          disabled={!model.canNextDocument}
          onPress={() => onIntent({ type: 'nextDocumentRequested' })}
        />

        {model.currentDocument?.kind === 'pdf' ? (
          <>
            <View style={styles.pageSelectWrap}>
              <EmrSelect
                label={l.page}
                options={pageOptions}
                value={String(model.pageIndex)}
                disabled={model.loading}
                onChange={val => {
                  if (val !== null) onIntent({ type: 'pageRequested', pageIndex: Number(val) });
                }}
              />
            </View>
            <EmrButton
              small
              variant="outline"
              label={l.previousPage}
              disabled={!model.canPreviousPage}
              onPress={() => onIntent({ type: 'previousPageRequested' })}
            />
            <EmrButton
              small
              variant="outline"
              label={l.nextPage}
              disabled={!model.canNextPage}
              onPress={() => onIntent({ type: 'nextPageRequested' })}
            />
          </>
        ) : null}

        <View style={styles.flex} />

        <EmrButton
          small
          variant="outline"
          label="−"
          accessibilityLabel={l.zoomOutAria}
          onPress={() => setZoom(z => stepViewerZoom(z, -0.25))}
        />
        <Text aria-live="polite" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: family }}>
          {viewerZoomPercent(zoom)}%
        </Text>
        <EmrButton
          small
          variant="outline"
          label="+"
          accessibilityLabel={l.zoomInAria}
          onPress={() => setZoom(z => stepViewerZoom(z, 0.25))}
        />
        <EmrButton
          small
          variant="ghost"
          label={l.reset}
          onPress={() => {
            setZoom(1);
            setRotation(0);
          }}
        />
        <EmrButton
          small
          variant="ghost"
          label="↶"
          accessibilityLabel={l.rotateCcwAria}
          onPress={() => setRotation(r => stepViewerRotation(r, -90))}
        />
        <EmrButton
          small
          variant="ghost"
          label="↷"
          accessibilityLabel={l.rotateCwAria}
          onPress={() => setRotation(r => stepViewerRotation(r, 90))}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.viewerViewport,
          { borderColor: t.border, backgroundColor: t.surfaceRaised },
        ]}
      >
        {model.loading ? (
          <EmrStateMessage kind="loading" title={l.loadingPage} />
        ) : model.error ? (
          <EmrStateMessage kind="error" title={l.errorTitle} message={model.error}>
            <EmrButton small variant="outline" label={l.retry} onPress={() => onIntent({ type: 'retryRequested' })} />
          </EmrStateMessage>
        ) : model.page ? (
          <Image
            source={{ uri: model.page.rasterUrl }}
            accessibilityLabel={model.page.altText}
            resizeMode="contain"
            onError={() => onIntent({ type: 'rasterLoadFailed', assetId: model.page!.assetId })}
            style={[
              styles.viewerImage,
              {
                transform: [{ scale: zoom }, { rotate: `${rotation}deg` }],
              },
            ]}
          />
        ) : (
          <EmrStateMessage kind="empty" title={l.noPage} />
        )}
      </ScrollView>

      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: family, textAlign: 'center' }}>
        {l.keyboardHint}
      </Text>
    </View>
  );

  if (inline) return surface;
  if (!mounted) return null;

  return (
    <Modal visible={model.open} transparent statusBarTranslucent animationType="fade" onRequestClose={close}>
      {surface}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  stack: { gap: 12, minWidth: 0 },
  tightStack: { gap: 6, minWidth: 0 },
  flex: { flex: 1, minWidth: 0 },
  inlineWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderCard: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 12 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0 },
  orderFields: { gap: 10 },
  pickerLayout: { gap: 16, minWidth: 0 },
  pickerColumn: { flex: 1, minWidth: 0 },
  treeList: { gap: 2 },
  treeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1 },
  expandButton: { borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  nodeCheckHit: { alignItems: 'center', justifyContent: 'center' },
  nodeCheckBox: { width: 22, height: 22, borderWidth: 2, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  nodeBullet: { alignItems: 'center', justifyContent: 'center' },
  treeLabelWrap: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 6 },
  previewBox: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 10 },
  queueCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 14 },
  dropzone: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 16, gap: 8 },
  candidateRow: { borderTopWidth: 1, paddingVertical: 10, gap: 6 },
  candidateMain: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
  docsToolbar: { gap: 10 },
  filterCell: { minWidth: 160 },
  docTableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1 },
  docCell: { flexBasis: 0, minWidth: 0 },
  docSelectButton: { justifyContent: 'center', gap: 2 },
  docCard: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 10 },
  docCardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  docMetaItem: { flexGrow: 1, flexBasis: 100, minWidth: 0, gap: 2 },
  pagerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  viewerContainer: { flex: 1, padding: 18, gap: 12 },
  viewerHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  viewerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 12, borderWidth: 1, borderRadius: 9 },
  viewerToolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  pageSelectWrap: { minWidth: 120 },
  viewerViewport: { minHeight: 280, borderWidth: 1, borderRadius: 10, padding: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  viewerImage: { width: '100%', height: 260 },
});
