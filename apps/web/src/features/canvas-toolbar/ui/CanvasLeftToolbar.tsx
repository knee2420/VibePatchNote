import { FileText, Hand, MousePointer2, Search, StickyNote, UploadCloud } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { RESOURCE_CARD_NODE_TYPE } from '@/entities/resource-card';
import { SEGMENT_NODE_TYPE } from '@/entities/segment';

import { useCanvasMode } from '../model/useCanvasMode';
import { ToolDockButton } from './ToolDockButton';

interface CanvasLeftToolbarProps {
  onUploadClick?: () => void;
}

export function CanvasLeftToolbar({ onUploadClick }: CanvasLeftToolbarProps) {
  const { mode, setMode, setIsSearchOpen } = useCanvasMode();
  const addNode = useCanvasBoardStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  /** 화면 중앙을 캔버스 좌표로 환산합니다. */
  const centerPosition = () =>
    screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  const handleAddKnowledgeCard = () => {
    const center = centerPosition();
    addNode({
      id: `resource-${Date.now()}`,
      type: RESOURCE_CARD_NODE_TYPE,
      position: { x: center.x - 125, y: center.y - 100 },
      data: {
        title: '새 지식 카드',
        type: 'knowledge',
        summary: '여기에 지식 또는 메모 내용을 입력하세요.',
      },
    });
  };

  const handleAddSegment = () => {
    const center = centerPosition();
    addNode({
      id: `segment-${Date.now()}`,
      type: SEGMENT_NODE_TYPE,
      position: { x: center.x - 250, y: center.y - 150 },
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
        <ToolDockButton
          icon={MousePointer2}
          label="선택 모드"
          tooltip="마우스 선택 모드 (V)"
          title="마우스 선택 모드 (드래그로 여러 카드 일괄 선택) [V]"
          isActive={mode === 'select'}
          onClick={() => setMode('select')}
        />

        {/* 2. ✋ 캔버스 이동 모드 (Hand Pan) */}
        <ToolDockButton
          icon={Hand}
          label="이동 모드"
          tooltip="캔버스 이동 모드 (H)"
          title="캔버스 이동 모드 (드래그로 캔버스 패닝) [H / Space]"
          isActive={mode === 'hand'}
          onClick={() => setMode('hand')}
        />

        <div className="w-full h-px bg-slate-200 my-0.5" />

        {/* 3. 📄 레퍼런스 파일 업로드 */}
        <ToolDockButton
          icon={UploadCloud}
          label="자료 업로드"
          tooltip="자료 파일 업로드"
          title="레퍼런스 문서/자료 업로드"
          hoverClass="hover:text-blue-600 hover:bg-blue-50"
          onClick={onUploadClick}
        />

        {/* 4. ➕ 지식 카드(포스트잇) 생성 */}
        <ToolDockButton
          icon={StickyNote}
          label="지식 카드 생성"
          tooltip="새 지식 카드 추가"
          title="새 지식 카드(포스트잇) 생성"
          hoverClass="hover:text-amber-600 hover:bg-amber-50"
          onClick={handleAddKnowledgeCard}
        />

        {/* 5. 📝 세그먼트 섹션 생성 */}
        <ToolDockButton
          icon={FileText}
          label="세그먼트 생성"
          tooltip="새 세그먼트 추가"
          title="새 세그먼트 섹션 생성"
          hoverClass="hover:text-emerald-600 hover:bg-emerald-50"
          onClick={handleAddSegment}
        />

        <div className="w-full h-px bg-slate-200 my-0.5" />

        {/* 6. 🔍 캔버스 빠른 검색 */}
        <ToolDockButton
          icon={Search}
          label="캔버스 검색"
          tooltip="카드 빠른 검색 (Ctrl+K)"
          title="캔버스 내 카드 빠른 검색 [Ctrl+K]"
          onClick={() => setIsSearchOpen(true)}
        />
      </div>
    </aside>
  );
}
