/**
 * @file editing.test.ts
 * @description 편집 액션이 패치 엔진을 거쳐 호스트의 트리를 바르게 바꾸는지 확인하는 테스트
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { checkTreeIntegrity, findNode } from '@vibe/outliner-core';
import { branch, createEditor, leaf } from './support';

/** P > [A > [A1 > [A1a], A2], B, C] */
const probe = () => [
  branch('P', [branch('A', [branch('A1', [leaf('A1a')]), leaf('A2')]), leaf('B'), leaf('C')]),
];

test('새 불릿: 바로 뒤, 마지막 자식, 보고 있는 범위의 끝', () => {
  const editor = createEditor(probe());

  const after = editor.act().insertAfter('A', '뒤');
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2) 뒤 B C)');
  assert.equal(editor.act().focusedNodeId, after);
  assert.equal(editor.act().targetCaretOffset, 0);

  editor.act().appendChild('A', '끝');
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2 끝) 뒤 B C)');

  editor.act().addBulletAtEnd();
  assert.equal(editor.roots().length, 2);

  editor.act().setZoom('B');
  editor.act().addBulletAtEnd();
  assert.equal(findNode(editor.roots(), 'B')!.children.length, 1);

  // 없는 불릿을 가리키면 맨 위 단계의 끝에 넣는다.
  editor.act().insertAfter('없음', '어디에도');
  assert.equal(editor.roots().at(-1)!.text, '어디에도');
});

test('들여쓰기·내어쓰기: 하나씩, 그리고 여러 개를 순서 그대로', () => {
  const editor = createEditor(probe());

  assert.equal(editor.act().indent('C'), true);
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2) B(C))');
  assert.equal(editor.act().indent('A'), false); // 위 형제가 없다

  assert.equal(editor.act().outdent('C'), true);
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2) B C)');
  assert.equal(editor.act().outdent('P'), false); // 이미 맨 위 단계

  assert.equal(editor.act().indentNodes(['B', 'C']), true);
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2 B C))');

  assert.equal(editor.act().outdentNodes(['B', 'C']), true);
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2) B C)');

  // 부모와 자식을 함께 골랐으면 부모만 옮기고 자식은 따라간다.
  assert.equal(editor.act().indentNodes(['B', 'A1', 'A1a']), true);
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2 B) C)');
});

test('접힌 불릿 안으로 들여 쓰면 펼쳐진다', () => {
  const editor = createEditor([branch('a', [leaf('a1')], { isFolded: true }), leaf('b')]);
  editor.act().indent('b');
  assert.equal(editor.shape(), 'a(a1 b)');
  assert.equal(editor.roots()[0].isFolded, false);
});

test('끌어 옮기기: 위·아래·안 맨 끝·안 맨 앞, 맨 위 단계, 그리고 막아야 하는 자리', () => {
  const moved = (ids: string[], target: string | null, position: 'before' | 'after' | 'inside' | 'inside-start') => {
    const editor = createEditor(probe());
    const ok = editor.act().moveNodes(ids, target, position);
    return `${ok ? '' : '실패 '}${editor.shape()}`;
  };

  assert.equal(moved(['C'], 'A', 'before'), 'P(C A(A1(A1a) A2) B)');
  assert.equal(moved(['C'], 'A', 'after'), 'P(A(A1(A1a) A2) C B)');
  assert.equal(moved(['B', 'C'], 'A', 'inside'), 'P(A(A1(A1a) A2 B C))');
  assert.equal(moved(['B', 'C'], 'A', 'inside-start'), 'P(A(B C A1(A1a) A2))');
  assert.equal(moved(['A1'], null, 'inside'), 'P(A(A2) B C) A1(A1a)');
  assert.equal(moved(['A1'], null, 'inside-start'), 'A1(A1a) P(A(A2) B C)');
  // 골라 둔 순서와 상관없이 문서 순서대로, 부모와 자식을 함께 골랐으면 부모만 옮긴다.
  assert.equal(moved(['C', 'A1a', 'A1'], 'B', 'after'), 'P(A(A2) B A1(A1a) C)');

  assert.equal(moved(['A'], 'A1a', 'inside'), '실패 P(A(A1(A1a) A2) B C)');
  assert.equal(moved(['A'], 'A', 'after'), '실패 P(A(A1(A1a) A2) B C)');
  assert.equal(moved(['A'], '없음', 'after'), '실패 P(A(A1(A1a) A2) B C)');
});

