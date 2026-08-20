import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrButtonComponent } from '../primitives/emr-button.component';
import { EmrCheckboxComponent, EmrRadioGroupComponent, EmrToggleComponent } from '../primitives/emr-choice.component';
import { EmrAlertComponent, EmrBadgeComponent, EmrChipComponent, EmrStateMessageComponent } from '../primitives/emr-feedback.component';
import { EmrDateInputComponent, EmrNumberInputComponent, EmrPairedInputComponent, EmrQuantityInputComponent, EmrSelectComponent, EmrTextInputComponent } from '../primitives/emr-inputs.component';
import { EmrSearchSelectComponent } from '../primitives/emr-search-select.component';
import { EmrTabsComponent } from '../primitives/emr-tabs.component';

const meta: Meta = {
  title: 'Foundations / Primitives',
  decorators: [moduleMetadata({ imports: [
    EmrButtonComponent, EmrCheckboxComponent, EmrRadioGroupComponent, EmrToggleComponent,
    EmrAlertComponent, EmrBadgeComponent, EmrChipComponent, EmrStateMessageComponent,
    EmrDateInputComponent, EmrNumberInputComponent, EmrPairedInputComponent, EmrQuantityInputComponent,
    EmrSelectComponent, EmrTextInputComponent, EmrSearchSelectComponent, EmrTabsComponent
  ] })],
  parameters: { docs: { description: { component: 'Controlled EMR foundations. Values and options are supplied by the consuming controller; interactions emit intent/value events.' } } }
};
export default meta;

type Story = StoryObj;

export const Controls: Story = {
  render: () => ({ template: `
    <div class="emr-story-grid emr-story-grid--two">
      <emr-text-input inputId="demo-name" label="Patient name" value="Ananya Rao" hint="Controlled text value" required />
      <emr-number-input inputId="demo-iop" label="Intraocular pressure" [value]="18" mode="decimal" [step]="0.1" hint="mmHg" />
      <emr-number-input inputId="demo-power" label="Power (MRC)" [value]="4" mode="integer" [min]="0" [max]="5" />
      <emr-date-input inputId="demo-date" label="Encounter date" value="2026-08-19" />
      <emr-select inputId="demo-status" label="Encounter status" value="review" [options]="statusOptions" />
      <emr-quantity-input inputId="demo-weight" label="Weight" [value]="68.5" unit="kg" [units]="unitOptions" />
      <emr-paired-input inputId="demo-pair" label="Visual acuity" firstLabel="OD" secondLabel="OS" firstValue="6/12" secondValue="6/9" separator="/" />
    </div>
    <div class="emr-stack emr-stack--compact">
      <emr-checkbox label="Fasting required" [checked]="true" />
      <emr-toggle label="Show only active orders" [checked]="true" />
      <emr-radio-group name="urgency" label="Urgency" value="routine" [options]="urgencyOptions" />
      <emr-tabs ariaLabel="Patient sections" active="overview" [tabs]="tabOptions" />
    </div>
    <div class="emr-chip-row"><emr-badge tone="success">Completed</emr-badge><emr-badge tone="warning">Review</emr-badge><emr-badge tone="danger">Allergy</emr-badge><emr-chip tone="info">Diabetes</emr-chip></div>
    <div class="emr-button-row"><emr-button>Save assessment</emr-button><emr-button variant="secondary">Cancel</emr-button><emr-button variant="outline">Preview</emr-button><emr-button variant="ghost">More</emr-button><emr-button variant="danger">Delete</emr-button><emr-button loading>Saving</emr-button></div>
  `, props: {
    statusOptions: [{ value: 'review', label: 'In review' }, { value: 'completed', label: 'Completed' }],
    unitOptions: [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }],
    urgencyOptions: [{ value: 'routine', label: 'Routine' }, { value: 'urgent', label: 'Urgent' }, { value: 'stat', label: 'STAT' }],
    tabOptions: [{ value: 'overview', label: 'Overview' }, { value: 'orders', label: 'Orders' }, { value: 'history', label: 'History' }]
  } })
};

export const SearchSingle: Story = {
  render: () => ({ template: `<emr-search-select inputId="med-search" label="Medication" placeholder="Search medicines" [options]="options" [selected]="selected" [open]="true" />`, props: { options: [{ value: 'metformin', label: 'Metformin 500 mg', description: 'Tablet · oral · twice daily' }, { value: 'latanoprost', label: 'Latanoprost 0.005%', description: 'Eye drop · nightly' }], selected: [] } })
};

export const SearchMultiSelect: Story = {
  render: () => ({ template: `<emr-search-select inputId="test-search" label="Laboratory tests" multiple [options]="options" [selected]="selected" [open]="true" />`, props: { options: [{ value: 'cbc', label: 'Complete blood count' }, { value: 'hba1c', label: 'Glycated haemoglobin' }, { value: 'creat', label: 'Serum creatinine' }], selected: [{ value: 'hba1c', label: 'Glycated haemoglobin' }] } })
};

export const FeedbackStates: Story = {
  render: () => ({ template: `<div class="emr-stack"><emr-alert tone="info" title="Information">This patient has an encounter scheduled today.</emr-alert><emr-alert tone="warning" title="Review required">The left eye value differs from the previous visit.</emr-alert><emr-alert tone="danger" title="Safety alert">Penicillin allergy is recorded.</emr-alert><emr-state-message kind="empty" title="No results" message="Try a different search term." /><emr-state-message kind="loading" title="Loading catalogue" message="Fetching current options…" /><emr-state-message kind="error" title="Unable to load" message="Retry when the service is available." /></div>` })
};

