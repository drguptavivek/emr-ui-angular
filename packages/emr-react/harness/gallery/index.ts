import { gallery as l1Inputs } from './l1-inputs';
import { gallery as l1Display } from './l1-display';
import { gallery as l1Interactive } from './l1-interactive';
import type { GallerySection } from './types';

export const galleryGroups: readonly { id: string; title: string; sections: readonly GallerySection[] }[] = [
  { id: 'l1-inputs', title: 'L1 · Inputs', sections: l1Inputs },
  { id: 'l1-display', title: 'L1 · Display and layout', sections: l1Display },
  { id: 'l1-interactive', title: 'L1 · Interactive', sections: l1Interactive },
];
