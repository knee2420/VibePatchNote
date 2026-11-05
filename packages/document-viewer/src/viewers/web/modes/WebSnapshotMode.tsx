import { memo, useState } from 'react';
import { Camera, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface WebSnapshotModeProps {
  snapshotUrl?: string;
  title: string;
  zoom?: number;
}

export const WebSnapshotMode = memo(function WebSnapshotMode({
  snapshotUrl,
  title,
  zoom = 1,
}: WebSnapshotModeProps) {
  const [localZoom, setLocalZoom] = useState(zoom);

  if (!snapshotUrl) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-400 text-center">
        <Camera className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-600 mb-1">고화질 스냅샷이 준비되지 않았습니다.</p>
        <p className="text-[11px] text-slate-400 max-w-xs">
          리더 모드 또는 라이브 웹 뷰를 이용해 원본을 대조해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full overflow-auto bg-slate-100/70 p-4 relative select-none">
      {/* 플로팅 미니 줌 툴바 */}
      <div className="sticky top-2 right-2 float-right z-10 flex items-center gap-1 bg-white/90 backdrop-blur-xs border border-slate-300 rounded-lg p-1 shadow-sm text-xs">
        <button
          type="button"
          onClick={() => setLocalZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
          className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
          title="축소"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="px-1 font-mono text-[11px] text-slate-700">
          {Math.round(localZoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setLocalZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
          className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
          title="확대"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setLocalZoom(1)}
          className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
          title="100% 원본 배율 복원"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div
        style={{
          transform: `scale(${localZoom})`,
          transformOrigin: 'top center',
          maxWidth: '100%',
        }}
        className="flex flex-col items-center transition-transform duration-100 ease-out"
      >
        <img
          src={snapshotUrl}
          alt={title}
          className="rounded-md shadow-md border border-slate-300 max-w-full h-auto bg-white"
          draggable={false}
        />
      </div>
    </div>
  );
});

