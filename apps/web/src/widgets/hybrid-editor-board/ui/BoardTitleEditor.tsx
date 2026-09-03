import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

import { DEFAULT_SESSION_TITLE } from '@/entities/workspace-session';
import { useActiveSessionTitle } from '@/features/workspace';

const FALLBACK_TITLE = 'React Flow + Tiptap Integration';

/** 보드 헤더의 세션 제목 인라인 편집기. */
export function BoardTitleEditor() {
  const { activeSessionTitle, renameActiveSession } = useActiveSessionTitle();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(activeSessionTitle || DEFAULT_SESSION_TITLE);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) renameActiveSession(trimmed);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          autoFocus
          className="px-1.5 py-0.5 text-xs font-medium text-slate-800 border border-blue-400 rounded outline-none ring-1 ring-blue-300"
        />
        <button onClick={commit} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded" title="저장">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="p-0.5 text-slate-400 hover:bg-slate-100 rounded"
          title="취소"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <p
        className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer font-medium transition"
        title="더블클릭하여 세션 이름 수정"
        onDoubleClick={startEdit}
      >
        {activeSessionTitle || FALLBACK_TITLE}
      </p>
      <button
        onClick={startEdit}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 rounded transition"
        title="세션 이름 수정"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}
