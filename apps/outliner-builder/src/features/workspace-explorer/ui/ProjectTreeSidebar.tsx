/**
 * @file ProjectTreeSidebar.tsx
 * @description File Explorer 메타포의 좌측 상시 프로젝트 계층 트리 탐색기 사이드바
 * - 부모-자식 프로젝트(하위 프로젝트)를 접기/펼치기 폴더 트리 형태로 계층 렌더링
 * - 페이지 전환 없이 프로젝트 클릭 시 우측 캔버스가 즉시 In-place Switching된다.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  GitFork,
  Trash2,
  ChevronRight,
  ChevronDown,
  Link2,
  Camera,
  FolderTree,
  CornerDownRight,
} from 'lucide-react';
import {
  buildRelationsGraph,
  buildProjectHierarchy,
  type HierarchicalProjectNode,
  type RelationsGraph,
  type Snapshot,
} from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';

// ==========================================
// 1. 단일 프로젝트 트리 항목 (재귀 계층 렌더링)
// ==========================================
interface ProjectTreeItemProps {
  itemNode: HierarchicalProjectNode;
  activeProjectId: string;
  snapshots: Record<string, Snapshot[]>;
  relationsGraph: RelationsGraph;
  projectCount: number;
  onFocus: (id: string) => void;
  onFork: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onCreateChild: (parentId: string) => void;
}

const ProjectTreeItem: React.FC<ProjectTreeItemProps> = ({
  itemNode,
  activeProjectId,
  snapshots,
  relationsGraph,
  projectCount,
  onFocus,
  onFork,
  onDelete,
  onCreateChild,
}) => {
  const [isFolded, setIsFolded] = useState(false);
  const { project, children, depth } = itemNode;
  const hasChildren = children.length > 0;
  const isActive = project.id === activeProjectId;
  const snapCount = snapshots[project.id]?.length ?? 0;
  const backlinkCount = relationsGraph.inbound[project.id]?.length ?? 0;

  return (
    <div className="flex flex-col space-y-0.5">
      <div
        onClick={() => onFocus(project.id)}
        className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer select-none ${
          isActive
            ? 'bg-indigo-950/60 text-indigo-200 font-medium border-l-2 border-indigo-500'
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${depth * 14 + (hasChildren ? 4 : 16)}px` }}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          {/* 트리 접기/펼치기 화살표 (하위 프로젝트 존재 시) */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFolded(!isFolded);
              }}
              title={isFolded ? '하위 프로젝트 펼치기' : '하위 프로젝트 접기'}
              className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 cursor-pointer shrink-0"
            >
              {isFolded ? (
                <ChevronRight className="w-3 h-3 text-indigo-400" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          ) : null}

          {/* 아이콘: 하위 프로젝트(CornerDownRight) vs 루트 프로젝트(Layers) */}
          {depth > 0 ? (
            <CornerDownRight
              className={`w-3.5 h-3.5 shrink-0 ${
                isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400/70'
              }`}
            />
          ) : (
            <Layers
              className={`w-3.5 h-3.5 shrink-0 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
              }`}
            />
          )}

          <span className="truncate">{project.title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* 인용 백링크 뱃지 */}
          {backlinkCount > 0 && (
            <span
              title={`${backlinkCount}개 인용됨`}
              className="px-1 py-0.2 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 flex items-center gap-0.5"
            >
              <Link2 className="w-2.5 h-2.5" />
              <span>{backlinkCount}</span>
            </span>
          )}

          {/* 스냅샷 카운트 */}
          {snapCount > 0 && (
            <span
              title={`${snapCount}개 스냅샷`}
              className="px-1 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-400 flex items-center gap-0.5"
            >
              <Camera className="w-2.5 h-2.5" />
              <span>{snapCount}</span>
            </span>
          )}

          {/* 호버 액션: 하위 프로젝트 추가 / Fork / Delete */}
          <div
            className="hidden group-hover:flex items-center gap-0.5 ml-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="이 프로젝트 아래에 새 하위 프로젝트 추가"
              onClick={() => onCreateChild(project.id)}
              className="p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              title="프로젝트 분기(Fork)"
              onClick={() => onFork(project.id)}
              className="p-1 rounded text-slate-500 hover:text-indigo-300 hover:bg-slate-800 cursor-pointer"
            >
              <GitFork className="w-3 h-3" />
            </button>
            {projectCount > 1 && (
              <button
                type="button"
                title="프로젝트 삭제"
                onClick={() => onDelete(project.id, project.title)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 하위 프로젝트 재귀 렌더링 (접히지 않았을 때) */}
      {!isFolded &&
        hasChildren &&
        children.map((childNode) => (
          <ProjectTreeItem
            key={childNode.project.id}
            itemNode={childNode}
            activeProjectId={activeProjectId}
            snapshots={snapshots}
            relationsGraph={relationsGraph}
            projectCount={projectCount}
            onFocus={onFocus}
            onFork={onFork}
            onDelete={onDelete}
            onCreateChild={onCreateChild}
          />
        ))}
    </div>
  );
};

// ==========================================
// 2. 메인 ProjectTreeSidebar 컨테이너
// ==========================================
interface ProjectTreeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// 사이드바 리사이즈 제약 조건 상수
const DEFAULT_SIDEBAR_WIDTH = 256;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 600;
const SIDEBAR_WIDTH_STORAGE_KEY = 'outliner_sidebar_width';

