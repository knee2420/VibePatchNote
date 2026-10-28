import { Plus, Save, X } from 'lucide-react';

import { useWorkspaceSessions } from '../model/useWorkspaceSessions';
import { SessionListItem } from './SessionListItem';

interface SessionListSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionListSheet({ isOpen, onClose }: SessionListSheetProps) {
  const {
    sessions,
    isLoading,
    activeSessionId,
    createSession,
    saveActiveSession,
    renameSession,
    deleteSession,
    openSession,
  } = useWorkspaceSessions({ enabled: isOpen });

  const handleCreate = () => {
    const title = prompt('새 세션 이름을 입력하세요:', 'New Session');
    if (title) createSession(title);
  };

  const handleSaveCurrent = async () => {
    const saved = await saveActiveSession();
    if (saved) {
      alert('세션이 저장되었습니다.');
    } else {
      handleCreate();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 이 세션을 삭제하시겠습니까?')) {
      deleteSession(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity">
      <div className="w-[400px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">워크스페이스 목록</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b flex gap-2">
          <button
            onClick={handleCreate}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> 새 세션
          </button>
          <button
            onClick={handleSaveCurrent}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition"
          >
            <Save size={16} /> 현재 저장
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-8">로딩 중...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">저장된 세션이 없습니다.</p>
          ) : (
            sessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onOpen={openSession}
                onRename={renameSession}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
