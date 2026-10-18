'use client';

import { useSyncExternalStore } from 'react';

/** Structural shape of emr-controller's StateController, so this file needs no runtime import from it. */
export interface EmrStore<State> {
  getSnapshot(): Readonly<State>;
  subscribe(listener: (state: Readonly<State>) => void): () => unknown;
}

/** Subscribe a component to a headless controller: `const model = useControllerState(controller)`. */
export function useControllerState<State>(store: EmrStore<State>): Readonly<State> {
  return useSyncExternalStore(
    listener => { const unsubscribe = store.subscribe(listener); return () => { unsubscribe(); }; },
    () => store.getSnapshot(),
    () => store.getSnapshot(),
  );
}
