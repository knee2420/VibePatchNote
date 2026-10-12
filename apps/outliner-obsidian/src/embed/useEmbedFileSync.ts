/**
 * @file useEmbedFileSync.ts
 * @description 마크다운 인라인 임베드 및 캔버스 노드용 파일 양방향 동기화 및 디바운스 자동 저장 훅
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { App, TFile } from 'obsidian';
import type { OutlineNode, Project, ViewMode } from '@vibe/outliner-core';
import {
  type OutlineProblem,
  readOutlineText,
  writeOutlineText,
} from '../outlineDocument';

export interface EmbedFileSyncOptions {
  app: App;
  file: TFile;
  debounceMs?: number;
}

export function useEmbedFileSync({ app, file, debounceMs = 300 }: EmbedFileSyncOptions) {
  const [project, setProject] = useState<Project | null>(null);
  const [problem, setProblem] = useState<OutlineProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 디바운스 저장 타이머 및 방금 쓴 내용 추적
  const saveTimerRef = useRef<number | null>(null);
  const lastWrittenTextRef = useRef<string | null>(null);
  const currentProjectRef = useRef<Project | null>(null);

  useEffect(() => {
    currentProjectRef.current = project;
  }, [project]);

  // 1. 파일 초기 로드 (마운트 시 비동기 처리)
  useEffect(() => {
    let isCancelled = false;

    app.vault
      .read(file)
      .then((text) => {
        if (isCancelled) return;
        const state = readOutlineText(text, file.basename);
        setProject(state.project);
        setProblem(state.problem);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('[VibeOutliner Embed] 파일 읽기 실패:', err);
        setProblem({ kind: 'parse-error' });
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [app, file]);

  // 2. 외부 파일 변경 감시 (app.vault.on('modify'))
  useEffect(() => {
    const ref = app.vault.on('modify', async (changedFile) => {
      if (changedFile.path !== file.path) return;

      try {
        const text = await app.vault.read(file);
        // 내가 방금 쓴 내용이면 무시 (무한 루프 방지)
        if (text === lastWrittenTextRef.current) return;

        const state = readOutlineText(text, file.basename);
        if (state.project) {
          setProject(state.project);
          setProblem(null);
        }
      } catch (err) {
        console.error('[VibeOutliner Embed] 외부 변경 반영 실패:', err);
      }
    });

    return () => {
      app.vault.offref(ref);
    };
  }, [app, file]);

  // 3. 디스크에 실제 쓰기 실행
  const flushSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const current = currentProjectRef.current;
    if (!current) return;

    const text = writeOutlineText(current, file.basename);
    lastWrittenTextRef.current = text;
    void app.vault.modify(file, text).catch((err) => {
      console.error('[VibeOutliner Embed] 파일 저장 실패:', err);
    });
  }, [app, file]);

  // 4. 스케줄링된 디바운스 저장
  const scheduleSave = useCallback(
    (updatedProject: Project) => {
      setProject(updatedProject);
      currentProjectRef.current = updatedProject;

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        flushSave();
      }, debounceMs);
    },
    [debounceMs, flushSave]
  );

  // 5. 트리 노드 변경 콜백
  const commitRoots = useCallback(
    (roots: OutlineNode[]) => {
      const current = currentProjectRef.current;
      if (!current) return;
      scheduleSave({
        ...current,
        rootNodes: roots,
        updatedAt: Date.now(),
      });
    },
    [scheduleSave]
  );

  // 6. 기본 뷰 모드 변경 콜백
  const setDefaultView = useCallback(
    (view: ViewMode) => {
      const current = currentProjectRef.current;
      if (!current) return;
      scheduleSave({
        ...current,
        defaultView: view,
        updatedAt: Date.now(),
      });
    },
    [scheduleSave]
  );

  // 7. 언마운트 시 남아있는 저장 즉시 처리
  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        flushSave();
      }
    };
  }, [flushSave]);

  return {
    project,
    problem,
    isLoading,
    commitRoots,
    setDefaultView,
    flushSave,
  };
}
