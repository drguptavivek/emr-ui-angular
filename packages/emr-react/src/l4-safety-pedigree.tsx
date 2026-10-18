'use client';

import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  ChecklistItemDefinition,
  FamilyPedigreeIntent,
  FamilyPedigreeViewModel,
  FamilyPersonNode,
  PacChecklistIntent,
  PacChecklistViewModel,
  StagedChecklistIntent,
  StagedChecklistViewModel,
} from '@drguptavivek/emr-controller';
import { EmrClinicalForm } from './clinical-form';
import { ThemedInput } from './inputs-core';
import { EmrStageStepper } from './l1-interactive';
import {
  activeChecklistPhase,
  canEmitChecklistIntent,
  checklistChoiceLabel,
  checklistHeadingId,
  checklistItemState,
  checklistStages,
  FAMILY_PEDIGREE_DEFAULTS,
  formatPersonAge,
  generationLabel,
  isChecklistItemDisabled,
  isChecklistItemReadOnly,
  isPacActionDisabled,
  isPersonDeceased,
  lifeIcon,
  lifeLabel,
  lifeState,
  needsChecklistNote,
  PAC_CHECKLIST_DEFAULTS,
  pacActionAriaLabel,
  pacActionVariant,
  pacHeadingId,
  pacSeverityLabel,
  pedigreeGenerations,
  pedigreeGlyph,
  peopleInGeneration,
  personAriaLabel,
  personName,
  phenotypeIcon,
  phenotypeLabel,
  phenotypeState,
  scopedPacForm,
  sexKind,
  STAGED_CHECKLIST_DEFAULTS,
  YES_NO_CHOICES,
  YES_NO_NA_CHOICES,
  type EmrFamilyPedigreeLabels,
  type EmrPacChecklistLabels,
  type EmrStagedChecklistLabels,
} from './l4-safety-pedigree.logic';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';

export * from './l4-safety-pedigree.logic';

type PressState = PressableStateCallbackType & { focused?: boolean };

// ---- 1. EmrStagedChecklist ---------------------------------------------------------------------

/**
 * L4 Staged Safety Checklist (e.g. WHO Surgical Safety Checklist: Sign In / Time Out / Sign Out).
 * Controlled presentation only: renders phases, items, required indicators, sign-offs, and blockers.
 */
