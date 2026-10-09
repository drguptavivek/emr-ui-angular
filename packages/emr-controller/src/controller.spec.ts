import { describe, expect, it } from 'vitest';
import {
  StateController,
  AsyncSearchController,
  ClinicalMatrixController,
  FavouritesController,
  HierarchyOrderController,
  type ClinicalMatrixSchema,
  type ClinicalMatrixValues,
  type FavouriteEntry,
  type FavouriteKind,
  type HierarchyNode,
  type SelectedOrder
} from './index';

const tick = async (): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(resolve, 0));
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('StateController', () => {
  class CounterController extends StateController<{ count: number }, { type: 'increment' }> {
    constructor() {
      super({ count: 0 });
    }

    dispatch(): void {
      this.setState(state => ({ count: state.count + 1 }));
    }
  }

  it('emits the initial snapshot and stops after destroy', () => {
    const controller = new CounterController();
    const snapshots: number[] = [];
    const unsubscribe = controller.subscribe(state => snapshots.push(state.count));

    controller.dispatch({ type: 'increment' });
    unsubscribe();
    controller.dispatch({ type: 'increment' });
    expect(snapshots).toEqual([0, 1]);

    controller.destroy();
    controller.dispatch({ type: 'increment' });
    expect(controller.getSnapshot().count).toBe(2);
    expect(controller.subscribe(() => snapshots.push(99))).toEqual(expect.any(Function));
    expect(snapshots).toEqual([0, 1]);
  });
});

describe('AsyncSearchController', () => {
  it('searches, pages, and copies selection without mutating caller arrays', async () => {
    const calls: Array<{ query: string; page: number; pageSize: number }> = [];
    const repository = {
      search: async (request: { query: string; page: number; pageSize: number; signal: AbortSignal }) => {
        calls.push(request);
        return { items: [`${request.query}-${request.page}`], total: 41 };
      }
    };
    const controller = new AsyncSearchController(repository, { pageSize: 5 });
    const selected = ['one'];
    controller.dispatch({ type: 'selectionChanged', selected });
    selected.push('two');
    controller.dispatch({ type: 'queryChanged', query: 'amox' });
    controller.dispatch({ type: 'searchRequested' });
    await tick();
    controller.dispatch({ type: 'pageChanged', page: 3 });
    await tick();

    expect(calls.map(call => [call.query, call.page, call.pageSize])).toEqual([
      ['amox', 1, 5],
      ['amox', 3, 5]
    ]);
    expect(controller.getSnapshot()).toMatchObject({ options: ['amox-3'], total: 41, loading: false });
    expect(controller.getSnapshot().selected).toEqual(['one']);
  });

  it('ignores stale results and aborts the previous request', async () => {
    const first = deferred<{ items: readonly string[]; total: number }>();
    const second = deferred<{ items: readonly string[]; total: number }>();
    const signals: AbortSignal[] = [];
    let count = 0;
    const repository = {
      search: (request: { signal: AbortSignal }) => {
        signals.push(request.signal);
        count += 1;
        return count === 1 ? first.promise : second.promise;
      }
    };
    const controller = new AsyncSearchController(repository);
    controller.dispatch({ type: 'searchRequested' });
    controller.dispatch({ type: 'queryChanged', query: 'new' });
    controller.dispatch({ type: 'searchRequested' });
    expect(signals[0]?.aborted).toBe(true);

    first.resolve({ items: ['stale'], total: 1 });
    second.resolve({ items: ['current'], total: 1 });
    await tick();
    expect(controller.getSnapshot().options).toEqual(['current']);
  });

  it('never applies a response that completes after the query changed', async () => {
    const pending = deferred<{ items: readonly string[]; total: number }>();
    const repository = { search: () => pending.promise };
    const controller = new AsyncSearchController(repository);
    controller.dispatch({ type: 'queryChanged', query: 'amox' });
    controller.dispatch({ type: 'searchRequested' });
    controller.dispatch({ type: 'queryChanged', query: 'metformin' });
    pending.resolve({ items: ['amoxicillin'], total: 1 });
    await tick();
    expect(controller.getSnapshot().query).toBe('metformin');
    expect(controller.getSnapshot().options).toEqual([]);
    expect(controller.getSnapshot().loading).toBe(false);
  });

  it('exposes repository errors and clears them on retry', async () => {
    let attempt = 0;
    const repository = {
      search: async () => {
        attempt += 1;
        if (attempt === 1) throw new Error('catalogue unavailable');
        return { items: ['ok'], total: 1 };
      }
    };
    const controller = new AsyncSearchController(repository);
    controller.dispatch({ type: 'searchRequested' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ loading: false, error: 'catalogue unavailable' });
    controller.dispatch({ type: 'retryRequested' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ loading: false, error: undefined, options: ['ok'] });
  });
});

