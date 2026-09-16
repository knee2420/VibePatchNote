import type { TopMenuBarProps } from './types';

/**
 * 워크스페이스 상단에 고정되는 범용 글로벌 탑 메뉴바 & 툴바 컴포넌트.
 * 좌측(뒤로가기, 문서제목), 중앙(뷰모드 전환), 우측(상태표시, 사이드바 토글) 3단 슬롯을 제공합니다.
 */
export function TopMenuBar({
  leftSlot,
  centerSlot,
  rightSlot,
  className = '',
}: TopMenuBarProps) {
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
