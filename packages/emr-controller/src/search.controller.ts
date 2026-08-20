import {
  SearchRepository,
  StateController
} from './contracts.js';

export interface AsyncSearchState<Item> {
  query: string;
  options: readonly Item[];
  selected: readonly Item[];
  loading: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
}

export type AsyncSearchIntent<Item> =
  | { type: 'queryChanged'; query: string }
  | { type: 'searchRequested' }
  | { type: 'pageChanged'; page: number }
  | { type: 'selectionChanged'; selected: readonly Item[] }
  | { type: 'retryRequested' };

export class AsyncSearchController<Item> extends StateController<
  AsyncSearchState<Item>,
  AsyncSearchIntent<Item>
> {
  private request?: AbortController;
  private requestSequence = 0;

  constructor(
    private readonly repository: SearchRepository<Item>,
    initial?: Partial<AsyncSearchState<Item>>
  ) {
    super({
      query: '',
      options: [],
      selected: [],
      loading: false,
      page: 1,
      pageSize: 20,
      total: 0,
      ...initial
    });
  }

  dispatch(intent: AsyncSearchIntent<Item>): void {
    switch (intent.type) {
      case 'queryChanged':
        this.setState(state => ({ ...state, query: intent.query, page: 1 }));
        return;
      case 'pageChanged':
        this.setState(state => ({ ...state, page: intent.page }));
        void this.search();
        return;
      case 'selectionChanged':
        this.setState(state => ({ ...state, selected: [...intent.selected] }));
        return;
      case 'searchRequested':
      case 'retryRequested':
        void this.search();
        return;
    }
  }

  private async search(): Promise<void> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    const sequence = ++this.requestSequence;
    const snapshot = this.getSnapshot();
    this.setState(state => ({ ...state, loading: true, error: undefined }));

    try {
      const result = await this.repository.search({
        query: snapshot.query,
        page: snapshot.page,
        pageSize: snapshot.pageSize,
        signal: request.signal
      });
      if (sequence !== this.requestSequence || request.signal.aborted) return;
      this.setState(state => ({
        ...state,
        options: [...result.items],
        total: result.total,
        loading: false
      }));
    } catch (error: unknown) {
      if (request.signal.aborted || sequence !== this.requestSequence) return;
      this.setState(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }));
    }
  }

  protected override onDestroy(): void {
    this.request?.abort();
  }
}
