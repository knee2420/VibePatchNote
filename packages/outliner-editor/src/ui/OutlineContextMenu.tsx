/**
 * @file OutlineContextMenu.tsx
 * @description 불릿 노드 메뉴 (Workflowy 스타일 다크 테마 플로팅 메뉴)
 * - "⋯" 손잡이에 마우스를 올리거나 누를 때, 불릿 점을 우클릭할 때 열린다.
 * - 여러 불릿을 골라 둔 상태에서 그중 하나의 메뉴를 열면, 고른 묶음 전체에 적용된다.
 */

import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FlattenedNode, NodeId } from '@vibe/outliner-core';
import {
  CheckCircle2,
  FileText,
  Copy,
  MoveRight,
  Shapes,
  ChevronsUpDown,
  ChevronsDownUp,
  Link2,
  Paperclip,
  Download,
  Trash2,
  ChevronRight,
  PanelRight,
} from 'lucide-react';
import { TURN_INTO_OPTIONS, useNodeActions } from '../model/useNodeActions';
import { useEditorStore, useEditorWindow, useOutlineHost } from '../session/context';
import { useFileAttach } from '../attachments/useFileAttach';

interface OutlineContextMenuProps {
  item: FlattenedNode;
  /** 조작 대상 불릿들 (보통 한 개, 여러 개를 골라 둔 상태면 그 묶음) */
  targetIds: NodeId[];
  x: number;
  y: number;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onRequestMove: (nodeIds: NodeId[]) => void;
}

