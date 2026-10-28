/**
 * @fileoverview Hook to manage active document recipe properties, readiness checking,
 * and WinForm / Webflow style contextual property inspection.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import { recipeApi, type RecipeRevision } from '@/entities/recipe';
import {
  REFERENCE_DOCUMENT_NODE_TYPE,
  type ReferenceDocumentData,
} from '@/entities/reference-document';
import {
  SCAFFOLD_DOCUMENT_NODE_TYPE,
  scaffoldArchiveApi,
  type ScaffoldArchiveDetail,
  type ScaffoldArchiveMeta,
  type ScaffoldDocumentData,
} from '@/entities/scaffold-document';
import { followAgentRun } from '@/shared/api';
import { useActiveElementStore, type SelectedElementData } from '@/shared/model';

function newestBy<T>(items: T[], createdAt: (item: T) => string): T | undefined {
  return items.reduce<T | undefined>(
    (newest, item) => (!newest || createdAt(item) > createdAt(newest) ? item : newest),
    undefined,
  );
}

export function useActiveRecipeProperty() {
  const nodes = useCanvasBoardStore((s) => s.nodes);
  const selection = useActiveElementStore((s) => s.selection);

  // 현재 캔버스에서 선택된 노드 찾기
  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);

  // 활성 노드: 전역 selection의 nodeId를 우선, 없으면 selectedNode
  const activeNode = useMemo(() => {
    if (selection?.nodeId) {
      const found = nodes.find((n) => n.id === selection.nodeId);
      if (found) return found;
    }
    if (
      selectedNode?.type === REFERENCE_DOCUMENT_NODE_TYPE ||
      selectedNode?.type === SCAFFOLD_DOCUMENT_NODE_TYPE
    ) {
      return selectedNode;
    }
    return null;
  }, [selection?.nodeId, selectedNode, nodes]);

  const isReferenceDoc =
    selection?.nodeType === REFERENCE_DOCUMENT_NODE_TYPE ||
    activeNode?.type === REFERENCE_DOCUMENT_NODE_TYPE;
  const isScaffoldDoc =
    selection?.nodeType === SCAFFOLD_DOCUMENT_NODE_TYPE ||
    activeNode?.type === SCAFFOLD_DOCUMENT_NODE_TYPE;

  const docData = isReferenceDoc
    ? (activeNode?.data as ReferenceDocumentData | undefined)
    : undefined;
  const scaffoldData = isScaffoldDoc
    ? (activeNode?.data as ScaffoldDocumentData | undefined)
    : undefined;

  // 대상 문서 ID 및 제목 확정 (와이어프레임 노드의 docId/archive.docId 지원)
  const docId =
    selection?.docId ||
    (typeof docData?.docId === 'string' ? docData.docId : undefined) ||
    (typeof scaffoldData?.docId === 'string' ? scaffoldData.docId : undefined) ||
    (typeof scaffoldData?.archive?.docId === 'string' ? (scaffoldData.archive.docId as string) : undefined);

  const docTitle: string =
    selection?.docTitle ||
    (typeof docData?.title === 'string' && docData.title ? docData.title : null) ||
    (typeof scaffoldData?.title === 'string' && scaffoldData.title ? scaffoldData.title : null) ||
    (typeof docData?.fileName === 'string' && docData.fileName ? docData.fileName : null) ||
    (typeof scaffoldData?.sourcePdfFileName === 'string' && scaffoldData.sourcePdfFileName ? scaffoldData.sourcePdfFileName : null) ||
    (isReferenceDoc ? '참조 문서' : isScaffoldDoc ? '와이어프레임' : '선택된 컴포넌트');

  // WinForm 스타일 선택된 엘리먼트 데이터
  const selectedElement: SelectedElementData | null = selection?.selectedElement ?? null;

  const [scaffoldId, setScaffoldId] = useState<string | undefined>(selection?.scaffoldId);
  const [scaffoldDetail, setScaffoldDetail] = useState<ScaffoldArchiveDetail | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<RecipeRevision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 저작 규격 및 준비 상태 새로고침 (docId 기반 직접 조회 강화)
  const refresh = useCallback(async () => {
    if (!docId) {
      const targetScaffoldId = selection?.scaffoldId || scaffoldData?.scaffoldId;
      if (targetScaffoldId) {
        // 와이어프레임 카드가 선택된 경우
        try {
          setIsLoading(true);
          const [list, detail] = await Promise.all([
            recipeApi.listByScaffold(targetScaffoldId),
            scaffoldArchiveApi.get(targetScaffoldId).catch(() => null),
          ]);
          const latest = newestBy(list, (item) => item.recipe.provenance.createdAt);
          setRecipe(latest?.recipe ?? null);
          if (detail) setScaffoldDetail(detail);
          setMissing([]);
        } catch (e) {
          console.error('[useActiveRecipeProperty] Failed to load recipe by scaffold:', e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setRecipe(null);
        setScaffoldDetail(null);
        setMissing([]);
      }
      return;
    }

    setIsLoading(true);
    try {
      // 1. 문서 ID(docId)로 이미 저장된 Recipe 직접 조회 (최우선)
      const docRecipes = await recipeApi.listByDocument(docId);
      let foundRecipe = newestBy(docRecipes, (item) => item.recipe.provenance.createdAt)?.recipe ?? null;

      // 2. 최신 와이어프레임 아카이브 조회
      const archives = await scaffoldArchiveApi.listByDocument(docId);
      const latestScaffoldId = newestBy<ScaffoldArchiveMeta>(
        archives,
        (item) => item.createdAt,
      )?.scaffoldId;
      const activeScaffoldId = selection?.scaffoldId || scaffoldData?.scaffoldId || latestScaffoldId;
      setScaffoldId(activeScaffoldId);

      // 3. 와이어프레임 아카이브 상세 정보 로드 (정본 slotsCount, totalPages, slots 확보)
      if (activeScaffoldId) {
        try {
          const detail = await scaffoldArchiveApi.get(activeScaffoldId);
          setScaffoldDetail(detail);
        } catch {
          // ignore
        }
      }

      // 4. 만약 docId로 아직 못 찾았고 activeScaffoldId가 있다면 scaffoldId로 재조회
      if (!foundRecipe && activeScaffoldId) {
        const scaffoldRecipes = await recipeApi.listByScaffold(activeScaffoldId);
        foundRecipe = newestBy(scaffoldRecipes, (item) => item.recipe.provenance.createdAt)?.recipe ?? null;
      }
      setRecipe(foundRecipe);

      // 5. 추출 준비 상태 체크
      const readiness = await recipeApi.readiness(docId, activeScaffoldId);
      setMissing(readiness.missing);
    } catch (e) {
      console.error('[useActiveRecipeProperty] Failed to refresh:', e);
      setMissing(['상태 확인 실패']);
    } finally {
      setIsLoading(false);
    }
  }, [docId, selection?.scaffoldId, scaffoldData?.scaffoldId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 보정된 selectedElement: scaffold_card일 때 백엔드 아카이브 정본(slotsCount, totalPages)으로 갱신
  const effectiveElement = useMemo<SelectedElementData | null>(() => {
    if (!selectedElement) return null;
    if (selectedElement.type === 'scaffold_card') {
      const slotsCount =
        selectedElement.slotsCount && selectedElement.slotsCount > 0
          ? selectedElement.slotsCount
          : scaffoldDetail?.slotsCount ?? 0;
      const totalPages =
        selectedElement.totalPages && selectedElement.totalPages > 1
          ? selectedElement.totalPages
          : scaffoldDetail?.totalPages ?? 1;
      return {
        ...selectedElement,
        slotsCount,
        totalPages,
      };
    }
    if (selectedElement.type === 'wireframe_slot') {
      const matched = scaffoldDetail?.slots?.find(
        (s) => s.id === selectedElement.id || s.number === selectedElement.slotNumber
      );
      if (matched) {
        return {
          ...selectedElement,
          page: selectedElement.page ?? matched.pageNumber ?? 1,
          box_2d: selectedElement.box_2d ?? matched.box_2d,
          label: selectedElement.label || matched.label,
        };
      }
    }
    return selectedElement;
  }, [selectedElement, scaffoldDetail]);

  // 선택된 엘리먼트/슬롯/세그먼트가 속한 Recipe 블록 찾기
  const mappedBlock = useMemo(() => {
    if (!recipe || !effectiveElement) return null;
    const blocks = Array.isArray(recipe.spec?.blocks)
      ? (recipe.spec.blocks as Array<Record<string, unknown>>)
      : [];

    // 1. 직접 elementId 매칭 (elem-p1-1 등)
    const direct = blocks.find(
      (b) => Array.isArray(b.elementIds) && b.elementIds.includes(effectiveElement.id),
    );
    if (direct) return direct;

    // 2. 와이어프레임 슬롯 매칭 (slotNumber 기반 or elem-p{page}-{num} 추론)
    if (effectiveElement.type === 'wireframe_slot' && effectiveElement.slotNumber !== undefined) {
      const page = effectiveElement.page ?? 1;
      const candidateElemId = `elem-p${page}-${effectiveElement.slotNumber}`;
      const slotMatch = blocks.find(
        (b) =>
          (Array.isArray(b.elementIds) && b.elementIds.includes(candidateElemId)) ||
          (Array.isArray(b.slotIds) && b.slotIds.includes(effectiveElement.id)) ||
          (Array.isArray(b.slots) && b.slots.includes(effectiveElement.slotNumber)),
      );
      if (slotMatch) return slotMatch;
    }

    // 3. 세그먼트 매칭
    if (effectiveElement.type === 'document_segment') {
      const segMatch = blocks.find(
        (b) =>
          (Array.isArray(b.segmentIds) && b.segmentIds.includes(effectiveElement.id)) ||
          b.segmentId === effectiveElement.id,
      );
      if (segMatch) return segMatch;
    }

    return null;
  }, [recipe, effectiveElement]);

  // LLM 저작 규격 추출 실행
  const startDistill = useCallback(async () => {
    if (!docId || missing.length > 0 || isRunning) return;

    setIsRunning(true);
    setStatusMessage('에이전트가 4대 근거 데이터를 분석하여 저작 규격을 추출 중입니다...');
    try {
      const accepted = await recipeApi.start(docId, scaffoldId);
      const settled = await followAgentRun<{ recipe: RecipeRevision }>(accepted.runId);

      if (settled.status === 'completed' && settled.result?.recipe) {
        setRecipe(settled.result.recipe);
        setStatusMessage('저작 규격 추출이 성공적으로 완료되었습니다.');
      } else {
        setStatusMessage(`추출 종료 상태: ${settled.status} ${settled.errorCode || ''}`);
      }
    } catch (error) {
      console.error('[useActiveRecipeProperty] Distill error:', error);
      setStatusMessage(`오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      void refresh();
    }
  }, [docId, scaffoldId, missing.length, isRunning, refresh]);

  // 특정 블록의 역할(role) 수정 및 새 불변 리비전 커밋
  const saveRole = useCallback(
    async (blockId: string, newRole: string) => {
      if (!recipe || isSaving) return;

      const currentBlocks = Array.isArray(recipe.spec.blocks)
        ? (recipe.spec.blocks as Array<Record<string, unknown>>)
        : [];

      const updatedBlocks = currentBlocks.map((blk) =>
        blk.id === blockId ? { ...blk, role: newRole } : blk,
      );

      const updatedSpec = {
        ...recipe.spec,
        blocks: updatedBlocks,
      };

      setIsSaving(true);
      try {
        const saved = await recipeApi.save(
          recipe.provenance.recipeId,
          recipe.provenance.revisionId,
          recipe.title,
          updatedSpec,
        );
        setRecipe(saved.recipe);
        setStatusMessage('새 불변 리비전으로 저장되었습니다.');
      } catch (e) {
        console.error('[useActiveRecipeProperty] Save error:', e);
        setStatusMessage(`저장 실패: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setIsSaving(false);
      }
    },
    [recipe, isSaving],
  );

  return {
    activeNode,
    selectedNode,
    isReferenceDoc,
    isScaffoldDoc,
    docTitle,
    docId,
    scaffoldId,
    selectedElement: effectiveElement,
    mappedBlock,
    scaffoldDetail,
    recipe,
    missing,
    isReady: missing.length === 0,
    isLoading,
    isRunning,
    isSaving,
    statusMessage,
    refresh,
    startDistill,
    saveRole,
  };
}
