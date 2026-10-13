/**
 * @file patch.ts
 * @description 패치 엔진 — ID 트리를 바꾸는 유일한 길 (Workflowy 의 tree_patch 와 같은 규칙)
 *
 * 규칙 (Workflowy 에서 실제로 확인한 동작을 그대로 따른다)
 * - 요청은 순서대로 실행하고, 뒤 요청은 앞 요청의 결과를 이어받는다.
 * - 요청은 서로 독립이다. 하나가 실패해도 나머지는 적용되고, 결과는 요청마다 따로 돌려준다.
 * - "안"에 넣는 삽입·이동은 맨 앞 자식 자리에 놓는다. 여러 개는 준 순서 그대로 놓인다.
 * - 자기 자신이나 자기 하위 밑으로 옮기려는 노드는 건너뛴다. (아무 일도 없고, 결과는 성공이다)
 * - 부모와 자식을 함께 옮기면 각자 따로 옮겨져 자식이 부모에서 빠져나온다.
 * - 하위가 있는 노드는 `recursively` 없이는 삭제하지 않는다.
 * - 이동은 옮긴 노드의 수정 시각만 바꾼다. 옛 부모·새 부모는 건드리지 않는다.
 * - 새 노드의 id 는 엔진이 만든다.
 *
 * 부모·자식 연결(parentId, childIds)은 이 파일의 `detach` / `attach` 두 곳에서만 고친다.
 * 바뀐 것이 없으면 받은 트리를 그대로(같은 객체) 돌려준다.
 */

import { ROOT_ID, collectSubtreeIds, isInSubtree } from '../model/flatTree';
import { generateNodeId } from '../model/id';
import type {
  FlatNode,
  FlatNodeInput,
  FlatOutlineTree,
  NodeId,
  TreePatchOutcome,
  TreePatchRequest,
  TreePatchResult,
} from '../model/types';

export interface ApplyPatchOptions {
  /** 수정 시각으로 쓸 값 (시험용). 없으면 지금 시각 */
  now?: number;
  /** 새 노드 id 발급기 (시험용) */
  generateId?: () => NodeId;
}

const OK: TreePatchResult = { ok: true };
const notFound = (id: NodeId): TreePatchResult => ({ ok: false, error: `Can't find id: ${id}` });
const fail = (error: string): TreePatchResult => ({ ok: false, error });

/** 고치는 동안의 트리. 처음 고칠 때에만 노드 표를 복사한다. */
class Draft {
  private nodes: Map<NodeId, FlatNode> | null = null;
  private readonly base: FlatOutlineTree;
  readonly now: number;
  readonly newId: () => NodeId;

  constructor(base: FlatOutlineTree, now: number, newId: () => NodeId) {
    this.base = base;
    this.now = now;
    this.newId = newId;
  }

  get(id: NodeId): FlatNode | undefined {
    return (this.nodes ?? this.base.nodes).get(id);
  }

  /** 불릿을 찾는다. 가상 뿌리는 불릿이 아니다. */
  bullet(id: NodeId): FlatNode | undefined {
    return id === ROOT_ID ? undefined : this.get(id);
  }

  set(node: FlatNode): void {
    this.nodes ??= new Map(this.base.nodes);
    this.nodes.set(node.id, node);
  }

  remove(id: NodeId): void {
    this.nodes ??= new Map(this.base.nodes);
    this.nodes.delete(id);
  }

  view(): FlatOutlineTree {
    return this.nodes ? { nodes: this.nodes } : this.base;
  }

  // ── 연결을 고치는 유일한 두 곳 ──

  /** 노드들을 지금 부모의 자식 목록에서 뗀다. (노드의 parentId 는 `attach` 가 새로 적는다) */
  detach(ids: NodeId[]): void {
    const byParent = new Map<NodeId, Set<NodeId>>();
    for (const id of ids) {
      const parentId = this.get(id)?.parentId;
      if (parentId == null) continue;
      const group = byParent.get(parentId) ?? new Set<NodeId>();
      group.add(id);
      byParent.set(parentId, group);
    }
    for (const [parentId, group] of byParent) {
      const parent = this.get(parentId);
      if (!parent) continue;
      this.set({ ...parent, childIds: parent.childIds.filter((id) => !group.has(id)) });
    }
  }

