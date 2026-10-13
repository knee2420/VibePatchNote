/**
 * @file OutlineInline.tsx
 * @description 마크다운 문서 및 캔버스 텍스트 카드 내에 삽입되는 아웃라인 임베드 뷰어/에디터 컴포넌트
 */

import React, { useEffect, useMemo } from 'react';
import { type App, Component, type TFile } from 'obsidian';
import {
  OutlineBoard,
  OutlineEditorProvider,
  OutlineHeader,
  OutlineTree,
  createOutlineEditorStore,
  useOutlineView,
} from '@vibe/outliner-editor';
import type { ViewMode } from '@vibe/outliner-core';
import { createObsidianHost } from '../../host/obsidianHost';
import { renameOutlineFile } from '../../document/outlineFiles';
import { useEmbedFileSync } from './useEmbedFileSync';

export interface OutlineInlineProps {
  app: App;
  file: TFile;
  /** 특정 불릿 하위만 줌인하여 렌더링할 경우 노드 ID */
  zoomNodeId?: string;
  /** 강제 지정할 뷰 모드 ('bullets' | 'board') */
  viewMode?: ViewMode;
  /** 최대 높이 (예: '500px', '400px', 'auto') */
  maxHeight?: string;
  /** 캔버스 카드 안에 임베드되었는지 여부 */
  isCanvasCard?: boolean;
}

const EmbedBody: React.FC<{ forcedView?: ViewMode }> = ({ forcedView }) => {
  const { view } = useOutlineView();
  const effectiveView = forcedView ?? view;
  return effectiveView === 'board' ? <OutlineBoard /> : <OutlineTree />;
};

export const OutlineInline: React.FC<OutlineInlineProps> = ({
  app,
  file,
  zoomNodeId,
  viewMode,
  maxHeight = '500px',
  isCanvasCard,
}) => {
  const { project, problem, isLoading, getRoots, commitRoots, setDefaultView } = useEmbedFileSync({
    app,
    file,
  });

  // 편집 상태(줌·포커스·선택)는 이 임베드가 떠 있는 동안 하나다. 내용이 바뀔 때마다 새로 만들면
  // 글자를 한 번 칠 때마다 포커스가 날아간다. 불릿 트리는 그때그때 getRoots 로 물어 간다.
  const editorStore = useMemo(() => {
    const store = createOutlineEditorStore({ getRoots, commitRoots, setDefaultView });
    if (zoomNodeId) {
      store.getState().setZoom(zoomNodeId);
    }
    return store;
  }, [getRoots, commitRoots, setDefaultView, zoomNodeId]);

  // 불릿 글자를 옵시디언 렌더러로 그린 조각들의 수명. 임베드가 사라질 때 함께 정리한다.
  const renderScope = useMemo(() => new Component(), []);
  useEffect(() => {
    renderScope.load();
    return () => renderScope.unload();
  }, [renderScope]);

  const host = useMemo(
    () =>
      createObsidianHost({
        app,
        getFile: () => file,
        getPortalRoot: () => window.document.body,
        component: renderScope,
      }),
    [app, file, renderScope]
  );

  if (isLoading) {
    return (
      <div className="p-4 text-xs text-(--text-muted) animate-pulse">
        아웃라인 로딩 중...
      </div>
    );
  }

  if (problem || !project) {
    return (
      <div className="p-3 text-xs text-rose-400 border border-rose-950/40 rounded-lg bg-rose-950/20">
        아웃라인을 열 수 없습니다: {file.name}
      </div>
    );
  }

  const containerClasses = isCanvasCard
    ? "vibe-outliner p-3 flex flex-col min-w-0 w-full h-full text-left bg-transparent"
    : "vibe-outliner my-2 p-3 rounded-lg border border-(--background-modifier-border) bg-(--background-primary) flex flex-col min-w-0 text-left";

  return (
    <div
      className={containerClasses}
      style={{
        maxHeight,
        height: isCanvasCard ? '100%' : undefined,
        overflowY: 'auto',
        textAlign: 'left',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <OutlineEditorProvider
        store={editorStore}
        host={host}
        rootNodes={project.rootNodes}
        defaultView={viewMode ?? project.defaultView}
      >
        <div className="flex flex-col min-w-0">
          <OutlineHeader
            rootTitle={file.basename}
            onUpdateRootTitle={(title) => void renameOutlineFile(app, file, title)}
            rootPlaceholder="아웃라인 제목"
            zoomPlaceholder="불릿 제목"
          />
          <EmbedBody forcedView={viewMode} />
        </div>
      </OutlineEditorProvider>
    </div>
  );
};
