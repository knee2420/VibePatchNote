/**
 * @file useContextMenu.ts
 * @description 불릿 노드 메뉴의 열림 상태(대상 노드·위치) 및 닫힘 조건 관리 훅
 *
 * 메뉴는 두 가지 방법으로 열린다.
 * - 고정 열기: 불릿 점 우클릭, "⋯" 손잡이 클릭. 바깥을 누르거나 Esc 를 눌러야 닫힌다.
 * - 호버 열기: "⋯" 손잡이에 마우스를 올리면 잠시 뒤 열리고, 손잡이와 메뉴를 모두 벗어나면 닫힌다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NodeId } from '@vibe/outliner-core';
import { useEditorWindow } from '../session/context';

export interface ContextMenuState {
  nodeId: NodeId;
  x: number;
  y: number;
  /** 고정 열기인지 (false 면 호버로 열린 상태) */
  pinned: boolean;
}

const HOVER_OPEN_DELAY_MS = 220;
const HOVER_CLOSE_DELAY_MS = 280;

export function useContextMenu() {
  const win = useEditorWindow();
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearOpenTimer = () => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    openTimer.current = null;
  };
  const clearCloseTimer = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const openMenu = useCallback((nodeId: NodeId, x: number, y: number) => {
    clearOpenTimer();
    clearCloseTimer();
    setMenu({ nodeId, x, y, pinned: true });
  }, []);

  const closeMenu = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setMenu(null);
  }, []);

  /** 손잡이에 마우스가 올라왔다: 잠시 뒤 그 자리에 메뉴를 연다. */
  const hoverOpen = useCallback((nodeId: NodeId, x: number, y: number) => {
    clearCloseTimer();
    clearOpenTimer();
    openTimer.current = window.setTimeout(() => {
      setMenu((current) => (current?.pinned ? current : { nodeId, x, y, pinned: false }));
    }, HOVER_OPEN_DELAY_MS);
  }, []);

  /** 손잡이나 메뉴에서 마우스가 벗어났다: 잠시 뒤 호버로 열린 메뉴를 닫는다. */
  const hoverLeave = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setMenu((current) => (current && !current.pinned ? null : current));
    }, HOVER_CLOSE_DELAY_MS);
  }, []);

  /** 메뉴 위에 마우스가 머문다: 닫기를 취소한다. */
  const hoverStay = useCallback(() => clearCloseTimer(), []);

  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    []
  );

  // 열려 있는 동안에만: 바깥 클릭 · Escape · (메뉴 밖) 스크롤 · 창 크기 변경 시 닫는다.
  useEffect(() => {
    if (!menu) return;

    const isInsideMenu = (target: EventTarget | null) =>
      target !== null && 'nodeType' in target && menuRef.current?.contains(target as Node) === true;

    const handlePointerDown = (e: MouseEvent) => {
      if (!isInsideMenu(e.target)) setMenu(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    const handleScroll = (e: Event) => {
      if (!isInsideMenu(e.target)) setMenu(null);
    };
    const handleResize = () => setMenu(null);

    win.addEventListener('mousedown', handlePointerDown);
    win.addEventListener('keydown', handleKeyDown);
    win.addEventListener('scroll', handleScroll, true);
    win.addEventListener('resize', handleResize);
    return () => {
      win.removeEventListener('mousedown', handlePointerDown);
      win.removeEventListener('keydown', handleKeyDown);
      win.removeEventListener('scroll', handleScroll, true);
      win.removeEventListener('resize', handleResize);
    };
  }, [menu, win]);

  return { menu, menuRef, openMenu, closeMenu, hoverOpen, hoverLeave, hoverStay };
}
