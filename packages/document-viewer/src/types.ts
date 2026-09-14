import type { ComponentType } from 'react';

import type { ViewerLabels } from './labels';
import type { SegmentTypeDescriptor } from './segmentTypes';

/**
 * `[ymin, xmin, ymax, xmax]` 정규 좌표.
 *
 * 기준은 **페이지 하나**이고, 스케일 상한은 `DocumentViewerProps.coordinateScale`
 * 이다(기본 1000). 뷰어 컨테이너(패딩·페이지 간격·스크롤 포함) 기준으로 그리면
 * 어긋난다.
 */
export type SegmentBoxTuple = [number, number, number, number];

/**
 * 뷰어가 그릴 수 있는 최소한의 영역 정보.
 *
 * **호스트의 저장 스키마가 아니다.** 백엔드 DTO를 그대로 흘려보내지 말고 호스트
 * 경계에서 이 모양으로 바꿔 넘긴다. 그래야 백엔드 직렬화 규약(snake_case 등)이
 * 뷰어 계약을 끌고 다니지 않는다.
 */
export interface ViewerSegment {
  id: string;
  page: number;
  /** 호스트 도메인의 분류 식별자. 뷰어는 값의 목록을 강제하지 않는다. */
  type: string;
  label: string;
  box: SegmentBoxTuple;
  summary?: string;
}

/**
 * 강조의 성격.
 *
 * `primary` 는 지금 고른 것, `context` 는 그것이 **어디에 속하는지** 알려 주는
 * 배경이다. 둘을 같이 그려야 "고른 항목이 자기 영역 밖에 있다"는 상태가 눈에 보인다.
 */
export type ViewerHighlightVariant = 'primary' | 'context';

/** 페이지 위에 겹쳐 보여줄 강조 영역. */
export interface ViewerHighlight {
  id: string;
  page: number;
  box: SegmentBoxTuple;
  label?: string;
  number?: number;
  variant?: ViewerHighlightVariant;
}

/** 모든 뷰어가 공통으로 받는 표시 전용 계약. */
export interface DocumentViewBaseProps {
  url: string;
  title: string;
  isSpread?: boolean;
  /**
   * 원본 위에 표시할 강조 영역들 (없으면 표시하지 않음).
   *
   * 여러 개를 받는 이유는 **관계를 보여 주기 위해서**다. 고른 항목 하나만 그리면,
   * 그것이 자기 소속 영역에서 멀리 떨어져 있을 때 화면에 아무 단서가 없다.
   */
  highlights?: ViewerHighlight[];
  /**
   * 호스트가 쓰는 좌표 상한. 기본 1000.
   * 0~1 정규 좌표를 쓰는 호스트는 `1` 을 넘기면 된다.
   */
  coordinateScale?: number;
  /** 표시 문구. 넘긴 항목만 덮어쓰고 나머지는 영어 기본값을 쓴다. */
  labels?: Partial<ViewerLabels>;
  onPageCountChange?: (count: number) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number; aspectRatio: number }) => void;
}

/**
 * 세그먼트 오버레이 계약.
 *
 * 표시와 분리해 둔다. 세그먼트를 다루지 않는 뷰어(이미지·iframe 대체 뷰어)는
 * 이 계약을 구현할 이유가 없고, 호스트도 오버레이만 따로 조합할 수 있다.
 */
export interface SegmentOverlayProps {
  segments?: ViewerSegment[];
  selectedSegmentId?: string | null;
  /**
   * 병합 후보. 선택과 **다른 상태**다.
   *
   * 고른 순서가 화면에 번호로 보이므로 배열 순서에 의미가 있다.
   */
  mergeCandidateIds?: string[];
  /** 지금 병합하면 고르지 않았어도 영역에 들어와 함께 사라지는 세그먼트. */
  absorbedSegmentIds?: string[];
  /** 병합하면 만들어질 영역. 실행 전에 보여 준다. */
  mergePreviewBox?: SegmentBoxTuple | null;
  onToggleMergeCandidate?: (segmentId: string) => void;
  /** 호스트 도메인의 타입 어휘. 생략하면 패키지 기본 어휘를 쓴다. */
  segmentTypes?: readonly SegmentTypeDescriptor[];
  isEditMode?: boolean;
  enableSmartSnap?: boolean;
  onUpdateSegment?: (updated: ViewerSegment) => void;
  onCreateSegment?: (created: ViewerSegment) => void;
  onDeleteSegment?: (segmentId: string) => void;
  /** 현재 세그먼트를 가로 또는 세로 기준으로 두 개의 독립 세그먼트로 나눕니다. */
  /**
   * 세그먼트를 둘로 나눈다.
   *
   * `position` 은 축 방향의 정규 좌표다. 넘기지 않으면 박스의 정중앙에서 나뉜다 —
   * 내용과 무관한 자리라 대개 원하는 결과가 아니므로, 화면에서 자리를 고르게 하는
   * 편이 낫다.
   */
  onSplitSegment?: (
    segmentId: string,
    axis: 'horizontal' | 'vertical',
    position?: number
  ) => void;
  onSelectSegment?: (segment: ViewerSegment) => void;
}

export interface DocumentViewerProps extends DocumentViewBaseProps, SegmentOverlayProps {}

export interface ViewerDefinition {
  id: string;
  canSpread: boolean; // 가로 펼치기(Spread) 지원 여부
  component: ComponentType<DocumentViewerProps>;
}