describe('ClinicalMatrixController', () => {
  const schema: ClinicalMatrixSchema = {
    id: 'neuro',
    label: 'Neurological examination',
    columns: [
      { id: 'right-arm', label: 'Right arm' },
      { id: 'left-arm', label: 'Left arm' }
    ],
    rows: [
      { id: 'power', label: 'Power', type: 'integer', assessmentStatusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'neutral' },
        { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' }
      ] },
      { id: 'reflex', label: 'Reflex', type: 'select', options: [{ value: '2+', label: '2+' }] }
    ]
  };

  const values: ClinicalMatrixValues = {
    power: {
      cells: {
        'right-arm': { value: 4 },
        'left-arm': { value: 5, readOnly: true }
      },
      remark: ''
    },
    reflex: {
      cells: { 'right-arm': { value: null, disabled: true } },
      remark: ''
    }
  };

  it('edits immutably, validates cells, and updates remarks', () => {
    const original = values.power.cells['right-arm'];
    const controller = new ClinicalMatrixController(schema, values, (_state, rowId, columnId) =>
      rowId === 'power' && columnId === 'right-arm' ? 'Power must be between 0 and 5' : undefined
    );
    controller.dispatch({ type: 'cellEditRequested', rowId: 'power', columnId: 'right-arm', value: 8 });
    controller.dispatch({ type: 'remarkEditRequested', rowId: 'power', remark: 'Weakness noted' });

    expect(values.power.cells['right-arm']).toBe(original);
    expect(controller.getSnapshot().values.power.cells['right-arm']).toMatchObject({ value: 8, error: 'Power must be between 0 and 5' });
    expect(controller.getSnapshot().values.power.remark).toBe('Weakness noted');
  });

  it('does not edit read-only, disabled, or non-applicable cells', () => {
    const controller = new ClinicalMatrixController(schema, values);
    controller.dispatch({ type: 'cellEditRequested', rowId: 'power', columnId: 'left-arm', value: 2 });
    controller.dispatch({ type: 'cellEditRequested', rowId: 'reflex', columnId: 'right-arm', value: '3+' });
    controller.dispatch({ type: 'cellEditRequested', rowId: 'reflex', columnId: 'left-arm', value: '3+' });
    expect(controller.getSnapshot().values.power.cells['left-arm'].value).toBe(5);
    expect(controller.getSnapshot().values.reflex.cells['right-arm'].value).toBeNull();
    expect(controller.getSnapshot().values.reflex.cells['left-arm']).toBeUndefined();
  });

  it('preserves explicit assessment status, read-only remarks, and external intents', () => {
    const controller = new ClinicalMatrixController(schema, {
      ...values,
      power: { ...values.power, remarkReadOnly: true }
    });
    controller.dispatch({ type: 'cellAssessmentStatusEditRequested', rowId: 'power', columnId: 'right-arm', status: 'unable-to-assess' });
    controller.dispatch({ type: 'remarkEditRequested', rowId: 'power', remark: 'Must not change' });
    controller.dispatch({ type: 'customCellIntent', rowId: 'power', columnId: 'right-arm', action: 'open-scale' });

    expect(controller.getSnapshot().values.power.cells['right-arm'].assessmentStatus).toMatchObject({ value: 'unable-to-assess', label: 'Unable to assess' });
    expect(controller.getSnapshot().values.power.remark).toBe('');
    expect(controller.getSnapshot().lastExternalIntent).toMatchObject({ type: 'customCellIntent', action: 'open-scale' });
  });
});

