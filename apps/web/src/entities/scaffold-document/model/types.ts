import type { Node } from '@xyflow/react';
import type { NodeTheme } from '@/shared/model';
import type { AgentRunExecution } from '@/shared/api';

/**
 * 스캐폴딩 문서 노드 타입 상수 (SSOT).
 * 헌법 §4 P5: 문자열 리터럴 하드코딩 금지.
 */
export const SCAFFOLD_DOCUMENT_NODE_TYPE = 'scaffoldDocument' as const;

/**
 * 스캐폴딩 문서 카드의 기본 크기(px).
 * 원본 참고 문서 카드와 동급(= 동등한 크기)으로 단일 출처를 유지합니다.
 */
export const SCAFFOLD_CARD_SIZE = { width: 600, height: 800 } as const;

export type ScaffoldStatus = 'generating' | 'completed' | 'error';

/** 서식 슬롯 하나와 원본 문서에서의 실측 위치. 엔진 계약을 그대로 따릅니다. */
export interface ScaffoldSlot {
  id: string;
  number: number;
  label: string;
  box_2d: [number, number, number, number];
  pageNumber?: number;
}

/** 백엔드 아카이브 요약 메타. `GET /api/v1/scaffolds` 응답 항목과 1:1 대응합니다. */
export interface ScaffoldArchiveMeta {
  scaffoldId: string;
  title: string;
  sourcePdfFileName: string;
  createdAt: string;
  slotsCount: number;
  difficulty: string;
  /** 엔진이 부여한 원본 식별자와 판정 메타. 아카이브가 함께 보존한다. */
  engineScaffoldId?: string;
  targetDoc?: string;
  description?: string;
  /** 아카이빙된 원본 페이지 번호(1-based). */
  pageNumber?: number;
  /** 사용자 편집 저장 횟수. 0이면 엔진 원본 그대로. */
  revision?: number;
  updatedAt?: string;
  overlayImageUrl: string;
  originalImageUrl: string;
  promptSpecUrl: string;
  htmlUrl: string;
  /** 엔진 원문 마크다운(content.md) URL. 명세서(promptSpecUrl)와 다른 파일이다. */
  markdownUrl: string;
  /** 사용자 편집 작업본(render.html) URL. */
  renderUrl?: string;
  /** 재구성본 화면 스냅샷(vision/render_p1.png) URL. */
  renderImageUrl?: string;
  hasRenderImage?: boolean;
  slotsUrl: string;
  archiveDir: string;
}

/**
 * 스캐폴딩 문서 노드 데이터.
 *
 * 본문(`htmlContent`/`markdownContent`/`slots`)의 SSOT 는 백엔드 아카이브다.
 * 노드는 `scaffoldId` 포인터만 영속화하고, 본문은 마운트 시 아카이브에서 하이드레이션한
 * **메모리 캐시**로만 들고 있는다. 아카이브가 없던 구(舊) 노드는 본문이 그대로
 * 세션에 남아 있으므로, 그 경우에 한해 이 값이 유일한 출처가 된다.
 */
export interface ScaffoldDocumentData extends Record<string, unknown> {
  id: string;
  title: string;
  sourceNodeId?: string;
  sourcePdfFileName?: string;
  /** 아카이브 포인터. 이 값이 있으면 본문은 저장되지 않고 아카이브에서 복원된다. */
  scaffoldId?: string;
  /**
   * 가리키던 보관본이 존재하지 않음(404)이 확인된 노드.
   *
   * 아카이빙이 실패했던 시절의 노드가 여기 해당한다. 이 표식이 있으면 다시 조회하지
   * 않는다. 없는 것을 매번 물어보면 새로고침할 때마다 404 가 찍힐 뿐이다.
   */
  archiveMissing?: boolean;
  htmlContent: string;
  markdownContent: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  theme?: NodeTheme;
  status?: ScaffoldStatus;
  progressStep?: number;
  progressMessage?: string;
  execution?: AgentRunExecution | null;
  runId?: string;
  errorMessage?: string;
  slots?: ScaffoldSlot[];
  archive?: ScaffoldArchiveMeta;
  width?: number;
  height?: number;
}


export type ScaffoldDocumentNode = Node<ScaffoldDocumentData, typeof SCAFFOLD_DOCUMENT_NODE_TYPE>;
