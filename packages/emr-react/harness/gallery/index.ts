import { gallery as l1Inputs } from './l1-inputs';
import { gallery as l1Display } from './l1-display';
import { gallery as l1Interactive } from './l1-interactive';
import { gallery as l3Structures } from './l3-structures';
import { gallery as l4Shell } from './l4-shell';
import { gallery as l4Lists } from './l4-lists';
import { gallery as stats } from './stats';
import { gallery as l4Identity } from './l4-identity';
import { gallery as l4History } from './l4-history';
import { gallery as l4Desk } from './l4-desk';
import { gallery as l4MobileShell } from './l4-mobile-shell';
import { gallery as l4WebShell } from './l4-web-shell';
import { gallery as dataTable } from './data-table';
import { gallery as l4Merge } from './l4-merge';
import { gallery as l4Records } from './l4-records';
import { gallery as charts } from './charts';
import { gallery as l4Consent } from './l4-consent';
import type { GallerySection } from './types';

export const galleryGroups: readonly { id: string; title: string; sections: readonly GallerySection[] }[] = [
  { id: 'l1-inputs', title: 'L1 · Inputs', sections: l1Inputs },
  { id: 'l1-display', title: 'L1 · Display and layout', sections: l1Display },
  { id: 'l1-interactive', title: 'L1 · Interactive', sections: l1Interactive },
  { id: 'stats', title: 'L1 · Stats', sections: stats },
  { id: 'l3-structures', title: 'L3 · Structures', sections: l3Structures },
  { id: 'l4-shell', title: 'L4 · Shell and capture', sections: l4Shell },
  { id: 'l4-lists', title: 'L4 · Lists and timelines', sections: l4Lists },
  { id: 'l4-identity', title: 'L4 · Identity', sections: l4Identity },
  { id: 'l4-history', title: 'L4 · Patient history', sections: l4History },
  { id: 'l4-desk', title: 'L4 · Desk workflows', sections: l4Desk },
  { id: 'l4-mobile-shell', title: 'L4 · Mobile shell', sections: l4MobileShell },
  { id: 'l4-web-shell', title: 'L4 · Web shell', sections: l4WebShell },
  { id: 'data-table', title: 'Web only · Data table', sections: dataTable },
  { id: 'l4-merge', title: 'L4 · Merge compare', sections: l4Merge },
  { id: 'l4-records', title: 'L4 · Record diff and upload', sections: l4Records },
  { id: 'charts', title: 'Web only · Charts', sections: charts },
  { id: 'l4-consent', title: 'L4 · Consent', sections: l4Consent },
];
