/**
 * @file useExport.ts
 * @description 내보내기 창의 선택 상태와 실행 훅
 *
 * 무엇이 어떤 파일로 나가는지는 `@vibe/outliner-dto` 가 정한다.
 * 이 훅은 화면의 선택을 요청으로 옮기고, 그 결과를 미리보기와 실제 저장에 그대로 쓴다.
 */

import { useCallback, useMemo, useState } from 'react';
import { findNode } from '@vibe/outliner-core';
import { type ExportFile, type ExportScope, buildExportFile } from '@vibe/outliner-dto';
import { useWorkspaceStore } from '@/entities/workspace';
import { downloadTextFile } from '../lib/downloadTextFile';
import { saveTextFileAs } from '../lib/vaultFs';

export type ExportScopeKind = ExportScope['kind'];

export type ExportOutcome = 'idle' | 'done' | 'failed';

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export function useExport() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const activeRootId = useWorkspaceStore((s) => s.activeRootId);
  const selectedNodeIds = useWorkspaceStore((s) => s.selectedNodeIds);

  const project = workspace.projects[workspace.activeProjectId];
  const zoomNode = activeRootId ? findNode(project.rootNodes, activeRootId) : null;

  const [scopeKind, setScopeKind] = useState<ExportScopeKind>(zoomNode ? 'subtree' : 'project');
  const [outcome, setOutcome] = useState<ExportOutcome>('idle');

  const file = useMemo<ExportFile | null>(() => {
    let scope: ExportScope;
    if (scopeKind === 'subtree') {
      if (!activeRootId) return null;
      scope = { kind: 'subtree', nodeId: activeRootId };
    } else if (scopeKind === 'nodes') {
      scope = { kind: 'nodes', nodeIds: selectedNodeIds };
    } else {
      scope = { kind: 'project' };
    }

    return buildExportFile(workspace, { projectId: workspace.activeProjectId, scope });
  }, [workspace, activeRootId, selectedNodeIds, scopeKind]);

  const chooseScope = useCallback((kind: ExportScopeKind) => {
    setScopeKind(kind);
    setOutcome('idle');
  }, []);

  // 저장할 자리는 사용자가 고른다. 자리를 고르게 할 수 없는 브라우저에서는 내려받기로 건넨다.
  const run = useCallback(async () => {
    if (!file) return;
    try {
      if (!(await saveTextFileAs(file.fileName, file.text))) {
        downloadTextFile(file.fileName, file.text);
      }
      setOutcome('done');
    } catch (err: unknown) {
      if (isAbort(err)) return;
      console.error('내보내기 오류:', err);
      setOutcome('failed');
    }
  }, [file]);

  return {
    projectTitle: project.title,
    zoomTitle: zoomNode ? zoomNode.text : null,
    selectionCount: selectedNodeIds.length,
    scopeKind,
    chooseScope,
    file,
    outcome,
    run,
  };
}
