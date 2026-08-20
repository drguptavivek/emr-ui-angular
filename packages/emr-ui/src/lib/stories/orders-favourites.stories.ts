import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmrButtonComponent } from '../primitives/emr-button.component';
import { EmrFavouritesPanelComponent } from '../favourites/emr-favourites-panel.component';
import { EmrHierarchyOrderPickerComponent } from '../orders/emr-hierarchy-order-picker.component';
import { EmrRightFlyoutComponent } from '../layout/emr-right-flyout.component';
import { favouritesErrorState, favouritesLoadingState, favouritesState, labOrderState, radiologyOrderState } from './fixtures';

const meta: Meta = {
  title: 'EMR / Orders and favourites',
  decorators: [moduleMetadata({ imports: [EmrButtonComponent, EmrFavouritesPanelComponent, EmrHierarchyOrderPickerComponent, EmrRightFlyoutComponent] })],
  parameters: { docs: { description: { component: 'Order catalogues and favourites are controlled by a controller. Stories use static synthetic view models only.' } } }
};
export default meta;
type Story = StoryObj;

export const LaboratoryHierarchy: Story = { render: () => ({ template: `<emr-hierarchy-order-picker [state]="state" />`, props: { state: labOrderState } }) };
export const RadiologyHierarchyWithPreview: Story = { render: () => ({ template: `<emr-hierarchy-order-picker [state]="state" />`, props: { state: radiologyOrderState } }) };
export const CatalogueLoading: Story = { render: () => ({ template: `<emr-hierarchy-order-picker [state]="state" />`, props: { state: { ...labOrderState, roots: [], selected: [], loading: true } } }) };
export const CatalogueError: Story = { render: () => ({ template: `<emr-hierarchy-order-picker [state]="state" />`, props: { state: { ...labOrderState, error: 'Catalogue could not be loaded.' } } }) };
export const FavouritesList: Story = { render: () => ({ template: `<emr-favourites-panel [state]="state" />`, props: { state: favouritesState } }) };
export const FavouritesEditor: Story = { render: () => ({ template: `<emr-favourites-panel [state]="state" />`, props: { state: { ...favouritesState, mode: 'editor', editor: favouritesState.items[0] } } }) };
export const FavouritesApplyResult: Story = { render: () => ({ template: `<emr-favourites-panel [state]="state" />`, props: { state: { ...favouritesState, mode: 'apply-result', applyIssues: [{ catalogueId: 'lab-hba1c', label: 'Glycated haemoglobin', reason: 'unavailable', detail: 'No current catalogue match' }] } } }) };
export const FavouritesLoading: Story = { render: () => ({ template: `<emr-favourites-panel [state]="state" />`, props: { state: favouritesLoadingState } }) };
export const FavouritesError: Story = { render: () => ({ template: `<emr-favourites-panel [state]="state" />`, props: { state: favouritesErrorState } }) };
export const FavouritesInFlyout: Story = { render: () => ({ template: `<div class="emr-story-flyout-host"><emr-right-flyout [open]="true" title="My favourites"><emr-favourites-panel [state]="state" /></emr-right-flyout></div>`, props: { state: favouritesState } }) };

