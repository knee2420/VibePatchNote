/**
 * @file patchEngine.test.ts
 * @description ID 트리와 패치 엔진 단위 테스트
 *
 * "Workflowy 규칙" 묶음은 Workflowy 데스크톱 앱에서 실제로 시험해 확인한 동작을 그대로 옮긴 것이다.
 * (2026-10-14, tree_patch 로 같은 모양의 트리에 같은 요청을 보내 본 결과)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type FlatOutlineTree,
  type NodeId,
  type OutlineNode,
  type TreePatchRequest,
  ROOT_ID,
  applyPatch,
  checkTreeIntegrity,
  flatToTree,
  importTree,
  indentRequests,
  insertRequests,
  moveRequests,
  outdentRequests,
  projectTree,
  subtreeInput,
  treeToFlat,
  withFoldStateOf,
} from '../src/index.js';

const leaf = (id: string, extra: Partial<OutlineNode> = {}): OutlineNode => ({
  id,
  text: id,
  children: [],
  ...extra,
});
const branch = (id: string, children: OutlineNode[], extra: Partial<OutlineNode> = {}): OutlineNode => ({
  id,
  text: id,
  children,
  ...extra,
});

/** Workflowy 에서 시험한 것과 같은 모양: P > [A > [A1 > [A1a], A2], B, C] */
function probe(): FlatOutlineTree {
  return treeToFlat([
    branch('P', [branch('A', [branch('A1', [leaf('A1a')]), leaf('A2')]), leaf('B'), leaf('C')]),
  ]);
}

/** 트리를 "글자(자식들)" 꼴로 적는다. 글자를 보므로 새로 만든 노드도 알아볼 수 있다. */
function shape(tree: FlatOutlineTree, id: NodeId = ROOT_ID): string {
  const node = tree.nodes.get(id)!;
  const children = node.childIds.map((childId) => shape(tree, childId)).join(' ');
  const label = id === ROOT_ID ? '' : node.text;
  return children ? `${label}(${children})` : label;
}

/** 요청을 적용하고, 트리가 어긋나지 않았는지 매번 확인한다. */
function patch(tree: FlatOutlineTree, requests: TreePatchRequest[], now = 5000) {
  let counter = 0;
  const outcome = applyPatch(tree, requests, { now, generateId: () => `new-${++counter}` });
  assert.deepEqual(checkTreeIntegrity(outcome.tree), []);
  return outcome;
}

// ── 올리기·내리기 ──

test('중첩 트리를 올렸다가 내리면 받은 객체 그대로 돌아온다', () => {
  const original = [
    branch('a', [leaf('a1', { isCompleted: true, completedAt: 10 }), leaf('a2', { note: '노트' })], {
      isFolded: true,
    }),
    leaf('b', { nodeType: 'h1', viewMode: 'board', file: { target: 'x.pdf', options: { page: 2 } } }),
  ];
  const { tree, projection } = importTree(original);

  assert.equal(tree.nodes.size, 5); // 불릿 4 + 가상 뿌리
  assert.deepEqual(tree.nodes.get(ROOT_ID)!.childIds, ['a', 'b']);
  assert.equal(tree.nodes.get('a1')!.parentId, 'a');
  assert.deepEqual(checkTreeIntegrity(tree), []);

  assert.deepEqual(flatToTree(tree), original);
  const again = projectTree(tree, projection);
  assert.equal(again.roots, original);
  assert.equal(again.roots[0], original[0]);
});

test('스키마가 모르는 필드도 잃지 않고, 고친 노드는 id·text·children 순서로 내려 준다', () => {
  const original = [{ ...leaf('a'), color: 'red' } as OutlineNode, leaf('b')];
  const { tree } = patch(treeToFlat(original), [{ op: 'replace', id: 'a', text: '바뀜' }]);
  const [a] = flatToTree(tree);

  assert.equal((a as OutlineNode & { color?: string }).color, 'red');
  assert.deepEqual(Object.keys(a).slice(0, 3), ['id', 'text', 'children']);
});

test('파일에 같은 id 가 두 번 나오면 뒤쪽에 새 id 를 주고 내용은 지킨다', () => {
  const tree = treeToFlat([branch('dup', [leaf('dup', { text: '안쪽' })]), leaf(ROOT_ID, { text: '뿌리와 겹침' })]);

  assert.deepEqual(checkTreeIntegrity(tree), []);
  assert.equal(tree.nodes.size, 4);
  assert.equal(shape(tree), '(dup(안쪽) 뿌리와 겹침)');
});

