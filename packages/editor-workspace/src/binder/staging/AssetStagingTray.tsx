import React, { memo, useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Inbox,
  Search,
  Wand2,
} from 'lucide-react';
import { StagingCard } from './StagingCard';
import type { AssetStagingTrayProps } from './types';

/**
 * AssetStagingTray (미매핑 에셋 대기소 트레이)
 *
 * 바인더 하단에 위치하는 접이식 서랍(Drawer) 형태의 자재 인박스.
 * 원본 문서에서 추출되었으나 아직 뼈대에 꽂히지 않은 에셋들을 카드 형태로 관리하고,
 * 검색, 타입 필터링 및 소켓 노드로의 드래그 앤 드롭을 지원합니다.
 */
function AssetStagingTrayInner<T = Record<string, unknown>>({
  assets,
  onSelectAsset,
  onAutoBindAll,
  isCollapsible = true,
  defaultExpanded = true,
  className = '',
}: AssetStagingTrayProps<T>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<string>('all');

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchType = activeType === 'all' || asset.type === activeType;
      const matchQuery =
        !searchQuery.trim() ||
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.summary?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (asset.sourceDocTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      return matchType && matchQuery;
    });
  }, [assets, activeType, searchQuery]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length };
    for (const a of assets) {
      counts[a.type] = (counts[a.type] || 0) + 1;
    }
    return counts;
  }, [assets]);

  return (
    <div className={`flex flex-col bg-slate-950 border-t border-slate-800 transition-all ${className}`}>
      {/* 헤더 토글 바 */}
      <div
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-slate-900/90 cursor-pointer select-none hover:bg-slate-900 border-b border-slate-800/60"
      >
        <div className="flex items-center gap-2">
          <Inbox className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200">미매핑 에셋 인박스</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-bold">
            {assets.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onAutoBindAll && assets.length > 0 && (
            <button
              type="button"
              onClick={onAutoBindAll}
              title="유사도 기반 자동 매핑 실행"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm"
            >
              <Wand2 className="w-2.5 h-2.5" />
              <span>자동 바인딩</span>
            </button>
          )}

          {isCollapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 펼침 본문 */}
      {isExpanded && (
        <div className="flex flex-col p-2 gap-2 max-h-[260px] overflow-hidden">
          {/* 검색 및 필터 바 */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="에셋 검색..."
                className="w-full pl-7 pr-2 py-1 text-[11px] rounded bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80"
              />
            </div>

            {/* 타입 필터 칩 */}
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
              {(['all', 'text', 'table', 'image'] as const).map((t) => {
                const count = typeCounts[t] || 0;
                if (t !== 'all' && count === 0) return null;
                const isActive = activeType === t;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveType(t)}
                    className={`
                      px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors uppercase
                      ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }
                    `}
                  >
                    {t} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 에셋 카드 리스트 */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar min-h-[100px]">
            {filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                <p className="text-xs">미할당 대기 중인 에셋이 없습니다.</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  모든 에셋이 바인더 소켓에 정상 반영되었습니다.
                </p>
              </div>
            ) : (
              filteredAssets.map((item) => (
                <StagingCard
                  key={item.id}
                  asset={item}
                  onSelect={onSelectAsset}
                />
              ))
            )}
          </div>

          <div className="text-[10px] text-slate-500 text-center border-t border-slate-900 pt-1">
            💡 카드를 끌어서 위의 규격 소켓 노드에 드롭하세요.
          </div>
        </div>
      )}
    </div>
  );
}

export const AssetStagingTray = memo(AssetStagingTrayInner) as <T = Record<string, unknown>>(
  props: AssetStagingTrayProps<T>
) => React.ReactElement | null;
