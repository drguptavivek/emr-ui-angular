export type Unsubscribe = () => void;

export interface EmrController<State, Intent> {
  getSnapshot(): Readonly<State>;
  subscribe(listener: (state: Readonly<State>) => void): Unsubscribe;
  dispatch(intent: Intent): void;
  destroy(): void;
}

export abstract class StateController<State, Intent>
  implements EmrController<State, Intent>
{
  private listeners = new Set<(state: Readonly<State>) => void>();
  private destroyed = false;

  protected constructor(private state: State) {}

  getSnapshot(): Readonly<State> {
    return this.state;
  }

  subscribe(listener: (state: Readonly<State>) => void): Unsubscribe {
    if (this.destroyed) {
      return () => undefined;
    }
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  protected setState(next: State | ((current: Readonly<State>) => State)): void {
    if (this.destroyed) return;
    this.state = typeof next === 'function'
      ? (next as (current: Readonly<State>) => State)(this.state)
      : next;
    for (const listener of this.listeners) listener(this.state);
  }

  protected isDestroyed(): boolean {
    return this.destroyed;
  }

  abstract dispatch(intent: Intent): void;

  destroy(): void {
    this.destroyed = true;
    this.listeners.clear();
    this.onDestroy();
  }

  protected onDestroy(): void {}
}

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface PageResult<Item> {
  items: readonly Item[];
  total: number;
}

export interface SearchRequest extends PageRequest {
  query: string;
  signal: AbortSignal;
}

export interface SearchRepository<Item> {
  search(request: SearchRequest): Promise<PageResult<Item>>;
}
