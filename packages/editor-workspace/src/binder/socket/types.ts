import type { ProvenanceItem } from '../provenance/types';
import type { BridgeTagItem } from '../bridge/types';
import type { NodeActionItem } from '../actions/types';

/** 소켓 노드의 매핑/채움 상태 */
export type SocketFillingState = 'empty' | 'filled' | 'conflict' | 'partial';

/** 소켓 노드가 요구하는 허용 데이터 타입 */
export type SocketAcceptType = 'text' | 'table' | 'image' | 'code' | 'any';

/** 소켓 노드 확장 데이터 모델 */
export interface SocketNodeData<T = Record<string, unknown>> {
  id: string;
  name: string;
  slotNumber?: number;
  fillingState?: SocketFillingState;
  mappedCount?: number;
  conflictReason?: string;
  acceptTypes?: SocketAcceptType[];
  provenances?: ProvenanceItem[];
  bridges?: BridgeTagItem[];
  actions?: NodeActionItem[];
  isFolder?: boolean;
  extra?: T;
}

/** 소켓 상태 뱃지 Props */
export interface SocketStateBadgeProps {
  state: SocketFillingState;
  count?: number;
  reason?: string;
  className?: string;
}

/** 소켓 노드 렌더러 Props */
export interface SocketNodeRendererProps<T = Record<string, unknown>> {
  node: {
    id: string;
    data: SocketNodeData<T>;
    isOpen: boolean;
    isSelected: boolean;
    isLeaf: boolean;
    level: number;
    toggle: () => void;
    select: () => void;
  };
  style?: React.CSSProperties;
  dragHandle?: (el: HTMLDivElement | null) => void;
  onDropAsset?: (targetNodeId: string, assetId: string, assetType: string) => void;
  onSelectProvenance?: (item: ProvenanceItem) => void;
  onClickBridge?: (targetId: string) => void;
  onTriggerAction?: (actionId: string, nodeId: string) => void;
  className?: string;
}