test('고친 노드와 그 조상만 새 객체가 되고, 나머지 가지는 같은 객체로 내려온다', () => {
  const original = [branch('a', [leaf('a1')]), branch('b', [leaf('b1')])];
  const { tree, projection } = importTree(original);
  const { tree: next } = patch(tree, [{ op: 'replace', id: 'a1', text: '바뀜' }]);
  const after = projectTree(next, projection);

  assert.notEqual(after.roots, original);
  assert.notEqual(after.roots[0], original[0]);
  assert.equal(after.roots[0].children[0].text, '바뀜');
  assert.equal(after.roots[1], original[1]);
});

// ── Workflowy 규칙 ──

test('"안"에 삽입하면 맨 앞 자식이 되고, 하위째 한 번에 만들어진다', () => {
  const { tree, results } = patch(probe(), [
    {
      op: 'insert_after',
      targetId: 'P',
      inside: true,
      items: [{ text: 'N', children: [{ text: 'N1' }] }],
    },
  ]);

  assert.equal(shape(tree), '(P(N(N1) A(A1(A1a) A2) B C))');
  assert.deepEqual(results, [{ ok: true, createdIds: ['new-1'] }]);
  assert.equal(tree.nodes.get('new-1')!.createdAt, 5000);
});

test('뒤·앞 삽입은 기준 노드의 형제 자리에 준 순서대로 놓인다', () => {
  const { tree } = patch(probe(), [
    { op: 'insert_after', targetId: 'B', items: [{ text: 'D' }, { text: 'E' }] },
    { op: 'insert_before', targetId: 'B', items: [{ text: 'X' }] },
  ]);
  assert.equal(shape(tree), '(P(A(A1(A1a) A2) X B D E C))');
});

test('"안"으로 이동하면 맨 앞에, 준 순서대로 놓인다', () => {
  const first = patch(probe(), [{ op: 'move', ids: ['A2', 'B'], under: 'C', inside: true }]);
  assert.equal(shape(first.tree), '(P(A(A1(A1a)) C(A2 B)))');

  // 자식이 이미 있는 부모 안으로 옮겨도 맨 앞이다.
  const second = patch(first.tree, [{ op: 'move', ids: ['A1'], under: 'C' }]);
  assert.equal(shape(second.tree), '(P(A C(A1(A1a) A2 B)))');
});

test('형제로 이동하면 기준 노드 바로 뒤에, 문서 순서가 아니라 준 순서대로 놓인다', () => {
  const { tree } = patch(probe(), [{ op: 'move', ids: ['B', 'A2'], under: 'A', inside: false }]);
  assert.equal(shape(tree), '(P(A(A1(A1a)) B A2 C))');
});

test('자기 자신이나 자기 하위 밑으로 옮기면 아무 일도 없고, 결과는 성공이다', () => {
  const start = probe();
  const { tree, results } = patch(start, [
    { op: 'move', ids: ['A'], under: 'A1a', inside: true },
    { op: 'move', ids: ['A'], under: 'A', inside: true },
    { op: 'move', ids: ['A'], under: 'A', inside: false },
  ]);

  assert.equal(tree, start);
  assert.deepEqual(results, [{ ok: true }, { ok: true }, { ok: true }]);
});

test('부모와 자식을 함께 옮기면 각자 옮겨져 자식이 부모에서 빠져나온다', () => {
  const { tree } = patch(probe(), [{ op: 'move', ids: ['A', 'A1'], under: 'C', inside: true }]);
  assert.equal(shape(tree), '(P(B C(A(A2) A1(A1a))))');
});

test('묶음은 순서대로 실행되고, 하나가 실패해도 나머지는 적용된다', () => {
  const { tree, results } = patch(probe(), [
    { op: 'replace', id: 'B', text: 'B-바뀜' },
    { op: 'replace', id: '없음', text: 'x' },
    { op: 'replace', id: 'C', text: 'C-바뀜' },
  ]);

  assert.deepEqual(results, [{ ok: true }, { ok: false, error: "Can't find id: 없음" }, { ok: true }]);
  assert.equal(shape(tree), '(P(A(A1(A1a) A2) B-바뀜 C-바뀜))');
});

