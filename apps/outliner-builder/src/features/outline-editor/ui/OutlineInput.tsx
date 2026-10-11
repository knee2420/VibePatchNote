/**
 * @file OutlineInput.tsx
 * @description plaintext-only contenteditable 기반 초경량 아웃라인 텍스트 입력 에디터
 */

import React, { useEffect, useRef } from 'react';
import { useTreeStore } from '@/entities/outline-document';

interface OutlineInputProps {
  nodeId: string;
  initialText: string;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const OutlineInput: React.FC<OutlineInputProps> = ({
  nodeId,
  initialText,
  onKeyDown,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const focusedNodeId = useTreeStore((s) => s.focusedNodeId);
  const targetCaretOffset = useTreeStore((s) => s.targetCaretOffset);
  const updateText = useTreeStore((s) => s.updateText);

  // 1. 초기 텍스트 반영
  useEffect(() => {
    if (ref.current && ref.current.textContent !== initialText) {
      ref.current.textContent = initialText;
    }
  }, [initialText]);

  // 2. 포커스 및 캐럿 오프셋 복원
  useEffect(() => {
    if (focusedNodeId === nodeId && ref.current) {
      ref.current.focus();

      if (targetCaretOffset !== null) {
        try {
          const sel = window.getSelection();
          if (sel && ref.current.firstChild) {
            const range = document.createRange();
            const textNode = ref.current.firstChild;
            const length = textNode.textContent?.length || 0;
            const safeOffset = Math.min(targetCaretOffset, length);

            range.setStart(textNode, safeOffset);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        } catch {
          // 텍스트 노드 미생성 시 예외 무시
        }
      }
    }
  }, [focusedNodeId, nodeId, targetCaretOffset]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    updateText(nodeId, text);
  };

  return (
    <div
      ref={ref}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={onKeyDown}
      data-node-id={nodeId}
      className="flex-1 py-1 px-1.5 min-h-[26px] text-sm text-slate-100 font-normal leading-relaxed rounded hover:bg-slate-900/60 focus:bg-slate-900/90 focus:ring-1 focus:ring-indigo-500/50 transition-colors break-words whitespace-pre-wrap cursor-text"
      data-placeholder="내용을 입력하세요..."
    />
  );
};
