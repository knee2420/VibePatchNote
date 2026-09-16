import React, { memo } from 'react';
import { SpineSwitcher, type SpineOption } from './spine';
import { BinderTree } from './BinderTree';
import { SocketNodeRenderer } from './socket';
import { AssetStagingTray, type StagingAssetItem } from './staging';
import type { BinderItem } from './types';
import type { SocketNodeData } from './socket/types';
import type { ProvenanceItem } from './provenance/types';

/** 완성형 인터랙티브 소켓 바인더 Props */
export interface InteractiveSocketBinderProps<
  TMode extends string = string,
  TNode = Record<string, unknown>,
  TAsset = Record<string, unknown>,
> {
  // 1. 척추 스위처
  spines: SpineOption<TMode>[];
  activeSpine: TMode;
  onChangeSpine: (spine: TMode) => void;

  // 2. 소화율 게이지
  coverage?: number;

  // 3. 소켓 트리
  treeData: BinderItem<SocketNodeData<TNode>>[];
  selectedId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onDropAssetToNode?: (targetNodeId: string, assetId: string, assetType: string) => void;
  onSelectProvenance?: (item: ProvenanceItem) => void;
  onClickBridge?: (targetId: string) => void;
  onTriggerNodeAction?: (actionId: string, nodeId: string) => void;

  // 4. 미매핑 에셋 인박스 트레이
  stagingAssets: StagingAssetItem<TAsset>[];
  onSelectStagingAsset?: (asset: StagingAssetItem<TAsset>) => void;
  onAutoBindAll?: () => void;

  // 레이아웃 & 툴바
  searchTerm?: string;
  className?: string;
}

/**
 * InteractiveSocketBinder (루브릭 뼈대 ↔ 다차원 에셋 소켓 바인더 종합 위젯)
 *
 * 1. 루브릭 앵커 스위처 (SpineSwitcher)
 * 2. 소화율 인디케이터 (CoverageRing)
 * 3. 소켓/슬롯형 트리 노드 (BinderTree + SocketNodeRenderer)
 * 4. 교차 도메인 미러 뱃지 (CrossDomainBridgeTag) & 역추적 칩 (ProvenanceChipList)
 * 5. 노드 인라인 액션 바 (NodeActionBar)
 * 6. 미매핑 에셋 대기소 트레이 (AssetStagingTray)
 */
function InteractiveSocketBinderInner<
  TMode extends string = string,
  TNode = Record<string, unknown>,
  TAsset = Record<string, unknown>,
>({
  spines,
  activeSpine,
  onChangeSpine,
  coverage,
  treeData,
  selectedId,
  onSelectNode,
  onDropAssetToNode,
  onSelectProvenance,
  onClickBridge,
  onTriggerNodeAction,
  stagingAssets,
  onSelectStagingAsset,
  onAutoBindAll,
  searchTerm,
  className = '',
}: InteractiveSocketBinderProps<TMode, TNode, TAsset>) {
  return (
    <div className={`flex flex-col h-full w-full bg-white text-slate-800 overflow-hidden ${className}`}>
      {/* 1. 상단: 척추 스위처 + 소화율 게이지 */}
      <div className="shrink-0">
        <SpineSwitcher
          options={spines}
          activeSpine={activeSpine}
          onChangeSpine={onChangeSpine}
          coverage={coverage}
          size="sm"
        />
      </div>

      {/* 2. 중단: 계층형 소켓 트리 */}
      <div className="flex-1 overflow-hidden p-1">
        <BinderTree
          data={treeData}
          selectedId={selectedId}
          onSelect={(item) => onSelectNode?.(item?.id || null)}
          searchTerm={searchTerm}
          renderNode={(nodeProps) => (
            <SocketNodeRenderer
              node={nodeProps.node}
              style={nodeProps.style}
              dragHandle={nodeProps.dragHandle}
              onDropAsset={onDropAssetToNode}
              onSelectProvenance={onSelectProvenance}
              onClickBridge={onClickBridge}
              onTriggerAction={onTriggerNodeAction}
            />
          )}
        />
      </div>

      {/* 3. 하단: 미매핑 에셋 인박스 서랍 */}
      <div className="shrink-0">
        <AssetStagingTray
          assets={stagingAssets}
          onSelectAsset={onSelectStagingAsset}
          onAutoBindAll={onAutoBindAll}
          isCollapsible={true}
          defaultExpanded={false}
        />
      </div>
    </div>
  );
}

export const InteractiveSocketBinder = memo(InteractiveSocketBinderInner) as <
  TMode extends string = string,
  TNode = Record<string, unknown>,
  TAsset = Record<string, unknown>,
>(
  props: InteractiveSocketBinderProps<TMode, TNode, TAsset>
) => React.ReactElement | null;
