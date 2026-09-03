import { memo } from 'react';
import { Trash2, BookOpen, Scaling, Image as ImageIcon, ScanText, Loader2 } from 'lucide-react';

interface ReferenceCardHeaderProps {
  title: string;
  pageCount: number | null;
  viewerDefId: string;
  isFitContent: boolean;
  headerThemeClass: string;
  isScanning?: boolean;
  hasSegments?: boolean;
  onToggleFit: () => void;
  onScan?: () => void;
  onDelete: () => void;
}

export const ReferenceCardHeader = memo(function ReferenceCardHeader({
  title,
  pageCount,
  viewerDefId,
  isFitContent,
  headerThemeClass,
  isScanning = false,
  hasSegments = false,
  onToggleFit,
  onScan,
  onDelete,
}: ReferenceCardHeaderProps) {
  return (
    <div
      onDoubleClick={onToggleFit}
      className={`px-4 py-3 border-b flex justify-between items-center rounded-t-[10px] cursor-grab active:cursor-grabbing select-none ${headerThemeClass}`}
      title="더블클릭하여 문서 여백에 딱 맞춤 (Fit to Content)"
    >
      <div className="flex items-center gap-2 min-w-0 pr-3">
        {viewerDefId === 'image' ? (
          <ImageIcon className="w-4 h-4 shrink-0 text-emerald-600" />
        ) : (
          <BookOpen className="w-4 h-4 shrink-0 text-blue-600" />
        )}
        <h4 className="font-bold text-sm truncate" title={title}>
          {title}
        </h4>
        {pageCount !== null && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/80 font-medium text-slate-600 shrink-0">
            {pageCount}p
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Scan & Analyze Button (AI/agy-cli Structure Detection) */}
        {onScan && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScan();
            }}
            disabled={isScanning}
            className={`
              p-1.5 rounded-md transition-colors nodrag cursor-pointer flex items-center justify-center
              ${
                isScanning
                  ? 'text-purple-600 bg-purple-100 animate-pulse'
                  : hasSegments
                  ? 'text-purple-600 bg-purple-100 hover:bg-purple-200'
                  : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
              }
            `}
            title={
              isScanning
                ? 'agy-cli 문서 영역 분석 중...'
                : hasSegments
                ? '문서 영역 재스캔 (agy-cli 분석)'
                : '스캔 혹은 문서 분석 (표, 개조식 목록, 섹션 감지)'
            }
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <ScanText className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Fit to Content Toggle Button */}
        <button
          onClick={onToggleFit}
          className={`
            p-1.5 rounded-md transition-colors nodrag cursor-pointer
            ${
              isFitContent
                ? 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
            }
          `}
          title={isFitContent ? '기본 크기로 복원' : '문서 여백에 딱 맞춤 (더블클릭 단축키)'}
        >
          <Scaling className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-slate-200/60 nodrag cursor-pointer"
          title="문서 카드 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

