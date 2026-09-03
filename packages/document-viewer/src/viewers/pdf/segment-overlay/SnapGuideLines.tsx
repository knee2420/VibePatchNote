import { Magnet } from 'lucide-react';

interface SnapGuideLinesProps {
  activeGuideX: number | null;
  activeGuideY: number | null;
}

const BADGE_BASE =
  'absolute px-1 py-0.2 bg-purple-600 text-white text-[8px] font-bold rounded-xs shadow-md flex items-center gap-0.5';

/** 자석이 걸린 순간 나타나는 피그마 스타일 스냅 가이드선. */
export function SnapGuideLines({ activeGuideX, activeGuideY }: SnapGuideLinesProps) {
  return (
    <>
      {activeGuideX !== null && (
        <div
          style={{ left: `${activeGuideX / 10}%` }}
          className="absolute top-0 bottom-0 w-0 border-l-2 border-dashed border-purple-600 z-50 pointer-events-none shadow-sm"
        >
          <div className={`${BADGE_BASE} top-2 -translate-x-1/2`}>
            <Magnet className="w-2.5 h-2.5" />
            <span>SNAP</span>
          </div>
        </div>
      )}

      {activeGuideY !== null && (
        <div
          style={{ top: `${activeGuideY / 10}%` }}
          className="absolute left-0 right-0 h-0 border-t-2 border-dashed border-purple-600 z-50 pointer-events-none shadow-sm"
        >
          <div className={`${BADGE_BASE} left-2 -translate-y-1/2`}>
            <Magnet className="w-2.5 h-2.5" />
            <span>SNAP</span>
          </div>
        </div>
      )}
    </>
  );
}
