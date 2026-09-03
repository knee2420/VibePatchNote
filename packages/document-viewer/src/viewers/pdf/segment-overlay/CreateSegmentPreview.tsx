import { Sparkles } from 'lucide-react';

import { toPercentStyle, type SegmentBox } from './geometry';

interface CreateSegmentPreviewProps {
  box: SegmentBox;
}

/** Shift + 드래그로 새 영역을 그리는 동안 보여주는 가이드 박스. */
export function CreateSegmentPreview({ box }: CreateSegmentPreviewProps) {
  return (
    <div
      style={toPercentStyle(box)}
      className="absolute border-2 border-dashed border-purple-500 bg-purple-500/20 rounded-xs pointer-events-none z-30"
    >
      <div className="absolute -top-5 left-1 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded font-bold shadow-xs flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        <span>새 영역 생성 중</span>
      </div>
    </div>
  );
}
