/** 대기소(Staging)에 보관된 미매핑 에셋 모델 */
export interface StagingAssetItem<T = Record<string, unknown>> {
  id: string;
  type: 'text' | 'table' | 'image' | 'code' | string;
  title: string;
  summary?: string;
  sourceDocTitle?: string;
  sourcePage?: number;
  confidence?: number;
  extra?: T;
}

/** 에셋 카드 Props */
export interface StagingCardProps<T = Record<string, unknown>> {
  asset: StagingAssetItem<T>;
  onSelect?: (asset: StagingAssetItem<T>) => void;
  onDragStart?: (asset: StagingAssetItem<T>, event: React.DragEvent) => void;
  className?: string;
}

/** 미매핑 에셋 트레이 Props */
export interface AssetStagingTrayProps<T = Record<string, unknown>> {
  assets: StagingAssetItem<T>[];
  onSelectAsset?: (asset: StagingAssetItem<T>) => void;
  onAutoBindAll?: () => void;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}
