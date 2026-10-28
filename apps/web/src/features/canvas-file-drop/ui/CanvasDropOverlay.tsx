import { UploadCloud, FileText } from 'lucide-react';

interface CanvasDropOverlayProps {
  isDraggingOver: boolean;
  supportedExtensions?: string[];
}

export function CanvasDropOverlay({ isDraggingOver, supportedExtensions = [] }: CanvasDropOverlayProps) {
  if (!isDraggingOver) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-blue-500/10 backdrop-blur-[1px] border-4 border-dashed border-blue-400 rounded-lg m-2 transition-all duration-200 animate-in fade-in">
      <div className="bg-white/95 px-8 py-6 rounded-xl shadow-xl flex flex-col items-center gap-3 border border-blue-200">
        <div className="p-3 bg-blue-50 rounded-full text-blue-600 animate-bounce">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800">자료를 여기에 놓아주세요</h3>
          <p className="text-xs text-slate-500 mt-1">
            마우스를 놓은 위치에 해당 레퍼런스 노드가 즉시 생성됩니다.
          </p>
        </div>

        {supportedExtensions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-center mt-2 max-w-sm">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-1">
              <FileText className="w-3.5 h-3.5" />
              <span>지원 포맷:</span>
            </div>
            {supportedExtensions.map((ext) => (
              <span
                key={ext}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded uppercase tracking-wider border border-blue-100"
              >
                .{ext}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
