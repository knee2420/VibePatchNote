import type { ReactNode } from 'react';

/** 인라인 렌즈 액션 모델 */
export interface DocumentLensAction {
  id: string;
  label: string;
  icon?: ReactNode;
  tooltip?: string;
}

/** 인라인 렌즈 컴포넌트 Props */
export interface DocumentInlineLensProps {
  actions?: DocumentLensAction[];
  onTriggerAction: (actionId: string) => void;
  className?: string;
  slotNumber?: number;
}

/** 진단 퀵픽스 컴포넌트 Props */
export interface DiagnosticQuickFixProps {
  issueType: 'conflict' | 'empty' | 'length_exceeded' | 'unverified';
  issueMessage: string;
  suggestedActionLabel?: string;
  onApplyFix: () => void;
  onDismiss?: () => void;
  className?: string;
}