test('뒤 요청은 앞 요청의 결과를 이어받고, 묶음 안에서 생긴 순환도 막는다', () => {
  const { tree, results } = patch(probe(), [
    { op: 'move', ids: ['A2'], under: 'B' },
    { op: 'move', ids: ['B'], under: 'C' },
    { op: 'move', ids: ['C'], under: 'A2' }, // A2 는 이제 C 의 하위다
  ]);

  assert.equal(shape(tree), '(P(A(A1(A1a)) C(B(A2))))');
  assert.equal(results.every((result) => result.ok), true);
});

test('하위가 있는 노드는 허락 없이 지우지 않고, 허락하면 하위까지 표에서 사라진다', () => {
  const start = probe();
  const refused = patch(start, [{ op: 'delete', id: 'A1' }]);
  assert.equal(refused.tree, start);
  assert.deepEqual(refused.results, [{ ok: false, error: 'Target has children: A1' }]);

  const { tree, results } = patch(start, [
    { op: 'delete', id: 'A', recursively: true },
    { op: 'delete', id: '없음', recursively: true },
    { op: 'delete', id: 'B' },
    { op: 'replace', id: 'B', text: '지운 뒤' },
  ]);
  assert.equal(shape(tree), '(P(C))');
  assert.deepEqual(
    ['A', 'A1', 'A1a', 'A2', 'B'].filter((id) => tree.nodes.has(id)),
    []
  );
  assert.deepEqual(results, [
    { ok: true },
    { ok: false, error: "Can't find id: 없음" },
    { ok: true },
    { ok: false, error: "Can't find id: B" },
  ]);
});

test('이동은 옮긴 노드의 수정 시각만 바꾼다', () => {
  const start = treeToFlat([
    branch('from', [leaf('x', { updatedAt: 1 })], { updatedAt: 1 }),
    leaf('to', { updatedAt: 1 }),
  ]);
  const { tree } = patch(start, [{ op: 'move', ids: ['x'], under: 'to' }], 9000);

  assert.equal(tree.nodes.get('x')!.updatedAt, 9000);
  assert.equal(tree.nodes.get('from')!.updatedAt, 1);
  assert.equal(tree.nodes.get('to')!.updatedAt, 1);
});

test('완료는 시각으로 남고, 해제하면 시각이 지워진다', () => {
  const done = patch(probe(), [{ op: 'complete', id: 'B' }], 7000);
  assert.equal(done.tree.nodes.get('B')!.isCompleted, true);
  assert.equal(done.tree.nodes.get('B')!.completedAt, 7000);

  const undone = patch(done.tree, [{ op: 'uncomplete', id: 'B' }]);
  assert.equal(undone.tree.nodes.get('B')!.isCompleted, false);
  assert.equal('completedAt' in undone.tree.nodes.get('B')!, false);
});

test('가상 뿌리는 옮기거나 지우거나 옆에 넣을 수 없고, 안에는 넣을 수 있다', () => {
  const start = probe();
  const { tree, results } = patch(start, [
    { op: 'delete', id: ROOT_ID, recursively: true },
    { op: 'move', ids: [ROOT_ID], under: 'P' },
    { op: 'insert_after', targetId: ROOT_ID, items: [{ text: 'x' }] },
    { op: 'replace', id: ROOT_ID, text: 'x' },
    { op: 'insert_after', targetId: ROOT_ID, inside: true, items: [{ text: '맨 위' }] },
  ]);

  assert.deepEqual(
    results.map((result) => result.ok),
    [false, false, false, false, true]
  );
  assert.equal(shape(tree), '(맨 위 P(A(A1(A1a) A2) B C))');
});

// ── 바뀐 것이 없으면 같은 트리 ──

test('결과가 달라지지 않는 요청은 받은 트리를 그대로 돌려준다', () => {
  const start = patch(probe(), [{ op: 'complete', id: 'C' }]).tree;
  const { tree } = patch(start, [
    { op: 'replace', id: 'B', text: 'B' },
    { op: 'complete', id: 'C' },
    { op: 'uncomplete', id: 'B' },
    { op: 'set_note', id: 'B', note: '' },
    { op: 'set_fold', id: 'B', isFolded: false },
    { op: 'move', ids: ['A'], under: 'P', inside: true }, // 이미 맨 앞 자식
    { op: 'move', ids: ['B', 'C'], under: 'A', inside: false }, // 이미 그 자리, 그 순서
    { op: 'insert_after', targetId: 'B', items: [] },
    { op: 'move', ids: [], under: 'C' },
  ]);
  assert.equal(tree, start);
});

