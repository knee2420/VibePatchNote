/**
 * @file history.test.ts
 * @description 실행 취소·다시 실행이 일반 편집기처럼 느껴지는지 확인하는 테스트
 *
 * 기준: 사용자가 한 번 한 동작은 한 번에 되돌아간다. 바뀐 것이 없으면 기록하지 않는다.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { findNode } from '@vibe/outliner-core';
import { branch, createEditor, leaf } from './support';

test('되돌리고 다시 실행하면 트리가 그대로 오간다', () => {
  const editor = createEditor([leaf('a'), leaf('b')]);
  assert.equal(editor.act().canUndo(), false);

  editor.act().indent('b');
  editor.act().insertAfter('b', '새');
  assert.equal(editor.shape(), 'a(b 새)');

  assert.equal(editor.act().undo(), true);
  assert.equal(editor.shape(), 'a(b)');
  assert.equal(editor.act().undo(), true);
  assert.equal(editor.shape(), 'a b');
  assert.equal(editor.act().undo(), false);

  assert.equal(editor.act().redo(), true);
  assert.equal(editor.act().redo(), true);
  assert.equal(editor.shape(), 'a(b 새)');
  assert.equal(editor.act().canRedo(), false);
});

test('Enter 로 줄을 나눈 것은 한 번에 되돌아간다', () => {
  const editor = createEditor([leaf('a', { text: 'hello world' })]);

  const created = editor.act().splitNode('a', 'hello', ' world');
  assert.equal(editor.shape(), 'hello  world');
  assert.equal(editor.act().focusedNodeId, created);
  assert.equal(editor.commits(), 1);

  editor.act().undo();
  assert.equal(editor.shape(), 'hello world');
  assert.equal(editor.roots().length, 1);
  assert.equal(editor.act().canUndo(), false);
});

test('Backspace 로 줄을 합친 것은 한 번에 되돌아가고, 하위가 있는 줄은 합치지 않는다', () => {
  const editor = createEditor([leaf('a', { text: '앞' }), leaf('b', { text: '뒤' }), branch('c', [leaf('c1')])]);

  assert.equal(editor.act().joinWithPrevious('b', 'a', '앞뒤', 1), true);
  assert.equal(editor.shape(), '앞뒤 c(c1)');
  assert.equal(editor.act().focusedNodeId, 'a');
  assert.equal(editor.act().targetCaretOffset, 1);

  editor.act().undo();
  assert.equal(editor.shape(), '앞 뒤 c(c1)');
  assert.equal(editor.act().canUndo(), false);

  // 하위가 있는 불릿은 지우지 않는다. 윗줄의 글자도 건드리지 않는다.
  assert.equal(editor.act().joinWithPrevious('c', 'b', '뒤c', 1), false);
  assert.equal(editor.shape(), '앞 뒤 c(c1)');
  assert.equal(editor.act().canUndo(), false);
});

test('이어서 친 글자는 한 번에 되돌아간다', () => {
  const editor = createEditor([leaf('a', { text: '원래' })]);

  editor.act().updateText('a', '원래 ');
  editor.act().updateText('a', '원래 안');
  editor.act().updateText('a', '원래 안녕');

  editor.act().undo();
  assert.equal(editor.shape(), '원래');
  editor.act().redo();
  assert.equal(editor.shape(), '원래 안녕');
});

test('바뀐 것이 없는 동작은 기록하지 않고, 다시 실행도 지우지 않는다', () => {
  const editor = createEditor([leaf('a'), leaf('b')]);

  // 글자를 고치지 않고 포커스만 떠난 경우 (입력칸은 포커스를 잃을 때마다 글자를 저장한다)
  editor.act().updateText('a', 'a');
  editor.act().updateText('없는 불릿', 'x');
  editor.act().indent('a');
  editor.act().moveNodes(['a'], 'b', 'before');
  assert.equal(editor.act().canUndo(), false);
  assert.equal(editor.commits(), 0);

  editor.act().insertAfter('b', '새');
  editor.act().undo();
  editor.act().updateText('a', 'a'); // 되돌린 뒤 다른 불릿을 눌러 포커스가 떠났다
  assert.equal(editor.act().canRedo(), true);
  editor.act().redo();
  assert.equal(editor.shape(), 'a b 새');
});

test('접기·펼치기는 기록하지 않고, 되돌릴 때 지금 접어 둔 모양을 유지한다', () => {
  const editor = createEditor([branch('a', [leaf('a1')]), leaf('b')]);

  editor.act().toggleFold('a');
  assert.equal(editor.roots()[0].isFolded, true); // 파일에는 저장된다
  assert.equal(editor.act().canUndo(), false);

  editor.act().updateText('b', '바뀜');
  editor.act().toggleFold('a'); // 글자를 고친 뒤에 다시 펼쳐 두었다
  editor.act().undo();

  assert.equal(findNode(editor.roots(), 'b')!.text, 'b');
  assert.equal(editor.roots()[0].isFolded, false); // 글자만 되돌아가고, 펼쳐 둔 모양은 그대로다
  assert.equal(editor.act().canUndo(), false);

  editor.act().setFoldDeep('a', true);
  assert.equal(editor.roots()[0].isFolded, true);
  assert.equal(editor.act().canUndo(), false);
});

test('묶은 동작은 한 번에 되돌아가고, 호스트에는 한 번만 돌려준다', () => {
  const editor = createEditor([leaf('a')]);

  editor.act().batch((state) => {
    state.updateText('a', '고침');
    const first = state.appendChild('a', '하위 1');
    state.insertAfter(first!, '하위 2');
    state.setNote('a', '노트');
    state.setFocus('a', 0);
  });

  assert.equal(editor.shape(), '고침(하위 1 하위 2)');
  assert.equal(editor.roots()[0].note, '노트');
  assert.equal(editor.commits(), 1);
  assert.equal(editor.act().focusedNodeId, 'a'); // 묶음 안에서 마지막에 정한 화면 상태가 남는다

  editor.act().undo();
  assert.equal(editor.shape(), 'a');
  assert.equal(editor.roots()[0].note, undefined);
  assert.equal(editor.act().canUndo(), false);
});

test('여러 불릿 들여쓰기·붙여넣어 바꾸기도 한 번에 되돌아간다', () => {
  const editor = createEditor([leaf('a'), leaf('b'), leaf('c')]);

  editor.act().indentNodes(['b', 'c']);
  assert.equal(editor.shape(), 'a(b c)');
  editor.act().undo();
  assert.equal(editor.shape(), 'a b c');

  editor.act().replaceNodes(['b', 'c'], [branch('x', [leaf('x1')]), leaf('y')]);
  assert.equal(editor.shape(), 'a x(x1) y');
  editor.act().undo();
  assert.equal(editor.shape(), 'a b c');
  assert.equal(editor.act().canUndo(), false);
});

test('밖에서 파일이 바뀌면 기록을 비운다 (예전 트리로 덮어쓰지 않는다)', () => {
  const editor = createEditor([leaf('a')]);
  editor.act().insertAfter('a', '내가 넣음');
  assert.equal(editor.act().canUndo(), true);

  editor.replaceFromOutside([leaf('a'), leaf('다른 화면이 넣음')]);
  assert.equal(editor.act().canUndo(), false);
  assert.equal(editor.act().undo(), false);
  assert.equal(editor.shape(), 'a 다른 화면이 넣음');

  // 바뀐 트리 위에서 이어서 편집하고 되돌릴 수 있다.
  editor.act().insertAfter('a', '이어서');
  assert.equal(editor.shape(), 'a 이어서 다른 화면이 넣음');
  editor.act().undo();
  assert.equal(editor.shape(), 'a 다른 화면이 넣음');
});

test('되돌리면 포커스가 그 동작 직전으로 돌아가고, 캐럿은 바뀐 글자 끝에 놓인다', () => {
  const editor = createEditor([leaf('a', { text: 'hello' })]);
  editor.act().setFocus('a', 5);

  editor.act().updateText('a', 'hello world');
  editor.act().undo();
  assert.equal(editor.act().focusedNodeId, 'a');
  assert.equal(editor.act().targetCaretOffset, 5);

  editor.act().redo();
  assert.equal(editor.act().targetCaretOffset, 11);
});