  /**
   * 떼어 둔(또는 새로 만든) 노드들을 부모의 자식 목록 `index` 자리에 순서대로 단다.
   * `touch` 면 단 노드의 수정 시각을 지금으로 바꾼다. 부모의 수정 시각은 바꾸지 않는다.
   */
  attach(ids: NodeId[], parentId: NodeId, index: number, touch: boolean): void {
    const parent = this.get(parentId);
    if (!parent) return;
    const childIds = [...parent.childIds];
    childIds.splice(index, 0, ...ids);
    this.set({ ...parent, childIds });
    for (const id of ids) {
      const node = this.get(id);
      if (!node) continue;
      this.set(touch ? { ...node, parentId, updatedAt: this.now } : { ...node, parentId });
    }
  }

  /** 안으로 넣은 것이 보이도록 펼친다. 접힘은 화면 상태라 수정 시각을 바꾸지 않는다. */
  unfold(id: NodeId): void {
    const node = this.bullet(id);
    if (node?.isFolded) this.set({ ...node, isFolded: false });
  }
}

/** 새 노드들을 하위째 만들어 표에 올리고, 맨 위 단계의 id 를 돌려준다. (부모에 다는 것은 `attach` 가 한다) */
function materialize(draft: Draft, items: FlatNodeInput[], parentId: NodeId): NodeId[] {
  return items.map((item) => {
    const id = draft.newId();
    const data: Partial<FlatNodeInput> & { id?: unknown } = { ...item };
    delete data.children;
    delete data.id;
    draft.set({
      ...(data as Omit<FlatNodeInput, 'children'>),
      id,
      parentId,
      childIds: materialize(draft, item.children ?? [], id),
      createdAt: draft.now,
      updatedAt: draft.now,
    });
    return id;
  });
}

/** 노드 하나의 필드를 고친다. `change` 가 같은 객체를 돌려주면 바뀐 것이 없다는 뜻이다. */
function edit(
  draft: Draft,
  id: NodeId,
  change: (node: FlatNode) => FlatNode,
  touch = true
): TreePatchResult {
  const node = draft.bullet(id);
  if (!node) return notFound(id);
  const next = change(node);
  if (next !== node) draft.set(touch ? { ...next, updatedAt: draft.now } : next);
  return OK;
}

function insert(
  draft: Draft,
  targetId: NodeId,
  items: FlatNodeInput[],
  place: 'after' | 'before' | 'inside'
): TreePatchResult {
  const target = draft.get(targetId);
  if (!target) return notFound(targetId);
  if (place !== 'inside' && target.parentId === null) return fail("Can't insert next to root");
  if (items.length === 0) return { ok: true, createdIds: [] };

  const parentId = place === 'inside' ? targetId : target.parentId!;
  const createdIds = materialize(draft, items, parentId);
  if (place === 'inside') {
    draft.attach(createdIds, parentId, 0, false);
    draft.unfold(parentId);
  } else {
    const index = draft.get(parentId)!.childIds.indexOf(targetId);
    draft.attach(createdIds, parentId, place === 'after' ? index + 1 : index, false);
  }
  return { ok: true, createdIds };
}

function move(draft: Draft, ids: NodeId[], under: NodeId, inside: boolean): TreePatchResult {
  const anchor = draft.get(under);
  if (!anchor) return notFound(under);
  if (!inside && anchor.parentId === null) return fail("Can't move next to root");
  for (const id of ids) {
    if (!draft.bullet(id)) return id === ROOT_ID ? fail("Can't move root") : notFound(id);
  }

  // 자기 자신이나 자기 하위 밑으로 가려는 노드는 건너뛴다.
  const tree = draft.view();
  const moving = [...new Set(ids)].filter((id) => !isInSubtree(tree, id, under));
  if (moving.length === 0) return OK;

  const parentId = inside ? under : anchor.parentId!;
  const movingSet = new Set(moving);
  const current = draft.get(parentId)!.childIds;
  const rest = current.filter((id) => !movingSet.has(id));
  const index = inside ? 0 : rest.indexOf(under) + 1;

  // 이미 그 자리에 그 순서로 있으면 아무것도 바꾸지 않는다.
  const alreadyThere =
    moving.every((id) => draft.get(id)!.parentId === parentId) &&
    current.length === rest.length + moving.length &&
    moving.every((id, i) => current[index + i] === id);
  if (!alreadyThere) {
    draft.detach(moving);
    draft.attach(moving, parentId, index, true);
  }
  if (inside) draft.unfold(under);
  return OK;
}

