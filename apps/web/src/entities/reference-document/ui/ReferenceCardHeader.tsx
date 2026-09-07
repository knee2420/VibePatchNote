import { memo } from 'react';
import {
  Trash2,
  BookOpen,
  Scaling,
  Image as ImageIcon,
  ScanText,
  Loader2,
  Edit3,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

interface ReferenceCardHeaderProps {
  title: string;
  pageCount: number | null;
  viewerDefId: string;
  isFitContent: boolean;
  headerThemeClass: string;
  isScanning?: boolean;
  hasSegments?: boolean;
  isEditMode?: boolean;
  isExtractingScaffold?: boolean;
  isExtractingOutline?: boolean;
  hasOutline?: boolean;
  isOutlineOpen?: boolean;
  onToggleFit: () => void;
  onScan?: () => void;
  onExtractScaffold?: () => void;
  onExtractOutline?: () => void;
  onToggleOutlinePanel?: () => void;
  onToggleEditMode?: () => void;
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
  isEditMode = false,
  isExtractingScaffold = false,
  isExtractingOutline = false,
  hasOutline = false,
  isOutlineOpen = false,
  onToggleFit,
  onScan,
  onExtractScaffold,
  onExtractOutline,
  onToggleOutlinePanel,
  onToggleEditMode,
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
        {/* Extract Outline Button (문서 아웃라인 & 엘리먼트 추출) */}
        {onExtractOutline && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExtractOutline();
            }}
            disabled={isExtractingOutline}
            className={`
              p-1.5 rounded-md transition-colors nodrag cursor-pointer flex items-center justify-center
              ${
                isExtractingOutline
                  ? 'text-indigo-600 bg-indigo-100 animate-pulse ring-1 ring-indigo-400'
                  : hasOutline
                    ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200'
                    : 'text-indigo-600 hover:bg-indigo-100/80 bg-indigo-50'
              }
            `}
            title={
              isExtractingOutline
                ? '아웃라인 & 엘리먼트 2-Stage 분석 중...'
                : hasOutline
                  ? '아웃라인 & 엘리먼트 재분석 (강제 갱신)'
                  : '문서 아웃라인 & 엘리먼트 추출 (LLM 분석)'
            }
          >
            {isExtractingOutline ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>
        )}

        {/* [NEW] 추출 완료 후 생겨나는 아웃라인 & 엘리먼트 패널 보기/접기 버튼 */}
        {hasOutline && onToggleOutlinePanel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleOutlinePanel();
            }}
            className={`
              p-1.5 rounded-md transition-colors nodrag cursor-pointer flex items-center justify-center
              ${
                isOutlineOpen
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm ring-1 ring-indigo-500'
                  : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200 ring-1 ring-indigo-300'
              }
            `}
            title={isOutlineOpen ? '아웃라인 패널 닫기 (기본 크기로 복원)' : '아웃라인 & 엘리먼트 패널 열기 (상세 트리 보기)'}
          >
            {isOutlineOpen ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Extract Scaffold Button (Tiptap 와이어프레임 추출 및 미로 엣지 연결) */}
        {onExtractScaffold && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExtractScaffold();
            }}
            disabled={isExtractingScaffold}
            className={`
              p-1.5 rounded-md transition-colors nodrag cursor-pointer flex items-center justify-center
              ${
                isExtractingScaffold
                  ? 'text-purple-600 bg-purple-100 animate-pulse ring-1 ring-purple-400'
                  : 'text-purple-600 hover:bg-purple-100/80 bg-purple-50'
              }
            `}
            title={
              isExtractingScaffold
                ? 'scaffold-engine 분석 및 Tiptap 서식 생성 중...'
                : 'Tiptap 서식(스캐폴딩) 추출하여 미로 엣지로 연결'
            }
          >
            {isExtractingScaffold ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <span className="text-[10px] font-bold px-0.5 text-purple-700">T</span>
            )}
          </button>
        )}

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
                  ? 'text-indigo-600 bg-indigo-100 animate-pulse'
                  : hasSegments
                  ? 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
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
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <ScanText className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Mask Edit Mode Toggle Button (Visible when segments exist) */}
        {hasSegments && onToggleEditMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleEditMode();
            }}
            className={`
              p-1.5 rounded-md transition-colors nodrag cursor-pointer flex items-center justify-center
              ${
                isEditMode
                  ? 'text-indigo-700 bg-indigo-100 ring-1 ring-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              }
            `}
            title={isEditMode ? '영역 편집 모드 끄기 (뷰 모드로 전환)' : '영역 편집 모드 켜기 (크기 조절 및 라벨 수정)'}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Fit to Content Toggle Button */}
        <button
          onClick={onToggleFit}
          className={`
            p-1.5 rounded-md transition-colors nodrag cursor-pointer
            ${
              isFitContent
                ? 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
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

