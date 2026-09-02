import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import type { ReferenceDocumentData } from '../model/types';

export function ReferenceDocumentNode({ id, data, selected }: NodeProps<Node<ReferenceDocumentData, "referenceDocument">>) {
  const { setNodes } = useReactFlow();

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };

  return (
    <div className={`
      bg-white rounded-md shadow-sm border w-[600px] h-[800px] flex flex-col
      ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-300' : 'border-slate-300'}
      transition-all duration-200
    `}>
      {/* Header acting as a safe drag area */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center rounded-t-md cursor-grab active:cursor-grabbing">
        <h4 className="font-semibold text-slate-700 text-sm truncate pr-4" title={data.title}>
          📄 {data.title}
        </h4>
        <button
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-200"
          title="삭제"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      
      {/* Iframe Content */}
      <div className="flex-1 p-0 overflow-hidden rounded-b-md relative">
        {/*
          Using an iframe to embed the PDF. 
          When not selected, we can optionally place a transparent overlay 
          to ensure dragging is easier, but standard practice is to let the user 
          drag from the header.
        */}
        <iframe 
          src={data.url} 
          className="w-full h-full border-none"
          title={data.title}
        />
      </div>

      <Handle type="source" position={Position.Right} id="right" className="bg-blue-500 w-3 h-3 rounded-full" />
      <Handle type="target" position={Position.Left} id="left" className="bg-blue-500 w-3 h-3 rounded-full" />
    </div>
  );
}