function remove(draft: Draft, id: NodeId, recursively: boolean): TreePatchResult {
  const node = draft.bullet(id);
  if (!node) return id === ROOT_ID ? fail("Can't delete root") : notFound(id);
  if (node.childIds.length > 0 && !recursively) return fail(`Target has children: ${id}`);

  const doomed = collectSubtreeIds(draft.view(), id);
  draft.detach([id]);
  for (const doomedId of doomed) draft.remove(doomedId);
  return OK;
}

function setFold(draft: Draft, id: NodeId, isFolded: boolean, deep: boolean): TreePatchResult {
  if (!draft.get(id) || (id === ROOT_ID && !deep)) return notFound(id);

  // 하위까지 한 번에: 하위가 있는 노드만 접힘을 갖는다.
  const targets = deep ? collectSubtreeIds(draft.view(), id) : [id];
  for (const targetId of targets) {
    const node = draft.bullet(targetId);
    if (!node || (deep && node.childIds.length === 0)) continue;
    if (!!node.isFolded !== isFolded) draft.set({ ...node, isFolded });
  }
  return OK;
}

/** 필드 하나를 정하거나(값이 있으면) 지운다(undefined 면). 바뀐 것이 없으면 받은 노드 그대로 돌려준다. */
function withField<K extends keyof FlatNode>(node: FlatNode, key: K, value: FlatNode[K] | undefined): FlatNode {
  if (node[key] === value) return node;
  const next = { ...node };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

function run(draft: Draft, request: TreePatchRequest): TreePatchResult {
  switch (request.op) {
    case 'replace':
      return edit(draft, request.id, (node) => withField(node, 'text', request.text));

    case 'complete':
      return edit(draft, request.id, (node) =>
        node.isCompleted ? node : { ...node, isCompleted: true, completedAt: draft.now }
      );

    case 'uncomplete':
      return edit(draft, request.id, (node) =>
        node.isCompleted ? withField({ ...node, isCompleted: false }, 'completedAt', undefined) : node
      );

    case 'insert_after':
      return insert(draft, request.targetId, request.items, request.inside ? 'inside' : 'after');

    case 'insert_before':
      return insert(draft, request.targetId, request.items, 'before');

    case 'move':
      return move(draft, request.ids, request.under, request.inside ?? true);

    case 'delete':
      return remove(draft, request.id, request.recursively ?? false);

    case 'set_note':
      return edit(draft, request.id, (node) => withField(node, 'note', request.note || undefined));

    case 'set_node_type':
      return edit(draft, request.id, (node) => withField(node, 'nodeType', request.nodeType));

    case 'set_file':
      return edit(draft, request.id, (node) => withField(node, 'file', request.file));

    case 'set_view_mode':
      return edit(draft, request.id, (node) => withField(node, 'viewMode', request.viewMode));

    case 'set_fold':
      return setFold(draft, request.id, request.isFolded, request.deep ?? false);
  }
}

/**
 * ID 트리에 요청들을 순서대로 적용한다.
 * 실패한 요청은 그 요청만 실패로 돌려주고, 나머지는 그대로 적용한다.
 */
export function applyPatch(
  tree: FlatOutlineTree,
  requests: TreePatchRequest[],
  options: ApplyPatchOptions = {}
): TreePatchOutcome {
  const draft = new Draft(tree, options.now ?? Date.now(), options.generateId ?? generateNodeId);
  const results = requests.map((request) => run(draft, request));
  return { tree: draft.view(), results };
}
