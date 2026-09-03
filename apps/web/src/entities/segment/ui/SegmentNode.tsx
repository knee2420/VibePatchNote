import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { RichTextEditor } from '@/shared/ui/editor/RichTextEditor';
import type { SegmentData } from '../model/types';
import { useState } from 'react';

const themeStyles: Record<string, { container: string; header: string }> = {
  default: { container: 'bg-white border-slate-200', header: 'bg-slate-100 border-slate-200 text-slate-700' },
  yellow: { container: 'bg-amber-50/80 border-amber-300', header: 'bg-amber-100 border-amber-200 text-amber-900' },
  green: { container: 'bg-emerald-50/80 border-emerald-300', header: 'bg-emerald-100 border-emerald-200 text-emerald-900' },
  blue: { container: 'bg-sky-50/80 border-sky-300', header: 'bg-sky-100 border-sky-200 text-sky-900' },
  purple: { container: 'bg-purple-50/80 border-purple-300', header: 'bg-purple-100 border-purple-200 text-purple-900' },
};

export function SegmentNode({ data, selected }: NodeProps<Node<SegmentData, "segment">>) {
  const [content, setContent] = useState(data.content);
  const currentTheme = typeof data.theme === 'string' && themeStyles[data.theme] ? themeStyles[data.theme] : themeStyles.default;

  return (
    <div className={`
      rounded-lg shadow-md border-2 w-[500px] flex flex-col
      ${currentTheme.container}
      ${selected ? '!border-blue-500 ring-2 ring-blue-300' : ''}
      transition-colors duration-200
    `}>
      {/* Target handle for top-down structural connection */}
      <Handle type="target" position={Position.Top} className="w-16 h-2 bg-blue-300 rounded-none border-none" />
      
      {/* Node Header (Drag Handle) */}
      <div className={`px-4 py-2 rounded-t-lg border-b flex justify-between items-center nodrag ${currentTheme.header}`}>
        <h3 className="font-bold text-sm">{data.title}</h3>
        <div className="text-xs opacity-60">Section</div>
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
