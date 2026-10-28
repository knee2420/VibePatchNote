import type { ReactNode } from 'react';

export type ActivityBarSide = 'left' | 'right';
export type ActivityBarItemVariant = 'line' | 'rounded';

/** 액티비티 바 개별 탭 설정 인터페이스 (Stateful View Container용) */
export interface ActivityBarItemConfig<T extends string = string> {
  id: T;
  label: string;
  icon: ReactNode;
  badge?: string | number | 'dot';
}

/** [Primitive] 개별 탭 버튼 부품 Props */
export interface IdeActivityBarItemProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  side?: ActivityBarSide;
  variant?: ActivityBarItemVariant;
  badge?: string | number | 'dot';
  onClick?: () => void;
  className?: string;
}

/** [Primitive] 하단 시스템 액션 버튼 부품 Props (Stateless Action Trigger) */
export interface IdeActivityBarActionProps {
  icon: ReactNode;
  title: string;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
}

/** [Composite] 완제품 IdeActivityBar Props */
export interface IdeActivityBarProps<T extends string = string> {
  /** 도킹 위치 (기본값: 'left') */
  side?: ActivityBarSide;
  /** 탭 버튼 스타일 변형 (기본값: 'line') */
  itemVariant?: ActivityBarItemVariant;
  /** 현재 활성화된 탭 ID (닫힘 상태 지원 시 null 허용) */
  activeTab: T | null;
  /** 탭 선택 콜백 (동일 탭 클릭 및 allowDeselect 활성화 시 null 전달 가능) */
  onSelectTab: (tab: T | null) => void;
  /** 이미 활성화된 탭 클릭 시 선택 해제(null 전달) 허용 여부 */
  allowDeselect?: boolean;
  /** 상단 탭 목록 (미지정 시 기본 7대 IDE 탭 자동 렌더링) */
  items?: ActivityBarItemConfig<T>[];
  /** 상단 커스텀 슬롯 (점수 서클, 프로필 아바타, 브랜드 엠블럼 등) */
  topSlot?: ReactNode;
  /** 하단 일회성 액션 영역 (계정, 설정, 패널 닫기 토글 등 Stateless Action Trigger 슬롯) */
  bottomActions?: ReactNode;
  className?: string;
}
