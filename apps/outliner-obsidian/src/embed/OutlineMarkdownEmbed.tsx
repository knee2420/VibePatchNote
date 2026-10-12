/**
 * @file OutlineMarkdownEmbed.tsx
 * @description 마크다운 문서 및 캔버스 텍스트 카드 내에 삽입되는 아웃라인 임베드 뷰어/에디터 컴포넌트
 */

import React, { useMemo } from 'react';
import type { App, TFile } from 'obsidian';
import {
  OutlineBoard,
  OutlineEditorProvider,
  OutlineHeader,
  OutlineTree,
  createOutlineEditorStore,
  useOutlineView,
  type OutlineHost,
} from '@vibe/outliner-editor';
import type { ViewMode } from '@vibe/outliner-core';
import { ConfirmModal } from '../ConfirmModal';
import { useEmbedFileSync } from './useEmbedFileSync';

export interface OutlineMarkdownEmbedProps {
  app: App;
  file: TFile;
  /** 특정 불릿 하위만 줌인하여 렌더링할 경우 노드 ID */
  zoomNodeId?: string;
  /** 강제 지정할 뷰 모드 ('bullets' | 'board') */
  viewMode?: ViewMode;
  /** 최대 높이 (예: '500px', '400px', 'auto') */
  maxHeight?: string;
}

const EmbedBody: React.FC<{ forcedView?: ViewMode }> = ({ forcedView }) => {
  const { view } = useOutlineView();
  const effectiveView = forcedView ?? view;
  return effectiveView === 'board' ? <OutlineBoard /> : <OutlineTree />;
};

export const OutlineMarkdownEmbed: React.FC<OutlineMarkdownEmbedProps> = ({
  app,
  file,
  zoomNodeId,
  viewMode,
  maxHeight = '500px',
}) => {
  const { project, problem, isLoading, commitRoots, setDefaultView } = useEmbedFileSync({
    app,
    file,
  });

  const editorStore = useMemo(() => {
    const store = createOutlineEditorStore({
      getRoots: () => project?.rootNodes ?? [],
      commitRoots,
      setDefaultView,
    });
    if (zoomNodeId) {
      store.getState().setZoom(zoomNodeId);
    }
    return store;
  }, [commitRoots, setDefaultView, project?.rootNodes, zoomNodeId]);

  const host = useMemo<OutlineHost>(
    () => ({
      confirm: (message) => new ConfirmModal(app, message).ask(),
      copyNodeLink: async (nodeId) => {
        const query = [
          ['vault', app.vault.getName()],
          ['file', file.path],
          ['node', nodeId],
        ]
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('&');
        await navigator.clipboard.writeText(`obsidian://vibe-outline?${query}`);
      },
      exportText: (fileName, text) => {
        const folder = file.parent ?? app.vault.getRoot();
        void app.vault.create(`${folder.path}/${fileName}`, text);
      },
      getPortalRoot: () => window.document.body,
      openLink: (link) => {
        void app.workspace.openLinkText(link, file.path, false);
      },
    }),
    [app, file]
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

  return (
    <div
      className="vibe-outliner my-2 p-3 rounded-lg border border-(--background-modifier-border) bg-(--background-primary) flex flex-col min-w-0"
      style={{ maxHeight, overflowY: 'auto' }}
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
            onUpdateRootTitle={(title) => {
              void app.fileManager.renameFile(
                file,
                file.parent?.path ? `${file.parent.path}/${title}.${file.extension}` : `${title}.${file.extension}`
              );
            }}
            rootPlaceholder="아웃라인 제목"
            zoomPlaceholder="불릿 제목"
          />
          <EmbedBody forcedView={viewMode} />
        </div>
      </OutlineEditorProvider>
    </div>
  );
};
