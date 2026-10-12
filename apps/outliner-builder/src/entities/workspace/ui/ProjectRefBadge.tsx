/**
 * @file ProjectRefBadge.tsx
 * @description 독립 프로젝트로 추출되거나 참조된 블록에 붙는 프로젝트 링크 뱃지 (엔티티 UI)
 */

import React from 'react';
import { ExternalLink, Layers, CornerDownRight } from 'lucide-react';
import { useWorkspaceStore } from '../model/useWorkspaceStore';

interface ProjectRefBadgeProps {
  targetProjectId: string;
  displayText?: string;
  relation?: 'child' | 'standalone';
}

export const ProjectRefBadge: React.FC<ProjectRefBadgeProps> = ({
  targetProjectId,
  displayText,
  relation,
}) => {
  const focusProject = useWorkspaceStore((s) => s.focusProject);
  const workspace = useWorkspaceStore((s) => s.workspace);

  const targetProject = workspace.projects[targetProjectId];
  const isSubProject = relation === 'child' || !!targetProject?.parentProjectId;
  const label = displayText ?? targetProject?.title ?? '참조된 프로젝트';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    focusProject(targetProjectId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${isSubProject ? '하위 프로젝트' : '독립 프로젝트'} '${label}' 집중 뷰로 이동`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 ml-2 rounded-full text-[11px] font-medium transition-all cursor-pointer shadow-xs select-none ${
        isSubProject
          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 hover:border-cyan-400 hover:text-cyan-200'
          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 hover:border-indigo-400 hover:text-indigo-200'
      }`}
    >
      {isSubProject ? (
        <CornerDownRight className="w-3 h-3 text-cyan-400" />
      ) : (
        <Layers className="w-3 h-3 text-indigo-400" />
      )}
      <span>{label}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
    </button>
  );
};
