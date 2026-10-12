/**
 * @file context.tsx
 * @description 편집 화면 하나를 감싸는 공급자와, 그 안의 컴포넌트가 쓰는 접근 훅
 *
 * 호스트는 "스캐폴드의 지금 내용(rootNodes·defaultView)", "편집 상태 스토어", "호스트 창구" 셋을 넘긴다.
 * 내용은 호스트가 주인이라 props 로 받고, 바뀔 때마다 호스트가 다시 넘겨준다.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useStore } from 'zustand';
import type { OutlineNode, ViewMode } from '@vibe/outliner-core';
import type { OutlineEditorState, OutlineEditorStore } from './editorStore';
import type { OutlineHost } from './host';

interface OutlineEditorContextValue {
  store: OutlineEditorStore;
  host: OutlineHost;
  rootNodes: OutlineNode[];
  defaultView: ViewMode | undefined;
}

const OutlineEditorContext = createContext<OutlineEditorContextValue | null>(null);

interface OutlineEditorProviderProps {
  store: OutlineEditorStore;
  host: OutlineHost;
  rootNodes: OutlineNode[];
  defaultView?: ViewMode;
  children: React.ReactNode;
}

export const OutlineEditorProvider: React.FC<OutlineEditorProviderProps> = ({
  store,
  host,
  rootNodes,
  defaultView,
  children,
}) => {
  const value = useMemo(
    () => ({ store, host, rootNodes, defaultView }),
    [store, host, rootNodes, defaultView]
  );
  return <OutlineEditorContext.Provider value={value}>{children}</OutlineEditorContext.Provider>;
};

function useOutlineEditorContext(): OutlineEditorContextValue {
  const value = useContext(OutlineEditorContext);
  if (!value) throw new Error('OutlineEditorProvider 안에서만 쓸 수 있습니다.');
  return value;
}

/** 편집 상태의 일부를 구독한다. */
export function useEditorStore<T>(selector: (state: OutlineEditorState) => T): T {
  return useStore(useOutlineEditorContext().store, selector);
}

/** 구독하지 않고 그때그때의 편집 상태를 읽을 때 쓴다. (이벤트 처리 안에서) */
export function useEditorApi(): OutlineEditorStore {
  return useOutlineEditorContext().store;
}

/** 지금 스캐폴드의 불릿 트리 */
export function useOutlineRoots(): OutlineNode[] {
  return useOutlineEditorContext().rootNodes;
}

/** 지금 스캐폴드의 기본 보기 방식 */
export function useOutlineDefaultView(): ViewMode | undefined {
  return useOutlineEditorContext().defaultView;
}

export function useOutlineHost(): OutlineHost {
  return useOutlineEditorContext().host;
}

/** 편집 화면이 지금 떠 있는 창 */
export function useEditorWindow(): Window {
  return useOutlineEditorContext().host.getPortalRoot().ownerDocument.defaultView ?? window;
}
