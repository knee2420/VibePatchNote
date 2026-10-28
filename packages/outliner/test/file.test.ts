/**
 * @file file.test.ts
 * @description 불릿에 딸린 파일: 주소 읽기와 글자 내보내기 단위 테스트 (붙이기·떼기는 patchEngine.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type OutlineNode,
  getTargetExtension,
  getTargetName,
  isWebTarget,
  toOutlineText,
} from '../src/index.js';

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
