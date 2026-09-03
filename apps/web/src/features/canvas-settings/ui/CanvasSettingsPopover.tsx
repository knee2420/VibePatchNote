import { useEffect, useRef, useState } from 'react';
import { Eye, Grid, Lock, Map, RotateCcw, Settings, Unlock } from 'lucide-react';

import { useCanvasSettings } from '../model/useCanvasSettings';
import { SettingsToggleRow } from './SettingsToggleRow';

interface CanvasSettingsPopoverProps {
  onClearSession?: () => void;
}

export function CanvasSettingsPopover({ onClearSession }: CanvasSettingsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    snapToGrid,
    showDots,
    showMiniMap,
    isReadOnly,
    toggleSnapToGrid,
    toggleShowDots,
    toggleShowMiniMap,
    toggleReadOnly,
  } = useCanvasSettings();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2 rounded-lg transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-slate-200 text-slate-900 shadow-inner'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="캔버스 뷰 & 환경 설정"
        aria-label="Canvas settings"
      >
        <Settings
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            캔버스 환경 설정
          </div>

          <div className="py-1">
            <SettingsToggleRow
              icon={Grid}
              label="그리드에 맞추기"
              checked={snapToGrid}
              onToggle={toggleSnapToGrid}
            />
            <SettingsToggleRow
              icon={Eye}
              label="도트 배경 표시"
              checked={showDots}
              onToggle={toggleShowDots}
            />
            <SettingsToggleRow
              icon={Map}
              label="미니맵 표시"
              checked={showMiniMap}
              onToggle={toggleShowMiniMap}
            />

            <div className="my-1 border-t border-slate-100" />

            <SettingsToggleRow
              icon={Unlock}
              activeIcon={Lock}
              label="읽기 전용 (캔버스 잠금)"
              checked={isReadOnly}
              onToggle={toggleReadOnly}
              accent="amber"
            />

            {onClearSession && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onClearSession();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-red-500" />
                  <span>세션 노드 전체 초기화</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