export const ProjectTreeSidebar: React.FC<ProjectTreeSidebarProps> = ({
  isOpen,
}) => {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const activeProjectId = workspace.activeProjectId;
  const focusProject = useWorkspaceStore((s) => s.focusProject);
  const createProject = useWorkspaceStore((s) => s.createProject);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const forkCurrentProject = useWorkspaceStore((s) => s.forkCurrentProject);
  const snapshots = workspace.snapshots;

  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createParentId, setCreateParentId] = useState<string | null>(null);

  // 사이드바 너비 상태 (localStorage 연동 & 안전 Clamping)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(sidebarWidth);

  useEffect(() => {
    widthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const resetWidth = useCallback(() => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    widthRef.current = DEFAULT_SIDEBAR_WIDTH;
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(DEFAULT_SIDEBAR_WIDTH));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clamped = Math.min(Math.max(e.clientX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      widthRef.current = clamped;
      setSidebarWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(widthRef.current));
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // 계층 폴더 트리 빌드
  const projectHierarchy = React.useMemo(
    () => buildProjectHierarchy(workspace.projects),
    [workspace.projects]
  );
  const relationsGraph = React.useMemo(
    () => buildRelationsGraph(workspace.projects),
    [workspace.projects]
  );
  const projectList = React.useMemo(() => Object.values(workspace.projects), [workspace.projects]);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createProject(newTitle.trim(), createParentId);

    setNewTitle('');
    setIsCreating(false);
    setCreateParentId(null);
  };

  const handleFork = (targetProjId: string) => {
    forkCurrentProject(targetProjId);
  };

  const handleDelete = (targetProjId: string, title: string) => {
    if (
      window.confirm(
        `'${title}' 프로젝트를 삭제하시겠습니까?\n(하위 프로젝트가 있을 경우 상위 계층으로 안전하게 승격됩니다)`
      )
    ) {
      deleteProject(targetProjId);
    }
  };

  const handleStartCreateChild = (parentId: string) => {
    setCreateParentId(parentId);
    setIsCreating(true);
  };

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className={`h-full border-r border-slate-800/80 bg-slate-950 flex flex-col select-none shrink-0 relative ${
        isResizing ? 'transition-none select-none' : 'transition-[width] duration-150'
      }`}
    >
      {/* 1. 사이드바 상단 워크스페이스 헤더 */}
      <div className="h-10 px-3.5 border-b border-slate-900 flex items-center justify-between text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <FolderTree className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{workspace.title || 'EXPLORER'}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateParentId(null);
            setIsCreating(true);
          }}
          title="새 최상위 프로젝트 추가"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. 프로젝트 계층 트리 탐색기 섹션 */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {/* 섹션 접기/펼치기 타이틀 */}
        <div
          onClick={() => setIsSectionOpen(!isSectionOpen)}
          className="flex items-center justify-between px-1.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-300 cursor-pointer tracking-wider uppercase transition-colors"
        >
          <div className="flex items-center gap-1">
            {isSectionOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>PROJECTS ({projectList.length})</span>
          </div>
        </div>

        {/* 새 프로젝트 인라인 생성 폼 */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="my-1.5 p-1.5 rounded-md bg-slate-900 border border-indigo-500/50 flex items-center gap-1"
          >
            <input
              type="text"
              placeholder={createParentId ? '하위 프로젝트 이름...' : '새 프로젝트 이름...'}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-1.5 py-0.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-hidden focus:border-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-0.5 text-[10px] rounded bg-indigo-600 text-white font-medium hover:bg-indigo-500 cursor-pointer"
            >
              생성
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setCreateParentId(null);
              }}
              className="px-1 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              ✕
            </button>
          </form>
        )}

        {/* 계층 폴더 트리 리스트 */}
        {isSectionOpen &&
          projectHierarchy.map((itemNode) => (
            <ProjectTreeItem
              key={itemNode.project.id}
              itemNode={itemNode}
              activeProjectId={activeProjectId}
              snapshots={snapshots}
              relationsGraph={relationsGraph}
              projectCount={projectList.length}
              onFocus={focusProject}
              onFork={handleFork}
              onDelete={handleDelete}
              onCreateChild={handleStartCreateChild}
            />
          ))}
      </div>

      {/* 3. 사이드바 하단 정보 */}
      <div className="p-2.5 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
        <span>프로젝트 {projectList.length}개</span>
        <span className="text-[10px] text-slate-600">Local-First Tree</span>
      </div>

      {/* 4. 마우스 드래그 리사이저 핸들 (스플리터) */}
      <div
        onMouseDown={startResizing}
        onDoubleClick={resetWidth}
        title="드래그하여 사이드바 너비 조절 (더블 클릭: 기본 너비 복원)"
        className={`absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-30 group flex items-center justify-center transition-colors ${
          isResizing ? 'bg-indigo-500/20' : 'hover:bg-indigo-500/10'
        }`}
      >
        <div
          className={`w-0.5 h-full transition-colors ${
            isResizing
              ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
              : 'group-hover:bg-indigo-400/70'
          }`}
        />
      </div>
    </aside>
  );
};
