import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { EmrOption } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-search-select',
  standalone: true,
  template: `
    <div class="emr-field emr-search-select">
      <label class="emr-field__label" [for]="controlId">{{ label }}</label>
      @if (multiple && selected.length) {
        <div class="emr-chip-row" aria-label="Selected options">
          @for (item of selected; track item.value) {
            <span class="emr-chip emr-tone-neutral">
              {{ item.label }}
              <button class="emr-button emr-button--small emr-button--ghost" type="button" [attr.aria-label]="'Remove ' + item.label"
                [disabled]="disabled" (click)="removeRequested.emit(item.value)">Remove</button>
            </span>
          }
        </div>
      }
      <div class="emr-search-select__bar">
        <input #queryInput class="emr-search-input" type="search" autocomplete="off" role="combobox" [id]="controlId"
          [value]="query" [placeholder]="placeholder" [disabled]="disabled" [attr.aria-expanded]="open"
          [attr.aria-controls]="controlId + '-listbox'" [attr.aria-autocomplete]="'list'"
          (focus)="openRequested.emit()" (input)="queryChanged.emit(inputValue($event))" (keydown.enter)="searchRequested.emit()"
          (keydown.arrowdown)="focusOption($event, 0)" (keydown.escape)="closeRequested.emit()" />
        <button class="emr-button emr-button--secondary" type="button" [disabled]="disabled || loading" (click)="searchRequested.emit()">
          {{ loading ? 'Searching…' : 'Search' }}
        </button>
      </div>
      @if (error) { <span class="emr-field__error" role="alert">{{ error }}</span> }
      @if (open) {
        <div class="emr-search-select__panel" [id]="controlId + '-listbox'" role="listbox" [attr.aria-multiselectable]="multiple">
          @if (!loading && options.length === 0) {
            <div class="emr-empty">{{ emptyMessage }}</div>
          }
          @for (option of options; track option.value) {
            <button #optionButton class="emr-search-select__option" type="button" role="option" [disabled]="option.disabled"
              [attr.aria-selected]="isSelected(option.value)" (click)="optionSelected.emit(option.value)"
              (keydown.arrowdown)="moveOptionFocus($event, 1)" (keydown.arrowup)="moveOptionFocus($event, -1)"
              (keydown.home)="focusOption($event, 0)" (keydown.end)="focusOption($event, options.length - 1)"
              (keydown.escape)="closeRequested.emit()">
              <strong>{{ option.label }}</strong>
              @if (option.description) { <span class="emr-search-select__description">{{ option.description }}</span> }
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmrSearchSelectComponent {
  @Input() controlId = 'emr-search';
  @Input() label = 'Search';
  @Input() placeholder = 'Type to search';
  @Input() query = '';
  @Input() options: readonly EmrOption[] = [];
  @Input() selected: readonly EmrOption[] = [];
  @Input() multiple = false;
  @Input() open = false;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() error = '';
  @Input() emptyMessage = 'No matching options';
  @Output() readonly queryChanged = new EventEmitter<string>();
  @Output() readonly searchRequested = new EventEmitter<void>();
  @Output() readonly openRequested = new EventEmitter<void>();
  @Output() readonly closeRequested = new EventEmitter<void>();
  @Output() readonly optionSelected = new EventEmitter<string>();
  @Output() readonly removeRequested = new EventEmitter<string>();
  @ViewChildren('optionButton') private optionButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  isSelected(value: string): boolean { return this.selected.some(item => item.value === value); }
  focusOption(event: Event, index: number): void {
    const enabled = this.optionButtons?.toArray().map(item => item.nativeElement).filter(button => !button.disabled) ?? [];
    if (!enabled.length) return;
    event.preventDefault();
    enabled[Math.max(0, Math.min(index, enabled.length - 1))]?.focus();
  }
  moveOptionFocus(event: Event, direction: -1 | 1): void {
    const enabled = this.optionButtons.toArray().map(item => item.nativeElement).filter(button => !button.disabled);
    const current = enabled.indexOf(event.currentTarget as HTMLButtonElement);
    if (current < 0) return;
    this.focusOption(event, current + direction);
  }
}
