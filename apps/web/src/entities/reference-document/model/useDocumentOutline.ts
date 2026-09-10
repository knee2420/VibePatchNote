import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';

import {
  agentRunClient,
  followAgentRun,
  HttpError,
  isWaiting,
  type AgentRunStatus,
} from '@/shared/api';
import { requestLlmSettings } from '@/shared/lib/llmSettingsEvent';

import { referenceDocumentApi } from '../api/referenceDocumentApi';
import type {
  AnalysisError,
  DocumentAnalysisStatus,
  DocumentElementItem,
  DocumentOutlineNode,
  ExtractOutlineResponse,
  ReferenceDocumentData,
} from './types';

interface UseDocumentOutlineOptions {
  nodeId: string;
  /** 문서 식별자. 아웃라인은 이 포인터로만 조회·생성합니다. */
  docId?: string;
  initialIsOpen?: boolean;
  initialStatus?: DocumentAnalysisStatus;
  initialError?: AnalysisError;
  onSuccess?: (data: ExtractOutlineResponse) => void;
  onError?: (err: unknown) => void;
}

const PROGRESS_MESSAGE: Record<string, string> = {
  queued: '⏳ 분석 요청을 대기열에 등록했습니다...',
  running: '🤖 AI가 문서 구조를 분석 중입니다...',
};

/**
 * useDocumentOutline (Entity Model Hook)
 *
 * 문서의 계층 아웃라인과 세부 엘리먼트를 다룹니다.
 *
 * **아웃라인 본문은 노드에 저장하지 않습니다.** 정본은 백엔드 아티팩트 저장소가
 * 갖고 있고, 노드는 `docId` 포인터와 실행 상태만 들고 있습니다. 그래서 카드가
 * 열릴 때 채택본을 한 번 읽어 옵니다 — 이 읽기는 LLM 을 호출하지 않습니다.
 */
