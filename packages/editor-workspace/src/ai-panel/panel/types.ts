import type { ReactNode } from 'react';
import type { PromptComposerProps } from '../composer/types';
import type { AgentExecutionStep } from '../execution/types';
import type { DiffChunkItem } from '../approval/types';
import type { CitationItem, GroundingScoreItem } from '../grounding/types';
import type { RunAttemptItem } from '../history/types';

/** AI 패널 내부 활성 뷰 탭 */
export type AgentPanelTab = 'stream' | 'diff' | 'grounding' | 'history';

/** AI 워크스페이스 패널 Props */
export interface AgentWorkspacePanelProps {
  title?: string;
  activeTab: AgentPanelTab;
  onChangeTab: (tab: AgentPanelTab) => void;

  // 1. 프롬프트 컴포저 props
  composerProps: PromptComposerProps;

  // 2. 실행 스트림
  steps?: AgentExecutionStep[];
  isExecuting?: boolean;

  // 3. Diff 승인 뷰
  diffChunks?: DiffChunkItem[];
  onAcceptChunk?: (chunkId: string) => void;
  onRejectChunk?: (chunkId: string) => void;
  onAcceptAllChunks?: () => void;
  onRejectAllChunks?: () => void;

  // 4. 그라운딩 뷰
  citations?: CitationItem[];
  groundingScore?: GroundingScoreItem;
  missingStatements?: string[];
  onSelectCitation?: (citation: CitationItem) => void;

  // 5. 이력 타임라인
  attempts?: RunAttemptItem[];
  activeAttemptId?: string;
  onSelectAttempt?: (attemptId: string) => void;
  onForkBranch?: (attemptId: string) => void;
  onRollbackToAttempt?: (attempt: RunAttemptItem) => void;

  // 헤더 및 창 제어
  onClose?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  extraHeaderActions?: ReactNode;
  className?: string;
}
