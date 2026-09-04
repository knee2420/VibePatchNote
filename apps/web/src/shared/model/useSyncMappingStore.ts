import { create } from 'zustand';

export interface ActiveSyncMapping {
  /** 매핑 식별자 (예: 'slot-1', 'slot-2', 'logo', 'billing' 등) */
  id: string;
  /** 매핑 번호 (#1, #2, #3...) */
  number: number;
  /** 라벨 (예: '상호 / 로고명', '수신자 회사/단체명') */
  label: string;
  /** 0~1000 정규화 2D 바운딩 박스 [ymin, xmin, ymax, xmax] */
  box_2d: [number, number, number, number];
  /** PDF 페이지 번호 (기본 1) */
  page?: number;
  /** 매핑 대상이 되는 특정 원본 참고 문서 노드 ID */
  targetNodeId?: string;
  /** 매핑 대상이 되는 원본 참고 문서 파일명 */
  sourcePdfFileName?: string;
  /** 이벤트 발신처 */
  source?: 'slot' | 'reference';
}

interface SyncMappingState {
  activeMapping: ActiveSyncMapping | null;
  setActiveMapping: (mapping: ActiveSyncMapping | null) => void;
  clearActiveMapping: () => void;
}

/**
 * useSyncMappingStore (Shared Model)
 *
 * 피그마/노션 AI 스타일의 양방향 동기화 컬러 태깅(Color Sync Matching) 전역 스토어.
 * 우측 Tiptap 슬롯과 좌측 참고 문서의 원본 바운더리 영역을 동일한 컬러와 번호 뱃지(#1, #2...)로 연결합니다.
 */
export const useSyncMappingStore = create<SyncMappingState>((set) => ({
  activeMapping: null,
  setActiveMapping: (mapping) => set({ activeMapping: mapping }),
  clearActiveMapping: () => set({ activeMapping: null }),
}));
