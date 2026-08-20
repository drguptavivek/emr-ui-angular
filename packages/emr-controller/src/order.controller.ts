import { StateController } from './contracts.js';
import {
  GroupAddPreview,
  HierarchyNode,
  HierarchyOrderIntent,
  HierarchyOrderViewModel,
  SelectedOrder
} from './models.js';

export interface OrderCatalogueRepository {
  roots(query: string, signal: AbortSignal): Promise<readonly HierarchyNode[]>;
  children(nodeId: string, signal: AbortSignal): Promise<readonly HierarchyNode[]>;
  previewGroup(nodeId: string, signal: AbortSignal): Promise<GroupAddPreview>;
  resolveItem(nodeId: string, signal: AbortSignal): Promise<SelectedOrder>;
}

export class HierarchyOrderController extends StateController<
  HierarchyOrderViewModel,
  HierarchyOrderIntent
> {
  private request?: AbortController;

  constructor(
    title: string,
    private readonly repository: OrderCatalogueRepository,
    initial?: Partial<HierarchyOrderViewModel>,
    private readonly orderKind: SelectedOrder['kind'] = 'laboratory'
  ) {
    super({
      title,
      query: '',
      roots: [],
      selected: [],
      loading: false,
      ...initial
    });
  }

  dispatch(intent: HierarchyOrderIntent): void {
    switch (intent.type) {
      case 'queryChanged':
        this.setState(state => ({ ...state, query: intent.query }));
        return;
      case 'searchRequested':
      case 'retryRequested':
        void this.search();
        return;
      case 'nodeExpansionRequested':
        void this.expand(intent.nodeId, intent.expanded);
        return;
      case 'itemAddRequested':
        void this.addItem(intent.nodeId);
        return;
      case 'groupPreviewRequested':
        void this.preview(intent.nodeId);
        return;
      case 'groupPreviewDismissed':
        this.setState(state => ({ ...state, preview: undefined }));
        return;
      case 'groupAddConfirmed':
        this.confirmGroup(intent.groupId);
        return;
      case 'orderRemoveRequested':
        this.setState(state => ({
          ...state,
          selected: state.selected.filter(item => item.id !== intent.orderId)
        }));
        return;
      case 'orderDetailChanged':
        this.setState(state => ({
          ...state,
          selected: state.selected.map(item =>
            item.id === intent.orderId
              ? { ...item, details: { ...item.details, [intent.field]: intent.value } }
              : item
          )
        }));
        return;
    }
  }

  private async run<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.setState(state => ({ ...state, loading: true, error: undefined }));
    try {
      const value = await operation(request.signal);
      if (request.signal.aborted) return undefined;
      this.setState(state => ({ ...state, loading: false }));
      return value;
    } catch (error: unknown) {
      if (request.signal.aborted) return undefined;
      this.setState(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load catalogue'
      }));
      return undefined;
    }
  }

  private async search(): Promise<void> {
    const query = this.getSnapshot().query;
    const roots = await this.run(signal => this.repository.roots(query, signal));
    if (roots) this.setState(state => ({ ...state, roots: [...roots] }));
  }

  private async expand(nodeId: string, expanded: boolean): Promise<void> {
    if (!expanded) {
      this.setState(state => ({ ...state, roots: updateNode(state.roots, nodeId, { expanded: false }) }));
      return;
    }
    const children = await this.run(signal => this.repository.children(nodeId, signal));
    if (children) {
      this.setState(state => ({
        ...state,
        roots: updateNode(state.roots, nodeId, { expanded: true, children: [...children] })
      }));
    }
  }

  private async addItem(nodeId: string): Promise<void> {
    const item = await this.run(signal => this.repository.resolveItem(nodeId, signal));
    if (!item) return;
    this.setState(state => state.selected.some(existing => existing.catalogueId === item.catalogueId)
      ? state
      : { ...state, selected: [...state.selected, item] });
  }

  private async preview(nodeId: string): Promise<void> {
    const preview = await this.run(signal => this.repository.previewGroup(nodeId, signal));
    if (preview) this.setState(state => ({ ...state, preview }));
  }

  private confirmGroup(groupId: string): void {
    const preview = this.getSnapshot().preview;
    if (!preview || preview.groupId !== groupId) return;
    this.setState(state => {
      const existingIds = new Set(state.selected.map(item => item.catalogueId));
      const added: SelectedOrder[] = preview.items
        .filter(item => !existingIds.has(item.catalogueId))
        .map(item => ({
          id: `order-${item.catalogueId}`,
          catalogueId: item.catalogueId,
          label: item.label,
          code: item.code,
          kind: this.orderKind
        }));
      return { ...state, selected: [...state.selected, ...added], preview: undefined };
    });
  }

  protected override onDestroy(): void {
    this.request?.abort();
  }
}

function updateNode(
  nodes: readonly HierarchyNode[],
  id: string,
  patch: Partial<HierarchyNode>
): readonly HierarchyNode[] {
  return nodes.map(node => {
    if (node.id === id) return { ...node, ...patch };
    if (!node.children) return node;
    return { ...node, children: updateNode(node.children, id, patch) };
  });
}
