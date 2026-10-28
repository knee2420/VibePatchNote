/**
 * @file useContextMenu.ts
 * @description 불릿 노드 메뉴의 열림 상태(대상 노드·위치) 및 닫힘 조건 관리 훅
 *
 * 메뉴는 명시적인 클릭 동작으로만 열린다:
 * - "⋯" 손잡이 클릭 (열려있으면 토글로 닫힘)
 * - 불릿 점 우클릭
 * 바깥을 누르거나 Esc를 누르면 닫힌다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NodeId } from '../../core';
import { useEditorWindow } from '../session/context';

export interface ContextMenuState {
  nodeId: NodeId;
  x: number;
  y: number;
}

export function useContextMenu() {
  const win = useEditorWindow();
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /** 메뉴 열기 (동일 노드 다시 클릭 시 토글 닫힘) */
  const openMenu = useCallback((nodeId: NodeId, x: number, y: number) => {
    setMenu((current) => (current?.nodeId === nodeId ? null : { nodeId, x, y }));
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

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

  return { menu, menuRef, openMenu, closeMenu };
}
