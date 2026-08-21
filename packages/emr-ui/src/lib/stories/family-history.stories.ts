import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrFamilyPedigreeComponent } from '../domain/emr-family-pedigree.component';
import type { FamilyPedigreeViewModel } from '@drguptavivek/emr-controller';

const familyHistoryStoryFixture: FamilyPedigreeViewModel = {
  label: 'Family history and relationships',
  selectedPersonId: 'patient',
  people: [
    { id: 'maternal-grandparent', displayName: 'Unknown relative', relationshipLabel: 'Maternal grandparent', generation: -2, order: 0, age: '68', sex: 'male', lifeStatusLabel: 'Deceased', deceased: true, phenotype: 'unaffected', summary: 'Details not available' },
    { id: 'father', displayName: 'Ravi Rao', relationshipLabel: 'Parent · adoptive', generation: -1, order: 0, age: 64, sex: 'male', lifeStatusLabel: 'Living', phenotype: 'affected', conditions: [{ label: 'Hypertension', tone: 'info' }] },
    { id: 'mother', displayName: 'Meena Rao', relationshipLabel: 'Parent', generation: -1, order: 1, age: 60, sex: 'female', lifeStatusLabel: 'Living', phenotype: 'unaffected' },
    { id: 'patient', displayName: 'Ananya Rao', relationshipLabel: 'Patient', generation: 0, order: 0, age: 58, sex: 'female', lifeStatusLabel: 'Living', proband: true, summary: 'Relationship details are supplied by the clinical record.', phenotype: 'affected' },
    { id: 'sibling', displayName: 'Kiran Rao', relationshipLabel: 'Sibling', generation: 0, order: 1, age: 32, sex: 'male', lifeStatusLabel: 'Living', phenotype: 'unaffected' },
    { id: 'child', displayName: 'Child · name not recorded', relationshipLabel: 'Child', generation: 1, order: 0, age: 'Newborn', sexLabel: 'Not recorded', sex: 'unknown', lifeStatusLabel: 'Not recorded', phenotype: 'unknown' }
  ],
  relationships: [
    { id: 'r1', fromPersonId: 'father', toPersonId: 'mother', relationshipLabel: 'Partner relationship', kind: 'partner' },
    { id: 'r2', fromPersonId: 'father', toPersonId: 'patient', relationshipLabel: 'Adoptive parent-child', kind: 'parent-child' },
    { id: 'r3', fromPersonId: 'mother', toPersonId: 'patient', relationshipLabel: 'Parent-child', kind: 'parent-child' },
    { id: 'r4', fromPersonId: 'patient', toPersonId: 'sibling', relationshipLabel: 'Sibling', kind: 'sibling' },
    { id: 'r5', fromPersonId: 'patient', toPersonId: 'child', relationshipLabel: 'Parent-child', kind: 'parent-child' }
  ]
};

const meta: Meta = {
  title: 'EMR / History / Family history',
  decorators: [moduleMetadata({ imports: [EmrFamilyPedigreeComponent] })],
  parameters: {
    docs: {
      description: {
        component: 'Controlled family history presentation. Names, symbols, sex/age, life status, and affected status are supplied by the controller; the component does not infer genetic meaning.'
      }
    }
  }
};
export default meta;
type Story = StoryObj;

export const Populated: Story = {
  render: () => ({ template: '<emr-family-pedigree [model]="model" />', props: { model: familyHistoryStoryFixture } })
};

export const Empty: Story = {
  render: () => ({ template: '<emr-family-pedigree [model]="model" />', props: { model: { ...familyHistoryStoryFixture, people: [], relationships: [], emptyMessage: 'Family history has not been recorded.' } } })
};

export const ReadOnly: Story = {
  render: () => ({ template: '<emr-family-pedigree [model]="model" />', props: { model: { ...familyHistoryStoryFixture, readOnly: true } } })
};

export const MobileDense: Story = {
  render: () => ({ template: '<emr-family-pedigree [model]="model" />', props: { model: familyHistoryStoryFixture } }),
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};
