/**
 * 세그먼트 애그리거트의 단일 호출 지점.
 *
 * 예전에는 이 호출들이 `referenceDocumentApi` 안에 섞여 있었다. 세그먼트는 문서와
 * 별개의 백엔드 도메인(`/api/v1/segments`)이므로 접근 지점도 분리한다.
 */
import { httpClient } from '@/shared/api';

import type {
  RelationshipTargetKind,
  SegmentArtifactResponse,
  SegmentStructureResponse,
} from '../model/types';
import type { DocumentSegmentItem } from '../model/types';

const BASE_PATH = '/api/v1/segments';

export const segmentApi = {
  // --- 읽기 (LLM 미개입) ---

  /** 채택된 세그먼트를 읽습니다. 아직 없으면 빈 목록을 받습니다. */
  getSegments: (docId: string) => httpClient.get<SegmentArtifactResponse>(`${BASE_PATH}/${docId}`),

  /** 세그먼트 중심 구조 뷰(아웃라인 element 매핑 포함). */
  getStructure: (docId: string) =>
    httpClient.get<SegmentStructureResponse>(`${BASE_PATH}/${docId}/structure`),

  // --- 쓰기 ---

  /** 사용자가 손으로 고친 세그먼트를 새 아티팩트로 남깁니다. */
  saveSegments: (docId: string, baseArtifactId: string | null, segments: DocumentSegmentItem[]) =>
    httpClient.put<SegmentArtifactResponse>(`${BASE_PATH}/${docId}`, { baseArtifactId, segments }),

  /** 사람이 확정한 포함 관계를 남깁니다. `null` 은 소속 해제입니다. */
  setRelationship: (
    docId: string,
    targetKind: RelationshipTargetKind,
    targetId: string,
    primarySegmentId: string | null
  ) =>
    httpClient.put(`${BASE_PATH}/${docId}/relationships`, {
      targetKind,
      targetId,
      primarySegmentId,
    }),

  /**
   * 사람이 정한 관계를 지우고 **자동 분석 결과로 되돌립니다.**
   *
   * 소속 해제(`setRelationship(..., null)`)와 다르다. 해제는 "어디에도 속하지
   * 않는다"는 사람의 결정이고, 이것은 그 결정 자체를 취소하는 것이다.
   */
  resetRelationship: (docId: string, targetKind: RelationshipTargetKind, targetId: string) =>
    httpClient.delete<void>(
      `${BASE_PATH}/${docId}/relationships/${targetKind}/${encodeURIComponent(targetId)}`
    ),

  // --- 실행 (Agent 경로) ---

  /** 세그먼트 분석을 백그라운드 실행으로 접수합니다. */
  startScan: (docId: string) =>
    httpClient.post<{ runId: string; status: string }>(`${BASE_PATH}/runs`, { docId }),
};
