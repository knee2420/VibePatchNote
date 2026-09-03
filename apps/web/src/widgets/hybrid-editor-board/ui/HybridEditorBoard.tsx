import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';

import { InfiniteCanvas } from '@/shared/ui/canvas/InfiniteCanvas';
import { SegmentNode } from '@/entities/segment/ui/SegmentNode';
import { ResourceCardNode } from '@/entities/resource-card/ui/ResourceCardNode';
import { ReferenceDocumentNode } from '@/entities/reference-document/ui/ReferenceDocumentNode';
import { useHybridEditorState } from '@/features/topdown-outline/model/useHybridEditorState';
import { SessionListSheet } from '@/features/workspace/ui/SessionListSheet';
import { 
  useCanvasFileDrop, 
  CanvasDropOverlay, 
  uploadDocumentApi, 
  fileDropRegistry 
} from '@/features/canvas-file-drop';
import { useCanvasSettings, CanvasSettingsPopover } from '@/features/canvas-settings';
import { CanvasNodeActionBar } from '@/features/canvas-node-actions';
import { 
  useCanvasMode, 
  CanvasLeftToolbar, 
  CanvasSearchModal 
} from '@/features/canvas-toolbar';

function HybridEditorBoardContent() {
  const navigate = useNavigate();
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode, 
    clearSession, 
    activeSessionId, 
    activeSessionTitle 
  } = useHybridEditorState();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManualUploading, setIsManualUploading] = useState(false);
  const [isSessionSheetOpen, setIsSessionSheetOpen] = useState(false);

  // Canvas View & Environment Settings
  const { snapToGrid, snapGrid, showDots, showMiniMap, isReadOnly } = useCanvasSettings();

  // Canvas Interaction Mode (Select vs Hand/Pan)
  const { mode } = useCanvasMode();

  const {
    isDraggingOver,
    isUploading: isDropUploading,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    supportedExtensions,
  } = useCanvasFileDrop({
    onNodeCreated: (newNode) => {
      addNode(newNode);
    },
  });

  const isUploading = isManualUploading || isDropUploading;

  // Auto-save logic (debounced)
  useEffect(() => {
    if (!activeSessionId) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`http://127.0.0.1:8000/api/v1/workspaces/${activeSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: activeSessionTitle, nodes, edges }),
        });
        console.log('Auto-saved session to backend.');
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, activeSessionId, activeSessionTitle]);

  // Define node types for React Flow
  const nodeTypes = useMemo(() => ({
    segment: SegmentNode,
    resourceCard: ResourceCardNode,
    referenceDocument: ReferenceDocumentNode,
  }), []);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsManualUploading(true);

    try {
      const uploadResult = await uploadDocumentApi(file);
      const handler = fileDropRegistry.getHandler(file);

      if (handler) {
        const newNode = handler.createNode({
          file,
          uploadResult,
          position: { x: Math.random() * 100 + 100, y: Math.random() * 100 + 100 },
        });
        addNode(newNode);
      } else {
        addNode({
          id: `reference-${Date.now()}`,
          type: 'referenceDocument',
          position: { x: Math.random() * 100 + 100, y: Math.random() * 100 + 100 },
          data: {
            title: file.name,
            url: uploadResult.file_url,
          },
        });
      }

      alert(`업로드 성공! [${file.name}]`);
    } catch (error) {
      console.error('File upload error:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsManualUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b px-4 py-2.5 flex justify-between items-center z-10 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Compact Return to Dashboard Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1.5 rounded-lg text-xs font-medium transition"
            title="대시보드로 돌아가기"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-semibold">대시보드</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">Hybrid Editing Board</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">{activeSessionTitle || 'React Flow + Tiptap Integration'}</p>
              <button 
                onClick={() => setIsSessionSheetOpen(true)}
                className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] rounded hover:bg-blue-100 transition font-medium"
              >
                세션 목록
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />

          {isUploading && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md animate-pulse font-medium border border-blue-100">
              업로드 중...
            </span>
          )}

          {/* Obsidian Style View & Environment Settings Popover */}
          <CanvasSettingsPopover
            onClearSession={() => {
              if (confirm('현재 세션을 초기화하시겠습니까? 모든 노드가 삭제됩니다.')) {
                clearSession();
              }
            }}
          />
        </div>
      </div>
      
      {/* Canvas Viewport Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Heptabase Left Tool Dock (Select, Hand, Upload, Cards, Search) */}
        <CanvasLeftToolbar onUploadClick={handleFileUploadClick} />

        {/* Floating Node Action Toolbar (Appears when cards are selected) */}
        <CanvasNodeActionBar />

        {/* Global Node Search Modal (Triggered by Search tool or Ctrl+K) */}
        <CanvasSearchModal />

        <InfiniteCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          snapToGrid={snapToGrid}
          snapGrid={snapGrid}
          showDots={showDots}
          showMiniMap={showMiniMap}
          isReadOnly={isReadOnly}
          canvasMode={mode}
        />
        <CanvasDropOverlay 
          isDraggingOver={isDraggingOver} 
          supportedExtensions={supportedExtensions} 
        />
        <SessionListSheet isOpen={isSessionSheetOpen} onClose={() => setIsSessionSheetOpen(false)} />
      </div>
    </div>
  );
}

export function HybridEditorBoard() {
  return (
    <ReactFlowProvider>
      <HybridEditorBoardContent />
    </ReactFlowProvider>
  );
}
