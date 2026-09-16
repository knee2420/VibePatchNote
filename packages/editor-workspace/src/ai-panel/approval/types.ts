import type { ReactNode } from 'react';

/** 변경 단위(Diff Chunk) 상태 */
export type DiffStatus = 'pending' | 'accepted' | 'rejected' | 'modified';

/** 변경 단위(Diff Chunk) 모델 */
export interface DiffChunkItem {
  id: string;
  sectionTitle?: string;
  originalText: string;
  proposedText: string;
  status: DiffStatus;
  userModifiedText?: string;
  reason?: string;
}

/** 인라인 Diff 뷰어 Props */
export interface InlineDiffViewerProps {
  originalText: string;
  proposedText: string;
  mode?: 'split' | 'unified';
  className?: string;
}

/** 청크 액션 그룹 Props */
export interface ChunkActionGroupProps {
  chunkId: string;
  status: DiffStatus;
  onAccept: (chunkId: string) => void;
  onReject: (chunkId: string) => void;
  onEdit?: (chunkId: string) => void;
  onRetry?: (chunkId: string) => void;
  className?: string;
}

/** 안전 승인 게이트 Props */
export interface SafetyApprovalGateProps {
  title: string;
  description: string;
  riskLevel?: 'low' | 'medium' | 'high';
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}

/** Diff 승인 뷰 Props */
export interface DiffApprovalViewProps {
  chunks: DiffChunkItem[];
  onAcceptChunk: (chunkId: string) => void;
  onRejectChunk: (chunkId: string) => void;
  onEditChunk?: (chunkId: string, newText: string) => void;
  onRetryChunk?: (chunkId: string) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  requireSafetyGate?: boolean;
  safetyGateMessage?: string;
  className?: string;
  extraHeader?: ReactNode;
}
