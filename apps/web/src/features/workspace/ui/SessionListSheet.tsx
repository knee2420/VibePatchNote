import React, { useState, useEffect } from 'react';
import { useHybridEditorState } from '@/features/topdown-outline/model/useHybridEditorState';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface WorkspaceSession {
  id: string;
  title: string;
  description?: string;
  nodes: any[];
  edges: any[];
  created_at: string;
  updated_at: string;
}

export function SessionListSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [sessions, setSessions] = useState<WorkspaceSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { loadSession, activeSessionId, activeSessionTitle, nodes, edges } = useHybridEditorState();

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/workspaces');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error('Failed to fetch sessions', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen]);

  const handleCreateSession = async () => {
    const title = prompt('새 세션 이름을 입력하세요:', 'New Session');
    if (!title) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: '' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessions([...sessions, data]);
        loadSession(data.id, data.title, data.nodes, data.edges);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCurrent = async () => {
    if (!activeSessionId) {
      handleCreateSession();
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/workspaces/${activeSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: activeSessionTitle, nodes, edges }),
      });
      if (res.ok) {
        alert('세션이 저장되었습니다.');
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말 이 세션을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/workspaces/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSessions();
        if (activeSessionId === id) {
          loadSession(null, 'Untitled Session', [], []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoad = (session: WorkspaceSession) => {
    loadSession(session.id, session.title, session.nodes, session.edges);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity">
      <div className="w-[400px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">워크스페이스 목록</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b flex gap-2">
          <button onClick={handleCreateSession} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition">
            <Plus size={16} /> 새 세션
          </button>
          <button onClick={handleSaveCurrent} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition">
            <Save size={16} /> 현재 저장
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-8">로딩 중...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">저장된 세션이 없습니다.</p>
          ) : (
            sessions.map(s => (
              <div 
                key={s.id} 
                onClick={() => handleLoad(s)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  activeSessionId === s.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800 truncate pr-2">{s.title}</h3>
                  <button onClick={(e) => handleDelete(s.id, e)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-200 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>노드 {s.nodes?.length || 0}개</span>
                  <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
