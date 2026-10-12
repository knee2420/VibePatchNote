/**
 * @file file.test.ts
 * @description 불릿에 딸린 파일: 붙이기·떼기·고치기와 주소 읽기 단위 테스트
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type OutlineNode,
  getTargetExtension,
  getTargetName,
  isWebTarget,
  setNodeFile,
  toOutlineText,
  updateNodeFile,
} from '../src/index.js';

function tree(): OutlineNode[] {
  return [
    { id: 'a', text: '첫째', children: [{ id: 'a1', text: '', children: [] }] },
    { id: 'b', text: '둘째', children: [] },
  ];
}

test('파일을 붙이고 떼어도 다른 불릿은 그대로다', () => {
  const before = tree();
  const attached = setNodeFile(before, 'a1', { target: '자료/설계.pdf' });

  assert.ok(attached.success);
  assert.deepEqual(attached.newNodes[0].children[0].file, { target: '자료/설계.pdf' });
  assert.equal(attached.newNodes[1], before[1]);
  assert.equal(before[0].children[0].file, undefined);

  const detached = setNodeFile(attached.newNodes, 'a1', null);
  assert.ok(detached.success);
  assert.equal('file' in detached.newNodes[0].children[0], false);
});

test('없는 불릿이나 파일이 없는 불릿은 고치지 않는다', () => {
  assert.equal(setNodeFile(tree(), '없음', { target: 'x.png' }).success, false);
  assert.equal(updateNodeFile(tree(), 'b', { options: { page: 3 } }).success, false);
});

test('종류별 옵션만 고치고, undefined 로 넘기면 옵션을 지운다', () => {
  const start = setNodeFile(tree(), 'b', { target: 'x.pdf' }).newNodes;

  const paged = updateNodeFile(start, 'b', { options: { page: 3 } });
  assert.deepEqual(paged.newNodes[1].file, { target: 'x.pdf', options: { page: 3 } });

  const reset = updateNodeFile(paged.newNodes, 'b', { options: undefined });
  assert.deepEqual(reset.newNodes[1].file, { target: 'x.pdf' });
});

test('주소에서 종류를 가릴 확장자와 보일 이름을 읽는다', () => {
  assert.equal(getTargetExtension('자료/설계.PDF#page=3'), 'pdf');
  assert.equal(getTargetExtension('이름만'), '');
  assert.equal(getTargetExtension('https://example.com/a/b.png?size=2'), 'png');
  assert.equal(getTargetName('자료/설계.pdf#page=3'), '설계.pdf');
  assert.equal(getTargetName('https://example.com/spec/'), 'example.com/spec');
  assert.equal(isWebTarget('HTTPS://example.com'), true);
  assert.equal(isWebTarget('자료/http.md'), false);
});

test('글자로 내보낼 때 딸린 파일은 임베드로, 웹 주소는 주소 그대로 붙는다', () => {
  const nodes: OutlineNode[] = [
    { id: 'a', text: '구조도', children: [], file: { target: '자료/설계.pdf' } },
    { id: 'b', text: '', children: [], file: { target: 'https://example.com' } },
  ];
  assert.equal(toOutlineText(nodes), '- 구조도 ![[자료/설계.pdf]]\n- https://example.com');
});
