/**
 * Generic, canvas-agnostic annotation toolbar contract. The toolbar renders supplied
 * tools, colours and widths and emits intents; it never knows what a tool does and holds
 * no geometry, history, zoom or colour state.
 */

/** `icon` is a heroicon name (for example `heroPencil`); an unknown name falls back to the label initial. */
export interface ToolbarTool {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly disabled?: boolean;
  /** Display-only hint appended to the tooltip, for example `V`. */
  readonly shortcutLabel?: string;
}

/** `hex` is the data colour of the mark, painted on the swatch; it is not UI styling. */
export interface ToolbarColour {
  readonly id: string;
  readonly label: string;
  readonly hex: string;
}

export interface ToolbarWidth {
  readonly id: string;
  readonly label: string;
  /** Stroke width in pixels, drawn as a sample bar on the button. */
  readonly px: number;
}

export interface AnnotationToolbarViewModel {
  readonly tools: readonly ToolbarTool[];
  readonly selectedToolId?: string;
  readonly colours: readonly ToolbarColour[];
  readonly selectedColourId?: string;
  readonly widths: readonly ToolbarWidth[];
  readonly selectedWidthId?: string;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Supplied display text such as `100%`; the toolbar owns no zoom state. */
  readonly zoomLabel: string;
  readonly canSave: boolean;
  readonly saveLabel?: string;
  /** Disables everything except zoom. */
  readonly readOnly?: boolean;
  /** Disables the four zoom buttons (the host has locked pan and zoom). */
  readonly zoomLocked?: boolean;
}

export type AnnotationToolbarIntent =
  | { readonly type: 'toolSelected'; readonly toolId: string }
  | { readonly type: 'colourSelected'; readonly colourId: string }
  | { readonly type: 'widthSelected'; readonly widthId: string }
  | { readonly type: 'undoRequested' }
  | { readonly type: 'redoRequested' }
  | { readonly type: 'zoomInRequested' }
  | { readonly type: 'zoomOutRequested' }
  | { readonly type: 'zoomFitRequested' }
  | { readonly type: 'zoomResetRequested' }
  | { readonly type: 'saveRequested' };
