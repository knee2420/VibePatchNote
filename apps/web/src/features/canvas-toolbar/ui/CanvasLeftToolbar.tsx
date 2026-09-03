import { 
  MousePointer2, 
  Hand, 
  UploadCloud, 
  StickyNote, 
  FileText, 
  Search 
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import { useHybridEditorState } from '@/features/topdown-outline/model/useHybridEditorState';
import { useCanvasMode } from '../model/useCanvasMode';

interface CanvasLeftToolbarProps {
  onUploadClick?: () => void;
}

export function CanvasLeftToolbar({ onUploadClick }: CanvasLeftToolbarProps) {
  const { mode, setMode, setIsSearchOpen } = useCanvasMode();
  const { addNode } = useHybridEditorState();
  const { screenToFlowPosition } = useReactFlow();

  // Helper to add card near the center of the screen
  const handleAddKnowledgeCard = () => {
    const centerPos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    addNode({
      id: `resource-${Date.now()}`,
      type: 'resourceCard',
      position: {
        x: centerPos.x - 125,
        y: centerPos.y - 100,
      },
      data: {
        title: '새 지식 카드',
        type: 'knowledge',
        summary: '여기에 지식 또는 메모 내용을 입력하세요.',
      },
    });
  };

  const handleAddSegment = () => {
    const centerPos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    addNode({
      id: `segment-${Date.now()}`,
      type: 'segment',
      position: {
        x: centerPos.x - 250,
        y: centerPos.y - 150,
      },
      data: {
        title: '새 세그먼트 섹션',
        content: '여기에 플롯이나 세그먼트 본문을 작성하세요.',
      },
    });
  };

  return (
    <aside 
      aria-label="Canvas Tool Dock"
      className="fixed left-5 top-1/2 -translate-y-1/2 z-40 animate-in fade-in slide-in-from-left-4 duration-200"
    >
      <div className="bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 rounded-2xl p-1.5 flex flex-col gap-1 ring-1 ring-black/5">
        {/* 1. ↖️ 선택 모드 (Mouse Selection) */}
        <button
          onClick={() => setMode('select')}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group ${
            mode === 'select'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="마우스 선택 모드 (드래그로 여러 카드 일괄 선택) [V]"
          aria-label="Select mode"
        >
          <MousePointer2 className="w-4 h-4" />
          <span className="sr-only">선택 모드</span>
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            마우스 선택 모드 (V)
          </span>
        </button>

        {/* 2. ✋ 캔버스 이동 모드 (Hand Pan) */}
        <button
          onClick={() => setMode('hand')}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group ${
            mode === 'hand'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="캔버스 이동 모드 (드래그로 캔버스 패닝) [H / Space]"
          aria-label="Pan mode"
        >
          <Hand className="w-4 h-4" />
          <span className="sr-only">이동 모드</span>
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            캔버스 이동 모드 (H)
          </span>
        </button>

        <div className="w-full h-px bg-slate-200 my-0.5" />

        {/* 3. 📄 레퍼런스 파일 업로드 */}
        <button
          onClick={onUploadClick}
          className="p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center relative group"
          title="레퍼런스 문서/자료 업로드"
          aria-label="Upload reference file"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="sr-only">자료 업로드</span>
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            자료 파일 업로드
          </span>
        </button>

        {/* 4. ➕ 지식 카드(포스트잇) 생성 */}
        <button
          onClick={handleAddKnowledgeCard}
          className="p-2.5 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center relative group"
          title="새 지식 카드(포스트잇) 생성"
          aria-label="Add knowledge card"
        >
          <StickyNote className="w-4 h-4" />
          <span className="sr-only">지식 카드 생성</span>
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            새 지식 카드 추가
          </span>
        </button>

        {/* 5. 📝 세그먼트 섹션 생성 */}
        <button
          onClick={handleAddSegment}
          className="p-2.5 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center relative group"
          title="새 세그먼트 섹션 생성"
          aria-label="Add segment section"
        >
          <FileText className="w-4 h-4" />
          <span className="sr-only">세그먼트 생성</span>
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            새 세그먼트 추가
          </span>
        </button>

        <div className="w-full h-px bg-slate-200 my-0.5" />

        {/* 6. 🔍 캔버스 빠른 검색 */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center relative group"
          title="캔버스 내 카드 빠른 검색 [Ctrl+K]"
          aria-label="Search canvas cards"
        >
          <Search className="w-4 h-4" />
          <span className="sr-only">캔버스 검색</span>
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            카드 빠른 검색 (Ctrl+K)
          </span>
        </button>
      </div>
    </aside>
  );
}
