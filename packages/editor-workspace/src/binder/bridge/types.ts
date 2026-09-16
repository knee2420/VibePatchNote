/** 교차 도메인 미러 뱃지 모델 */
export interface BridgeTagItem {
  /** 'forward': 다른 도메인으로의 사상 (예: → P.2 Right Card), 'backward': 역방향 참조 (예: ← Sec 3.1 결론) */
  direction: 'forward' | 'backward';
  targetLabel: string;
  targetId?: string;
  domainName?: string;
}

/** 미러 뱃지 Props */
export interface CrossDomainBridgeTagProps {
  item: BridgeTagItem;
  onClick?: (targetId: string) => void;
  className?: string;
}
