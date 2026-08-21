import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroUsers } from '@ng-icons/heroicons/outline';
import {
  FamilyPedigreeIntent,
  FamilyPedigreeViewModel,
  FamilyPersonNode
} from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-family-pedigree',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroUsers })],
  template: `
    <section class="emr-family-pedigree" [attr.aria-labelledby]="headingId">
      <div class="emr-family-pedigree__header">
        <ng-icon class="emr-card-header-icon" name="heroUsers" aria-hidden="true" />
        <div>
          <span class="emr-family-pedigree__eyebrow">Family history</span>
          <h2 class="emr-panel__title" [id]="headingId">{{ model.label }}</h2>
        </div>
        @if (!model.readOnly) {
          <button class="emr-button emr-button--small emr-button--outline" type="button"
            (click)="emit({ type: 'personAddRequested' })">Add person</button>
        }
      </div>

      @if (!model.people.length) {
        <div class="emr-empty" role="status">{{ model.emptyMessage || 'No family history recorded.' }}</div>
      } @else {
        <div class="emr-family-pedigree__legend" aria-label="Family history guidance">
          <span class="emr-family-pedigree__legend-title">Family pedigree symbols</span>
          <div class="emr-family-pedigree__legend-grid">
            <span class="emr-family-pedigree__legend-item"><span class="emr-family-pedigree__legend-mark emr-family-pedigree__legend-mark--male" aria-hidden="true">♂</span> Male</span>
            <span class="emr-family-pedigree__legend-item"><span class="emr-family-pedigree__legend-mark emr-family-pedigree__legend-mark--female" aria-hidden="true">♀</span> Female</span>
            <span class="emr-family-pedigree__legend-item"><span class="emr-family-pedigree__legend-mark emr-family-pedigree__legend-mark--deceased" aria-hidden="true">✝</span> Deceased</span>
            <span class="emr-family-pedigree__legend-item"><span class="emr-family-pedigree__legend-mark emr-family-pedigree__legend-mark--alive" aria-hidden="true">●</span> Alive</span>
            <span class="emr-family-pedigree__legend-item"><span class="emr-family-pedigree__legend-mark emr-family-pedigree__legend-mark--affected" aria-hidden="true">⚠</span> Affected</span>
            <span class="emr-family-pedigree__legend-item"><span class="emr-family-pedigree__legend-mark emr-family-pedigree__legend-mark--unaffected" aria-hidden="true">✓</span> Unaffected</span>
          </div>
          <span class="emr-family-pedigree__legend-item">The patient is labelled explicitly and relationships are shown as supplied.</span>
        </div>

        <div class="emr-family-pedigree__generations" aria-label="Family members by generation">
          @for (generation of generations(); track generation) {
            <section class="emr-family-pedigree__generation" [attr.aria-labelledby]="generationId(generation)">
              <h3 class="emr-family-pedigree__generation-label" [id]="generationId(generation)">{{ generationLabel(generation) }}</h3>
              <div class="emr-family-pedigree__people" role="list">
                @for (person of peopleInGeneration(generation); track person.id) {
                  <article class="emr-family-pedigree__person" role="listitem"
                    [class.emr-family-pedigree__person--selected]="model.selectedPersonId === person.id">
                    <button class="emr-family-pedigree__person-button" type="button"
                      [attr.aria-pressed]="model.selectedPersonId === person.id"
                      [attr.aria-label]="personAriaLabel(person)"
                      (click)="emit({ type: 'personSelected', personId: person.id })">
                      <span class="emr-family-pedigree__person-top">
                        <span class="emr-family-pedigree__pedigree-symbol"
                          [class.emr-family-pedigree__pedigree-symbol--male]="sexKind(person) === 'male'"
                          [class.emr-family-pedigree__pedigree-symbol--female]="sexKind(person) === 'female'"
                          [class.emr-family-pedigree__pedigree-symbol--other]="sexKind(person) === 'other'"
                          [class.emr-family-pedigree__pedigree-symbol--unknown]="sexKind(person) === 'unknown'"
                          [class.emr-family-pedigree__pedigree-symbol--deceased]="isDeceased(person)"
                          [class.emr-family-pedigree__pedigree-symbol--affected]="phenotype(person) === 'affected'"
                          [class.emr-family-pedigree__pedigree-symbol--unaffected]="phenotype(person) === 'unaffected'">
                          <span class="emr-family-pedigree__pedigree-glyph" aria-hidden="true">{{ pedigreeGlyph(person) }}</span>
                        </span>
                        <span class="emr-family-pedigree__person-header">
                          <span class="emr-family-pedigree__person-line">
                            <span class="emr-family-pedigree__person-name">{{ person.displayName }}</span>
                            @if (personAge(person)) { <span class="emr-family-pedigree__person-age">{{ personAge(person) }}</span> }
                          </span>
                          <span class="emr-family-pedigree__person-relationship">
                            <span>{{ person.relationshipLabel }}</span>
                            @if (person.proband) { <span class="emr-badge emr-tone-info">Patient</span> }
                          </span>
                        </span>
                      </span>
                      <span class="emr-family-pedigree__person-status-row">
                        <span class="emr-family-pedigree__status-pill" [class]="statusClass('life', lifeState(person))">{{ lifeIcon(person) }} {{ lifeLabel(person) }}</span>
                        <span class="emr-family-pedigree__status-pill" [class]="statusClass('phenotype', phenotype(person))">{{ phenotypeIcon(person) }} {{ phenotypeLabel(person) }}</span>
                        @if (person.sexLabel) { <span class="emr-family-pedigree__status-pill emr-family-pedigree__status-pill--detail">{{ person.sexLabel }}</span> }
                      </span>
                      @if (person.summary) { <span class="emr-family-pedigree__person-summary">{{ person.summary }}</span> }
                      @if (person.conditions?.length) {
                        <span class="emr-chip-row" aria-label="Recorded conditions">
                          @for (condition of person.conditions; track condition.label) { <span class="emr-chip" [class]="'emr-chip emr-tone-' + condition.tone">{{ condition.label }}</span> }
                        </span>
                      }
                    </button>
                    @if (!model.readOnly && !person.readOnly) {
                      <div class="emr-family-pedigree__person-actions">
                        <button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Edit ' + person.displayName"
                          (click)="emit({ type: 'personEditRequested', personId: person.id })">Edit</button>
                        <button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Remove ' + person.displayName"
                          (click)="emit({ type: 'personRemoveRequested', personId: person.id })">Remove</button>
                      </div>
                    }
                  </article>
                }
              </div>
            </section>
          }
        </div>

        <div class="emr-family-pedigree__relationships" aria-labelledby="relationships-heading">
          <h3 class="emr-family-pedigree__subheading" id="relationships-heading">Relationships</h3>
          @if (!model.relationships.length) {
            <p class="emr-family-pedigree__muted">No relationships recorded.</p>
          } @else {
            <ul class="emr-family-pedigree__relationship-list">
              @for (relationship of model.relationships; track relationship.id) {
                <li class="emr-family-pedigree__relationship">
                  <span class="emr-family-pedigree__relationship-people">{{ personName(relationship.fromPersonId) }} and {{ personName(relationship.toPersonId) }}</span>
                  <span class="emr-family-pedigree__relationship-label">{{ relationship.relationshipLabel }}</span>
                  @if (!model.readOnly) {
                    <button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Edit relationship between ' + personName(relationship.fromPersonId) + ' and ' + personName(relationship.toPersonId)"
                      (click)="emit({ type: 'relationshipEditRequested', relationshipId: relationship.id })">Edit</button>
                  }
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .emr-family-pedigree { display: block; border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); padding: 20px; color: var(--emr-text); }
    .emr-family-pedigree__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .emr-family-pedigree__eyebrow { color: var(--emr-primary); font-size:var(--emr-text-xs); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .emr-family-pedigree__legend { margin-bottom: 18px; color: var(--emr-text-muted); font-size:var(--emr-text-sm); display: grid; gap: 8px; }
    .emr-family-pedigree__legend-title { font-weight: 650; color: var(--emr-text); }
    .emr-family-pedigree__legend-grid { display: flex; flex-wrap: wrap; gap: 8px 14px; }
    .emr-family-pedigree__legend-item { display: inline-flex; align-items: center; gap: 6px; }
    .emr-family-pedigree__legend-mark { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 999px; font-size:var(--emr-text-2xs); font-weight: 700; line-height: 1; }
    .emr-family-pedigree__legend-mark--male { background: var(--emr-info-soft); color: var(--emr-info); }
    .emr-family-pedigree__legend-mark--female { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-family-pedigree__legend-mark--deceased { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-family-pedigree__legend-mark--alive { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-family-pedigree__legend-mark--affected { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-family-pedigree__legend-mark--unaffected { background: var(--emr-surface-slate); color: var(--emr-text-muted); }
    .emr-family-pedigree__generations { display: grid; gap: 16px; }
    .emr-family-pedigree__generation { border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface-soft); padding: 14px; }
    .emr-family-pedigree__generation-label, .emr-family-pedigree__subheading { margin: 0 0 10px; color: var(--emr-text); font-size:var(--emr-text-sm); font-weight: 700; }
    .emr-family-pedigree__people { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
    .emr-family-pedigree__person { position: relative; display: flex; min-width: 0; border: 1px solid var(--emr-border); border-radius: 9px; background: var(--emr-surface); transition: border-color .15s ease, box-shadow .15s ease; }
    .emr-family-pedigree__person--selected { border-color: var(--emr-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--emr-primary) 16%, transparent); }
    .emr-family-pedigree__person-button { display: grid; flex: 1; min-width: 0; gap: 7px; border: 0; border-radius: 8px; background: transparent; padding: 12px; color: inherit; text-align: left; cursor: pointer; }
    .emr-family-pedigree__person-button:focus-visible { outline: 3px solid #9bd4cb; outline-offset: 2px; }
    .emr-family-pedigree__person-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .emr-family-pedigree__person-top { align-items: center; }
    .emr-family-pedigree__pedigree-symbol {
      position: relative;
      width: 38px;
      height: 38px;
      min-width: 38px;
      border: 2px solid var(--emr-text);
      border-radius: 6px;
      color: var(--emr-text);
      background: var(--emr-surface);
      display: grid;
      place-items: center;
      font-size:var(--emr-text-lg);
      font-weight: 700;
      transition: border-color .15s ease, background-color .15s ease;
    }
    .emr-family-pedigree__pedigree-symbol--female { border-radius: 999px; }
    .emr-family-pedigree__pedigree-symbol--other { border-radius: 999px 999px 0 999px; transform: rotate(45deg); }
    .emr-family-pedigree__pedigree-symbol--deceased::after {
      content: '';
      position: absolute;
      inset: 4px 0;
      border-top: 3px solid currentColor;
      transform: rotate(-45deg);
      opacity: 0.95;
    }
    .emr-family-pedigree__pedigree-symbol--affected { border-color: var(--emr-danger); background: var(--emr-danger-soft); }
    .emr-family-pedigree__pedigree-symbol--unaffected { border-color: var(--emr-success); background: var(--emr-success-soft); }
    .emr-family-pedigree__pedigree-symbol--deceased { border-color: var(--emr-danger); color: var(--emr-danger); }
    .emr-family-pedigree__pedigree-glyph { line-height: 1; transform: rotate(-45deg); }
    .emr-family-pedigree__pedigree-symbol--deceased .emr-family-pedigree__pedigree-glyph { color: var(--emr-danger); }
    .emr-family-pedigree__person-header { min-width: 0; display: grid; gap: 4px; }
    .emr-family-pedigree__person-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
    .emr-family-pedigree__person-name { overflow-wrap: anywhere; color: var(--emr-text); font-weight: 700; }
    .emr-family-pedigree__person-age { color: var(--emr-text-muted); font-size:var(--emr-text-sm); font-weight: 700; }
    .emr-family-pedigree__person-relationship { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; color: var(--emr-text-muted); font-size:var(--emr-text-sm); }
    .emr-family-pedigree__person-status-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .emr-family-pedigree__person-summary, .emr-family-pedigree__status-pill { color: var(--emr-text-muted); font-size:var(--emr-text-sm); }
    .emr-family-pedigree__status-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 2px 9px; border: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-family-pedigree__status-pill--life-alive { border-color: color-mix(in srgb, var(--emr-success) 24%, var(--emr-border)); background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-family-pedigree__status-pill--life-deceased { border-color: color-mix(in srgb, var(--emr-danger) 24%, var(--emr-border)); background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-family-pedigree__status-pill--life-unknown { border-color: color-mix(in srgb, var(--emr-text-muted) 30%, var(--emr-border)); background: var(--emr-surface-soft); color: var(--emr-text-muted); }
    .emr-family-pedigree__status-pill--phenotype-affected { border-color: color-mix(in srgb, var(--emr-danger) 35%, var(--emr-border)); background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-family-pedigree__status-pill--phenotype-unaffected { border-color: color-mix(in srgb, var(--emr-success) 35%, var(--emr-border)); background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-family-pedigree__status-pill--phenotype-unknown { border-color: color-mix(in srgb, var(--emr-text-muted) 30%, var(--emr-border)); background: var(--emr-surface-accent); color: var(--emr-text-muted); }
    .emr-family-pedigree__status-pill--detail { border-color: var(--emr-border); color: var(--emr-text-muted); }
    .emr-family-pedigree__status-icon { display: inline-flex; width: 14px; justify-content: center; line-height: 1; }
    .emr-family-pedigree__person-summary { line-height: 1.4; }
    .emr-family-pedigree__person-actions { display: flex; align-items: flex-start; gap: 1px; padding: 8px 6px 0 0; }
    .emr-family-pedigree__relationships { margin-top: 20px; border-top: 1px solid var(--emr-border); padding-top: 16px; }
    .emr-family-pedigree__relationship-list { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
    .emr-family-pedigree__relationship { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); padding: 9px 10px; }
    .emr-family-pedigree__relationship-people { overflow-wrap: anywhere; color: var(--emr-text); font-size:var(--emr-text-md); font-weight: 600; }
    .emr-family-pedigree__relationship-label { color: var(--emr-text-muted); font-size:var(--emr-text-sm); }
    .emr-family-pedigree__muted { margin: 0; color: var(--emr-text-muted); font-size:var(--emr-text-md); }
    @media (max-width: 560px) {
      .emr-family-pedigree { padding: 14px; }
      .emr-family-pedigree__header { align-items: stretch; flex-direction: column; }
      .emr-family-pedigree__header .emr-button { align-self: flex-start; }
      .emr-family-pedigree__people { grid-template-columns: 1fr; }
      .emr-family-pedigree__relationship { grid-template-columns: 1fr auto; }
      .emr-family-pedigree__relationship-label { grid-column: 1; }
      .emr-family-pedigree__relationship .emr-button { grid-column: 2; grid-row: 1 / span 2; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrFamilyPedigreeComponent {
  @Input({ required: true }) model!: FamilyPedigreeViewModel;
  @Input() headingId = 'emr-family-pedigree-heading';
  @Output() readonly intent = new EventEmitter<FamilyPedigreeIntent>();

  generations(): readonly number[] {
    return [...new Set(this.model.people.map(person => person.generation))].sort((a, b) => a - b);
  }

  peopleInGeneration(generation: number): readonly FamilyPersonNode[] {
    return this.model.people.filter(person => person.generation === generation).sort((a, b) => a.order - b.order);
  }

  generationId(generation: number): string { return `${this.headingId}-generation-${generation}`; }

  generationLabel(generation: number): string {
    if (generation === 0) return 'Patient generation';
    return generation < 0 ? `${Math.abs(generation)} generation${generation < -1 ? 's' : ''} above` : `${generation} generation${generation > 1 ? 's' : ''} below`;
  }

  personName(personId: string): string { return this.model.people.find(person => person.id === personId)?.displayName || 'Unknown person'; }

  personAge(person: FamilyPersonNode): string | null {
    if (person.age === undefined || person.age === null) return null;
    if (typeof person.age === 'number') return `${person.age} y`;
    const normalized = String(person.age).trim();
    if (!normalized) return null;
    if (/^\d+$/.test(normalized)) return `${normalized} y`;
    return normalized;
  }

  sexKind(person: FamilyPersonNode): 'male' | 'female' | 'other' | 'unknown' {
    if (person.sex) return person.sex;
    const sexLabel = (person.sexLabel ?? '').toLowerCase();
    if (!sexLabel) return 'unknown';
    if (/\b(m|male|man|boy|male|mr|sir)\b/.test(sexLabel)) return 'male';
    if (/\b(f|female|woman|girl|mrs|ms|miss)\b/.test(sexLabel)) return 'female';
    if (/\b(unknown|not recorded|other|undetermined)\b/.test(sexLabel)) return 'unknown';
    return 'other';
  }

  phenotype(person: FamilyPersonNode): 'affected' | 'unaffected' | 'unknown' {
    if (person.phenotype === 'affected' || person.phenotype === 'unaffected' || person.phenotype === 'unknown') {
      return person.phenotype;
    }
    return 'unknown';
  }

  phenotypeLabel(person: FamilyPersonNode): string {
    switch (this.phenotype(person)) {
      case 'affected':
        return 'Affected';
      case 'unaffected':
        return 'Unaffected';
      default:
        return 'Status unknown';
    }
  }

  phenotypeIcon(person: FamilyPersonNode): string {
    switch (this.phenotype(person)) {
      case 'affected':
        return '⚠';
      case 'unaffected':
        return '✓';
      default:
        return '○';
    }
  }

  pedigreeGlyph(person: FamilyPersonNode): string {
    switch (this.sexKind(person)) {
      case 'male':
        return '♂';
      case 'female':
        return '♀';
      case 'other':
        return '⚬';
      default:
        return '⌖';
    }
  }

  lifeState(person: FamilyPersonNode): 'alive' | 'deceased' | 'unknown' {
    if (person.deceased || this.lifeStatusLooksDeceased(person.lifeStatusLabel)) return 'deceased';
    return 'alive';
  }

  lifeLabel(person: FamilyPersonNode): string {
    if (this.lifeState(person) === 'deceased') return person.lifeStatusLabel || 'Deceased';
    if (person.lifeStatusLabel) return person.lifeStatusLabel;
    return 'Alive';
  }

  lifeIcon(person: FamilyPersonNode): string { return this.lifeState(person) === 'deceased' ? '✝' : '●'; }

  isDeceased(person: FamilyPersonNode): boolean { return this.lifeState(person) === 'deceased'; }

  private lifeStatusLooksDeceased(lifeStatusLabel?: string): boolean {
    if (!lifeStatusLabel) return false;
    return /\b(deceased|died|dead|expired)\b/i.test(lifeStatusLabel);
  }

  statusClass(category: 'life' | 'phenotype', value: 'alive' | 'deceased' | 'unknown' | 'affected' | 'unaffected'): string {
    if (category === 'life') {
      return `emr-family-pedigree__status-pill--life-${value}`;
    }

    if (category === 'phenotype') {
      return `emr-family-pedigree__status-pill--phenotype-${value}`;
    }

    return 'emr-family-pedigree__status-pill';
  }

  personAriaLabel(person: FamilyPersonNode): string {
    return [person.displayName, this.personAge(person), person.relationshipLabel, person.sexLabel, this.lifeLabel(person), this.phenotypeLabel(person)]
      .filter(Boolean).join(', ');
  }

  emit(intent: FamilyPedigreeIntent): void { this.intent.emit(intent); }
}