export function useDocumentOutline({
  nodeId,
  docId,
  initialIsOpen = false,
  initialStatus = 'idle',
  initialError,
  onSuccess,
  onError,
}: UseDocumentOutlineOptions) {
  const [isExtractingOutline, setIsExtractingOutline] = useState(false);
  const [outlineProgressStep, setOutlineProgressStep] = useState<number>(1);
  const [outlineProgressMessage, setOutlineProgressMessage] = useState<string>('');
  const [isOutlineOpen, setIsOutlineOpen] = useState(initialIsOpen);
  const [outlines, setOutlines] = useState<DocumentOutlineNode[]>([]);
  // 캔버스 노드의 완료 상태는 실행 중 표시를 위한 보조 정보다. 아웃라인 존재
  // 여부의 정본은 문서 아티팩트의 HEAD이며, 아래 목록 조회가 이를 채운다.
  const [hasAdoptedOutline, setHasAdoptedOutline] = useState(false);
  const [elements, setElements] = useState<DocumentElementItem[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [outlineError, setOutlineError] = useState<AnalysisError | undefined>(initialError);
  const [runStatus, setRunStatus] = useState<DocumentAnalysisStatus>(initialStatus);
  const [runId, setRunId] = useState<string | undefined>();

  const { setNodes } = useReactFlow();

  const optionsRef = useRef({ onSuccess, onError });
  useEffect(() => {
    optionsRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  /** 노드에는 포인터와 상태만 기록합니다. 본문은 여기로 오지 않습니다. */
  const patchNode = useCallback(
    (patch: Partial<ReferenceDocumentData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...patch } as ReferenceDocumentData }
            : node
        )
      );
    },
    [nodeId, setNodes]
  );

  /** 채택본을 읽어 옵니다. 없으면 조용히 비어 있는 상태로 둡니다. */
  const loadAdopted = useCallback(async () => {
    if (!docId) return;
    try {
      const adopted = await referenceDocumentApi.getOutline(docId);
      setOutlines(adopted.outlines || []);
      setElements(adopted.elements || []);
      setHasAdoptedOutline((adopted.outlines || []).length > 0);
    } catch (err) {
      // 404 는 "아직 분석하지 않았다"는 정상 상태다. 에러로 표시하지 않는다.
      if (err instanceof HttpError && err.status === 404) return;
      console.error('[useDocumentOutline] 채택본 조회 실패:', err);
    }
  }, [docId]);

  // 본문을 매 카드마다 미리 가져오면 캔버스 초기 렌더링이 무거워진다. 대신
  // 가벼운 아티팩트 목록으로 패널을 열 수 있는지만 먼저 판단한다.
  useEffect(() => {
    if (!docId) return;

    let isCancelled = false;
    void referenceDocumentApi
      .getArtifacts(docId)
      .then(({ artifacts }) => {
        if (!isCancelled) setHasAdoptedOutline(Boolean(artifacts.outline?.head));
      })
      .catch((err: unknown) => {
        if (!isCancelled) console.error('[useDocumentOutline] 아티팩트 목록 조회 실패:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [docId]);

  // 패널이 열려 있는 채로 복원됐다면 본문이 없으므로 한 번 읽어 온다.
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!isOutlineOpen || hasLoadedRef.current || !docId) return;
    hasLoadedRef.current = true;
    void loadAdopted();
  }, [isOutlineOpen, docId, loadAdopted]);

  const applyResult = useCallback(
    (response: ExtractOutlineResponse) => {
      setOutlines(response.outlines || []);
      setElements(response.elements || []);
      setHasAdoptedOutline((response.outlines || []).length > 0);
      setOutlineError(undefined);
      setRunStatus('completed');
      patchNode({
        isOutlineOpen: true,
        outlineStatus: 'completed',
        outlineError: undefined,
        outlineTraceId: response.traceId,
        outlineRunId: response.agentRunId,
        lastSuccessfulOutlineAt: new Date().toISOString(),
      });
      optionsRef.current.onSuccess?.(response);
    },
    [patchNode]
  );

  const applyFailure = useCallback(
    (status: AgentRunStatus, error: AnalysisError) => {
      setOutlineError(error);
      setRunStatus(status);
      patchNode({ outlineStatus: status, outlineError: error });
      setOutlineProgressMessage(`❌ ${error.message}`);
      if (error.requiresAction === 'configure_google_api') {
        requestLlmSettings();
      }
    },
    [patchNode]
  );

  const extractOutline = useCallback(
    async (forceRefresh = false) => {
      if (!docId || isExtractingOutline) return;

      setIsExtractingOutline(true);
      setIsOutlineOpen(true); // 0ms 즉각 패널 오픈!
      setOutlineProgressStep(1);
      setOutlineProgressMessage('📄 [1/3] PDF 시각 기하(표·타이포·로고) 실측 중...');
      setOutlineError(undefined);
      setRunStatus('queued');

      try {
        const accepted = await referenceDocumentApi.startOutline(docId, forceRefresh);
        setRunId(accepted.runId);
        patchNode({ outlineStatus: 'queued', outlineRunId: accepted.runId });

        const settled = await followAgentRun<ExtractOutlineResponse>(
          accepted.runId,
          (current) => {
            setRunStatus(current.status);
            setOutlineProgressStep(current.status === 'queued' ? 1 : 2);
            setOutlineProgressMessage(PROGRESS_MESSAGE[current.status] ?? '');
          }
        );

        if (isWaiting(settled.status)) {
          // 실패가 아니라 보류다. 사람이 설정을 마치면 이 실행을 이어서 재개할 수 있다.
          applyFailure(settled.status, {
            code: settled.errorCode || 'WAITING_FOR_USER',
            message: 'AI 공급자를 사용할 수 없습니다. 설정을 마치면 이어서 분석합니다.',
            retryable: false,
            requiresAction: 'configure_google_api',
          });
          return;
        }

        if (settled.status === 'failed' || !settled.result) {
          applyFailure('failed', {
            code: settled.errorCode || 'ANALYSIS_FAILED',
            message: '문서 AI 분석을 완료하지 못했습니다.',
            retryable: true,
          });
          return;
        }

        setOutlineProgressStep(3);
        setOutlineProgressMessage('✓ 분석 완료! 목차 트리를 표시합니다.');
        applyResult(settled.result);
      } catch (err) {
        console.error('[useDocumentOutline] Extract outline failed:', err);
        const apiError = err instanceof HttpError ? err.payload?.error : undefined;
        applyFailure('failed', {
          code: apiError?.code || 'ANALYSIS_REQUEST_FAILED',
          message: apiError?.message || '문서 AI 분석을 완료하지 못했습니다. 다시 시도해 주세요.',
          retryable: apiError?.retryable ?? true,
          requiresAction: apiError?.requiresAction,
        });
        optionsRef.current.onError?.(err);
      } finally {
        setTimeout(() => {
          setIsExtractingOutline(false);
        }, 600);
      }
    },
    [docId, isExtractingOutline, applyResult, applyFailure, patchNode]
  );

  /** 보류·중단된 실행을 처음부터 다시 돌리지 않고 이어서 실행합니다. */
  const resumeOutline = useCallback(async () => {
    if (!runId) return;
    setIsExtractingOutline(true);
    try {
      await agentRunClient.resume(runId);
      const settled = await followAgentRun<ExtractOutlineResponse>(runId, (current) =>
        setRunStatus(current.status)
      );
      if (settled.status === 'completed' && settled.result) applyResult(settled.result);
    } finally {
      setIsExtractingOutline(false);
    }
  }, [runId, applyResult]);

  const toggleOutlinePanel = useCallback(() => {
    setIsOutlineOpen((prev) => {
      const next = !prev;
      // React 19: BatchProvider setState 충돌 방지를 위해 setNodes를 updater 바깥 비동기 마이크로태스크로 분리
      queueMicrotask(() => patchNode({ isOutlineOpen: next }));
      if (next) void loadAdopted();
      return next;
    });
  }, [patchNode, loadAdopted]);

  return {
    isExtractingOutline,
    outlineProgressStep,
    outlineProgressMessage,
    isOutlineOpen,
    outlines,
    elements,
    hasOutline: hasAdoptedOutline || outlines.length > 0,
    selectedElementId,
    outlineError,
    runStatus,
    runId,
    setSelectedElementId,
    extractOutline,
    resumeOutline,
    toggleOutlinePanel,
  };
}
