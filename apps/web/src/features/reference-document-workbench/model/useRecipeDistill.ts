import { useCallback, useEffect, useState } from 'react';
import { followAgentRun } from '@/shared/api';
import { useCanvasSettings } from '@/shared/model';
import { recipeApi, type RecipeRevision } from '@/entities/recipe';
import { scaffoldArchiveApi, type ScaffoldArchiveMeta } from '@/entities/scaffold-document';

/** 목록은 오래된 순으로 온다. 방금 만든 것이 보여야 하므로 최신 항목을 고른다. */
function newestBy<T>(items: T[], createdAt: (item: T) => string): T | undefined {
  return items.reduce<T | undefined>(
    (newest, item) => (!newest || createdAt(item) > createdAt(newest) ? item : newest),
    undefined,
  );
}

export function useRecipeDistill(
  docId?: string,
  onError?: (message: string) => void,
  onDone?: (blockCount: number) => void,
) {
  const revealInspector = useCanvasSettings((state) => state.setShowRecipeInspector);
  const [missing, setMissing] = useState<string[]>(docId ? ['와이어프레임'] : ['원본 문서']);
  const [scaffoldId, setScaffoldId] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [recipe, setRecipe] = useState<RecipeRevision | null>(null);
  const refresh = useCallback(async () => {
    if (!docId) { setMissing(['원본 문서']); return; }
    try {
      const archives = await scaffoldArchiveApi.listByDocument(docId);
      // 저작 규격은 사용자가 마지막으로 만든 와이어프레임을 근거로 삼아야 한다.
      const selected = newestBy<ScaffoldArchiveMeta>(archives, (item) => item.createdAt)?.scaffoldId;
      setScaffoldId(selected);
      const state = await recipeApi.readiness(docId, selected);
      setMissing(state.missing);
      const recipes = selected ? await recipeApi.listByScaffold(selected) : [];
      // 재추출은 매번 독립 Recipe 를 만든다. 방금 만든 것을 보여주지 않으면
      // 버튼을 눌러도 화면이 그대로라 아무 일도 없었던 것처럼 보인다.
      setRecipe(newestBy(recipes, (item) => item.recipe.provenance.createdAt)?.recipe ?? null);
    } catch { setMissing(['Recipe 추출 준비 상태']); }
  }, [docId]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  const start = useCallback(async () => {
    if (!docId || missing.length || isRunning) return;
    // 아웃라인 추출이 패널을 즉시 열듯, 결과가 놓일 자리를 먼저 연다.
    // 이것이 없으면 추출이 성공해도 화면에는 아무 흔적도 남지 않는다.
    revealInspector(true);
    setIsRunning(true);
    try {
      const accepted = await recipeApi.start(docId, scaffoldId);
      // `followAgentRun` 은 실패한 실행도 그대로 돌려준다. 여기서 보지 않으면
      // 실패가 조용히 삼켜져 이용자는 버튼이 죽은 줄 안다.
      const settled = await followAgentRun<{ recipe: RecipeRevision }>(accepted.runId);
      if (settled.status === 'completed') {
        const blocks = settled.result?.recipe.spec.blocks;
        onDone?.(Array.isArray(blocks) ? blocks.length : 0);
      } else onError?.(settled.errorCode ?? `저작 규격 추출이 ${settled.status} 상태로 끝났습니다.`);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : String(error));
    } finally { setIsRunning(false); void refresh(); }
  }, [docId, scaffoldId, missing.length, isRunning, refresh, onError, onDone, revealInspector]);
  const save = useCallback(async (title: string, spec: Record<string, unknown>) => {
    if (!recipe) return;
    const saved = await recipeApi.save(recipe.provenance.recipeId, recipe.provenance.revisionId, title, spec);
    setRecipe(saved.recipe);
  }, [recipe]);
  return { missing, isReady: missing.length === 0, isRunning, start, refresh, recipe, save };
}
