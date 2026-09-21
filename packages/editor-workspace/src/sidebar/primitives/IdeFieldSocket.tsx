import type { MouseEvent, ReactNode } from 'react';
import { Sparkles, Check, X, Link2 } from 'lucide-react';

export interface IdeFieldSocketProps {
  id: string;
  fieldName: string;
  fieldKey?: string;
  value?: string;
  status?: 'unbound' | 'suggested' | 'bound' | 'custom';
  suggestedValue?: string;
  confidence?: string;
  resourceName?: string;
  sourceLocation?: string;
  compact?: boolean;
  isSelected?: boolean;
  actions?: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onApplySuggested?: (e: MouseEvent<HTMLButtonElement>) => void;
  onUnbind?: (e: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * IdeFieldSocket
 * 세그먼트 노드 또는 슬롯 노드 하위에 N개로 부착되는 데이터 필드 소켓 레고 블록.
 * 바인딩 상태, 신뢰도 태그, 원본 출처 위치, 인라인 추천값 적용을 지원합니다.
 */
export function IdeFieldSocket({
  fieldName,
  value,
  status = 'unbound',
  suggestedValue,
  confidence,
  resourceName,
  sourceLocation,
  compact = false,
  isSelected = false,
  actions,
  className = '',
  onClick,
  onApplySuggested,
  onUnbind,
}: IdeFieldSocketProps) {
  const isBound = status === 'bound';
  const hasSuggestion = status === 'suggested' || Boolean(suggestedValue);

  // 컴팩트 인라인 행 모드
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`group/socket flex items-center justify-between gap-1.5 px-2 py-0.5 rounded text-[11px] select-none cursor-pointer transition-colors border ${
          isSelected
            ? 'bg-slate-800 border-indigo-500/80 text-white'
            : isBound
            ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
            : hasSuggestion
            ? 'bg-teal-950/30 border-teal-800/40 text-teal-200 hover:border-teal-700'
            : 'bg-slate-950/20 border-dashed border-slate-800/60 text-slate-400 hover:border-slate-700'
        } ${className}`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
          <Link2
            className={`w-2.5 h-2.5 shrink-0 ${
              isBound ? 'text-indigo-400' : hasSuggestion ? 'text-teal-400' : 'text-slate-500'
            }`}
          />
          <span className="truncate font-medium">{fieldName}</span>
          {value ? (
            <span className="text-[10px] text-slate-300 font-mono truncate bg-slate-900 px-1 rounded">
              {value}
            </span>
          ) : hasSuggestion ? (
            <span className="text-[10px] text-teal-300/90 font-mono truncate">
              {suggestedValue}
            </span>
          ) : (
            <span className="text-[9px] text-slate-500 italic">미지정</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasSuggestion && !isBound && onApplySuggested && (
            <button
              type="button"
              aria-label="추천 적용"
              onClick={(e) => {
                e.stopPropagation();
                onApplySuggested(e);
              }}
              className="p-0.5 rounded bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 hover:text-white transition-colors"
              title="추천값 적용"
            >
              <Check className="w-2.5 h-2.5" />
            </button>
          )}
          {isBound && onUnbind && (
            <button
              type="button"
              aria-label="연결 해제"
              onClick={(e) => {
                e.stopPropagation();
                onUnbind(e);
              }}
              className="opacity-0 group-hover/socket:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
              title="연결 해제"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
          {actions}
        </div>
      </div>
    );
  }

  // 카드 모드
  return (
    <div
      onClick={onClick}
      className={`group/socket px-2.5 py-1.5 rounded text-xs transition-colors border select-none cursor-pointer ${
        isSelected
          ? 'bg-slate-800 border-indigo-500/80 shadow-xs'
          : isBound
          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          : hasSuggestion
          ? 'bg-teal-950/20 border-teal-800/40 hover:border-teal-700/60'
          : 'bg-slate-950/40 border-dashed border-slate-800/80 hover:border-slate-700'
      } ${className}`}
    >
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
          {actions}
        </div>
      </div>

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
                className="opacity-0 group-hover/socket:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 rounded transition-opacity"
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
