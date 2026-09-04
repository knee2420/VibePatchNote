import { useState, useCallback } from 'react';
import { useReactFlow, type Edge } from '@xyflow/react';

import { useCanvasBoardStore } from '@/entities/canvas-board';
import {
  referenceDocumentApi,
  type ScaffoldExtractResponse,
} from '@/entities/reference-document';
import {
  SCAFFOLD_DOCUMENT_NODE_TYPE,
  type ScaffoldDocumentNode,
} from '@/entities/scaffold-document';

interface UseScaffoldExtractOptions {
  nodeId: string;
  filename: string;
  onSuccess?: (res: ScaffoldExtractResponse) => void;
  onError?: (err: unknown) => void;
}

/**
 * useScaffoldExtract (FSD Feature Hook)
 *
 * 참고 문서로부터 Tiptap 스캐폴딩을 추출하고,
 * 완료 시 미로(Miro)처럼 우측에 신규 스캐폴드 카드를 생성하여 엣지로 자동 연결합니다.
 */
export function useScaffoldExtract({
  nodeId,
  filename,
  onSuccess,
  onError,
}: UseScaffoldExtractOptions) {
  const [isExtracting, setIsExtracting] = useState(false);
  const { getNode } = useReactFlow();
  const addNode = useCanvasBoardStore((s) => s.addNode);

  const extract = useCallback(async () => {
    if (!filename || isExtracting) return;

    setIsExtracting(true);
    try {
      const res = await referenceDocumentApi.extractScaffold(filename);

      // 원본 노드 위치 계산
      const sourceNode = getNode(nodeId);
      const posX = (sourceNode?.position?.x ?? 100) + (sourceNode?.measured?.width ?? 400) + 120;
      const posY = sourceNode?.position?.y ?? 100;

      const newScaffoldId = `scaffold-${Date.now()}`;

      // 1. 신규 스캐폴드 노드 생성
      const newScaffoldNode: ScaffoldDocumentNode = {
        id: newScaffoldId,
        type: SCAFFOLD_DOCUMENT_NODE_TYPE,
        position: { x: posX, y: posY },
        data: {
          id: newScaffoldId,
          title: res.meta.title || `${filename} 서식 틀`,
          sourcePdfFileName: filename,
          htmlContent: res.htmlContent,
          markdownContent: res.markdownContent,
          description: res.meta.description,
          difficulty: res.meta.difficulty,
        },
      };

      // 2. 미로 스타일 곡선 엣지 생성 (보라색 애니메이션)
      const newEdge: Edge = {
        id: `edge-${nodeId}-${newScaffoldId}`,
        source: nodeId,
        target: newScaffoldId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#9333ea', strokeWidth: 2 },
      };

      // 3. 캔버스 보드 스토어에 추가
      addNode(newScaffoldNode);
      useCanvasBoardStore.setState((state) => ({
        edges: [...state.edges, newEdge],
      }));

      onSuccess?.(res);
    } catch (err) {
      console.error('[useScaffoldExtract] Error extracting scaffold:', err);
      onError?.(err);
    } finally {
      setIsExtracting(false);
    }
  }, [filename, isExtracting, nodeId, getNode, addNode, onSuccess, onError]);

  return {
    isExtracting,
    extract,
  };
}
