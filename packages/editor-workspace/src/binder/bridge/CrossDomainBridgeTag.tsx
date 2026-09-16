import { memo } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import type { CrossDomainBridgeTagProps } from './types';

/**
 * CrossDomainBridgeTag (교차 도메인 미러 뱃지)
 *
 * 아웃라인 ↔ 와이어프레임 슬롯 간의 상호 매핑 관계를 노드 우측에 표시하는 컴팩트 뱃지.
 * 클릭 시 해당 타깃 노드로 점프합니다.
 */
export const CrossDomainBridgeTag = memo(function CrossDomainBridgeTag({
  item,
  onClick,
  className = '',
}: CrossDomainBridgeTagProps) {
  const isForward = item.direction === 'forward';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (item.targetId) onClick?.(item.targetId);
      }}
      title={`교차 링크: ${item.domainName ? `[${item.domainName}] ` : ''}${item.targetLabel}`}
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors select-none cursor-pointer
        ${
          isForward
            ? 'bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300'
            : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300'
        }
        ${className}
      `}
    >
      {isForward ? (
        <ArrowRight className="w-2.5 h-2.5 shrink-0 text-blue-400" />
      ) : (
        <ArrowLeft className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
      )}
      <span className="truncate max-w-[100px]">{item.targetLabel}</span>
    </button>
  );
});