describe('HierarchyOrderController', () => {
  const group: HierarchyNode = { id: 'chemistry', label: 'Chemistry', kind: 'group', selectable: true };
  const item: HierarchyNode = { id: 'cbc', label: 'Complete blood count', code: 'CBC', kind: 'item', selectable: true };

  it('searches, expands, deduplicates items, and previews group additions', async () => {
    const repository = {
      roots: async () => [group],
      children: async () => [item],
      resolveItem: async () => ({ id: 'order-cbc', catalogueId: 'cbc', label: item.label, code: item.code, kind: 'laboratory' as const }),
      previewGroup: async () => ({ groupId: 'chemistry', groupLabel: 'Chemistry', items: [
        { catalogueId: 'cbc', label: item.label, code: item.code },
        { catalogueId: 'glucose', label: 'Glucose', code: 'GLU' }
      ], duplicateIds: ['cbc'] })
    };
    const controller = new HierarchyOrderController('Laboratory', repository);
    controller.dispatch({ type: 'searchRequested' });
    await tick();
    controller.dispatch({ type: 'nodeExpansionRequested', nodeId: 'chemistry', expanded: true });
    await tick();
    controller.dispatch({ type: 'itemAddRequested', nodeId: 'cbc' });
    await tick();
    controller.dispatch({ type: 'itemAddRequested', nodeId: 'cbc' });
    await tick();
    controller.dispatch({ type: 'groupPreviewRequested', nodeId: 'chemistry' });
    await tick();
    expect(controller.getSnapshot().preview?.duplicateIds).toEqual(['cbc']);
    controller.dispatch({ type: 'groupAddConfirmed', groupId: 'chemistry' });
    expect(controller.getSnapshot().selected.map(order => order.catalogueId)).toEqual(['cbc', 'glucose']);
  });

  it('uses the configured specialty kind and surfaces load failures', async () => {
    const repository = {
      roots: async () => [],
      children: async () => [],
      resolveItem: async () => ({ id: 'mri', catalogueId: 'mri', label: 'MRI', kind: 'radiology' as const }),
      previewGroup: async () => ({ groupId: 'g', groupLabel: 'G', items: [], duplicateIds: [] })
    };
    const controller = new HierarchyOrderController('Radiology', repository, undefined, 'radiology');
    controller.dispatch({ type: 'itemAddRequested', nodeId: 'mri' });
    await tick();
    expect(controller.getSnapshot().selected[0]?.kind).toBe('radiology');

    const failing = new HierarchyOrderController('Radiology', {
      ...repository,
      roots: async () => { throw new Error('catalogue failed'); }
    });
    failing.dispatch({ type: 'searchRequested' });
    await tick();
    expect(failing.getSnapshot().error).toBe('catalogue failed');
  });
});

describe('FavouritesController', () => {
  const order: SelectedOrder = { id: 'o1', catalogueId: 'amox', label: 'Amoxicillin', kind: 'medication' };
  const initial: FavouriteEntry = { id: 'f1', name: 'Respiratory', kind: 'medication', orderTemplates: [order], updatedAt: '2026-01-01' };

  it('supports load, create/edit/save, delete, move, and apply issues', async () => {
    let entries = [initial];
    const calls: string[] = [];
    const repository = {
      list: async (kind: FavouriteKind) => entries.filter(entry => entry.kind === kind),
      save: async (entry: FavouriteEntry) => { calls.push('save'); entries = [entry]; return entry; },
      delete: async (id: string) => { calls.push(`delete:${id}`); entries = []; },
      move: async (id: string, direction: 'up' | 'down') => { calls.push(`move:${id}:${direction}`); },
      apply: async () => [{ catalogueId: 'missing', label: 'Unavailable medicine', reason: 'unavailable' as const }]
    };
    const controller = new FavouritesController(repository, { createId: () => 'new-id', now: () => '2026-02-02' });
    controller.dispatch({ type: 'opened' });
    await tick();
    expect(controller.getSnapshot().items).toHaveLength(1);
    controller.dispatch({ type: 'createRequested', kind: 'medication' });
    controller.dispatch({ type: 'editorNameChanged', name: '  New favourite  ' });
    controller.dispatch({ type: 'editorOrdersChanged', orders: [order] });
    controller.dispatch({ type: 'saveRequested' });
    await tick();
    await tick();
    expect(calls).toContain('save');
    expect(controller.getSnapshot().mode).toBe('list');
    controller.dispatch({ type: 'moveRequested', id: 'new-id', direction: 'down' });
    await tick();
    expect(calls).toContain('move:new-id:down');
    controller.dispatch({ type: 'applyRequested', id: 'new-id' });
    await tick();
    expect(controller.getSnapshot().mode).toBe('apply-result');
    expect(controller.getSnapshot().applyIssues?.[0].reason).toBe('unavailable');
    controller.dispatch({ type: 'deleteRequested', id: 'new-id' });
    await tick();
    expect(calls).toContain('delete:new-id');
    expect(controller.getSnapshot().items).toEqual([]);
  });

  it('validates an empty editor name and exposes repository errors', async () => {
    const controller = new FavouritesController({
      list: async () => [],
      save: async () => { throw new Error('save failed'); },
      delete: async () => undefined,
      move: async () => undefined,
      apply: async () => []
    }, { createId: () => 'id', now: () => 'now' });
    controller.dispatch({ type: 'createRequested', kind: 'combination' });
    controller.dispatch({ type: 'saveRequested' });
    expect(controller.getSnapshot().error).toBe('A favourite name is required.');
    controller.dispatch({ type: 'editorNameChanged', name: 'Combo' });
    controller.dispatch({ type: 'saveRequested' });
    await tick();
    expect(controller.getSnapshot().error).toBe('save failed');
  });
});
