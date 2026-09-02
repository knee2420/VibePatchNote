import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { RichTextEditor } from '@/shared/ui/editor/RichTextEditor';
import type { SegmentData } from '../model/types';
import { useState } from 'react';

export function SegmentNode({ data, selected }: NodeProps<Node<SegmentData, "segment">>) {
  const [content, setContent] = useState(data.content);

  return (
    <div className={`
      bg-white rounded-lg shadow-md border-2 w-[500px] flex flex-col
      ${selected ? 'border-blue-500' : 'border-slate-200'}
      transition-colors duration-200
    `}>
      {/* Target handle for top-down structural connection */}
      <Handle type="target" position={Position.Top} className="w-16 h-2 bg-blue-300 rounded-none border-none" />
      
      {/* Node Header (Drag Handle) */}
      <div className="bg-slate-100 px-4 py-2 rounded-t-lg border-b border-slate-200 flex justify-between items-center nodrag">
        <h3 className="font-bold text-slate-700 text-sm">{data.title}</h3>
        <div className="text-xs text-slate-400">Section</div>
      </div>
      
      {/* Content Area (Rich Text Editor) */}
      <div className="p-4 nodrag cursor-text">
        <RichTextEditor 
          initialContent={content} 
          onChange={(newContent) => setContent(newContent)}
          className="border-none shadow-none bg-transparent p-0 min-h-[150px]"
        />
      </div>
      
      {/* Source handle for top-down structural connection */}
      <Handle type="source" position={Position.Bottom} className="w-16 h-2 bg-blue-300 rounded-none border-none" />
      
      {/* Left/Right handles for attaching resource cards (Post-its) */}
      <Handle type="target" position={Position.Left} id="left-attach" className="w-2 h-8 bg-amber-400 rounded-sm border-none -ml-1" />
      <Handle type="target" position={Position.Right} id="right-attach" className="w-2 h-8 bg-amber-400 rounded-sm border-none -mr-1" />
    </div>
  );
}