test('복제: 원본 바로 아래에 하위째, 새 id 로', () => {
  const editor = createEditor(probe());
  const created = editor.act().duplicateNodes(['A']);

  assert.equal(editor.shape(), 'P(A(A1(A1a) A2) A(A1(A1a) A2) B C)');
  assert.equal(created.length, 1);
  assert.notEqual(created[0], 'A');
  const ids = new Set<string>();
  const collect = (nodes: ReturnType<typeof editor.roots>) =>
    nodes.forEach((node) => {
      ids.add(node.id);
      collect(node.children);
    });
  collect(editor.roots());
  assert.equal(ids.size, 11);

  assert.equal(editor.act().duplicateNodesTo(['B'], 'C', 'inside'), true);
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2) A(A1(A1a) A2) B C(B))');
});

test('삭제: 고른 것은 하위째 지우고, 선택을 푼다', () => {
  const editor = createEditor(probe());
  editor.act().selectNodes(['A1', 'A1a', 'B']);

  assert.equal(editor.act().deleteNodes(['A1', 'A1a', 'B']), true);
  assert.equal(editor.shape(), 'P(A(A2) C)');
  assert.deepEqual(editor.act().selectedNodeIds, []);
  assert.equal(editor.act().deleteNodes(['없음']), false);

  assert.equal(editor.act().deleteNode('A'), true);
  assert.equal(editor.shape(), 'P(C)');
});

test('종류·보기 방식·완료·노트를 고친다', () => {
  const editor = createEditor(probe());
  const node = (id: string) => findNode(editor.roots(), id)!;

  editor.act().setNodesViewMode(['A'], 'board');
  editor.act().setNodesType(['A', 'B'], 'todo');
  assert.equal(node('A').nodeType, 'todo');
  assert.equal(node('A').viewMode, undefined); // 종류를 바꾸면 보드 지정은 풀린다
  assert.equal(node('B').nodeType, 'todo');

  editor.act().toggleCompleted('B');
  assert.equal(node('B').isCompleted, true);
  editor.act().setNodesCompleted(['B', 'C']); // 하나라도 미완료면 모두 완료
  assert.equal(node('C').isCompleted, true);
  editor.act().setNodesCompleted(['B', 'C']); // 모두 완료면 모두 미완료
  assert.equal(node('B').isCompleted, false);
  assert.equal(node('C').isCompleted, false);

  editor.act().setNote('B', '노트');
  assert.equal(node('B').note, '노트');
  editor.act().setNote('B', '');
  assert.equal('note' in node('B'), false);
});

test('파일 붙이기: 빈 불릿은 파일 불릿이 되고, 내용이 있는 불릿에는 하위로 들어간다', () => {
  const editor = createEditor([leaf('빈', { text: '' }), branch('글', [leaf('글1')], { isFolded: true })]);

  const onBlank = editor.act().attachFiles('빈', ['a.png', 'b.png']);
  assert.equal(onBlank.length, 2);
  assert.equal(onBlank[0], '빈');
  assert.deepEqual(
    editor.roots().map((node) => node.file?.target),
    ['a.png', 'b.png', undefined]
  );

  const onText = editor.act().attachFiles('글', ['c.pdf', 'd.pdf']);
  const parent = findNode(editor.roots(), '글')!;
  assert.deepEqual(
    parent.children.map((node) => node.file?.target),
    [undefined, 'c.pdf', 'd.pdf']
  );
  assert.equal(parent.isFolded, false);
  assert.deepEqual(
    onText,
    parent.children.slice(1).map((node) => node.id)
  );

  editor.act().detachFile('빈');
  assert.equal('file' in editor.roots()[0], false);
});

test('고치지 않은 가지는 호스트에 같은 객체로 돌아가고, 트리는 어긋나지 않는다', () => {
  const editor = createEditor([branch('a', [leaf('a1')]), branch('b', [leaf('b1')])]);
  const untouched = editor.roots()[1];

  editor.act().updateText('a1', '바뀜');
  assert.equal(editor.roots()[1], untouched);
  assert.notEqual(editor.roots()[0].children[0].text, 'a1');
  assert.deepEqual(checkTreeIntegrity(editor.act().getTree()), []);
});

test('패치 요청을 그대로 적용하면 요청마다 결과가 돌아온다', () => {
  const editor = createEditor(probe());
  const results = editor.act().applyPatch([
    { op: 'move', ids: ['B'], under: 'C' },
    { op: 'delete', id: 'A' }, // 하위가 있어 거부된다
    { op: 'replace', id: '없음', text: 'x' },
    { op: 'insert_after', targetId: 'C', inside: true, items: [{ text: '새' }] },
  ]);

  assert.deepEqual(
    results.map((result) => (result.ok ? 'ok' : result.error)),
    ['ok', 'Target has children: A', "Can't find id: 없음", 'ok']
  );
  assert.equal(editor.shape(), 'P(A(A1(A1a) A2) C(새 B))');
  assert.equal(editor.commits(), 1);
});
