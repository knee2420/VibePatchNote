import { useMemo, useRef, useState } from 'react';
import { InfiniteCanvas } from '@/shared/ui/canvas/InfiniteCanvas';
import { SegmentNode } from '@/entities/segment/ui/SegmentNode';
import { ResourceCardNode } from '@/entities/resource-card/ui/ResourceCardNode';
import { useHybridEditorState } from '@/features/topdown-outline/model/useHybridEditorState';

export function HybridEditorBoard() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useHybridEditorState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Define node types for React Flow
  const nodeTypes = useMemo(() => ({
    segment: SegmentNode,
    resourceCard: ResourceCardNode,
  }), []);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      alert(`업로드 성공! Job ID: ${data.job_id}`);
      // TODO: Use the returned data to add a new ResourceCardNode to the canvas
    } catch (error) {
      console.error('File upload error:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
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
          <p className="text-sm text-slate-500">React Flow + Tiptap Integration</p>
        </div>
        <div className="flex gap-2">
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
        />
      </div>
    </div>
  );
}