export function EmrStagedChecklist({
  model,
  headingId,
  labels,
  onIntent,
}: {
  model: StagedChecklistViewModel;
  headingId?: string;
  labels?: Partial<EmrStagedChecklistLabels>;
  onIntent: (intent: StagedChecklistIntent) => void;
}) {
  const t = useEmrTheme();
  const l: EmrStagedChecklistLabels = { ...STAGED_CHECKLIST_DEFAULTS, ...labels };
  const resolvedHeadingId = checklistHeadingId(model, headingId);
  const phase = activeChecklistPhase(model);
  const signoff = phase ? model.signoffs?.[phase.id] : undefined;
  const font = { fontFamily: fontFamily(t) };

  const emit = (intent: StagedChecklistIntent) => {
    if (canEmitChecklistIntent(model, intent)) onIntent(intent);
  };

  const renderItemControl = (item: ChecklistItemDefinition) => {
    const state = checklistItemState(model, item);
    const disabled = isChecklistItemDisabled(model, item);
    const readOnly = isChecklistItemReadOnly(model, item);

    if (item.type === 'checkbox') {
      return (
        <View style={styles.itemHeaderRow}>
          <EmrOptionChip
            multiple
            label={item.label}
            selected={state.value === true}
            disabled={disabled}
            readOnly={readOnly}
            onPress={() => emit({ type: 'itemResponseRequested', itemId: item.id, value: state.value !== true })}
          />
          {item.required ? <EmrBadgeView badge={{ label: l.required, tone: 'neutral' }} /> : null}
        </View>
      );
    }

    const header = (
      <View style={styles.itemHeaderRow}>
        <Text style={[font, styles.grow, { color: disabled ? t.textMuted : t.text, fontSize: t.textMd, fontWeight: fontWeight(650) }]}>
          {item.label}
        </Text>
        {item.required ? <EmrBadgeView badge={{ label: l.required, tone: 'neutral' }} /> : null}
      </View>
    );

    if (item.type === 'yes-no' || item.type === 'yes-no-na') {
      const choices = item.type === 'yes-no-na' ? YES_NO_NA_CHOICES : YES_NO_CHOICES;
      return (
        <View style={styles.stackSm}>
          {header}
          <View role="radiogroup" aria-label={item.label} style={styles.wrap}>
            {choices.map(choice => (
              <EmrOptionChip
                key={choice}
                label={checklistChoiceLabel(choice, l)}
                selected={state.value === choice}
                disabled={disabled}
                readOnly={readOnly}
                onPress={() => emit({ type: 'itemResponseRequested', itemId: item.id, value: choice })}
              />
            ))}
          </View>
        </View>
      );
    }

    if (item.type === 'select') {
      return (
        <View style={styles.stackSm}>
          {header}
          <EmrSelect
            label={item.label}
            options={item.options ?? []}
            value={typeof state.value === 'string' ? state.value : null}
            invalid={Boolean(state.error)}
            disabled={disabled}
            readOnly={readOnly}
            onChange={value => emit({ type: 'itemResponseRequested', itemId: item.id, value })}
          />
        </View>
      );
    }

    return (
      <View style={styles.stackSm}>
        {header}
        <ThemedInput
          aria-label={item.label}
          value={typeof state.value === 'string' ? state.value : ''}
          editable={!disabled}
          readOnly={readOnly}
          invalid={Boolean(state.error)}
          onChangeText={value => emit({ type: 'itemResponseRequested', itemId: item.id, value })}
        />
      </View>
    );
  };

  return (
    <View role="region" aria-labelledby={resolvedHeadingId} style={[styles.checklistCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.checklistHeader}>
        <View style={styles.grow}>
          <Text role="heading" aria-level={2} nativeID={resolvedHeadingId} style={[font, { color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold) }]}>
            {model.schema.label}
          </Text>
          {model.schema.description ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textMd, marginTop: 4 }]}>{model.schema.description}</Text>
          ) : null}
        </View>
        {model.readOnly ? <EmrBadgeView badge={{ label: l.readOnly, tone: 'neutral' }} /> : null}
      </View>

      <EmrStageStepper
        stages={checklistStages(model)}
        activeId={model.activePhaseId}
        ariaLabel={l.phasesAria}
        onStageSelect={phaseId => emit({ type: 'phaseSelected', phaseId })}
      />

      {phase ? (
        <View style={styles.checklistBody}>
          <View style={styles.phaseHeading}>
            <View style={styles.grow}>
              <Text role="heading" aria-level={3} style={[font, { color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }]}>
                {phase.label}
              </Text>
              {phase.description ? (
                <Text style={[font, { color: t.textMuted, fontSize: t.textSm, marginTop: 2 }]}>{phase.description}</Text>
              ) : null}
            </View>
            <View style={styles.wrap}>
              <EmrButton
                variant="outline"
                label={l.completePhase}
                disabled={Boolean(model.readOnly)}
                onPress={() => emit({ type: 'phaseCompletionRequested', phaseId: phase.id })}
              />
              <EmrButton
                variant="ghost"
                small
                label={l.signoffPhase}
                disabled={Boolean(model.readOnly)}
                onPress={() => emit({ type: 'phaseSignoffRequested', phaseId: phase.id })}
              />
            </View>
          </View>

          {signoff ? (
            <View role="status" style={[styles.signoffBanner, { backgroundColor: t.successSoft, borderColor: t.success }]}>
              <Text style={[font, { color: t.text, fontSize: t.textSm }]}>
                {l.signedBy(signoff.displayName, signoff.roleLabel, signoff.signedAtLabel)}
              </Text>
            </View>
          ) : null}

          {phase.items.map(item => {
            const state = checklistItemState(model, item);
            const disabled = isChecklistItemDisabled(model, item);
            const readOnly = isChecklistItemReadOnly(model, item);
            return (
              <View key={item.id} style={[styles.checklistItem, { borderBottomColor: t.border }]}>
                {renderItemControl(item)}
                {item.description ? (
                  <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{item.description}</Text>
                ) : null}
                {state.error ? (
                  <Text role="alert" style={[font, { color: t.danger, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium) }]}>
                    {state.error}
                  </Text>
                ) : null}
                {needsChecklistNote(item, state) ? (
                  <View style={styles.stackSm}>
                    <Text style={[font, { color: t.text, fontSize: t.textSm, fontWeight: fontWeight(650) }]}>{l.note}</Text>
                    <ThemedInput
                      multiline
                      numberOfLines={3}
                      aria-label={`${item.label} ${l.note}`}
                      value={state.note ?? ''}
                      editable={!disabled}
                      readOnly={readOnly}
                      onChangeText={note => emit({ type: 'itemNoteRequested', itemId: item.id, note })}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}

          {model.error ? (
            <View role="alert" style={[styles.checklistErrorBanner, { backgroundColor: t.dangerSoft, borderColor: t.danger }]}>
              <Text style={[font, { color: t.danger, fontSize: t.textMd, fontWeight: fontWeight(t.weightMedium) }]}>
                {model.error}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---- 2. EmrPacChecklist ------------------------------------------------------------------------

/**
 * L4 Pre-Anaesthesia Checklist (PAC) wrapper.
 * Renders patient/procedure context, status badge, validation issues, embedded EmrClinicalForm, and actions.
 */
export function EmrPacChecklist({
  model,
  headingId,
  labels,
  onIntent,
}: {
  model: PacChecklistViewModel;
  headingId?: string;
  labels?: Partial<EmrPacChecklistLabels>;
  onIntent: (intent: PacChecklistIntent) => void;
}) {
  const t = useEmrTheme();
  const l: EmrPacChecklistLabels = { ...PAC_CHECKLIST_DEFAULTS, ...labels };
  const resolvedHeadingId = pacHeadingId(model, headingId);
  const font = { fontFamily: fontFamily(t) };

  return (
    <View role="region" aria-labelledby={resolvedHeadingId} style={[styles.pacCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.pacHeader}>
        <View style={styles.grow}>
          <Text style={[font, styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }]}>
            {l.eyebrow}
          </Text>
          <Text role="heading" aria-level={2} nativeID={resolvedHeadingId} style={[font, { color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold) }]}>
            {model.title}
          </Text>
          {model.description ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textMd, marginTop: 4 }]}>{model.description}</Text>
          ) : null}
        </View>
        <View style={styles.wrap}>
          {model.overallStatus ? <EmrBadgeView badge={model.overallStatus} /> : null}
          {model.readOnly ? <EmrBadgeView badge={{ label: l.readOnly, tone: 'neutral' }} /> : null}
        </View>
      </View>

      {model.context.length > 0 ? (
        <View role="group" aria-label={l.contextAria(model.instanceId)} style={[styles.pacContext, { backgroundColor: t.surfaceRaised, borderColor: t.border }]}>
          {model.context.map(item => (
            <View key={item.id} style={styles.pacContextItem}>
              <Text style={[font, { color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(650) }]}>{item.label}</Text>
              <Text style={[font, { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(600), marginTop: 2 }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {model.errors && model.errors.length > 0 ? (
        <View role="alert" aria-label={l.errorsAria(model.instanceId)} style={[styles.pacErrors, { backgroundColor: t.dangerSoft, borderColor: t.danger }]}>
          <Text style={[font, { color: t.danger, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }]}>
            {l.errorsTitle}
          </Text>
          <View style={styles.stackXs}>
            {model.errors.map(err => (
              <Text key={err.id} style={[font, { color: t.danger, fontSize: t.textSm }]}>
                <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{pacSeverityLabel(err.severity, l)}</Text>
                {` · ${err.message}`}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <EmrClinicalForm
          model={scopedPacForm(model)}
          onIntent={intent => {
            if (!model.readOnly) onIntent({ type: 'formIntent', intent });
          }}
        />
      </View>

      {model.actions.length > 0 ? (
        <View role="group" aria-label={l.actionsAria(model.instanceId)} style={[styles.pacActions, { borderTopColor: t.border }]}>
          {model.actions.map(action => {
            const disabled = isPacActionDisabled(model, action);
            return (
              <EmrButton
                key={action.id}
                variant={pacActionVariant(action.tone)}
                label={action.loading ? `${l.loadingPrefix}${action.label}` : action.label}
                accessibilityLabel={pacActionAriaLabel(action)}
                disabled={disabled}
                onPress={() => {
                  if (!disabled) onIntent({ type: 'actionRequested', actionId: action.id });
                }}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ---- 3. EmrFamilyPedigree ----------------------------------------------------------------------

function LegendMark({ glyph, tone, label }: { glyph: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; label: string }) {
  const t = useEmrTheme();
  const c = toneColors(t, tone);
  return (
    <View style={styles.legendItem}>
      <View aria-hidden style={[styles.legendMark, { backgroundColor: c.backgroundColor }]}>
        <Text style={{ color: c.color, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>{glyph}</Text>
      </View>
      <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>{label}</Text>
    </View>
  );
}

function PedigreeSymbol({ person }: { person: FamilyPersonNode }) {
  const t = useEmrTheme();
  const sex = sexKind(person);
  const pheno = phenotypeState(person);
  const deceased = isPersonDeceased(person);

  const borderColor = deceased || pheno === 'affected' ? t.danger : pheno === 'unaffected' ? t.success : t.text;
  const backgroundColor = pheno === 'affected' ? t.dangerSoft : pheno === 'unaffected' ? t.successSoft : t.surface;
  const glyphColor = deceased ? t.danger : t.text;
  const borderRadius = sex === 'female' ? 999 : sex === 'other' ? 12 : 6;

  return (
    <View
      aria-hidden
      style={[
        styles.pedigreeSymbol,
        {
          borderColor,
          backgroundColor,
          borderRadius,
        },
      ]}
    >
      <Text style={{ color: glyphColor, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
        {pedigreeGlyph(person)}
      </Text>
      {deceased ? <View style={[styles.deceasedSlash, { backgroundColor: t.danger }]} /> : null}
    </View>
  );
}

/**
 * L4 Family History & Pedigree surface.
 * Controlled presentation of family members by generation, pedigree symbols, vital/phenotype status, and relationships.
 */
export function EmrFamilyPedigree({
  model,
  headingId = 'emr-family-pedigree-heading',
  labels,
  onIntent,
}: {
  model: FamilyPedigreeViewModel;
  headingId?: string;
  labels?: Partial<EmrFamilyPedigreeLabels>;
  onIntent: (intent: FamilyPedigreeIntent) => void;
}) {
  const t = useEmrTheme();
  const l: EmrFamilyPedigreeLabels = { ...FAMILY_PEDIGREE_DEFAULTS, ...labels };
  const font = { fontFamily: fontFamily(t) };
  const generations = pedigreeGenerations(model.people);
  const relationshipsHeadingId = `${headingId}-relationships-heading`;

  return (
    <View role="region" aria-labelledby={headingId} style={[styles.pedigreeCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.pedigreeHeader}>
        <View style={styles.grow}>
          <Text style={[font, styles.eyebrow, { color: t.primary, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }]}>
            {l.eyebrow}
          </Text>
          <Text role="heading" aria-level={2} nativeID={headingId} style={[font, { color: t.text, fontSize: t.textXl, fontWeight: fontWeight(t.weightBold) }]}>
            {model.label}
          </Text>
        </View>
        {!model.readOnly ? (
          <EmrButton small variant="outline" label={l.addPerson} onPress={() => onIntent({ type: 'personAddRequested' })} />
        ) : null}
      </View>

      {model.people.length === 0 ? (
        <View role="status" style={[styles.emptyBox, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}>
          <Text style={[font, { color: t.textMuted, fontSize: t.textMd }]}>{model.emptyMessage || l.emptyMessage}</Text>
        </View>
      ) : (
        <>
          <View role="group" aria-label={l.legendAria} style={styles.stackSm}>
            <Text style={[font, { color: t.text, fontSize: t.textSm, fontWeight: fontWeight(650) }]}>{l.legendTitle}</Text>
            <View style={styles.legendGrid}>
              <LegendMark glyph="♂" tone="info" label={l.male} />
              <LegendMark glyph="♀" tone="success" label={l.female} />
              <LegendMark glyph="⚬" tone="neutral" label={l.otherSex} />
              <LegendMark glyph="✝" tone="danger" label={l.deceased} />
              <LegendMark glyph="●" tone="success" label={l.alive} />
              <LegendMark glyph="⚠" tone="warning" label={l.affected} />
              <LegendMark glyph="✓" tone="neutral" label={l.unaffected} />
            </View>
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{l.legendNote}</Text>
          </View>

          <View role="region" aria-label={l.generationsAria} style={styles.stackMd}>
            {generations.map(gen => {
              const genHeadingId = `${headingId}-generation-${gen}`;
              const members = peopleInGeneration(model.people, gen);
              return (
                <View key={gen} role="region" aria-labelledby={genHeadingId} style={[styles.generationCard, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}>
                  <Text role="heading" aria-level={3} nativeID={genHeadingId} style={[font, { color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }]}>
                    {generationLabel(gen, l)}
                  </Text>
                  <View role="list" style={styles.peopleGrid}>
                    {members.map(person => {
                      const selected = model.selectedPersonId === person.id;
                      const age = formatPersonAge(person.age, l.ageYears);
                      const vital = lifeState(person);
                      const pheno = phenotypeState(person);
                      const vitalColors = toneColors(t, vital === 'deceased' ? 'danger' : vital === 'alive' ? 'success' : 'neutral');
                      const phenoColors = toneColors(t, pheno === 'affected' ? 'danger' : pheno === 'unaffected' ? 'success' : 'neutral');

                      return (
                        <View
                          key={person.id}
                          role="listitem"
                          style={[
                            styles.personCard,
                            {
                              backgroundColor: t.surface,
                              borderColor: selected ? t.primary : t.border,
                              borderWidth: selected ? 2 : 1,
                            },
                          ]}
                        >
                          <Pressable
                            role="button"
                            aria-pressed={selected}
                            aria-label={personAriaLabel(person, l)}
                            onPress={() => onIntent({ type: 'personSelected', personId: person.id })}
                            style={({ focused }: PressState) => [styles.personButton, focusRing(t, focused)]}
                          >
                            <View style={styles.personTop}>
                              <PedigreeSymbol person={person} />
                              <View style={styles.grow}>
                                <View style={styles.personLine}>
                                  <Text style={[font, styles.grow, { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }]}>
                                    {person.displayName}
                                  </Text>
                                  {age ? (
                                    <Text style={[font, { color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }]}>
                                      {age}
                                    </Text>
                                  ) : null}
                                </View>
                                <View style={styles.personLine}>
                                  <Text style={[font, styles.grow, { color: t.textMuted, fontSize: t.textSm }]}>
                                    {person.relationshipLabel}
                                  </Text>
                                  {person.proband ? <EmrBadgeView badge={{ label: l.patientBadge, tone: 'info' }} /> : null}
                                </View>
                              </View>
                            </View>

                            <View style={styles.wrap}>
                              <View style={[styles.statusPill, { backgroundColor: vitalColors.backgroundColor, borderColor: t.border }]}>
                                <Text style={[font, { color: vitalColors.color, fontSize: t.textXs, fontWeight: fontWeight(600) }]}>
                                  {`${lifeIcon(person)} ${lifeLabel(person, l)}`}
                                </Text>
                              </View>
                              <View style={[styles.statusPill, { backgroundColor: phenoColors.backgroundColor, borderColor: t.border }]}>
                                <Text style={[font, { color: phenoColors.color, fontSize: t.textXs, fontWeight: fontWeight(600) }]}>
                                  {`${phenotypeIcon(person)} ${phenotypeLabel(person, l)}`}
                                </Text>
                              </View>
                              {person.sexLabel ? (
                                <View style={[styles.statusPill, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}>
                                  <Text style={[font, { color: t.textMuted, fontSize: t.textXs }]}>{person.sexLabel}</Text>
                                </View>
                              ) : null}
                            </View>

                            {person.summary ? (
                              <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{person.summary}</Text>
                            ) : null}

                            {person.conditions && person.conditions.length > 0 ? (
                              <View role="list" aria-label={l.conditionsAria} style={styles.wrap}>
                                {person.conditions.map(cond => (
                                  <EmrBadgeView key={cond.label} badge={cond} />
                                ))}
                              </View>
                            ) : null}
                          </Pressable>

                          {!model.readOnly && !person.readOnly ? (
                            <View style={[styles.personActions, { borderTopColor: t.border }]}>
                              <EmrButton
                                small
                                variant="ghost"
                                label={l.edit}
                                accessibilityLabel={l.editPerson(person.displayName)}
                                onPress={() => onIntent({ type: 'personEditRequested', personId: person.id })}
                              />
                              <EmrButton
                                small
                                variant="ghost"
                                label={l.remove}
                                accessibilityLabel={l.removePerson(person.displayName)}
                                onPress={() => onIntent({ type: 'personRemoveRequested', personId: person.id })}
                              />
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>

          <View role="region" aria-labelledby={relationshipsHeadingId} style={[styles.relationshipsSection, { borderTopColor: t.border }]}>
            <Text role="heading" aria-level={3} nativeID={relationshipsHeadingId} style={[font, { color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }]}>
              {l.relationshipsTitle}
            </Text>
            {model.relationships.length === 0 ? (
              <Text style={[font, { color: t.textMuted, fontSize: t.textMd }]}>{l.noRelationships}</Text>
            ) : (
              <View role="list" style={styles.stackSm}>
                {model.relationships.map(rel => {
                  const fromName = personName(model.people, rel.fromPersonId, l.unknownPerson);
                  const toName = personName(model.people, rel.toPersonId, l.unknownPerson);
                  return (
                    <View key={rel.id} role="listitem" style={[styles.relationshipRow, { backgroundColor: t.surface, borderColor: t.border }]}>
                      <View style={styles.grow}>
                        <Text style={[font, { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(600) }]}>
                          {l.relationshipPair(fromName, toName)}
                        </Text>
                        <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{rel.relationshipLabel}</Text>
                      </View>
                      {!model.readOnly ? (
                        <EmrButton
                          small
                          variant="ghost"
                          label={l.edit}
                          accessibilityLabel={l.editRelationship(fromName, toName)}
                          onPress={() => onIntent({ type: 'relationshipEditRequested', relationshipId: rel.id })}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  stackXs: { gap: 4 },
  stackSm: { gap: 8 },
  stackMd: { gap: 14 },
  eyebrow: { letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  // Staged checklist
  checklistCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  checklistHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingHorizontal: 20, paddingVertical: 16 },
  checklistBody: { paddingBottom: 16 },
  phaseHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  signoffBanner: { marginHorizontal: 20, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  checklistItem: { marginHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 8 },
  itemHeaderRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  checklistErrorBanner: { marginHorizontal: 20, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  // PAC checklist
  pacCard: { borderWidth: 1, borderRadius: 12, padding: 18, gap: 16 },
  pacHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  pacContext: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 12, borderWidth: 1, borderRadius: 9 },
  pacContextItem: { flexGrow: 1, flexBasis: 150, minWidth: 140 },
  pacErrors: { padding: 12, borderRadius: 9, borderWidth: 1, gap: 6 },
  pacActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, paddingTop: 14, borderTopWidth: 1 },
  // Family pedigree
  pedigreeCard: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 16 },
  pedigreeHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  emptyBox: { padding: 20, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendMark: { width: 20, height: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  generationCard: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 10 },
  peopleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  personCard: { flexGrow: 1, flexBasis: 220, minWidth: 200, borderRadius: 9, overflow: 'hidden', justifyContent: 'space-between' },
  personButton: { padding: 12, gap: 8 },
  personTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pedigreeSymbol: { width: 38, height: 38, borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  deceasedSlash: { position: 'absolute', width: 46, height: 2, transform: [{ rotate: '-45deg' }] },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1 },
  personActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth },
  relationshipsSection: { paddingTop: 16, borderTopWidth: 1, gap: 10 },
  relationshipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
});
