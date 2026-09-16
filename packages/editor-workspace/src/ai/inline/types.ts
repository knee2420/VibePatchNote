import type { ReactNode } from 'react';

/** 인라인 프롬프트 모달 Props */
export interface InlinePromptModalProps {
  isOpen: boolean;
  selectedText?: string;
  position?: { top: number; left: number };
  onSubmit: (prompt: string, selectedText?: string) => void;
  onClose: () => void;
  isLoading?: boolean;
  quickActions?: { id: string; label: string; prompt: string; icon?: ReactNode }[];
  placeholder?: string;
  className?: string;
}

/** 인라인 Diff 오버레이 Props */
export interface InlineDiffOverlayProps {
  originalText: string;
  proposedText: string;
  onAccept: () => void;
  onReject: () => void;
  onEdit?: (text: string) => void;
  className?: string;
}

/** 고스트 텍스트 자동완성 예측 Props */
export interface GhostTextPredictorProps {
  ghostText: string;
  onAccept: () => void;
  onNextJump?: () => void;
  jumpHint?: string;
  className?: string;
}
