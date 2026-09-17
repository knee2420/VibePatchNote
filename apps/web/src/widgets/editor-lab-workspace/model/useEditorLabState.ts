import { useState, useCallback } from 'react';
import type {
  PageLayoutMode,
  AgentPanelTab,
  DiffChunkItem,
  ModelConfig,
  ContextTagItem,
  AgentExecutionStep,
} from '@vibe/editor-workspace';

import {
  labModelConfig,
  labContextTags,
  labAgentSteps,
  labDiffChunks,
  labSectionContents,
  type LabSectionContent,
} from './mockData';

export function useEditorLabState() {
  // 1. 패널 가시성 및 너비 상태
  const [showSidebar, setShowSidebar] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [inspectorWidth, setInspectorWidth] = useState(380);

  // 2. 뷰포트 레이아웃 및 줌
  const [layoutMode, setLayoutMode] = useState<PageLayoutMode>('continuous');
  const [zoom, setZoom] = useState(100);

  // 3. 바인더 상태
  const [activeSpine, setActiveSpine] = useState<'rubric' | 'evidence'>('rubric');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sec-1-1');

  // 4. AI 인스펙터 패널 상태
  const [activeAiTab, setActiveAiTab] = useState<AgentPanelTab>('stream');
  const [promptValue, setPromptValue] = useState('');
  const [modelConfig, setModelConfig] = useState<ModelConfig>(labModelConfig);
  const [contextTags, setContextTags] = useState<ContextTagItem[]>(labContextTags);
  const [agentSteps, setAgentSteps] = useState<AgentExecutionStep[]>(labAgentSteps);
  const [diffChunks, setDiffChunks] = useState<DiffChunkItem[]>(labDiffChunks);
  const [isExecutingAi, setIsExecutingAi] = useState(false);

  // 활성 섹션 본문 데이터 도출
  const activeSection: LabSectionContent = selectedNodeId && labSectionContents[selectedNodeId]
    ? labSectionContents[selectedNodeId]
    : labSectionContents['sec-1-1'];

  // 노드 선택 핸들러
  const handleSelectNode = useCallback((nodeId: string | null) => {
    if (nodeId) {
      setSelectedNodeId(nodeId);
      const section = labSectionContents[nodeId];
      if (section) {
        setContextTags([
          { id: `tag-${section.id}`, type: 'section', label: section.title },
          { id: 'tag-core', type: 'doc', label: '루브릭 뼈대 헌법 (00-core)' },
        ]);
      }
    }
  }, []);

  // 줌 조절 핸들러
  const handleZoomIn = useCallback(() => setZoom((prev) => Math.min(prev + 10, 150)), []);
  const handleZoomOut = useCallback(() => setZoom((prev) => Math.max(prev - 10, 70)), []);
  const handleZoomReset = useCallback(() => setZoom(100), []);

  // AI 프롬프트 제출 모의 실행
  const handleSubmitPrompt = useCallback((prompt: string) => {
    if (!prompt.trim()) return;
    setIsExecutingAi(true);

    const newStepId = `step-${Date.now()}`;
    const startTime = Date.now();
    const initialStep: AgentExecutionStep = {
      id: newStepId,
      stepNumber: agentSteps.length + 1,
      title: `"${prompt.slice(0, 24)}..." 분석 및 작업 수행`,
      status: 'running',
      startedAt: startTime,
    };

    setAgentSteps((prev) => [...prev, initialStep]);
    setPromptValue('');

    setTimeout(() => {
      setAgentSteps((prev) =>
        prev.map((step) =>
          step.id === newStepId
            ? {
                ...step,
                status: 'completed',
                thought: `모델 ${modelConfig.modelName}이(가) 컨텍스트를 분석하여 최적의 단락 구성을 완성했습니다.`,
                completedAt: Date.now(),
              }
            : step
        )
      );
      setIsExecutingAi(false);
    }, 1200);
  }, [agentSteps.length, modelConfig.modelName]);

  // Diff 청크 수락/거절 핸들러
  const handleAcceptChunk = useCallback((chunkId: string) => {
    setDiffChunks((prev) =>
      prev.map((chunk) => (chunk.id === chunkId ? { ...chunk, status: 'accepted' } : chunk))
    );
  }, []);

  const handleRejectChunk = useCallback((chunkId: string) => {
    setDiffChunks((prev) =>
      prev.map((chunk) => (chunk.id === chunkId ? { ...chunk, status: 'rejected' } : chunk))
    );
  }, []);

  const handleAcceptAllChunks = useCallback(() => {
    setDiffChunks((prev) => prev.map((c) => ({ ...c, status: 'accepted' })));
  }, []);

  const handleRejectAllChunks = useCallback(() => {
    setDiffChunks((prev) => prev.map((c) => ({ ...c, status: 'rejected' })));
  }, []);

  // 태그 삭제 핸들러
  const handleRemoveContextTag = useCallback((tagId: string) => {
    setContextTags((prev) => prev.filter((t) => t.id !== tagId));
  }, []);

  return {
    // 패널 가시성 & 너비
    showSidebar,
    setShowSidebar,
    showInspector,
    setShowInspector,
    sidebarWidth,
    setSidebarWidth,
    inspectorWidth,
    setInspectorWidth,

    // 뷰포트 레이아웃 & 줌
    layoutMode,
    setLayoutMode,
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,

    // 바인더 & 섹션
    activeSpine,
    setActiveSpine,
    selectedNodeId,
    handleSelectNode,
    activeSection,

    // AI 인스펙터
    activeAiTab,
    setActiveAiTab,
    promptValue,
    setPromptValue,
    modelConfig,
    setModelConfig,
    contextTags,
    handleRemoveContextTag,
    agentSteps,
    diffChunks,
    isExecutingAi,
    handleSubmitPrompt,
    handleAcceptChunk,
    handleRejectChunk,
    handleAcceptAllChunks,
    handleRejectAllChunks,
  };
}
