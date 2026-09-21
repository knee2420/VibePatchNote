import { useState, useRef, useEffect } from 'react';
import type { IdeMenuBarProps } from '../types';

const DEFAULT_MENU_ITEMS = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

/**
 * [Primitive] IDE 텍스트 메뉴바 & 팝오버 드롭다운 부품.
 * File, Edit 등의 메뉴를 표시하며 클릭 시 단축키 힌트가 포함된 드롭다운을 엽니다.
 */
export function IdeMenuBar({
  items = DEFAULT_MENU_ITEMS,
  onSelectMenu,
  className = '',
}: IdeMenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫힘 처리
  useEffect(() => {
    if (!activeMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const handleItemClick = (item: string) => {
    setActiveMenu(activeMenu === item ? null : item);
    onSelectMenu?.(item);
  };

  return (
    <div ref={containerRef} className={`flex items-center gap-1 ${className}`}>
      {items.map((item) => (
        <div key={item} className="relative">
          <button
            type="button"
            onClick={() => handleItemClick(item)}
            className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
              activeMenu === item
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {item}
          </button>

          {/* 모의 드롭다운 팝오버 메뉴 */}
          {activeMenu === item && (
            <div
              className="absolute left-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 z-50 text-[11px] text-slate-200"
              onClick={() => setActiveMenu(null)}
            >
              <div className="px-3 py-1.5 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between">
                <span>New File</span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+N</span>
              </div>
              <div className="px-3 py-1.5 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between">
                <span>Save</span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+S</span>
              </div>
              <div className="h-[1px] bg-slate-700 my-1" />
              <div className="px-3 py-1.5 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between">
                <span>Preferences</span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+,</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