const MENU_WIDTH = 240;
const VIEWPORT_MARGIN = 8;

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  danger?: boolean;
  disabled?: boolean;
  trailing?: React.ReactNode;
  onSelect: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  hint,
  danger,
  disabled,
  trailing,
  onSelect,
}) => (
  <button
    type="button"
    role="menuitem"
    disabled={disabled}
    onClick={onSelect}
    className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs transition-colors ${
      disabled
        ? 'text-(--text-faint) cursor-not-allowed'
        : danger
          ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 cursor-pointer'
          : 'text-(--text-normal) hover:bg-(--background-modifier-hover)/80 hover:text-(--text-normal) cursor-pointer'
    }`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="flex-1 truncate">{label}</span>
    {hint && <span className="shrink-0 text-[10px] text-(--text-faint)">{hint}</span>}
    {trailing}
  </button>
);

const Separator: React.FC = () => <div className="my-1 border-t border-(--background-modifier-border)" />;

export const OutlineContextMenu: React.FC<OutlineContextMenuProps> = ({
  item,
  targetIds,
  x,
  y,
  menuRef,
  onClose,
  onRequestMove,
}) => {
  const actions = useNodeActions();
  const { canAttach, pickAndAttach } = useFileAttach();
  const detachFile = useEditorStore((s) => s.detachFile);
  const host = useOutlineHost();
  const win = useEditorWindow();
  const [isTypeListOpen, setIsTypeListOpen] = useState(false);

  const isSingle = targetIds.length === 1;
  const currentType = item.node.viewMode === 'board' ? 'board' : (item.node.nodeType ?? 'bullet');

  // 실제 크기를 잰 뒤 화면 밖으로 나가지 않도록 위치를 당긴다. (종류 목록을 펼쳐 길어져도 다시 맞춘다)
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = Math.max(VIEWPORT_MARGIN, Math.min(x, win.innerWidth - width - VIEWPORT_MARGIN));
    const top = Math.max(VIEWPORT_MARGIN, Math.min(y, win.innerHeight - height - VIEWPORT_MARGIN));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [menuRef, x, y, isTypeListOpen, win]);

  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      data-row-control
      style={{ left: x, top: y, width: MENU_WIDTH }}
      onContextMenu={(e) => e.preventDefault()}
      className="outline-menu-pop fixed z-[100] py-1 max-h-[calc(100vh-16px)] overflow-y-auto rounded-lg bg-(--background-secondary)/95 border border-(--background-modifier-border) backdrop-blur-md shadow-2xl shadow-black/60 select-none"
    >
      {!isSingle && (
        <div className="px-3 py-1 text-[10px] font-semibold text-(--text-accent)">
          고른 불릿 {targetIds.length}개에 적용
        </div>
      )}

      <MenuItem
        icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        label={isSingle && item.node.isCompleted ? '완료 취소' : '완료 처리'}
        hint="Ctrl+Enter"
        onSelect={run(() => actions.setNodesCompleted(targetIds))}
      />
      {isSingle && (
        <MenuItem
          icon={<FileText className="w-3.5 h-3.5 text-sky-400" />}
          label={item.node.note ? '노트 편집' : '노트 추가'}
          hint="Shift+Enter"
          onSelect={run(() => actions.startNoteEdit(item.id))}
        />
      )}
      {isSingle && canAttach && (
        <MenuItem
          icon={<Paperclip className="w-3.5 h-3.5 text-amber-400" />}
          label="파일 붙이기..."
          onSelect={run(() => void pickAndAttach(item.id))}
        />
      )}
      {isSingle && item.node.file && (
        <MenuItem
          icon={<Paperclip className="w-3.5 h-3.5 text-(--text-muted)" />}
          label="파일 떼기"
          onSelect={run(() => detachFile(item.id))}
        />
      )}

      <Separator />

      <MenuItem
        icon={<Copy className="w-3.5 h-3.5 text-(--text-muted)" />}
        label="복제"
        onSelect={run(() => actions.duplicateNodes(targetIds))}
      />
      <MenuItem
        icon={<MoveRight className="w-3.5 h-3.5 text-(--text-muted)" />}
        label="이동..."
        onSelect={run(() => onRequestMove(targetIds))}
      />
      <MenuItem
        icon={<Shapes className="w-3.5 h-3.5 text-violet-400" />}
        label="종류 바꾸기"
        trailing={
          <ChevronRight
            className={`w-3 h-3 text-(--text-faint) transition-transform ${isTypeListOpen ? 'rotate-90' : ''}`}
          />
        }
        onSelect={() => setIsTypeListOpen((open) => !open)}
      />
      {isTypeListOpen && (
        <div className="mx-2 mb-1 p-1 grid grid-cols-2 gap-0.5 rounded-md bg-(--background-primary)/60 border border-(--background-modifier-border)">
          {TURN_INTO_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              onClick={run(() => actions.turnInto(targetIds, option.value))}
              className={`px-2 py-1 rounded text-left text-[11px] transition-colors cursor-pointer ${
                isSingle && currentType === option.value
                  ? 'bg-(--interactive-accent)/20 text-(--text-accent)'
                  : 'text-(--text-muted) hover:bg-(--background-modifier-hover) hover:text-(--text-normal)'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <Separator />

      <MenuItem
        icon={<ChevronsUpDown className="w-3.5 h-3.5 text-(--text-muted)" />}
        label="전체 펼치기"
        disabled={isSingle && !item.hasChildren}
        onSelect={run(() => actions.setFoldAll(targetIds, false))}
      />
      <MenuItem
        icon={<ChevronsDownUp className="w-3.5 h-3.5 text-(--text-muted)" />}
        label="전체 접기"
        disabled={isSingle && !item.hasChildren}
        onSelect={run(() => actions.setFoldAll(targetIds, true))}
      />

      {isSingle && (
        <>
          <Separator />
          <MenuItem
            icon={<Link2 className="w-3.5 h-3.5 text-(--text-muted)" />}
            label="내부 링크 복사"
            onSelect={run(() => void actions.copyNodeLink(item.id))}
          />
          {host.nodeMenuItems?.(item.id).map((extra) => (
            <MenuItem
              key={extra.label}
              icon={<PanelRight className="w-3.5 h-3.5 text-(--text-muted)" />}
              label={extra.label}
              onSelect={run(extra.run)}
            />
          ))}
        </>
      )}
      <MenuItem
        icon={<Download className="w-3.5 h-3.5 text-(--text-muted)" />}
        label="내보내기 (텍스트 파일)"
        onSelect={run(() => actions.exportNodes(targetIds))}
      />

      <Separator />

      <MenuItem
        icon={<Trash2 className="w-3.5 h-3.5" />}
        label="삭제"
        hint={isSingle ? 'Ctrl+Shift+Backspace' : 'Delete'}
        danger
        onSelect={run(() => actions.removeNodes(targetIds))}
      />
    </div>,
    host.getPortalRoot()
  );
};
