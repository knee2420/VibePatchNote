import { useState, useRef, useEffect } from 'react';
import { Settings, Check, Grid, Eye, Map, Lock, Unlock, RotateCcw } from 'lucide-react';

import { useCanvasSettings } from '../model/useCanvasSettings';

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
        <Settings className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            캔버스 환경 설정
          </div>

          <div className="py-1">
            {/* 그리드에 맞추기 */}
            <button
              onClick={toggleSnapToGrid}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50/80 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>그리드에 맞추기</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                snapToGrid ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {snapToGrid && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* 도트 배경 표시 */}
            <button
              onClick={toggleShowDots}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50/80 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>도트 배경 표시</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                showDots ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {showDots && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* 미니맵 표시 */}
            <button
              onClick={toggleShowMiniMap}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50/80 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Map className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>미니맵 표시</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                showMiniMap ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {showMiniMap && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <div className="my-1 border-t border-slate-100" />

            {/* 읽기 전용 모드 */}
            <button
              onClick={toggleReadOnly}
              className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between group transition-colors ${
                isReadOnly ? 'text-amber-700 hover:bg-amber-50' : 'text-slate-700 hover:bg-blue-50/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isReadOnly ? (
                  <Lock className="w-4 h-4 text-amber-600" />
                ) : (
                  <Unlock className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                )}
                <span>읽기 전용 (캔버스 잠금)</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isReadOnly ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {isReadOnly && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

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
