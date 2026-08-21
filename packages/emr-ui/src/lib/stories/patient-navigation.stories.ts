import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrButtonComponent } from '../primitives/emr-button.component';
import { EmrAppShellComponent } from '../domain/emr-app-shell.component';
import { EmrLeftNavComponent } from '../domain/emr-left-nav.component';
import { EmrRightFlyoutComponent } from '../domain/emr-right-flyout.component';
import { EmrPatientBannerComponent } from '../domain/emr-patient-banner.component';
import { EmrPatientListComponent } from '../domain/emr-patient-list.component';
import { EmrClinicalListComponent, EmrAllergyListComponent, EmrChronicDiseaseListComponent, EmrMedicationListComponent, EmrPersonalHistoryListComponent } from '../structures/emr-clinical-list.component';
import { EmrFavouritesPanelComponent } from '../domain/emr-favourites-panel.component';
import { navItems, patientBanner, patientList, clinicalItems, emptyClinicalItems, favouritesState } from './fixtures';

const meta: Meta = {
  title: 'EMR / Patient and Navigation',
  decorators: [moduleMetadata({ imports: [EmrButtonComponent, EmrAppShellComponent, EmrLeftNavComponent, EmrRightFlyoutComponent, EmrPatientBannerComponent, EmrPatientListComponent, EmrClinicalListComponent, EmrAllergyListComponent, EmrChronicDiseaseListComponent, EmrMedicationListComponent, EmrPersonalHistoryListComponent, EmrFavouritesPanelComponent] })]
};
export default meta;
type Story = StoryObj;

export const PatientCard: Story = { render: () => ({ template: `<emr-patient-banner [model]="patient" />`, props: { patient: patientBanner } }) };

export const PatientList: Story = { render: () => ({ template: `<emr-patient-list [model]="state" />`, props: { state: patientList } }) };

export const PatientListLoading: Story = { render: () => ({ template: `<emr-patient-list [model]="state" />`, props: { state: { ...patientList, rows: [], loading: true } } }) };
export const PatientListError: Story = { render: () => ({ template: `<emr-patient-list [model]="state" />`, props: { state: { ...patientList, rows: [], error: 'Patient service is unavailable.' } } }) };
export const PatientListEmpty: Story = { render: () => ({ template: `<emr-patient-list [model]="state" />`, props: { state: { ...patientList, rows: [], total: 0 } } }) };

export const CollapsibleNavigation: Story = { render: () => ({ template: `<div class="emr-story-nav-frame"><emr-left-nav title="Care workspace" [items]="items" activeId="patients" [expandedIds]="['clinical']" /></div>`, props: { items: navItems } }) };
export const CollapsedNavigation: Story = { render: () => ({ template: `<div class="emr-story-nav-frame"><emr-left-nav title="Care workspace" [items]="items" activeId="patients" [expandedIds]="[]" [collapsed]="true" /></div>`, props: { items: navItems } }) };

export const ApplicationShellLight: Story = { render: () => ({ template: `<emr-app-shell theme="light"><emr-left-nav emrShellNavigation [items]="items" activeId="patients" [expandedIds]="['clinical']" /><div class="emr-stack"><emr-patient-banner [model]="patient" /><div class="emr-panel"><h2>Encounter workspace</h2><p class="emr-field__hint">Clinical content is projected into the shell and remains controller-owned.</p></div></div></emr-app-shell>`, props: { items: navItems, patient: patientBanner } }) };
export const ApplicationShellDark: Story = { render: () => ({ template: `<emr-app-shell theme="dark"><emr-left-nav emrShellNavigation [items]="items" activeId="patients" [expandedIds]="['clinical']" /><div class="emr-stack"><emr-patient-banner [model]="patient" /></div></emr-app-shell>`, props: { items: navItems, patient: patientBanner } }) };

export const RightFlyout: Story = { render: () => ({ template: `<div class="emr-story-flyout-host"><emr-right-flyout [open]="true" title="My favourites" [showFooter]="true"><emr-favourites-panel [model]="state" /><div emrFlyoutFooter class="emr-button-row"><emr-button>Apply selected</emr-button></div></emr-right-flyout></div>`, props: { state: favouritesState } }) };

export const ClinicalLists: Story = { render: () => ({ template: `<div class="emr-story-grid emr-story-grid--two"><emr-medication-list [items]="items" /><emr-allergy-list [items]="allergies" /><emr-chronic-disease-list [items]="diseases" /><emr-personal-history-list [items]="history" /></div>`, props: { items: clinicalItems, allergies: [{ id: 'a1', title: 'Penicillin', subtitle: 'Rash', badges: [{ label: 'Severe', tone: 'danger' }] }, { id: 'a2', title: 'Latex', subtitle: 'Contact dermatitis' }], diseases: [{ id: 'd1', title: 'Type 2 diabetes', subtitle: 'Diagnosed 2013', badges: [{ label: 'Active', tone: 'info' }] }, { id: 'd2', title: 'Hypertension', subtitle: 'Controlled' }], history: [{ id: 'h1', title: 'Former smoker', detail: 'Stopped in 2018' }, { id: 'h2', title: 'Cataract surgery', detail: 'Right eye · 2021', readOnly: true }] } }) };
export const ClinicalListEmptyReadOnly: Story = { render: () => ({ template: `<div class="emr-story-grid emr-story-grid--two"><emr-clinical-list title="Allergies" emptyMessage="Allergy status has not been supplied." [items]="items" /><emr-clinical-list title="Medication reconciliation" [items]="readonlyItems" [allowAdd]="false" /></div>`, props: { items: emptyClinicalItems, readonlyItems: clinicalItems.map(item => ({ ...item, readOnly: true })) } }) };
