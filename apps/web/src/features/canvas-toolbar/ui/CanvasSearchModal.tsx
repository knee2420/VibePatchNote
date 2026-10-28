import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, FileText, StickyNote, File } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { REFERENCE_DOCUMENT_NODE_TYPE } from '@/entities/reference-document';
import { SEGMENT_NODE_TYPE } from '@/entities/segment';

import { useCanvasMode } from '../model/useCanvasMode';

export function CanvasSearchModal() {
  const { isSearchOpen, setIsSearchOpen } = useCanvasMode();
  const nodes = useCanvasBoardStore((s) => s.nodes);
  const setNodes = useCanvasBoardStore((s) => s.setNodes);
  const { setCenter } = useReactFlow();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Global shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const filteredNodes = useMemo(() => {
    if (!query.trim()) return nodes;
    const lower = query.toLowerCase();
    return nodes.filter((n) => {
      const title = String(n.data?.title || '').toLowerCase();
      const summary = String(n.data?.summary || '').toLowerCase();
      const content = String(n.data?.content || '').toLowerCase();
      return title.includes(lower) || summary.includes(lower) || content.includes(lower);
    });
  }, [nodes, query]);

  if (!isSearchOpen) return null;

  const handleSelectNode = (nodeId: string, posX: number, posY: number) => {
    // Select this node and focus canvas
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === nodeId,
      }))
    );
    setCenter(posX + 300, posY + 200, { zoom: 1, duration: 800 });
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="캔버스 내 카드 및 문서 검색... (제목, 내용)"
            className="flex-1 outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredNodes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              일치하는 카드가 없습니다.
            </div>
          ) : (
            filteredNodes.map((n) => {
              const title = String(n.data?.title || '제목 없음');
              const isRef = n.type === REFERENCE_DOCUMENT_NODE_TYPE;
              const isSegment = n.type === SEGMENT_NODE_TYPE;

              return (
                <button
                  key={n.id}
                  onClick={() => handleSelectNode(n.id, n.position.x, n.position.y)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50/80 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isRef ? (
                      <File className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : isSegment ? (
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <StickyNote className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 truncate group-hover:text-blue-600">
                      {title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.5 bg-slate-100 rounded">
                    {n.type}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
