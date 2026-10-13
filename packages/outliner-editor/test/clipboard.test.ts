/**
 * @file clipboard.test.ts
 * @description 복사한 글자를 다시 불릿으로 읽어 붙여 넣는 흐름 테스트
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOutlineToNodes, toOutlineText } from '@vibe/outliner-core';
import { branch, createEditor, leaf } from './support';

test('고른 불릿을 글자로 복사했다가 붙여 넣으면 계층이 유지된다', () => {
  const source = [branch('복사할 부모', [leaf('자식 A'), leaf('자식 B')])];

  const text = toOutlineText(source);
  assert.equal(text, '- 복사할 부모\n  - 자식 A\n  - 자식 B');

  const editor = createEditor([leaf('여기 뒤에')]);
  const created = editor.act().insertNodes('여기 뒤에', parseOutlineToNodes(text));

  assert.equal(editor.shape(), '여기 뒤에 복사할 부모(자식 A 자식 B)');
  assert.equal(created.length, 1);
  assert.equal(editor.act().focusedNodeId, created[0]);
});

test('붙여 넣은 불릿은 언제나 새 id 를 받아 기존 불릿과 겹치지 않는다', () => {
  const original = leaf('original-id', { text: '원본', nodeType: 'todo', isCompleted: true });
  const editor = createEditor([original]);

  // JSON 으로 복사된 불릿(원본과 같은 id 를 들고 있다)을 그대로 붙여 넣는다.
  const [created] = editor.act().insertNodes('original-id', parseOutlineToNodes(JSON.stringify([original])));

  assert.equal(editor.roots().length, 2);
  assert.equal(editor.roots()[0].id, 'original-id');
  assert.equal(editor.roots()[1].id, created);
  assert.notEqual(created, 'original-id');
  assert.equal(editor.roots()[1].text, '원본');
  assert.equal(editor.roots()[1].nodeType, 'todo');
  assert.equal(editor.roots()[1].isCompleted, true);
});

test('여러 불릿을 고른 채 붙여 넣으면 고른 것들이 붙여 넣은 것으로 바뀐다', () => {
  const editor = createEditor([leaf('a'), branch('b', [leaf('b1')]), leaf('c'), leaf('d')]);

  editor.act().replaceNodes(['b', 'c'], parseOutlineToNodes('- 새 1\n- 새 2'));
  assert.equal(editor.shape(), 'a 새 1 새 2 d');

  editor.act().undo();
  assert.equal(editor.shape(), 'a b(b1) c d');
});
