/**
 * @file OutlineInput.tsx
 * @description plaintext-only contenteditable 기반 초경량 아웃라인 텍스트 입력 에디터
 */

import React, { useEffect, useRef } from 'react';
import type { OutlineNodeType } from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';

/** 불릿 종류별 글자 모양 */
const TYPE_STYLES: Record<OutlineNodeType, string> = {
  bullet: 'text-sm font-normal',
  todo: 'text-sm font-normal',
  paragraph: 'text-sm font-normal',
  h1: 'text-2xl font-bold tracking-tight',
  h2: 'text-xl font-semibold',
  h3: 'text-lg font-semibold',
  quote: 'text-sm italic border-l-2 border-slate-600 pl-3',
  code: 'text-xs font-mono bg-slate-900 border border-slate-800',
  divider: 'text-sm font-normal',
};

interface OutlineInputProps {
  nodeId: string;
  initialText: string;
  nodeType?: OutlineNodeType;
  isCompleted?: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const OutlineInput: React.FC<OutlineInputProps> = ({
  nodeId,
  initialText,
  nodeType = 'bullet',
  isCompleted = false,
  onKeyDown,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const focusedNodeId = useWorkspaceStore((s) => s.focusedNodeId);
  const targetCaretOffset = useWorkspaceStore((s) => s.targetCaretOffset);
  const updateText = useWorkspaceStore((s) => s.updateText);

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
      className={`flex-1 py-0.5 px-1.5 min-h-[26px] font-[var(--font-text-theme)] leading-[1.7] tracking-[-0.005em] rounded hover:bg-(--background-modifier-hover) focus:bg-(--background-modifier-hover)/60 focus:ring-1 focus:ring-(--interactive-accent)/50 transition-colors break-words whitespace-pre-wrap cursor-text ${
        TYPE_STYLES[nodeType]
      } ${
        isCompleted
          ? 'text-(--text-muted) opacity-60 line-through decoration-slate-600'
          : nodeType === 'quote'
            ? 'text-(--text-muted) italic'
            : 'text-(--text-normal)'
      }`}
      data-placeholder="내용을 입력하세요..."
    />
  );
};
