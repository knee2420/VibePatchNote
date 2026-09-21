import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

export interface IdeSidebarHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onToggleReferenceDoc?: () => void;
  isReferenceDocOpen?: boolean;
  actions?: ReactNode;
  viewSelector?: ReactNode;
  className?: string;
}

/**
 * IdeSidebarHeader
 * 좌측 사이드바 상단 헤더 Primitives.
 * 대문자 섹션 타이틀, 📖 레퍼런스 원본 토글 버튼, 뷰 셀렉터 및 액션 슬롯을 제공합니다.
 */
export function IdeSidebarHeader({
  title,
  subtitle,
  icon,
  onToggleReferenceDoc,
  isReferenceDocOpen = false,
  actions,
  viewSelector,
  className = '',
}: IdeSidebarHeaderProps) {
  return (
    <div
      className={`border-b border-slate-800/80 bg-slate-900/90 shrink-0 select-none ${className}`}
    >
      {/* 1. 기본 타이틀 & 액션 툴바 */}
      <div className="h-8.5 px-3 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span className="truncate text-slate-300">{title}</span>
          {subtitle && (
            <span className="text-[10px] font-mono text-slate-500 font-normal">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 📖 레퍼런스 원본 열기/닫기 토글 버튼 */}
          {onToggleReferenceDoc && (
            <button
              type="button"
              onClick={onToggleReferenceDoc}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-normal border cursor-pointer transition-all ${
                isReferenceDocOpen
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/60 hover:border-slate-600'
              }`}
              title="레퍼런스 원본 DOC 열람 패널 토글"
            >
              <BookOpen className="w-3 h-3 text-teal-400" />
              <span>레퍼런스</span>
            </button>
          )}

          {/* 추가 액션 버튼들 */}
          {actions}
        </div>
      </div>

      {/* 2. 뷰 전환 선택기 슬롯 (옵션) */}
      {viewSelector && <div className="px-2 pb-1.5">{viewSelector}</div>}
    </div>
  );
}
