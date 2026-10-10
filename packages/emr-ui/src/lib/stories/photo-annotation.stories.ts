import { Component, signal } from '@angular/core';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type { EmrAnnotationLabel, EmrClinicalAnnotationCanvasState } from '@drguptavivek/emr-controller';
import { EmrClinicalAnnotationCanvasComponent } from '../domain/emr-clinical-annotation-canvas.component';
import { placeholderAnatomyTemplates } from './annotation.fixtures';

/** Intrinsic size of every `svgFromText` placeholder. */
const placeholderSize = { width: 1400, height: 900 } as const;
const slate = '#475f70';

const svgFromText = (label: string, subtitle: string, accent: string): string => `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
    <rect width="1400" height="900" fill="#f8fafc"/>
    <rect x="55" y="55" width="1290" height="790" rx="20" fill="#fff" stroke="#cbd5e1" stroke-width="6"/>
    <text x="90" y="140" fill="${accent}" font-size="46" font-family="Inter,system-ui,sans-serif" font-weight="700">${label}</text>
    <text x="90" y="188" fill="#64748b" font-size="25" font-family="Inter,system-ui,sans-serif">${subtitle}</text>
    <path d="M90 260h1220M90 420h1220M90 580h1220M90 740h1220" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round"/>
  </svg>
`)}`;

const dermatologyLabels: EmrAnnotationLabel[] = [
  { id: 'lesion', label: 'Lesion', color: '#dc2626' },
  { id: 'scar', label: 'Scar', color: '#475569' },
  { id: 'excoriation', label: 'Excoriation', color: '#ea580c' },
  { id: 'inflammatory', label: 'Inflammatory patch', color: '#be123c' },
  { id: 'normal', label: 'Normal skin', color: '#64748b' },
];

const retinaLabels: EmrAnnotationLabel[] = [
  { id: 'retina-dry', label: 'Dry lesion', color: '#0284c7' },
  { id: 'hemorrhage', label: 'Hemorrhage', color: '#b91c1c' },
  { id: 'edema', label: 'Edema', color: '#2563eb' },
  { id: 'normal', label: 'Normal retina', color: '#64748b' },
  { id: 'artifact', label: 'Image artifact', color: '#7c3aed' },
];

const surgicalLabels: EmrAnnotationLabel[] = [
  { id: 'incision', label: 'Incision', color: '#7c3aed' },
  { id: 'margin', label: 'Margin', color: '#b45309' },
  { id: 'excision', label: 'Excision plan', color: '#be185d' },
  { id: 'landmark', label: 'Landmark', color: '#0369a1' },
  { id: 'normal', label: 'Normal anatomy', color: '#64748b' },
];

const dermStoryState: EmrClinicalAnnotationCanvasState = {
  instanceId: 'photo-annotator-derm-demo',
  title: 'Dermatology photo annotation',
  description: 'Upload a skin photo and tag each annotation with lesion class labels for dermatology reporting workflows.',
  imageTemplates: [
    { id: 'derm-outline', label: 'Dermatology outline', imageUrl: svgFromText('Dermatology', 'Right forearm lesion map', slate), ...placeholderSize, altText: 'Dermatology anatomy outline' },
    { id: 'derm-sample', label: 'Uploaded clinical photo', imageUrl: svgFromText('Patient skin photo', 'Replace by clicking Upload photo', '#0369a1'), ...placeholderSize, altText: 'Dermatology sample photo' },
  ],
  availableLabels: dermatologyLabels,
  selectedImageId: 'derm-sample',
  selectedLabelId: 'lesion',
  selectedTool: 'freeform',
  brushColor: slate,
  brushWidth: 3,
  textContent: 'ABCD',
  layers: [
    {
      id: 'demo-derm-1',
      tool: 'circle',
      label: 'Index lesion',
      color: '#dc2626',
      strokeWidth: 3,
      visible: true,
      classIds: ['lesion'],
      center: { x: 0.48, y: 0.43 },
      radiusX: 0.11,
      radiusY: 0.08,
    },
    {
      id: 'demo-derm-2',
      tool: 'text',
      label: 'Measurement',
      color: '#334155',
      strokeWidth: 2,
      visible: true,
      classIds: ['normal'],
      point: { x: 0.21, y: 0.2 },
      text: '6 x 4 mm',
      fontSize: 20,
    },
  ],
  selectedLayerId: 'demo-derm-1',
  photoUploadHint: 'Upload a derm photo (JPG/PNG) and annotate every region with a specific class.',
  photoAccept: 'image/*',
};

const retinaStoryState: EmrClinicalAnnotationCanvasState = {
  ...dermStoryState,
  instanceId: 'photo-annotator-retina-demo',
  title: 'Retina pair annotation',
  description: 'Specialty labels for OD/OS retinal marking with separate template choice for each encounter.',
  imageTemplates: placeholderAnatomyTemplates.filter(template => template.id.startsWith('retina-')),
  availableLabels: retinaLabels,
  selectedImageId: 'retina-od',
  selectedLabelId: 'hemorrhage',
  selectedTool: 'polygon',
  brushColor: '#dc2626',
  brushWidth: 4,
  layers: [],
  selectedLayerId: undefined,
  textContent: 'Lesion',
  photoUploadHint: 'Upload OD/OS photos and mark class-wise findings.',
};

const surgeryStoryState: EmrClinicalAnnotationCanvasState = {
  ...dermStoryState,
  instanceId: 'photo-annotator-surgery-demo',
  title: 'Surgery planning annotation',
  description: 'Upload surgical field images and classify markings like margins, incisions, and landmarks.',
  imageTemplates: [
    { id: 'surgery-body', label: 'Surgical body template', imageUrl: svgFromText('Surgical planning', 'Upload field photo and annotate', slate), ...placeholderSize, altText: 'Surgical field template' },
    ...placeholderAnatomyTemplates.filter(template => !template.id.startsWith('retina-')),
  ],
  availableLabels: surgicalLabels,
  selectedImageId: 'surgery-body',
  selectedLabelId: 'landmark',
  selectedTool: 'line',
  brushColor: slate,
  brushWidth: 3,
  layers: [
    {
      id: 'demo-surg-1',
      tool: 'line',
      label: 'Primary incision',
      color: '#be185d',
      strokeWidth: 3,
      visible: true,
      classIds: ['incision'],
      points: [{ x: 0.2, y: 0.46 }, { x: 0.8, y: 0.54 }],
    },
    {
      id: 'demo-surg-2',
      tool: 'polygon',
      label: 'Planned margin',
      color: '#b45309',
      strokeWidth: 3,
      visible: true,
      classIds: ['margin'],
      points: [
        { x: 0.56, y: 0.34 },
        { x: 0.66, y: 0.46 },
        { x: 0.58, y: 0.68 },
        { x: 0.48, y: 0.48 },
      ],
    },
  ],
  photoUploadHint: 'Upload operative photo and classify each drawing by annotation label before saving.',
};

/**
 * Plays the controller's part for uploads: the canvas only emits the chosen files, and
 * this host turns one into a template with a stable id, a URL and its intrinsic size.
 * A real controller would store the file and return a durable id instead.
 */
@Component({
  selector: 'emr-annotation-upload-story',
  standalone: true,
  imports: [EmrClinicalAnnotationCanvasComponent],
  template: `<div class="emr-story-surface"><emr-clinical-annotation-canvas [model]="model()" (intent)="latest = $event.state" (nativeFilesSelected)="addPhoto($event)" /></div>`,
})
class AnnotationUploadStoryComponent {
  // A signal, because the update lands in an async FileReader callback with no zone to notice it.
  readonly model = signal<EmrClinicalAnnotationCanvasState>(dermStoryState);
  latest: EmrClinicalAnnotationCanvasState = dermStoryState;
  private uploads = 0;

  addPhoto(files: readonly File[]): void {
    const file = files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const id = `story-upload-${this.uploads += 1}`;
        const template = { id, label: `Uploaded: ${file.name}`, imageUrl, width: image.naturalWidth, height: image.naturalHeight, altText: file.name };
        this.latest = { ...this.latest, imageTemplates: [template, ...this.latest.imageTemplates], selectedImageId: id };
        this.model.set(this.latest);
      };
      image.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }
}

const meta: Meta = {
  title: 'EMR / Clinical / Photo annotation',
  decorators: [moduleMetadata({ imports: [EmrClinicalAnnotationCanvasComponent, AnnotationUploadStoryComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'Photo annotation canvas with upload, per-annotation class assignment and class-aware layers. ' +
          'Use this as a reusable base for dermatology, ophthalmology, surgical marks, and other specialty image workflows.'
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Dermatology: Story = {
  render: () => ({ template: `<emr-annotation-upload-story />` }),
};

export const RetinaPairs: Story = {
  render: () => ({ template: `<div class="emr-story-surface"><emr-clinical-annotation-canvas [model]="model" /></div>`, props: { model: retinaStoryState } }),
};

export const SurgeryPlanning: Story = {
  render: () => ({ template: `<div class="emr-story-surface"><emr-clinical-annotation-canvas [model]="model" /></div>`, props: { model: surgeryStoryState } }),
};

export const DermatologyReadonly: Story = {
  render: () => ({ template: `<div class="emr-story-surface"><emr-clinical-annotation-canvas [model]="model" /></div>`, props: { model: { ...dermStoryState, readOnly: true } } }),
};
