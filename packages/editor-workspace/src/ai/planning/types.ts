/** 계획 세부 단계 모델 */
export interface PlanStepItem {
  id: string;
  stepNumber: number;
  title: string;
  description?: string;
  targetSlots?: string[];
  estimatedTokens?: number;
  isSelected?: boolean;
}

/** 승인 게이트 결정 타입 */
export type PlanDecision = 'proceed' | 'request_changes' | 'reject';

/** 계획 승인 배너 Props */
export interface PlanApprovalGateProps {
  planTitle: string;
  totalSteps: number;
  onProceed: () => void;
  onRequestChanges?: () => void;
  onReject: () => void;
  className?: string;
}

/** 실행 계획 모달 Props */
export interface ExecutionPlanModalProps {
  isOpen: boolean;
  planTitle: string;
  overview: string;
  steps: PlanStepItem[];
  onToggleStep?: (stepId: string) => void;
  onProceed: (selectedSteps: PlanStepItem[]) => void;
  onRequestChanges?: (feedback: string) => void;
  onReject: () => void;
  onClose: () => void;
  className?: string;
}
