import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  MoreHorizontal,
  Search,
  Check,
  Layers,
} from 'lucide-react';
import type { ActivityBarTab, FileTreeNode } from '../model/types';

interface IdePrimarySidebarProps {
  activeTab: ActivityBarTab;
  fileTree: FileTreeNode[];
  activeFileId?: string;
  onOpenFile: (node: FileTreeNode) => void;
  onToggleFolder: (folderId: string) => void;
}

export function IdePrimarySidebar({
  activeTab,
  fileTree,
  activeFileId,
  onOpenFile,
  onToggleFolder,
}: IdePrimarySidebarProps) {
  // 아코디언 섹션 상태
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isWorkspaceTreeOpen, setIsWorkspaceTreeOpen] = useState(true);

  // 검색 인풋 상태
  const [searchTerm, setSearchTerm] = useState('');

  // 소스 제어 커밋 메시지
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitted, setIsCommitted] = useState(false);

  // 파일 아이콘 헬퍼
  const renderFileIcon = (fileName: string, type?: string) => {
    if (type === 'wireframe' || fileName.endsWith('.canvas')) {
      return <Layers className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (fileName.endsWith('.html')) {
      return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    }
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
      return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    if (fileName.endsWith('.json')) {
      return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (fileName.endsWith('.md')) {
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  // 재귀적 파일 트리 렌더러
  const renderTree = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isSelected = node.id === activeFileId;
      const paddingLeft = `${depth * 14 + 10}px`;

      if (node.isFolder) {
        return (
          <div key={node.id} className="select-none">
            <div
              style={{ paddingLeft }}
              onClick={() => onToggleFolder(node.id)}
              className="flex items-center gap-1.5 py-1 text-xs text-slate-300 hover:bg-slate-800/60 cursor-pointer group"
            >
              {node.isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
              )}
              {node.isOpen ? (
                <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-indigo-400/80 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
            {node.isOpen && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.id}
          style={{ paddingLeft }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', fileId: node.id }));
            e.dataTransfer.effectAllowed = 'copyMove';
          }}
          onClick={() => onOpenFile(node)}
          className={`flex items-center justify-between pr-3 py-1 text-xs cursor-pointer select-none transition-colors group ${
            isSelected
              ? 'bg-slate-800 text-white font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="클릭하여 열거나, 에디터 영역으로 드래그하여 분할 창에 열기"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-3.5" />
            {renderFileIcon(node.name, node.type)}
            <span className="truncate">{node.name}</span>
          </div>

          {/* Git 변경 상태 배지 */}
          {node.gitStatus && (
            <span
              className={`text-[10px] font-bold shrink-0 font-mono ${
                node.gitStatus === 'M' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {node.gitStatus}
            </span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col text-slate-300 overflow-hidden select-none">
      {/* 1. 패널 상단 헤더 */}
      <div className="h-8.5 px-3 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 shrink-0">
        <span>
          {activeTab === 'explorer' && 'Explorer'}
          {activeTab === 'search' && 'Search'}
          {activeTab === 'sourceControl' && 'Source Control'}
          {activeTab === 'runDebug' && 'Run and Debug'}
          {activeTab === 'extensions' && 'Extensions'}
          {activeTab === 'antigravity' && 'Antigravity Workspace'}
        </span>
        <button
          type="button"
          className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          title="Views and More Actions"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. 패널 본문 (선택된 액티비티에 따라 렌더링) */}
      <div className="flex-1 overflow-y-auto">
        {/* [A] Explorer 뷰 */}
        {activeTab === 'explorer' && (
          <div className="flex flex-col h-full">
            {/* 1) 워크스페이스 프로젝트 트리 아코디언 */}
            <div className="border-b border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsWorkspaceTreeOpen((prev: boolean) => !prev)}
                className="w-full flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-800/40 cursor-pointer uppercase tracking-wider"
              >
                {isWorkspaceTreeOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>VibePatchNote</span>
              </button>

              {isWorkspaceTreeOpen && <div className="pb-2">{renderTree(fileTree)}</div>}
            </div>

            {/* 2) Outline 아코디언 */}
            <div className="border-b border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsOutlineOpen((prev: boolean) => !prev)}
                className="w-full flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer uppercase tracking-wider"
              >
                {isOutlineOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Outline</span>
              </button>
              {isOutlineOpen && (
                <div className="px-5 py-2 text-xs text-slate-500 space-y-1">
                  <div>EditorLabPage (function)</div>
                  <div>navigate (const)</div>
                </div>
              )}
            </div>

            {/* 3) Timeline 아코디언 */}
            <div>
              <button
                type="button"
                onClick={() => setIsTimelineOpen((prev: boolean) => !prev)}
                className="w-full flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer uppercase tracking-wider"
              >
                {isTimelineOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Timeline</span>
              </button>
              {isTimelineOpen && (
                <div className="px-5 py-2 text-xs text-slate-500">
                  <div>Local History (Just now)</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* [B] Search 뷰 */}
        {activeTab === 'search' && (
          <div className="p-3 space-y-3 text-xs">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search (files to include...)"
                className="w-full bg-slate-800/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
            <div className="text-[11px] text-slate-400">
              {searchTerm ? `2 results in 1 file for "${searchTerm}"` : 'Type a query to search across files.'}
            </div>
          </div>
        )}

        {/* [C] Source Control 뷰 */}
        {activeTab === 'sourceControl' && (
          <div className="p-3 space-y-3 text-xs">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Message (Ctrl+Enter to commit)"
              rows={3}
              className="w-full bg-slate-800/80 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              type="button"
              onClick={() => {
                if (commitMessage.trim()) {
                  setIsCommitted(true);
                  setCommitMessage('');
                  setTimeout(() => setIsCommitted(false), 2000);
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 rounded flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isCommitted ? 'Committed!' : 'Commit & Push'}</span>
            </button>
            <div className="text-[11px] font-bold text-slate-400 pt-2 uppercase">Changes (2)</div>
            <div className="space-y-1 text-slate-300">
              <div className="flex items-center justify-between hover:bg-slate-800/50 p-1 rounded">
                <span>EditorLabPage.tsx</span>
                <span className="text-amber-400 font-mono">M</span>
              </div>
              <div className="flex items-center justify-between hover:bg-slate-800/50 p-1 rounded">
                <span>editor-lab-workspace/</span>
                <span className="text-emerald-400 font-mono">U</span>
              </div>
            </div>
          </div>
        )}

        {/* [D] Antigravity 뷰 */}
        {activeTab === 'antigravity' && (
          <div className="p-3 space-y-3 text-xs">
            <div className="p-2.5 bg-indigo-950/40 border border-indigo-800/50 rounded-lg space-y-1">
              <div className="font-bold text-indigo-300">Agent Runtime Active</div>
              <div className="text-[11px] text-slate-400">StepCollector & Telemetry bus connected</div>
            </div>
            <div className="text-[11px] text-slate-400">
              Active Model: <span className="text-slate-200 font-mono">Gemini 3.8 Flash High</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
