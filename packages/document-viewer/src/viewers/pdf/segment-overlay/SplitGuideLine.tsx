import { toPercentStyle, type SegmentBox } from './geometry';

interface SplitGuideLineProps {
  box: SegmentBox;
  axis: 'horizontal' | 'vertical';
  /** 축 방향의 정규 좌표. 아직 포인터가 안 들어왔으면 null. */
  position: number | null;
}

/** 분할될 자리를 보여 주는 선. 클릭하면 이 자리에서 나뉜다. */
export function SplitGuideLine({ box, axis, position }: SplitGuideLineProps) {
  const [ymin, xmin, ymax, xmax] = box;
  const value = position ?? (axis === 'horizontal' ? (ymin + ymax) / 2 : (xmin + xmax) / 2);
  const style =
    axis === 'horizontal'
      ? { top: `${value / 10}%`, left: `${xmin / 10}%`, width: `${(xmax - xmin) / 10}%`, height: 0 }
      : { left: `${value / 10}%`, top: `${ymin / 10}%`, height: `${(ymax - ymin) / 10}%`, width: 0 };

  return (
    <>
      <div
        style={toPercentStyle(box)}
        className="absolute border-2 border-dashed border-rose-400/70 pointer-events-none z-30"
      />
      <div
        style={style}
        className={`absolute pointer-events-none z-40 ${
          axis === 'horizontal' ? 'border-t-2' : 'border-l-2'
        } border-rose-500`}
      />
    </>
  );
}
