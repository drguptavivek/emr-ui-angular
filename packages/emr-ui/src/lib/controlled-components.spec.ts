import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Angular metadata is compiled by ng-packagr, while the repository's Vitest
// profile intentionally runs in Node. These contract tests inspect the source
// boundary; Angular interaction tests run through Storybook/Playwright.
const component = (relativePath: string): string =>
  readFileSync(join(process.cwd(), 'packages/emr-ui/src/lib', relativePath), 'utf8');

describe('controlled UI component contracts', () => {
  it('button and form primitives expose outputs rather than hidden state updates', () => {
    const source = component('primitives/emr-button.component.ts') + component('primitives/emr-inputs.component.ts');

    expect(source).toMatch(/@Output\(\)\s+readonly\s+clicked\s*=\s*new EventEmitter/);
    expect(source).toMatch(/@Output\(\)\s+readonly\s+valueChange\s*=\s*new EventEmitter/);
    expect(source).not.toMatch(/this\.value\s*=/);
  });

  it('search-select is controlled by query/options/selected inputs and emits intents', () => {
    const source = component('primitives/emr-search-select.component.ts');

    expect(source).toMatch(/@Input\(\)\s+query\s*=\s*''/);
    expect(source).toMatch(/@Input\(\)\s+options:\s+readonly\s+EmrOption\[\]/);
    expect(source).toMatch(/@Input\(\)\s+selected:\s+readonly\s+EmrOption\[\]/);
    expect(source).toMatch(/@Output\(\)\s+readonly\s+queryChanged/);
    expect(source).toMatch(/@Output\(\)\s+readonly\s+optionSelected/);
    expect(source).not.toMatch(/this\.(query|options|selected)\s*=/);
  });

  it('patient list and navigation emit typed intents without mutating supplied view state', () => {
    const patientList = component('domain/emr-patient-list.component.ts');
    const navigation = component('domain/emr-left-nav.component.ts');

    expect(patientList).toMatch(/@Output\(\)\s+readonly\s+intent\s*=\s*new EventEmitter<PatientListIntent>/);
    expect(patientList).toMatch(/patientSelected/);
    expect(patientList).not.toMatch(/this\.state\s*=/);
    expect(navigation).toMatch(/collapseToggled|itemSelected|itemExpansionRequested/);
    expect(navigation).not.toMatch(/this\.(items|activeId|expandedIds|collapsed)\s*=/);
  });

  it('patient banner is a pure projection with a controlled expansion intent', () => {
    const source = component('domain/emr-patient-banner.component.ts');

    expect(source).toMatch(/readonly\s+model\s*=\s*input\.required<PatientBannerViewModel>\(\)/);
    expect(source).toMatch(/readonly\s+intent\s*=\s*output<PatientBannerIntent>\(\)/);
    expect(source).toMatch(/type:\s*'expandedChangeRequested'/);
    expect(source).not.toMatch(/@Input|@Output|EventEmitter/);
    expect(source).toMatch(/primaryIdentifier\(\)/);
    expect(source).toMatch(/combinedAlerts\(\)/);
    expect(source).not.toMatch(/model\.(allergies|alerts|chronicDiseases)\.(?:push|splice|sort|reverse)\s*\(/);
  });

  it('clinical matrix supports specialty schemas while emitting cell and remark edits', () => {
    const source = component('structures/emr-clinical-matrix.component.ts');

    expect(source).toMatch(/ClinicalMatrixSchema/);
    expect(source).toMatch(/ClinicalMatrixValues/);
    expect(source).toMatch(/cellEditRequested/);
    expect(source).toMatch(/remarkEditRequested/);
    expect(source).toMatch(/customCellIntent/);
    expect(source).toMatch(/applicableColumnIds/);
    expect(source).not.toMatch(/this\.values\s*=/);
  });

  it('spectacle prescription is a controlled eye-by-field table with raw string edits', () => {
    const source = component('domain/emr-spectacle-prescription.component.ts');

    expect(source).toMatch(/SpectaclePrescriptionViewModel/);
    expect(source).toMatch(/cellFocused/);
    expect(source).toMatch(/cellEditRequested/);
    expect(source).toMatch(/notesEditRequested/);
    expect(source).toMatch(/scope="row"/);
    expect(source).toMatch(/@media\(max-width:720px\)/);
    expect(source).not.toMatch(/fetch\(|localStorage|sessionStorage|Router|HttpClient/);
    expect(source).not.toMatch(/this\.model\.(values|notes)\s*=/);
  });

  it('workflow components contain no direct network, persistence, or routing calls', () => {
    const files = [
      'domain/emr-patient-list.component.ts',
      'domain/emr-timeline.component.ts',
      'domain/emr-hierarchy-order-picker.component.ts',
      'domain/emr-favourites-panel.component.ts',
    ];
    for (const path of files) {
      const source = component(path);
      expect(source, path).not.toMatch(/\b(?:fetch|HttpClient|Router|localStorage|sessionStorage|XMLHttpRequest)\b/);
    }
  });

  it('PAC checklist wraps a controlled clinical form and namespaces its instance actions', () => {
    const source = component('domain/emr-pac-checklist.component.ts');

    expect(source).toMatch(/PacChecklistViewModel/);
    expect(source).toMatch(/type: 'formIntent'/);
    expect(source).toMatch(/type: 'actionRequested'/);
    expect(source).toMatch(/model\.instanceId/);
    expect(source).toMatch(/readOnly: !!this\.model\.readOnly/);
    expect(source).not.toMatch(/fetch\(|HttpClient|Router|localStorage|sessionStorage|fitness|clearance|ASA/);
  });

  it('document library and viewer are controlled, permission-aware presentation surfaces', () => {
    const library = component('domain/emr-patient-documents.component.ts');
    const viewer = component('domain/emr-document-viewer.component.ts');

    expect(library).toMatch(/folderChanged/);
    expect(library).toMatch(/documentClicked/);
    expect(library).toMatch(/previewRequested/);
    expect(library).toMatch(/headingId/);
    expect(library).not.toMatch(/ViewEncapsulation\.None/);
    expect(library).toMatch(/emr-patient-documents__select\{min-height:44px/);
    expect(viewer).toMatch(/DocumentViewerViewModel/);
    expect(viewer).toMatch(/DocumentViewerIntent/);
    expect(viewer).toMatch(/rasterLoadFailed/);
    expect(viewer).toMatch(/data-asset-id/);
    expect(viewer).toMatch(/event\.currentTarget/);
    expect(viewer).toMatch(/previousPageRequested|nextPageRequested/);
    expect(viewer).toMatch(/isPlatformBrowser/);
    expect(viewer).toMatch(/inject\(DOCUMENT\)/);
    expect(viewer).not.toMatch(/fetch\(|HttpClient|Router|localStorage|sessionStorage|createObjectURL|<iframe|<object|<embed/);
  });
});
