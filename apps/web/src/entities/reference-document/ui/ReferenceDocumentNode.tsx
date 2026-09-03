import { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';

import type { ReferenceDocumentData } from '../model/types';

const themeStyles: Record<string, { container: string; header: string }> = {
  default: { container: 'bg-white border-slate-300', header: 'bg-slate-50 border-slate-200 text-slate-700' },
  yellow: { container: 'bg-amber-50/70 border-amber-300', header: 'bg-amber-100 border-amber-200 text-amber-900' },
  green: { container: 'bg-emerald-50/70 border-emerald-300', header: 'bg-emerald-100 border-emerald-200 text-emerald-900' },
  blue: { container: 'bg-sky-50/70 border-sky-300', header: 'bg-sky-100 border-sky-200 text-sky-900' },
  purple: { container: 'bg-purple-50/70 border-purple-300', header: 'bg-purple-100 border-purple-200 text-purple-900' },
};

export const ReferenceDocumentNode = memo(function ReferenceDocumentNode({
  id,
  data,
  selected,
}: NodeProps<Node<ReferenceDocumentData, 'referenceDocument'>>) {
  const { setNodes } = useReactFlow();

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };

  const currentTheme =
    typeof data.theme === 'string' && themeStyles[data.theme]
      ? themeStyles[data.theme]
      : themeStyles.default;

  return (
    <div
      className={`
      rounded-md shadow-xs border w-[600px] h-[800px] flex flex-col [contain:layout_style_paint]
      ${currentTheme.container}
      ${selected ? '!border-blue-500 shadow-lg ring-2 ring-blue-300' : ''}
      transition-colors duration-200
    `}
    >
      {/* Header acting as a safe drag area */}
      <div
        className={`px-4 py-3 border-b flex justify-between items-center rounded-t-md cursor-grab active:cursor-grabbing select-none ${currentTheme.header}`}
      >
        <h4 className="font-semibold text-sm truncate pr-4" title={data.title}>
          📄 {data.title}
        </h4>
        <button
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-200"
          title="삭제"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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

      {/* Iframe Content with pointer-events protection for smooth canvas dragging */}
      <div className="flex-1 p-0 overflow-hidden rounded-b-md relative">
        <iframe
          src={data.url}
          className={`w-full h-full border-none ${selected ? 'pointer-events-auto' : 'pointer-events-none'}`}
          title={data.title}
        />
        {!selected && (
          <div 
            className="absolute inset-0 bg-transparent cursor-pointer"
            title="클릭하여 문서 인터랙션 활성화"
          />
        )}
      </div>

      <Handle type="source" position={Position.Right} id="right" className="bg-blue-500 w-3 h-3 rounded-full" />
      <Handle type="target" position={Position.Left} id="left" className="bg-blue-500 w-3 h-3 rounded-full" />
    </div>
  );
});
