import type { MouseEvent, ReactNode } from 'react';
import { Sparkles, Check, X, Link2 } from 'lucide-react';

export interface IdeSegmentFieldProps {
  id: string;
  fieldName: string;
  fieldKey?: string;
  value?: string;
  status?: 'unbound' | 'suggested' | 'bound' | 'custom';
  suggestedValue?: string;
  confidence?: string;
  resourceName?: string;
  sourceLocation?: string;
  actions?: ReactNode;
  isSelected?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onApplySuggested?: (e: MouseEvent<HTMLButtonElement>) => void;
  onUnbind?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

/**
 * IdeSegmentField
 * 세그먼트 블록 내부의 개별 매핑 필드 (1:N 복수 매핑 단위)
 * 필드명, 매핑값, 추천값, 신뢰도, 출처 위치, 원클릭 바인딩 버튼을 포함하는 컴포넌트.
 */
export function IdeSegmentField({
  fieldName,
  value,
  status = 'unbound',
  suggestedValue,
  confidence,
  resourceName,
  sourceLocation,
  actions,
  isSelected = false,
  onClick,
  onApplySuggested,
  onUnbind,
  className = '',
}: IdeSegmentFieldProps) {
  const isBound = status === 'bound';
  const hasSuggestion = status === 'suggested' || Boolean(suggestedValue);

  return (
    <div
      onClick={onClick}
      className={`group/field px-2.5 py-1.5 rounded text-xs transition-colors border select-none cursor-pointer ${
        isSelected
          ? 'bg-slate-800 border-indigo-500/80 shadow-xs'
          : isBound
          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          : hasSuggestion
          ? 'bg-teal-950/20 border-teal-800/40 hover:border-teal-700/60'
          : 'bg-slate-950/40 border-dashed border-slate-800/80 hover:border-slate-700'
      } ${className}`}
    >
      {/* 1. 필드 라벨 & 상태 뱃지 */}
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link2
            className={`w-3 h-3 shrink-0 ${
              isBound ? 'text-indigo-400' : hasSuggestion ? 'text-teal-400' : 'text-slate-500'
            }`}
          />
          <span className="font-medium text-slate-300 truncate text-[11px]">
            {fieldName}
          </span>
        </div>

        {/* 상태 태그 */}
        <div className="flex items-center gap-1 shrink-0">
          {isBound ? (
            <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              연결됨
            </span>
          ) : hasSuggestion ? (
            <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-teal-950 text-teal-300 border border-teal-700/60 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-teal-400" />
              <span>추천 {confidence || ''}</span>
            </span>
          ) : (
            <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-slate-800/60 text-slate-400">
              미지정
            </span>
          )}

          {/* 추가 액션 슬롯 */}
          {actions}
        </div>
      </div>

      {/* 2. 현재 값 / 추천 값 영역 */}
      <div className="text-[11px] font-sans">
        {value ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-200 truncate font-mono bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800/50 flex-1">
              {value}
            </span>
            {onUnbind && (
              <button
                type="button"
                aria-label="연결 해제"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnbind(e);
                }}
                className="opacity-0 group-hover/field:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 rounded transition-opacity"
                title="연결 해제"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : hasSuggestion && suggestedValue ? (
          <div className="flex items-center justify-between gap-1.5 bg-teal-950/40 px-1.5 py-1 rounded border border-teal-800/40">
            <div className="min-w-0 flex-1">
              <div className="text-teal-200 truncate font-mono text-[10px]">
                {suggestedValue}
              </div>
              {(resourceName || sourceLocation) && (
                <div className="text-[9px] text-teal-400/80 truncate">
                  {resourceName} {sourceLocation ? `(${sourceLocation})` : ''}
                </div>
              )}
            </div>
            {onApplySuggested && (
              <button
                type="button"
                aria-label="추천값 적용"
                onClick={(e) => {
                  e.stopPropagation();
                  onApplySuggested(e);
                }}
                className="p-1 bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 hover:text-white rounded border border-teal-500/40 shrink-0 transition-colors"
                title="추천값 적용"
              >
                <Check className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 italic px-1">
            할당된 데이터 없음
          </div>
        )}
      </div>
    </div>
  );
}
