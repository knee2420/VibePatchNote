/**
 * @file OutlineNote.tsx
 * @description Workflowy 스타일 불릿 부연설명 노트 (테두리 없는 자연스러운 서브타이틀 & 양방향 캐럿 네비게이션)
 */

import React, { useEffect, useRef, useState } from 'react';
import { type FlattenedNode, getNextFocusId } from '@vibe/outliner-core';
import { useWorkspaceStore } from '@/entities/workspace';

interface OutlineNoteProps {
  nodeId: string;
  note: string;
  flattenedNodes: FlattenedNode[];
}

function isCaretAtStart(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return true;
  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length === 0;
}

function isCaretAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return true;
  const range = sel.getRangeAt(0);
  const postRange = range.cloneRange();
  postRange.selectNodeContents(el);
  postRange.setStart(range.endContainer, range.endOffset);
  return postRange.toString().length === 0;
}

export const OutlineNote: React.FC<OutlineNoteProps> = ({ nodeId, note, flattenedNodes }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isEditingRequested = useWorkspaceStore((s) => s.noteEditingNodeId === nodeId);
  const [isFocused, setIsFocused] = useState(false);
  const setNote = useWorkspaceStore((s) => s.setNote);
  const startNoteEdit = useWorkspaceStore((s) => s.startNoteEdit);
  const endNoteEdit = useWorkspaceStore((s) => s.endNoteEdit);
  const setFocus = useWorkspaceStore((s) => s.setFocus);
  const insertAfter = useWorkspaceStore((s) => s.insertAfter);

  const isExpanded = isFocused || isEditingRequested;

  // 1. 저장된 노트 반영
  useEffect(() => {
    if (ref.current && ref.current.textContent !== note) {
      ref.current.textContent = note;
    }
  }, [note]);

  // 2. 노트 편집 요청(메뉴·단축키·방향키) 시 맨 끝 또는 맨 앞에 포커스
  useEffect(() => {
    if (!isEditingRequested || !ref.current) return;
    if (document.activeElement === ref.current) return;
    ref.current.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.selectAllChildren(ref.current);
      sel.collapseToEnd();
    }
  }, [isEditingRequested]);

  // 상위 불릿 본문으로 포커스를 복귀시키는 헬퍼
  const focusParentBullet = (toEnd = true) => {
    endNoteEdit();
    const parentRow = ref.current?.closest('[data-node-id]');
    const bulletInput = parentRow?.querySelector<HTMLElement>(
      '[contenteditable][data-node-id]'
    );
    if (!bulletInput) return;
    bulletInput.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.selectAllChildren(bulletInput);
      if (toEnd) {
        sel.collapseToEnd();
      } else {
        sel.collapseToStart();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';

    // 1. Escape 또는 Shift+Enter: 노트를 마치고 상위 불릿 본문으로 복귀
    if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey && !e.nativeEvent.isComposing)) {
      e.preventDefault();
      e.stopPropagation();
      focusParentBullet(true);
      return;
    }

    // 2. 비어있는 상태에서 Enter: 노트를 닫고 바로 다음 형제 불릿 생성!
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && text.trim() === '') {
      e.preventDefault();
      e.stopPropagation();
      setNote(nodeId, ''); // 빈 노트 정리
      endNoteEdit();
      const createdId = insertAfter(nodeId, '');
      if (createdId) {
        setFocus(createdId, 0);
      }
      return;
    }

    // 3. ArrowUp: 첫 번째 글자(오프셋 0)에서 위를 누르면 상위 불릿 본문 끝으로 부드럽게 복귀
    if (e.key === 'ArrowUp' && !e.shiftKey) {
      if (ref.current && isCaretAtStart(ref.current)) {
        e.preventDefault();
        e.stopPropagation();
        focusParentBullet(true);
        return;
      }
    }

    // 4. ArrowDown: 마지막 글자에서 아래를 누르면 다음 불릿 노드로 자연스럽게 하강
    if (e.key === 'ArrowDown' && !e.shiftKey) {
      if (ref.current && isCaretAtEnd(ref.current)) {
        const nextId = getNextFocusId(flattenedNodes, nodeId, 'down');
        if (nextId) {
          e.preventDefault();
          e.stopPropagation();
          endNoteEdit();
          setFocus(nextId, 0);
          return;
        }
      }
    }

    // 5. Backspace: 노트가 완전히 비어있을 때 백스페이스를 누르면 노트를 삭제하고 상위 불릿 끝으로 복귀
    if (e.key === 'Backspace' && text === '' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.stopPropagation();
      setNote(nodeId, '');
      focusParentBullet(true);
      return;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    endNoteEdit();
    const text = e.currentTarget.textContent || '';
    // 포커스를 잃었을 때 내용이 비어있으면 흔적 없이 자동 소멸(Auto-prune)!
    if (text.trim() === '') {
      setNote(nodeId, '');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    startNoteEdit(nodeId);
  };

  return (
    <div className="relative group/note">
      <div
        ref={ref}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        onInput={(e) => setNote(nodeId, e.currentTarget.textContent || '')}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-note-for={nodeId}
        data-placeholder="노트를 입력하세요..."
        className={`w-full px-1.5 pb-1 -mt-0.5 min-h-[18px] font-[var(--font-text-theme)] text-[13px] text-(--text-muted) font-normal leading-[1.7] tracking-[-0.005em] rounded hover:text-(--text-normal) hover:bg-(--background-modifier-hover)/40 focus:text-(--text-normal) focus:bg-(--background-modifier-hover)/60 outline-none transition-all break-words cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-(--text-faint) empty:before:italic ${
          isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1 overflow-hidden'
        }`}
      />
    </div>
  );
};
