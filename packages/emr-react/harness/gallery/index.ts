import { gallery as l1Inputs } from './l1-inputs';
import { gallery as l1Display } from './l1-display';
import { gallery as l1Interactive } from './l1-interactive';
import { gallery as l2Fields } from './l2-fields';
import { gallery as l3Structures } from './l3-structures';
import { gallery as l3Annotation } from './l3-annotation';
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
import { gallery as l4ConsentReview } from './l4-consent-review';
import { gallery as l4Contact } from './l4-contact';
import { gallery as l4Privacy } from './l4-privacy';
import { gallery as l4Cards } from './l4-cards';
import { gallery as l4Drafts } from './l4-drafts';
import { gallery as l4Medications } from './l4-medications';
import { gallery as l4SafetyPedigree } from './l4-safety-pedigree';
import { gallery as l4Ophthalmology } from './l4-ophthalmology';
import { gallery as l4OrdersDocuments } from './l4-orders-documents';
import { gallery as l4AnnotationCanvas } from './l4-annotation-canvas';
import { gallery as l6Authoring } from './l6-authoring';
import type { GallerySection } from './types';

export const galleryGroups: readonly { id: string; title: string; sections: readonly GallerySection[] }[] = [
  { id: 'l1-inputs', title: 'L1 · Inputs', sections: l1Inputs },
  { id: 'l1-display', title: 'L1 · Display and layout', sections: l1Display },
  { id: 'l1-interactive', title: 'L1 · Interactive', sections: l1Interactive },
  { id: 'stats', title: 'L1 · Stats', sections: stats },
  { id: 'l2-fields', title: 'L2 · Clinical fields', sections: l2Fields },
  { id: 'l3-structures', title: 'L3 · Structures', sections: l3Structures },
  { id: 'l3-annotation', title: 'L3 · Repeatable & annotation structures', sections: l3Annotation },
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
  { id: 'l4-privacy', title: 'L4 · Privacy centre', sections: l4Privacy },
  { id: 'l4-cards', title: 'L4 · Link cards', sections: l4Cards },
  { id: 'l4-drafts', title: 'L4 · Drafts and sent', sections: l4Drafts },
  { id: 'l4-contact', title: 'L4 · Contact attempts', sections: l4Contact },
  { id: 'l4-consent-review', title: 'L4 · Consent review and receipt', sections: l4ConsentReview },
  { id: 'l4-medications', title: 'L4 · Scores & medications', sections: l4Medications },
  { id: 'l4-safety-pedigree', title: 'L4 · Safety checklists & pedigree', sections: l4SafetyPedigree },
  { id: 'l4-ophthalmology', title: 'L4 · Ophthalmology & diagnostics', sections: l4Ophthalmology },
  { id: 'l4-orders-documents', title: 'L4 · Orders, favourites & documents', sections: l4OrdersDocuments },
  { id: 'l4-annotation-canvas', title: 'L4 · Clinical annotation canvas', sections: l4AnnotationCanvas },
  { id: 'l6-authoring', title: 'L6 · Authoring & template studio', sections: l6Authoring },
];
