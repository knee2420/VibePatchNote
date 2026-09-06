import type { Node } from '@xyflow/react';
import type { NodeTheme } from '@/shared/model';

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

export interface ScaffoldDocumentData extends Record<string, unknown> {
  id: string;
  title: string;
  sourceNodeId?: string;
  sourcePdfFileName?: string;
  htmlContent: string;
  markdownContent: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  theme?: NodeTheme;
  status?: ScaffoldStatus;
  progressStep?: number;
  progressMessage?: string;
  errorMessage?: string;
  slots?: Array<{
    id: string;
    number: number;
    label: string;
    box_2d: [number, number, number, number];
    pageNumber?: number;
  }>;
  width?: number;
  height?: number;
}


export type ScaffoldDocumentNode = Node<ScaffoldDocumentData, typeof SCAFFOLD_DOCUMENT_NODE_TYPE>;
