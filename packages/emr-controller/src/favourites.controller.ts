import { StateController } from './contracts.js';
import {
  FavouriteApplyIssue,
  FavouriteEntry,
  FavouriteKind,
  FavouritesIntent,
  FavouritesViewModel
} from './models.js';

export interface FavouriteRepository {
  list(kind: FavouriteKind, query: string, signal: AbortSignal): Promise<readonly FavouriteEntry[]>;
  save(entry: FavouriteEntry, signal: AbortSignal): Promise<FavouriteEntry>;
  delete(id: string, signal: AbortSignal): Promise<void>;
  move(id: string, direction: 'up' | 'down', signal: AbortSignal): Promise<void>;
  apply(id: string, signal: AbortSignal): Promise<readonly FavouriteApplyIssue[]>;
}

export class FavouritesController extends StateController<
  FavouritesViewModel,
  FavouritesIntent
> {
  private request?: AbortController;
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(
    private readonly repository: FavouriteRepository,
    dependencies?: { createId?: () => string; now?: () => string }
  ) {
    super({
      open: false,
      mode: 'list',
      activeKind: 'medication',
      query: '',
      items: [],
      loading: false
    });
    this.createId = dependencies?.createId ?? (() => crypto.randomUUID());
    this.now = dependencies?.now ?? (() => new Date().toISOString());
  }

  dispatch(intent: FavouritesIntent): void {
    switch (intent.type) {
      case 'opened':
        this.setState(state => ({ ...state, open: true }));
        void this.load();
        return;
      case 'closed':
        this.setState(state => ({ ...state, open: false, mode: 'list' }));
        return;
      case 'tabChanged':
        this.setState(state => ({ ...state, activeKind: intent.kind, mode: 'list' }));
        void this.load();
        return;
      case 'queryChanged':
        this.setState(state => ({ ...state, query: intent.query }));
        void this.load();
        return;
      case 'createRequested':
        this.setState(state => ({
          ...state,
          mode: 'editor',
          editor: {
            id: this.createId(),
            name: '',
            kind: intent.kind,
            orderTemplates: [],
            updatedAt: this.now()
          }
        }));
        return;
      case 'editRequested': {
        const editor = this.getSnapshot().items.find(item => item.id === intent.id);
        if (editor) this.setState(state => ({ ...state, mode: 'editor', editor: { ...editor } }));
        return;
      }
      case 'editorNameChanged':
        this.setState(state => state.editor
          ? { ...state, editor: { ...state.editor, name: intent.name } }
          : state);
        return;
      case 'editorOrdersChanged':
        this.setState(state => state.editor
          ? { ...state, editor: { ...state.editor, orderTemplates: [...intent.orders] } }
          : state);
        return;
      case 'saveRequested':
        void this.save();
        return;
      case 'deleteRequested':
        void this.remove(intent.id);
        return;
      case 'moveRequested':
        void this.move(intent.id, intent.direction);
        return;
      case 'applyRequested':
        void this.apply(intent.id);
        return;
      case 'backRequested':
        this.setState(state => ({ ...state, mode: 'list', editor: undefined, applyIssues: undefined }));
        return;
      case 'retryRequested':
        void this.load();
        return;
    }
  }

  private async perform<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.setState(state => ({ ...state, loading: true, error: undefined }));
    try {
      const result = await operation(request.signal);
      if (request.signal.aborted) return undefined;
      this.setState(state => ({ ...state, loading: false }));
      return result;
    } catch (error: unknown) {
      if (request.signal.aborted) return undefined;
      this.setState(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to update favourites'
      }));
      return undefined;
    }
  }

  private async load(): Promise<void> {
    const { activeKind, query } = this.getSnapshot();
    const items = await this.perform(signal => this.repository.list(activeKind, query, signal));
    if (items) this.setState(state => ({ ...state, items: [...items] }));
  }

  private async save(): Promise<void> {
    const editor = this.getSnapshot().editor;
    if (!editor || !editor.name.trim()) {
      this.setState(state => ({ ...state, error: 'A favourite name is required.' }));
      return;
    }
    const saved = await this.perform(signal =>
      this.repository.save({ ...editor, name: editor.name.trim(), updatedAt: this.now() }, signal)
    );
    if (saved) {
      this.setState(state => ({ ...state, mode: 'list', editor: undefined }));
      await this.load();
    }
  }

  private async remove(id: string): Promise<void> {
    await this.perform(signal => this.repository.delete(id, signal));
    if (!this.getSnapshot().error && !this.isDestroyed()) await this.load();
  }

  private async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.perform(signal => this.repository.move(id, direction, signal));
    if (!this.getSnapshot().error && !this.isDestroyed()) await this.load();
  }

  private async apply(id: string): Promise<void> {
    const issues = await this.perform(signal => this.repository.apply(id, signal));
    if (issues) {
      this.setState(state => ({ ...state, mode: 'apply-result', applyIssues: [...issues] }));
    }
  }

  protected override onDestroy(): void {
    this.request?.abort();
  }
}
