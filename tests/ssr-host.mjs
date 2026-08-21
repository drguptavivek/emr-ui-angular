import '@angular/compiler';
import { Component } from '@angular/core';
import {
  EmrClinicalMatrixComponent,
  EmrDocumentViewerComponent,
  EmrFieldGeneratorComponent,
  EmrPacChecklistComponent,
  EmrRightFlyoutComponent,
  EmrTemplateComposerComponent,
  EmrTimelineComponent
} from '../dist/emr-ui/fesm2022/drguptavivek-emr-ui.mjs';
import { derivePreview } from '../packages/emr-controller/dist/index.js';

export class EmrSsrHostComponent {
  events = [{ id: 'enc-1', occurredAt: '2026-08-19T09:00:00Z', dateLabel: '19 Aug 2026', title: 'Review', kindId: 'encounter' }];
  kinds = [{ id: 'encounter', label: 'Encounter', tone: 'info' }];
  schema = { id: 'ssr-matrix', label: 'SSR assessment', columns: [{ id: 'od', label: 'Right eye (OD)' }], rows: [{ id: 'finding', label: 'Finding', type: 'text' }] };
  values = { finding: { cells: { od: { value: 'Normal' } }, remark: '' } };
  reusableField = { schemaVersion: '1.0', id: 'ssr-weight', revision: 1, label: 'Weight', type: 'quantity', required: true, repeats: false, unit: 'kg', unitSystem: 'UCUM', unitCode: 'kg', validationRules: [], terminologyBindings: [] };
  fieldGenerator = { draft: this.reusableField, sources: [], terminologySearches: {}, validationErrors: {}, saving: false, dirty: false };
  templateDefinition = { schemaVersion: '1.0', id: 'ssr-general-examination', revision: 1, title: 'SSR reusable template', locale: 'en-IN', status: 'draft', sections: [{ id: 'general', label: 'General examination', fields: [{ id: 'weight-placement', sourceFieldId: this.reusableField.id, sourceFieldRevision: this.reusableField.revision, field: this.reusableField }] }] };
  templateComposer = { template: this.templateDefinition, fieldLibrary: [this.reusableField], fieldLibraryQuery: '', selectedSectionId: 'general', preview: derivePreview(this.templateDefinition), loading: false, saving: false, dirty: false };
  pac = { instanceId: 'ssr-pac', title: 'SSR PAC checklist', context: [{ id: 'procedure', label: 'Procedure', value: 'Synthetic procedure' }], form: { schema: { id: 'ssr-pac-form', label: 'PAC form', sections: [{ id: 'history', label: 'History', blocks: [{ id: 'history-note', label: 'History note', type: 'text' }] }] }, fields: { 'history-note': { value: 'Controller supplied' } }, repeatableGroups: {} }, actions: [{ id: 'save', label: 'Save draft', tone: 'secondary' }] };
  documentViewer = { instanceId: 'ssr-viewer', open: true, currentDocument: { documentId: 'doc-1', title: 'SSR document', fileName: 'ssr-page.png', categoryLabel: 'Clinical', folderLabel: 'Encounter', createdAtLabel: '19 Aug 2026', kind: 'image', pageCount: 1 }, documentIndex: 0, documentCount: 1, pageIndex: 0, page: { assetId: 'asset-1', documentId: 'doc-1', pageIndex: 0, pageLabel: 'Page 1', rasterUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', altText: 'Synthetic document page' }, loading: false, canPreviousDocument: false, canNextDocument: false, canPreviousPage: false, canNextPage: false };
  closedDocumentViewer = { ...this.documentViewer, instanceId: 'ssr-viewer-closed', open: false };
}

Component({
  selector: 'emr-ssr-host',
  standalone: true,
  imports: [EmrClinicalMatrixComponent, EmrDocumentViewerComponent, EmrFieldGeneratorComponent, EmrPacChecklistComponent, EmrRightFlyoutComponent, EmrTemplateComposerComponent, EmrTimelineComponent],
  template: `
    <emr-right-flyout [open]="true" title="Review orders"><p>Controller-supplied panel content</p></emr-right-flyout>
    <emr-timeline orientation="horizontal" [events]="events" [kinds]="kinds" selectedId="enc-1" />
    <emr-clinical-matrix [definition]="schema" [model]="values" />
    <emr-field-generator [model]="fieldGenerator" />
    <emr-template-composer [model]="templateComposer" />
    <emr-pac-checklist [model]="pac" />
    <emr-document-viewer [model]="documentViewer" />
    <emr-document-viewer [model]="closedDocumentViewer" />
  `
})(EmrSsrHostComponent);
