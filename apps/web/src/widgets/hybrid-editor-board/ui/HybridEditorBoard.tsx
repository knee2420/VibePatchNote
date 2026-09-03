import { useMemo, useRef, useState, useEffect } from 'react';
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

function HybridEditorBoardContent() {
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
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Hybrid Editing Board</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">{activeSessionTitle || 'React Flow + Tiptap Integration'}</p>
            <button 
              onClick={() => setIsSessionSheetOpen(true)}
              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition font-medium ml-2"
            >
              세션 목록
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => {
              if (confirm('현재 세션을 초기화하시겠습니까? 모든 노드가 삭제됩니다.')) {
                clearSession();
              }
            }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 transition font-medium mr-2"
          >
            초기화
          </button>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            onClick={handleFileUploadClick}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-md hover:bg-blue-100 transition disabled:opacity-50"
          >
            {isUploading ? '업로드 중...' : '+ 레퍼런스 업로드'}
          </button>
          <button className="px-4 py-2 bg-amber-50 text-amber-600 font-medium rounded-md hover:bg-amber-100 transition">
            + 지식 카드 추가
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
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
