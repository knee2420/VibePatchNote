import { memo, useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2, Wand2 } from 'lucide-react';
import type { InlinePromptModalProps } from './types';

const DEFAULT_QUICK_ACTIONS = [
  { id: 'summarize', label: '핵심 요약', prompt: '선택한 텍스트의 핵심 내용을 간결하게 요약해줘.' },
  { id: 'to_table', label: '표로 재구성', prompt: '선택한 텍스트를 논리적인 표(Table) 형식으로 변환해줘.' },
  { id: 'formal', label: '격식체 교정', prompt: '선택한 텍스트를 공문서/보고서용 정중하고 격식 있는 문체로 교정해줘.' },
  { id: 'expand', label: '세부 보강', prompt: '선택한 텍스트의 논리적 근거와 세부 설명을 보강해줘.' },
];

/**
 * InlinePromptModal (안티그래비티 Ctrl + I 인라인 플로팅 프롬프트)
 *
 * 에디터에서 텍스트를 선택하고 Ctrl+I를 눌렀을 때 선택 영역 바로 위에 팝업되는 플로팅 지시창.
 */
export const InlinePromptModal = memo(function InlinePromptModal({
  isOpen,
  selectedText = '',
  position,
  onSubmit,
  onClose,
  isLoading = false,
  quickActions = DEFAULT_QUICK_ACTIONS,
  placeholder = '선택한 텍스트에 적용할 작업을 지시하세요 (Enter로 실행, Esc로 닫기)...',
  className = '',
}: InlinePromptModalProps) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setPrompt('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isLoading) {
        onSubmit(prompt.trim(), selectedText);
      }
    }
  };

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: Math.max(10, position.top - 70),
        left: Math.max(10, position.left),
        zIndex: 100,
      }
    : {
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
      };

  return (
    <div style={style} className={`w-[420px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-150 ${className}`}>
      <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-900/95 border border-indigo-500/70 shadow-2xl backdrop-blur-md text-xs">
        {/* 선택된 텍스트 프리뷰 (컴팩트) */}
        {selectedText && (
          <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-mono">
            <span className="truncate max-w-[320px] italic">"{selectedText.trim()}"</span>
            <span className="shrink-0">{selectedText.length}자 선택됨</span>
          </div>
        )}

        {/* 인풋 바 */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus-within:border-indigo-500 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
          ) : (
            <button
              type="button"
              disabled={!prompt.trim()}
              onClick={() => onSubmit(prompt.trim(), selectedText)}
              className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* 빠른 프리셋 칩 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {quickActions.map((qa) => (
            <button
              key={qa.id}
              type="button"
              onClick={() => {
                setPrompt(qa.prompt);
                onSubmit(qa.prompt, selectedText);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-200 border border-slate-700/60 hover:border-indigo-600/60 text-[10px] text-slate-300 transition-colors whitespace-nowrap cursor-pointer select-none"
            >
              {qa.icon || <Wand2 className="w-2.5 h-2.5 text-indigo-400" />}
              <span>{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
