import { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';

import type { ResourceCardData } from '../model/types';

export const ResourceCardNode = memo(function ResourceCardNode({
  id,
  data,
  selected,
}: NodeProps<Node<ResourceCardData, 'resourceCard'>>) {
  const { setNodes } = useReactFlow();

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'knowledge':
        return 'bg-amber-200 text-amber-800';
      case 'rule':
        return 'bg-rose-200 text-rose-800';
      case 'asset':
        return 'bg-emerald-200 text-emerald-800';
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  return (
    <div
      className={`
      bg-amber-100 rounded-md shadow-xs border w-[250px] flex flex-col cursor-grab active:cursor-grabbing select-none [contain:layout_style_paint]
      ${selected ? 'border-amber-500 shadow-md ring-2 ring-amber-300 nowheel' : 'border-amber-300'}
      transition-colors duration-150
    `}
    >
      {/* Post-it Note Header */}
      <div className="px-3 py-2 border-b border-amber-200/50 flex justify-between items-start group">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-semibold text-amber-900 text-sm leading-tight truncate">{data.title}</h4>
          <span
            className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getBadgeColor(
              data.type
            )}`}
          >
            {data.type}
          </span>
        </div>
        <button
          onClick={() => setNodes((nds) => nds.filter((node) => node.id !== id))}
          className="text-amber-700/50 hover:text-red-500 transition-colors p-1 rounded hover:bg-amber-200/50 opacity-0 group-hover:opacity-100 nodrag"
          title="삭제"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Post-it Content: 카드 전체 어디를 잡아도 즉시 드래그되도록 nodrag 제거 */}
      <div className="p-3 pointer-events-none">
        <p className="text-amber-950/80 text-xs leading-relaxed">{data.summary}</p>
      </div>

      {/* Handles to attach to segments */}
      <Handle type="target" position={Position.Left} id="left" className="bg-amber-500 w-3 h-3 rounded-full" />
      <Handle type="source" position={Position.Right} id="right" className="bg-amber-500 w-3 h-3 rounded-full" />
    </div>
  );
});
