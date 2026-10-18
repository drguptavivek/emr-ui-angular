import type { ReactNode } from 'react';

/** One demo on the gallery page. `render` is a component body, so it may use hooks for local state. */
export interface GallerySection {
  id: string;
  title: string;
  render: () => ReactNode;
}
