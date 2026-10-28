/**
 * @file defaults.ts
 * @description 초기 빈 문서 및 샘플 문서 생성기 (데이터 규격 기본 팩토리)
 */

import { generateNodeId } from './id';
import type { OutlineDocument, OutlineNode } from './types';
import { OUTLINE_FORMAT_VERSION } from './version';

export function createEmptyDocument(title = '제목 없는 아웃라인'): OutlineDocument {
  const now = Date.now();
  const rootId = generateNodeId();
  return {
    version: OUTLINE_FORMAT_VERSION,
    id: generateNodeId(),
    title,
    rootNodes: [
      {
        id: rootId,
        text: '',
        children: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function createSampleDocument(): OutlineDocument {
  const now = Date.now();

  const c1: OutlineNode = {
    id: generateNodeId(),
    text: '120fps 키스트로크 손맛 (Enter, Tab, Shift+Tab)',
    children: [],
    createdAt: now,
    updatedAt: now,
  };

  const c2: OutlineNode = {
    id: generateNodeId(),
    text: '무한 줌인(Zoom-in) 및 빵가루 네비게이션',
    children: [],
    createdAt: now,
    updatedAt: now,
  };

  const root1: OutlineNode = {
    id: generateNodeId(),
    text: 'outline-builder 핵심 아키텍처 개요',
    children: [
      {
        id: generateNodeId(),
        text: 'Local-First 파일 시스템 직접 영속화 (Chrome File System API)',
        children: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateNodeId(),
        text: '불변 12자리 Node ID 기반 AST 관리',
        children: [c1, c2],
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const root2: OutlineNode = {
    id: generateNodeId(),
    text: '지식 자산화 및 멀티모달 딥링크 바인딩 (#scope)',
    children: [
      {
        id: generateNodeId(),
        text: '불릿 하위 원본 복사 배제, 오직 포인터 체결로 데이터 오염 0%',
        children: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  return {
    version: OUTLINE_FORMAT_VERSION,
    id: generateNodeId(),
    title: 'outline-builder 퀵스타트 가이드',
    rootNodes: [root1, root2],
    createdAt: now,
    updatedAt: now,
  };
}