// ── 이 아웃라이너만의 필드 ──

test('파일을 붙이고 떼어도 다른 불릿은 그대로다', () => {
  const start = treeToFlat([branch('a', [leaf('a1', { text: '' })]), leaf('b')]);
  const attached = patch(start, [{ op: 'set_file', id: 'a1', file: { target: '자료/설계.pdf' } }]);

  assert.deepEqual(attached.tree.nodes.get('a1')!.file, { target: '자료/설계.pdf' });
  assert.equal(attached.tree.nodes.get('b'), start.nodes.get('b'));
  assert.equal(start.nodes.get('a1')!.file, undefined);

  const detached = patch(attached.tree, [{ op: 'set_file', id: 'a1' }]);
  assert.equal('file' in detached.tree.nodes.get('a1')!, false);
  assert.equal(patch(start, [{ op: 'set_file', id: '없음', file: { target: 'x.png' } }]).results[0].ok, false);
});

test('노트·종류·보기 방식을 고치고, 접기는 수정 시각을 바꾸지 않는다', () => {
  const start = treeToFlat([branch('a', [branch('a1', [leaf('a1a')])], { updatedAt: 1 })]);
  const { tree } = patch(start, [
    { op: 'set_note', id: 'a', note: '노트' },
    { op: 'set_node_type', id: 'a1', nodeType: 'todo' },
    { op: 'set_view_mode', id: 'a1', viewMode: 'board' },
  ]);
  assert.equal(tree.nodes.get('a')!.note, '노트');
  assert.equal(tree.nodes.get('a1')!.nodeType, 'todo');
  assert.equal(tree.nodes.get('a1')!.viewMode, 'board');

  const folded = patch(start, [{ op: 'set_fold', id: 'a', isFolded: true, deep: true }], 9000).tree;
  assert.equal(folded.nodes.get('a')!.isFolded, true);
  assert.equal(folded.nodes.get('a1')!.isFolded, true);
  assert.equal(folded.nodes.get('a1a')!.isFolded, undefined); // 하위가 없으면 접힘을 갖지 않는다
  assert.equal(folded.nodes.get('a')!.updatedAt, 1);
});

test('접힌 노드 안으로 넣거나 옮기면 펼쳐진다', () => {
  const start = treeToFlat([branch('a', [leaf('a1')], { isFolded: true }), leaf('b')]);
  assert.equal(patch(start, [{ op: 'move', ids: ['b'], under: 'a' }]).tree.nodes.get('a')!.isFolded, false);
  assert.equal(
    patch(start, [{ op: 'insert_after', targetId: 'a', inside: true, items: [{ text: 'n' }] }]).tree.nodes.get('a')!
      .isFolded,
    false
  );
});

test('예전 트리를 되살릴 때 지금의 접힘 상태를 옮겨 입힌다', () => {
  const old = treeToFlat([branch('a', [leaf('a1')]), branch('b', [leaf('b1')], { isFolded: true })]);
  const current = patch(old, [
    { op: 'set_fold', id: 'a', isFolded: true },
    { op: 'set_fold', id: 'b', isFolded: false },
    { op: 'replace', id: 'a1', text: '바뀜' },
  ]).tree;
  const restored = withFoldStateOf(old, current);

  assert.equal(restored.nodes.get('a')!.isFolded, true);
  assert.equal(restored.nodes.get('b')!.isFolded, false);
  assert.equal(restored.nodes.get('a1')!.text, 'a1');
  assert.equal(withFoldStateOf(old, old), old);
});

// ── 편집 동작을 요청으로 옮기기 ──

test('들여쓰기는 위 형제의 마지막 자식으로, 내어쓰기는 부모 바로 뒤로 간다', () => {
  const start = probe();
  const indented = patch(start, indentRequests(start, 'C')).tree;
  assert.equal(shape(indented), '(P(A(A1(A1a) A2) B(C)))');

  const indentedAgain = patch(start, indentRequests(start, 'B')).tree;
  assert.equal(shape(indentedAgain), '(P(A(A1(A1a) A2 B) C))');

  const outdented = patch(start, outdentRequests(start, 'A1')).tree;
  assert.equal(shape(outdented), '(P(A(A2) A1(A1a) B C))');

  assert.deepEqual(indentRequests(start, 'A'), []); // 위 형제가 없다
  assert.deepEqual(outdentRequests(start, 'P'), []); // 이미 맨 위 단계
});

