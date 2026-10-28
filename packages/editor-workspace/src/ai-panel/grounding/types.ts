/** 원본 발췌 인용 모델 */
export interface CitationItem {
  id: string;
  index: number;
  sourceDocTitle: string;
  page?: number;
  snippet: string;
  box_2d?: [number, number, number, number];
  confidence?: number;
}

/** 사실 일치율 및 신뢰도 스코어 */
export interface GroundingScoreItem {
  faithfulnessScore: number; // 0~100
  rubricComplianceScore: number; // 0~100
  unverifiedClaimsCount: number;
}

/** 인용 뱃지 Props */
export interface CitationBadgeProps {
  citation: CitationItem;
  onClick?: (citation: CitationItem) => void;
  className?: string;
}

/** 신뢰도 스코어카드 Props */
export interface FaithfulnessScoreCardProps {
  score: GroundingScoreItem;
  className?: string;
}

/** 근거 누락 경고 Props */
export interface MissingEvidenceAlertProps {
  unverifiedStatements: string[];
  missingRequirements?: string[];
  onAddEvidenceRequest?: (statement: string) => void;
  className?: string;
}

/** 출처 역추적 바 Props */
export interface GroundingCitationBarProps {
  citations: CitationItem[];
  score?: GroundingScoreItem;
  missingStatements?: string[];
  onSelectCitation?: (citation: CitationItem) => void;
  className?: string;
}
