import { Handle, Position, NodeProps } from '@xyflow/react';
import { ResourceCardData } from '../model/types';

export function ResourceCardNode({ data, selected }: NodeProps<ResourceCardData>) {
  
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'knowledge': return 'bg-amber-200 text-amber-800';
      case 'rule': return 'bg-rose-200 text-rose-800';
      case 'asset': return 'bg-emerald-200 text-emerald-800';
      default: return 'bg-slate-200 text-slate-800';
    }
  };

  return (
    <div className={`
      bg-amber-100 rounded-md shadow-sm border w-[250px] flex flex-col transform rotate-1 hover:rotate-0
      ${selected ? 'border-amber-500 shadow-md ring-2 ring-amber-300' : 'border-amber-300'}
      transition-all duration-200
    `}>
      {/* Post-it Note Header */}
      <div className="px-3 py-2 border-b border-amber-200/50 flex justify-between items-start">
        <h4 className="font-semibold text-amber-900 text-sm leading-tight">{data.title}</h4>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-2 ${getBadgeColor(data.type)}`}>
          {data.type}
        </span>
      </div>
      
      {/* Post-it Content */}
      <div className="p-3">
        <p className="text-amber-950/80 text-xs leading-relaxed">
          {data.summary}
        </p>
      </div>

      {/* Handles to attach to segments */}
      <Handle type="source" position={Position.Right} id="right" className="bg-amber-500 w-3 h-3 rounded-full" />
      <Handle type="source" position={Position.Left} id="left" className="bg-amber-500 w-3 h-3 rounded-full" />
    </div>
  );
}
