/**
 * @file parseOutlineToNodes.test.ts
 * @description 들여쓴 텍스트 및 Markdown 목록 파서 단위 테스트
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOutlineToNodes } from '../src/outline/views/text/parseOutlineToNodes';
import { toOutlineText } from '../src/outline/views/text/toOutlineText';

test('단일 라인 텍스트를 기본 bullet 노드로 파싱한다', () => {
  const nodes = parseOutlineToNodes('단일 노드 텍스트');
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].text, '단일 노드 텍스트');
  assert.equal(nodes[0].nodeType, 'bullet');
  assert.equal(nodes[0].children.length, 0);
});

test('들여쓰기 2칸 및 하위 계층 구조를 트리로 복원한다', () => {
  const text = `- 루트 1
  - 자식 1-1
    - 손자 1-1-1
  - 자식 1-2
- 루트 2`;

  const nodes = parseOutlineToNodes(text);
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].text, '루트 1');
  assert.equal(nodes[0].children.length, 2);
  assert.equal(nodes[0].children[0].text, '자식 1-1');
  assert.equal(nodes[0].children[0].children.length, 1);
  assert.equal(nodes[0].children[0].children[0].text, '손자 1-1-1');
  assert.equal(nodes[0].children[1].text, '자식 1-2');
  assert.equal(nodes[1].text, '루트 2');
});

test('체크박스 [ ] 와 [x] 를 todo 타입 및 isCompleted 로 파싱한다', () => {
  const text = `- [ ] 할 일 1
- [x] 완료된 일
- 일반 불릿`;

  const nodes = parseOutlineToNodes(text);
  assert.equal(nodes.length, 3);
  assert.equal(nodes[0].text, '할 일 1');
  assert.equal(nodes[0].nodeType, 'todo');
  assert.equal(nodes[0].isCompleted, false);

  assert.equal(nodes[1].text, '완료된 일');
  assert.equal(nodes[1].nodeType, 'todo');
  assert.equal(nodes[1].isCompleted, true);

  assert.equal(nodes[2].text, '일반 불릿');
  assert.equal(nodes[2].nodeType, 'bullet');
  assert.equal(nodes[2].isCompleted, undefined);
});

test('구분선 --- 을 divider 타입으로 파싱한다', () => {
  const text = `- 첫 번째 항목
- ---
- 세 번째 항목`;

  const nodes = parseOutlineToNodes(text);
  assert.equal(nodes.length, 3);
  assert.equal(nodes[1].nodeType, 'divider');
});

test('딸린 파일 ![[...]] 및 웹 주소를 file.target 으로 파싱한다', () => {
  const text = `- 로컬 파일 첨부 ![[도면.png]]
- 웹 주소 링크 https://example.com/spec`;

  const nodes = parseOutlineToNodes(text);
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].text, '로컬 파일 첨부');
  assert.equal(nodes[0].file?.target, '도면.png');

  assert.equal(nodes[1].text, '웹 주소 링크');
  assert.equal(nodes[1].file?.target, 'https://example.com/spec');
});

test('불릿 기호 없는 들여쓴 줄을 이전 노드의 부연 노트(note)로 병합한다', () => {
  const text = `- 본문 불릿
    첫 번째 부연 설명 줄
    두 번째 부연 설명 줄
- 다음 불릿`;

  const nodes = parseOutlineToNodes(text);
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].text, '본문 불릿');
  assert.equal(nodes[0].note, '첫 번째 부연 설명 줄\n두 번째 부연 설명 줄');
  assert.equal(nodes[1].text, '다음 불릿');
});

test('toOutlineText 와 parseOutlineToNodes 간의 왕복(Round-trip) 일관성을 유지한다', () => {
  const original = `- 부모 노드
  - [x] 자식 완료 항목
  - [ ] 자식 미완료 항목
    자식의 부연 설명
  - 자식 일반 ![[이미지.png]]`;

  const parsed = parseOutlineToNodes(original);
  const serialized = toOutlineText(parsed);
  const reparsed = parseOutlineToNodes(serialized);

  assert.equal(reparsed.length, 1);
  assert.equal(reparsed[0].text, '부모 노드');
  assert.equal(reparsed[0].children.length, 3);
  assert.equal(reparsed[0].children[0].text, '자식 완료 항목');
  assert.equal(reparsed[0].children[0].isCompleted, true);
  assert.equal(reparsed[0].children[1].text, '자식 미완료 항목');
  assert.equal(reparsed[0].children[1].isCompleted, false);
  assert.equal(reparsed[0].children[1].note, '자식의 부연 설명');
  assert.equal(reparsed[0].children[2].file?.target, '이미지.png');
});

test('JSON 노드 배열 문자열을 파싱할 때 새로운 ID를 발급하여 복제한다', () => {
  const sampleNodes = [
    {
      id: 'old-id-1',
      text: 'JSON 노드 1',
      children: [
        {
          id: 'old-id-2',
          text: 'JSON 자식',
          children: [],
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  const jsonStr = JSON.stringify(sampleNodes);
  const parsed = parseOutlineToNodes(jsonStr);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].text, 'JSON 노드 1');
  assert.notEqual(parsed[0].id, 'old-id-1');
  assert.equal(parsed[0].children.length, 1);
  assert.notEqual(parsed[0].children[0].id, 'old-id-2');
});
