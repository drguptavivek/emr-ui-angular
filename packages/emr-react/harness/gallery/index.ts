import { gallery as l1Inputs } from './l1-inputs';
import { gallery as l1Display } from './l1-display';
import { gallery as l1Interactive } from './l1-interactive';
import { gallery as l3Structures } from './l3-structures';
import { gallery as l4Shell } from './l4-shell';
import { gallery as l4Lists } from './l4-lists';
import { gallery as stats } from './stats';
import type { GallerySection } from './types';

export const galleryGroups: readonly { id: string; title: string; sections: readonly GallerySection[] }[] = [
  { id: 'l1-inputs', title: 'L1 · Inputs', sections: l1Inputs },
  { id: 'l1-display', title: 'L1 · Display and layout', sections: l1Display },
  { id: 'l1-interactive', title: 'L1 · Interactive', sections: l1Interactive },
  { id: 'stats', title: 'L1 · Stats', sections: stats },
  { id: 'l3-structures', title: 'L3 · Structures', sections: l3Structures },
  { id: 'l4-shell', title: 'L4 · Shell and capture', sections: l4Shell },
  { id: 'l4-lists', title: 'L4 · Lists and timelines', sections: l4Lists },
];
