import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { ReferenceDocumentCard, REFERENCE_DOCUMENT_NODE_TYPE } from '@/entities/reference-document';
import { ResourceCardNode, RESOURCE_CARD_NODE_TYPE } from '@/entities/resource-card';
import { SegmentNode, SEGMENT_NODE_TYPE } from '@/entities/segment';
import { CanvasDropOverlay, useCanvasFileDrop } from '@/features/canvas-file-drop';
import { CanvasNodeActionBar } from '@/features/canvas-node-actions';
import { CanvasLeftToolbar, CanvasSearchModal, useCanvasMode } from '@/features/canvas-toolbar';
import { SessionListSheet, useSessionActions, useSessionSync } from '@/features/workspace';
import { useCanvasSettings } from '@/shared/model';
import { InfiniteCanvas } from '@/shared/ui';

import { useBoardFileUpload } from '../model/useBoardFileUpload';
import { BoardHeader } from './BoardHeader';

const NODE_TYPES = {
  [SEGMENT_NODE_TYPE]: SegmentNode,
  [RESOURCE_CARD_NODE_TYPE]: ResourceCardNode,
  [REFERENCE_DOCUMENT_NODE_TYPE]: ReferenceDocumentCard,
};

function HybridEditorBoardContent() {
  const [isSessionSheetOpen, setIsSessionSheetOpen] = useState(false);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useCanvasBoardStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      onNodesChange: s.onNodesChange,
      onEdgesChange: s.onEdgesChange,
      onConnect: s.onConnect,
      addNode: s.addNode,
    }))
  );

  // 백엔드 세션 복원 + 자동 저장
  useSessionSync();
  const { closeSession } = useSessionActions();

  const { snapToGrid, snapGrid, showDots, showMiniMap, isReadOnly } = useCanvasSettings();
  const { mode } = useCanvasMode();

  const {
    fileInputRef,
    isUploading: isManualUploading,
    openFilePicker,
    handleFileChange,
  } = useBoardFileUpload({
    onSuccess: (file) => alert(`업로드 성공! [${file.name}]`),
    onError: () => alert('파일 업로드 중 오류가 발생했습니다.'),
  });

  const {
    isDraggingOver,
    isUploading: isDropUploading,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    supportedExtensions,
  } = useCanvasFileDrop({
    onNodeCreated: addNode,
    onUploadError: (file) => alert(`[${file.name}] 파일 업로드 중 오류가 발생했습니다.`),
  });

  const handleClearSession = () => {
    if (confirm('현재 세션을 초기화하시겠습니까? 모든 노드가 삭제됩니다.')) {
      closeSession();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <BoardHeader
        isUploading={isManualUploading || isDropUploading}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        onOpenSessionSheet={() => setIsSessionSheetOpen(true)}
        onClearSession={handleClearSession}
      />

      {/* Canvas Viewport Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Heptabase Left Tool Dock (Select, Hand, Upload, Cards, Search) */}
        <CanvasLeftToolbar onUploadClick={openFilePicker} />

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
          nodeTypes={NODE_TYPES}
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
        <SessionListSheet
          isOpen={isSessionSheetOpen}
          onClose={() => setIsSessionSheetOpen(false)}
        />
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
