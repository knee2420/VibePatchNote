import { GitMerge } from 'lucide-react';

import { useViewerLabels } from '../../../viewerConfig';
import { toPercentStyle, type SegmentBox } from './geometry';

interface MergePreviewBoxProps {
  box: SegmentBox;
  absorbedCount: number;
}

/**
 * 병합하면 만들어질 영역을 실행 전에 보여 준다.
 *
 * 세그먼트는 연속된 한 영역이라 고른 것들 사이도 함께 묶인다. 둘 골랐는데 다섯이
 * 사라지면 사고이므로, 어디까지 먹는지 눈으로 확인시킨다.
 */
export function MergePreviewBox({ box, absorbedCount }: MergePreviewBoxProps) {
  const labels = useViewerLabels();
  return (
    <div
      style={toPercentStyle(box)}
      className="absolute border-2 border-dashed border-violet-600 bg-violet-500/10 pointer-events-none z-30"
    >
      <div className="absolute -top-5 left-1 px-1.5 py-0.5 bg-violet-600 text-white text-[10px] rounded font-bold shadow-xs flex items-center gap-1 whitespace-nowrap">
        <GitMerge className="w-3 h-3" />
        <span>{labels.mergePreview}</span>
        {absorbedCount > 0 && <span className="opacity-90">(+{absorbedCount})</span>}
      </div>
    </div>
  );
}
