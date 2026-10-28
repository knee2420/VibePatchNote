import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';

import type { WorkspaceSession } from '@/entities/workspace-session';

interface SessionListItemProps {
  session: WorkspaceSession;
  isActive: boolean;
  onOpen: (session: WorkspaceSession) => void;
  onRename: (session: WorkspaceSession, nextTitle: string) => void;
  onDelete: (id: string) => void;
}

export function SessionListItem({
  session,
  isActive,
  onOpen,
  onRename,
  onDelete,
}: SessionListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(session.title);

  const startEdit = () => {
    setDraftTitle(session.title);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== session.title) {
      onRename(session, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => !isEditing && onOpen(session)}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 pr-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
              className="flex-1 px-2 py-1 text-sm font-semibold text-slate-800 bg-white border border-blue-400 rounded-md outline-none ring-2 ring-blue-200"
            />
            <button
              onClick={commit}
              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              title="저장"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition"
              title="취소"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2 group">
            <h3
              className="font-semibold text-slate-800 truncate"
              title={session.title}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEdit();
              }}
            >
              {session.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEdit();
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition"
              title="세션 이름 수정"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.id);
          }}
          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-200 transition shrink-0"
          title="세션 삭제"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>노드 {session.nodes?.length ?? 0}개</span>
        <span>{new Date(session.updated_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
