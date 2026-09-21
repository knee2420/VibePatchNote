/** 문서 스냅샷 엔티티 */
export interface DocumentSnapshot {
  id: string;
  title: string;
  timestamp: number;
  previewText?: string;
  fullContent?: string;
  author?: string;
}

/** 스냅샷 인스펙터 패널 Props */
export interface SnapshotInspectorProps {
  snapshots: DocumentSnapshot[];
  currentContent?: string;
  onTakeSnapshot?: () => void;
  onRestoreSnapshot?: (snapshot: DocumentSnapshot) => void;
  onDeleteSnapshot?: (id: string) => void;
  onCompare?: (snapshot: DocumentSnapshot) => void;
  isTakingSnapshot?: boolean;
  emptyText?: string;
  className?: string;
}
