import { useState, useCallback } from 'react';
import { useReactFlow, type Edge, MarkerType } from '@xyflow/react';

import { referenceDocumentApi } from '../api/referenceDocumentApi';

/** 백엔드 최악 지연(하네스 75초 x 재시도 3회 = 225초)을 덮는 프런트 가드. */
const SCAFFOLD_TIMEOUT_MS = 240_000;

interface UseDocumentScaffoldOptions {
  nodeId: string;
  title: string;
  url?: string;
  onSuccess?: (title: string) => void;
  onError?: (err: unknown) => void;
}

/**
 * useDocumentScaffold (Entity Model Hook)
 *
 * 참고 문서 엔티티의 스캐폴딩 생성 헤드리스 훅.
 * 백엔드 `scaffold-engine`을 호출하고, 완료 시 미로(Miro) 스타일 엣지로 연결된 스캐폴드 노드를 스폰합니다.
 */
export function useDocumentScaffold({
  nodeId,
  title,
  url,
  onSuccess,
  onError,
}: UseDocumentScaffoldOptions) {
  const [isExtractingScaffold, setIsExtractingScaffold] = useState(false);
  const { getNode, setNodes, setEdges } = useReactFlow();

  // URL 또는 제목에서 순수 파일명 추출 (URL 인코딩 해제)
  const rawName = url ? url.split('/').pop() || title : title;
  const filename = decodeURIComponent(rawName);

  const extractScaffold = useCallback(async () => {
    if (!filename || isExtractingScaffold) return;

    console.info('[useDocumentScaffold] Starting extractScaffold -> filename:', filename, 'title:', title, 'url:', url);

    setIsExtractingScaffold(true);

    // 1. 원본 노드 위치 및 동급(=동일) 크기 산정
    const sourceNode = getNode(nodeId);
    const measuredWidth =
      (sourceNode?.measured?.width as number) ||
      (typeof sourceNode?.style?.width === 'number'
        ? sourceNode.style.width
        : typeof sourceNode?.style?.width === 'string'
          ? parseInt(sourceNode.style.width, 10)
          : 600);
    const nodeWidth = Math.max(measuredWidth, 560);

    const nodeHeight =
      (sourceNode?.measured?.height as number) ||
      (typeof sourceNode?.style?.height === 'number'
        ? sourceNode.style.height
        : typeof sourceNode?.style?.height === 'string'
          ? parseInt(sourceNode.style.height, 10)
          : 800);

    // 넉넉한 180px 오프셋으로 엣지가 찌그러지지 않고 우아하게 이어지도록 배치
    const posX = (sourceNode?.position?.x ?? 100) + nodeWidth + 180;
    const posY = sourceNode?.position?.y ?? 100;
    const newScaffoldId = `scaffold-${Date.now()}`;

    // 2. [즉시 실행] 1단계: 신규 스캐폴드 노드를 'generating' 상태로 즉각 캔버스에 생성
    const initialScaffoldNode = {
      id: newScaffoldId,
      type: 'scaffoldDocument',
      position: { x: posX, y: posY },
      style: { width: `${nodeWidth}px`, height: `${nodeHeight}px` },
      data: {
        id: newScaffoldId,
        sourceNodeId: nodeId, // 원본 참고 문서 카드 노드 ID 연결 (격리용 SSOT)
        title: `${title} 서식 틀`,
        sourcePdfFileName: filename,
        htmlContent: '',
        markdownContent: '',
        status: 'generating' as const,
        progressStep: 1,
        progressMessage: '원본 페이지 기하 실측 준비...',
        width: nodeWidth,
        height: nodeHeight,
      },
    };

    // 3. [즉시 실행] 미로 스타일 곡선 보라색 엣지 즉각 연결 (핸들 정확 바인딩 + 화살표)
    const newEdge: Edge = {
      id: `edge-${nodeId}-${newScaffoldId}`,
      source: nodeId,
      target: newScaffoldId,
      sourceHandle: 'right',
      targetHandle: 'target-left',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#9333ea', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#9333ea',
        width: 14,
        height: 14,
      },
    };

    setNodes((nds) => [...nds, initialScaffoldNode]);
    setEdges((eds) => [...eds, newEdge]);

    // AI 진행 상태 시뮬레이션 타이머들 (사용자 체감 향상)
    const timers: NodeJS.Timeout[] = [];
    timers.push(
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === newScaffoldId && n.data?.status === 'generating'
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    progressStep: 2,
                    progressMessage: '표 경계·행 높이·열 너비 실측 중...',
                  },
                }
              : n
          )
        );
      }, 3500)
    );

    timers.push(
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === newScaffoldId && n.data?.status === 'generating'
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    progressStep: 3,
                    progressMessage: '고정 서식과 채울 값을 AI가 판정하는 중...',
                  },
                }
              : n
          )
        );
      }, 8000)
    );

    timers.push(
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === newScaffoldId && n.data?.status === 'generating'
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    progressStep: 4,
                    progressMessage: '실측 좌표로 서식 조립 및 기하 채점 중...',
                  },
                }
              : n
          )
        );
      }, 30000)
    );

    try {
      // 4. 백엔드 scaffold-engine 호출.
      //    가드는 백엔드 최악 지연(하네스 75초 x 재시도 3회)보다 커야 한다.
      //    그렇지 않으면 백엔드가 아직 일하는 중에 프런트가 먼저 실패로 처리한다.
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('서식 생성 요청 시간 초과 (240초)')), SCAFFOLD_TIMEOUT_MS)
      );

      const res = await Promise.race([
        referenceDocumentApi.extractScaffold(filename),
        timeoutPromise,
      ]);

      // 타이머 정리
      timers.forEach((t) => clearTimeout(t));

      // 5. 완료 시 최종본 노드 데이터 반영 (status: 'completed')
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === newScaffoldId) {
            return {
              ...n,
              data: {
                ...n.data,
                title: res.meta.title || `${title} 서식 틀`,
                htmlContent: res.htmlContent,
                markdownContent: res.markdownContent,
                // 백엔드가 원본에서 실측한 슬롯 좌표. 이게 있어야 양방향 매핑이 성립한다.
                slots: res.slots ?? [],
                description: res.meta.description,
                difficulty: res.meta.difficulty,
                status: 'completed',
                progressStep: 4,
                progressMessage: '서식 생성 완료',
              },
            };
          }
          return n;
        })
      );

      onSuccess?.(res.meta.title || title);
    } catch (err) {
      timers.forEach((t) => clearTimeout(t));
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[useDocumentScaffold] Error extracting scaffold for', filename, ':', err);

      // 실패 시 노드에 실제 에러 상세 메시지 기록
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === newScaffoldId) {
            return {
              ...n,
              data: {
                ...n.data,
                status: 'error',
                errorMessage: `서식 추출 실패: ${errorMsg}`,
              },
            };
          }
          return n;
        })
      );

      onError?.(err);
    } finally {
      setIsExtractingScaffold(false);
    }

  }, [filename, isExtractingScaffold, nodeId, title, url, getNode, setNodes, setEdges, onSuccess, onError]);


  return {
    isExtractingScaffold,
    extractScaffold,
  };
}
