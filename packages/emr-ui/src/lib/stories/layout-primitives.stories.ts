import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrSeparatorComponent } from '../primitives/emr-separator.component';
import {
  EmrCardComponent,
  EmrColumnsComponent,
  EmrFieldValueRowComponent
} from '../primitives/emr-card-layout.component';

const meta: Meta = {
  title: 'Foundations / Layout primitives',
  decorators: [
    moduleMetadata({
      imports: [
        EmrSeparatorComponent,
        EmrCardComponent,
        EmrColumnsComponent,
        EmrFieldValueRowComponent
      ]
    })
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Presentation-only layout primitives: single card wrapper, configurable 2/3-column card layouts, a full-width field/value/remarks/notes row, and a divider. They provide alignment and equal row heights without owning workflow state.'
      }
    }
  }
};
export default meta;

type Story = StoryObj;

export const Separators: Story = {
  render: () => ({
    template: `
      <div class="emr-stack">
        <p>Plain divider between sections.</p>
        <emr-separator />
        <emr-separator label="Clinical history" />
        <div class="emr-button-row" style="align-items:center">
          <span>Left</span>
          <emr-separator orientation="vertical" />
          <span>Middle</span>
          <emr-separator orientation="vertical" />
          <span>Right</span>
        </div>
      </div>
    `
  })
};

export const SingleCard: Story = {
  render: () => ({
    template: `
      <emr-card label="Vitals">
        <p>Any projected content — controlled fields, lists, or summaries — sits inside the padded card body.</p>
      </emr-card>
    `
  })
};

export const TwoColumn: Story = {
  render: () => ({
    template: `
      <emr-columns [count]="2">
        <emr-card label="Right eye (OD)"><p>Projected column content.</p></emr-card>
        <emr-card label="Left eye (OS)"><p>Equal-height sibling column.</p></emr-card>
      </emr-columns>
    `
  })
};

export const ThreeColumnWeighted: Story = {
  render: () => ({
    template: `
      <emr-columns [widths]="['2fr','1fr','1fr']">
        <emr-card label="Assessment"><p>Wide primary column (2fr).</p></emr-card>
        <emr-card label="Plan"><p>1fr.</p></emr-card>
        <emr-card label="Follow-up"><p>1fr.</p></emr-card>
      </emr-columns>
    `
  })
};

export const FieldValueRemarksNotes: Story = {
  render: () => ({
    template: `
      <div role="table" aria-label="Clinical findings">
        <emr-field-value-row heading field="Field" value="Value" remarks="Remarks" notes="Notes" />
        <emr-field-value-row field="Intraocular pressure" value="18 mmHg" remarks="Within range" notes="Rechecked at 11:20" />
        <emr-field-value-row field="Visual acuity" value="6/9" remarks="Improved from 6/12" notes="With current correction" />
        <emr-field-value-row field="Fundus" value="" remarks="Not assessed" notes="Pupil not dilated" />
      </div>
    `
  })
};
