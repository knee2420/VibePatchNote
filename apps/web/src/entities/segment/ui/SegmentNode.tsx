import { memo, useState } from 'react';
import { Handle, Position, useReactFlow, NodeResizer, type NodeProps, type Node } from '@xyflow/react';

import { RichTextEditor } from '@/shared/ui/editor/RichTextEditor';

import type { SegmentData } from '../model/types';

const themeStyles: Record<string, { container: string; header: string }> = {
  default: { container: 'bg-white border-slate-200', header: 'bg-slate-100 border-slate-200 text-slate-700' },
  yellow: { container: 'bg-amber-50/80 border-amber-300', header: 'bg-amber-100 border-amber-200 text-amber-900' },
  green: { container: 'bg-emerald-50/80 border-emerald-300', header: 'bg-emerald-100 border-emerald-200 text-emerald-900' },
  blue: { container: 'bg-sky-50/80 border-sky-300', header: 'bg-sky-100 border-sky-200 text-sky-900' },
  purple: { container: 'bg-purple-50/80 border-purple-300', header: 'bg-purple-100 border-purple-200 text-purple-900' },
};

export const SegmentNode = memo(function SegmentNode({
  id,
  data,
  selected,
}: NodeProps<Node<SegmentData, 'segment'>>) {
  const { updateNodeData } = useReactFlow();
  const [content, setContent] = useState(data.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);

  const currentTheme =
    typeof data.theme === 'string' && themeStyles[data.theme]
      ? themeStyles[data.theme]
      : themeStyles.default;

  return (
    <div
      style={
        customSize
          ? {
              width: `${customSize.width}px`,
              height: `${customSize.height}px`,
            }
          : undefined
      }
      className={`
      group/node rounded-lg shadow-md border-2 flex flex-col relative [contain:layout_style_paint]
      ${currentTheme.container}
      ${selected ? '!border-blue-500 ring-2 ring-blue-300' : ''}
      ${customSize ? '' : 'w-[500px]'}
      ${isResizing ? '' : 'transition-colors duration-200'}
    `}
    >
      {/* 테두리 마우스 호버 및 선택 시 나타나는 크기 조절 핸들 */}
      <NodeResizer
        minWidth={280}
        minHeight={160}
        isVisible={true}
        onResizeStart={() => setIsResizing(true)}
        onResize={(_, params) => {
          setCustomSize({ width: params.width, height: params.height });
        }}
        onResizeEnd={(_, params) => {
          setIsResizing(false);
          setCustomSize({ width: params.width, height: params.height });
        }}
        lineClassName={`border-blue-400 pointer-events-none transition-opacity duration-150 ${
          selected ? 'opacity-80' : 'opacity-0 group-hover/node:opacity-60'
        }`}
        handleClassName={`!w-2.5 !h-2.5 !bg-white !border-2 !border-blue-500 !rounded-full shadow-xs transition-opacity duration-150 ${
          selected ? '!opacity-100' : '!opacity-0 group-hover/node:!opacity-100'
        }`}
      />

      {/* Target handle for top-down structural connection */}
      <Handle type="target" position={Position.Top} className="w-16 h-2 bg-blue-300 rounded-none border-none" />

      {/* Node Header (Drag Handle) */}
      <div className={`px-4 py-2 rounded-t-lg border-b flex justify-between items-center shrink-0 ${currentTheme.header}`}>
        <h3 className="font-bold text-sm select-none">{data.title}</h3>
        <div className="text-xs opacity-60">Section</div>
      </div>

      {/* Content Area (Lazy Tiptap Editor for 60fps performance) */}
      <div className="p-4 nodrag nopan flex-1 overflow-auto flex flex-col">
        {isEditing ? (
          <div onBlur={() => setIsEditing(false)} className="flex-1 flex flex-col">
            <RichTextEditor
              initialContent={content}
              onChange={(newContent) => {
                setContent(newContent);
                updateNodeData(id, { content: newContent });
              }}
              className="border border-blue-200 rounded-md bg-white shadow-xs p-2 min-h-[150px] flex-1"
            />
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="min-h-[150px] flex-1 p-2 rounded-md hover:bg-slate-50/80 cursor-text transition-colors"
            title="클릭하여 편집"
          >
            {content ? (
              <div
                className="prose prose-sm max-w-none text-slate-800 pointer-events-none select-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="text-slate-400 italic text-sm select-none">
                내용을 입력하려면 클릭하세요...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Source handle for top-down structural connection */}
      <Handle type="source" position={Position.Bottom} className="w-16 h-2 bg-blue-300 rounded-none border-none" />

      {/* Left/Right handles for attaching resource cards (Post-its) */}
      <Handle type="source" position={Position.Left} id="left-attach" className="w-2 h-8 bg-amber-400 rounded-sm border-none -ml-1" />
      <Handle type="target" position={Position.Left} id="left-attach-target" className="w-2 h-8 bg-amber-400 rounded-sm border-none -ml-1 opacity-0 pointer-events-none" />

      <Handle type="source" position={Position.Right} id="right-attach" className="w-2 h-8 bg-amber-400 rounded-sm border-none -mr-1" />
      <Handle type="target" position={Position.Right} id="right-attach-target" className="w-2 h-8 bg-amber-400 rounded-sm border-none -mr-1 opacity-0 pointer-events-none" />
    </div>
  );
});
