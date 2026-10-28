/**
 * @file ProjectTreeSidebar.tsx
 * @description File Explorer 메타포의 좌측 상시 프로젝트 목록 사이드바
 * - 워크스페이스 안의 프로젝트들은 서로 나란히 놓인 단건이라, 계층 없이 한 줄씩 보여준다.
 * - 페이지 전환 없이 프로젝트 클릭 시 우측 캔버스가 즉시 In-place Switching된다.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Layers, Plus, Trash2, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import type { Project } from '@vibe/outliner/core';
import { useWorkspaceStore } from '@/entities/workspace';

// ==========================================
// 1. 단일 프로젝트 항목
// ==========================================
interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  canDelete: boolean;
  onFocus: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isActive,
  canDelete,
  onFocus,
  onDelete,
}) => (
  <div
    onClick={() => onFocus(project.id)}
    className={`group flex items-center justify-between pl-4 pr-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer select-none ${
      isActive
        ? 'bg-(--interactive-accent)/15 text-(--text-normal) font-medium border-l-2 border-(--interactive-accent)'
        : 'text-(--text-muted) hover:bg-(--background-modifier-hover) hover:text-(--text-normal)'
    }`}
  >
    <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
      <Layers
        className={`w-3.5 h-3.5 shrink-0 ${
          isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
        }`}
      />
      <span className="truncate">{project.title}</span>
    </div>

    {/* 호버 액션: 삭제 */}
    {canDelete && (
      <div
        className="hidden group-hover:flex items-center shrink-0 ml-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title="스캐폴드 삭제"
          onClick={() => onDelete(project.id, project.title)}
          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    )}
  </div>
);

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

  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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

  // 정해 둔 순서가 있으면 그 순서대로, 없으면 만든 순서대로 나열한다.
  const projectList = React.useMemo(
    () =>
      Object.values(workspace.projects).sort(
        (a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt)
      ),
    [workspace.projects]
  );

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createProject(newTitle.trim());

    setNewTitle('');
    setIsCreating(false);
  };

  const handleDelete = (targetProjId: string, title: string) => {
    if (window.confirm(`'${title}' 스캐폴드를 삭제하시겠습니까?`)) {
      deleteProject(targetProjId);
    }
  };

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className={`h-full border-r border-(--background-modifier-border) bg-(--background-secondary) flex flex-col select-none shrink-0 relative ${
        isResizing ? 'transition-none select-none' : 'transition-[width] duration-150'
      }`}
    >
      {/* 1. 사이드바 상단 워크스페이스 헤더 */}
      <div className="h-10 px-3.5 border-b border-(--background-modifier-border) flex items-center justify-between text-xs font-semibold text-(--text-normal)">
        <div className="flex items-center gap-2 truncate">
          <FolderTree className="w-4 h-4 text-(--interactive-accent) shrink-0" />
          <span className="truncate">{workspace.title || 'EXPLORER'}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          title="새 스캐폴드 추가"
          className="p-1 rounded hover:bg-(--background-modifier-hover) text-(--text-muted) hover:text-(--text-normal) transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. 프로젝트 목록 섹션 */}
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
            <span>SCAFFOLDS ({projectList.length})</span>
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
              placeholder="새 스캐폴드 이름..."
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
              onClick={() => setIsCreating(false)}
              className="px-1 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              ✕
            </button>
          </form>
        )}

        {/* 프로젝트 목록 */}
        {isSectionOpen &&
          projectList.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
              canDelete={projectList.length > 1}
              onFocus={focusProject}
              onDelete={handleDelete}
            />
          ))}
      </div>

      {/* 3. 사이드바 하단 정보 */}
      <div className="p-2.5 border-t border-(--background-modifier-border) text-[11px] text-(--text-muted) flex items-center justify-between">
        <span>스캐폴드 {projectList.length}개</span>
        <span className="text-[10px] text-(--text-faint)">Local-First</span>
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
