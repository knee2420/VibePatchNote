import type { DocumentTopBarProps } from './types';

/**
 * [Document Web Mode] 일반 웹 문서 워크스페이스에 고정되는 상단 탑 메뉴바 & 툴바.
 * 좌측(뒤로가기/문서제목), 중앙(뷰모드 전환), 우측(상태표시/액션) 3단 슬롯을 제공합니다.
 * (하위 호환을 위해 `TopMenuBar` 별칭도 함께 제공됩니다.)
 */
export function DocumentTopBar({
  leftSlot,
  centerSlot,
  rightSlot,
  className = '',
}: DocumentTopBarProps) {
  return (
    <div
      className={`h-13 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none z-20 text-slate-800 shadow-xs ${className}`}
    >
      {/* 1. 좌측 슬롯 */}
      <div className="flex items-center gap-3 min-w-0">
        {leftSlot}
      </div>

      {/* 2. 중앙 슬롯 */}
      <div className="flex items-center gap-2">
        {centerSlot}
      </div>

      {/* 3. 우측 슬롯 */}
      <div className="flex items-center gap-3">
        {rightSlot}
      </div>
    </div>
  );
}

/** 하위 호환을 위한 이전 명칭 별칭 */
export const TopMenuBar = DocumentTopBar;