test('놓을 자리 네 가지(위·아래·안 맨 앞·안 맨 끝)를 요청으로 옮긴다', () => {
  const start = probe();
  const moved = (ids: NodeId[], target: NodeId, position: Parameters<typeof moveRequests>[3]) =>
    shape(patch(start, moveRequests(start, ids, target, position)).tree);

  assert.equal(moved(['C'], 'A', 'before'), '(P(C A(A1(A1a) A2) B))');
  assert.equal(moved(['C'], 'B', 'before'), '(P(A(A1(A1a) A2) C B))');
  assert.equal(moved(['B'], 'C', 'before'), '(P(A(A1(A1a) A2) B C))'); // 이미 그 자리
  assert.equal(moved(['C'], 'A', 'after'), '(P(A(A1(A1a) A2) C B))');
  assert.equal(moved(['B', 'C'], 'A', 'inside'), '(P(A(A1(A1a) A2 B C)))');
  assert.equal(moved(['B', 'C'], 'A', 'inside-start'), '(P(A(B C A1(A1a) A2)))');
  assert.equal(moved(['A2'], 'A', 'inside'), '(P(A(A1(A1a) A2) B C))'); // 이미 맨 끝
  assert.equal(moved(['A1'], ROOT_ID, 'inside'), '(P(A(A2) B C) A1(A1a))');
  assert.equal(moved(['A1'], ROOT_ID, 'inside-start'), '(A1(A1a) P(A(A2) B C))');
});

test('새 노드를 놓을 자리 네 가지로 넣고, 하위째 복제할 입력을 만든다', () => {
  const start = probe();
  const inserted = (target: NodeId, position: Parameters<typeof insertRequests>[2]) =>
    shape(patch(start, insertRequests(start, target, position, [{ text: 'N' }])).tree);

  assert.equal(inserted('A', 'before'), '(P(N A(A1(A1a) A2) B C))');
  assert.equal(inserted('A', 'after'), '(P(A(A1(A1a) A2) N B C))');
  assert.equal(inserted('A', 'inside'), '(P(A(A1(A1a) A2 N) B C))');
  assert.equal(inserted('A', 'inside-start'), '(P(A(N A1(A1a) A2) B C))');
  assert.equal(inserted('B', 'inside'), '(P(A(A1(A1a) A2) B(N) C))');

  const copy = subtreeInput(start, 'A')!;
  const duplicated = patch(start, [{ op: 'insert_after', targetId: 'A', items: [copy] }]).tree;
  assert.equal(shape(duplicated), '(P(A(A1(A1a) A2) A(A1(A1a) A2) B C))');
  assert.equal('id' in copy, false);
});

// ── 어떤 요청이 와도 트리는 어긋나지 않는다 ──

test('무작위 요청 3000 개를 보내도 트리가 어긋나지 않고, 올리기·내리기가 맞는다', () => {
  let seed = 20261014;
  const random = (n: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };
  let counter = 0;
  const generateId = () => `r${++counter}`;
  let tree = probe();

  for (let step = 0; step < 3000; step++) {
    const ids = [...tree.nodes.keys()];
    const pick = () => ids[random(ids.length)];
    const kind = random(10);
    let request: TreePatchRequest;
    if (kind < 3) {
      request = { op: 'move', ids: [pick(), pick()], under: pick(), inside: random(2) === 0 };
    } else if (kind < 5) {
      request = {
        op: 'insert_after',
        targetId: pick(),
        inside: random(2) === 0,
        items: [{ text: `n${step}`, children: random(3) === 0 ? [{ text: `c${step}` }] : [] }],
      };
    } else if (kind < 6) {
      request = { op: 'insert_before', targetId: pick(), items: [{ text: `b${step}` }] };
    } else if (kind < 8) {
      request = { op: 'delete', id: pick(), recursively: random(3) === 0 };
    } else if (kind < 9) {
      request = { op: 'set_fold', id: pick(), isFolded: random(2) === 0, deep: random(2) === 0 };
    } else {
      request = { op: 'replace', id: pick(), text: `t${step}` };
    }

    tree = applyPatch(tree, [request], { now: step, generateId }).tree;
    const problems = checkTreeIntegrity(tree);
    assert.deepEqual(problems, [], `${step} 번째 요청 뒤: ${JSON.stringify(request)}`);
  }

  assert.equal(shape(treeToFlat(flatToTree(tree))), shape(tree));
});
