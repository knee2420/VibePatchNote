import { memo, useCallback, useMemo, useRef } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import {
  FileText,
  Maximize2,
  Trash2,
  Sparkles,
  Loader2,
  Layers,
  AlertCircle,
} from 'lucide-react';

import { ScaffoldCanvasEditor, type SlotMappingItem } from '@vibe/tiptap-scaffold';

import { useSyncMappingStore } from '@/shared/model';
import { ProviderExecutionBadge, providerExecutionMessage } from '@/shared/ui';

import { useScaffoldArchive, type ScaffoldArchiveSyncState } from '../model/useScaffoldArchive';
import { useScaffoldFocusStore } from '../model/useScaffoldFocusStore';
import { type ScaffoldDocumentNode, SCAFFOLD_CARD_SIZE } from '../model/types';

/**
 * ScaffoldDocumentCard (FSD Entity UI)
 *
 * 미로(Miro) 레퍼런스 스타일의 스캐폴딩 문서 노드.
 * 원본 참고 문서와 '= 동급' 크기(600x800)로 배치되며,
 * 1) 생성 중: 실시간 AI 프로세스(Vision -> 2D Grid -> DSL 추론 -> DOM 검증) 현황 시각화
 * 2) 완료 시: Tiptap 와이어프레임 캔버스 에디터(인라인 슬롯, 다단 그리드)가 카드에 직접 렌더링됩니다.
 */
const SYNC_LABELS: Record<ScaffoldArchiveSyncState, string> = {
  idle: '',
  hydrating: '불러오는 중',
  saving: '저장 중',
  saved: '보관함 저장됨',
  error: '동기화 실패',
};

export const ScaffoldDocumentCard = memo(function ScaffoldDocumentCard({
  id,
  data,
  selected = false,
}: NodeProps<ScaffoldDocumentNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const openFocus = useScaffoldFocusStore((s) => s.openFocus);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  // 본문(HTML/마크다운/슬롯)의 출처이자 저장처는 백엔드 아카이브다.
  const { syncState } = useScaffoldArchive(id, data, editorContainerRef);

  const setActiveMapping = useSyncMappingStore((s) => s.setActiveMapping);
  const activeMapping = useSyncMappingStore((s) => s.activeMapping);

  const handleHoverSlot = useCallback(
    (slot: SlotMappingItem | null) => {
      if (!slot) {
        setActiveMapping(null);
        return;
      }
      setActiveMapping({
        id: slot.id,
        number: slot.number,
        label: slot.label,
        box_2d: slot.box_2d,
        page: slot.pageNumber ?? 1,
        targetNodeId: (data.sourceNodeId as string) || undefined,
        sourcePdfFileName: data.sourcePdfFileName,
        source: 'slot',
      });
    },
    [setActiveMapping, data.sourceNodeId, data.sourcePdfFileName]
  );

  // 활성 매핑이 이 스캐폴드 카드의 원본 문서와 일치하는 경우에만 하이라이트 번호를 전달한다 (타 카드 교차 번짐 완벽 방지)
  const isMappingForThisCard = useMemo(() => {
    if (!activeMapping) return false;
    if (activeMapping.targetNodeId && data.sourceNodeId) {
      return activeMapping.targetNodeId === data.sourceNodeId;
    }
    if (activeMapping.sourcePdfFileName && data.sourcePdfFileName) {
      return activeMapping.sourcePdfFileName === data.sourcePdfFileName;
    }
    return false;
  }, [activeMapping, data.sourceNodeId, data.sourcePdfFileName]);

  const activeNumberForEditor = isMappingForThisCard ? activeMapping?.number : null;

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    },
    [id, setNodes, setEdges]
  );

  const handleOpenFocus = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openFocus(id);
    },
    [id, openFocus]
  );

  // 카드 본문에서 Tiptap 내용이 편집될 때 노드 데이터 실시간 동기화
  const handleUpdateHtml = useCallback(
    (html: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                htmlContent: html,
              },
            };
          }
          return n;
        })
      );
    },
    [id, setNodes]
  );

  const handleUpdateMarkdown = useCallback(
    (md: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                markdownContent: md,
              },
            };
          }
          return n;
        })
      );
    },
    [id, setNodes]
  );

  // 원본 참고 카드와 동급(=동일) 크기 산정
  const cardStyle = useMemo(() => {
    const width = data.width || SCAFFOLD_CARD_SIZE.width;
    const height = data.height || SCAFFOLD_CARD_SIZE.height;
    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [data.width, data.height]);

  // 세션에서 복원된 노드는 본문이 비어 있고 포인터만 있다. 그것도 완료 상태다.
  const status = data.status || (data.htmlContent || data.scaffoldId ? 'completed' : 'generating');
  return (
    <div
      style={cardStyle}
      className={`
        rounded-2xl border-2 transition-all duration-300 select-none
        flex flex-col overflow-hidden bg-white text-slate-800 shadow-md relative [contain:layout_style]
        ${
          selected
            ? 'border-indigo-500 ring-4 ring-indigo-400/20 z-30 shadow-indigo-900/10'
            : 'border-slate-200 hover:border-slate-300 z-10 hover:z-20'
        }
      `}
    >
      {/* 1. 카드 상단 헤더 바 */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            {status === 'generating' ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {status === 'generating' ? 'AI 실시간 분석 중' : 'Tiptap 와이어프레임 서식'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {status === 'generating' ? '실행 중' : 'v1.0'}
              </span>
              {status === 'completed' && syncState !== 'idle' && (
                <span
                  className={`text-[10px] font-medium ${syncState === 'error' ? 'text-rose-500' : 'text-slate-400'}`}
                  title="서식 보관함 동기화 상태"
                >
                  {SYNC_LABELS[syncState]}
                </span>
              )}
            </div>
            <h4 className="font-semibold text-sm text-slate-900 truncate leading-tight mt-0.5" title={data.title}>
              {data.title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 포커스(전체화면 3단 모달) 버튼 */}
          <button
            onClick={handleOpenFocus}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-indigo-600 border border-slate-200 shadow-2xs transition-all nodrag cursor-pointer"
            title="Playground 3단 전체 화면 포커스 편집"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {/* 노드 삭제 버튼 */}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-2xs transition-all nodrag cursor-pointer"
            title="서식 카드 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 카드 본문 뷰포트 (상태에 따른 분기) */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-50/50 relative">
        {/* CASE 1: AI 프로세스 진행 중 (Thinking & Generating) */}
        {status === 'generating' && (
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto nowheel">
            <div className="flex flex-col gap-5">
              {/* 상단 펄스 타이틀 */}
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-indigo-900">
                    AI 서식 분석 엔진이 문서를 스캐폴딩하고 있습니다
                  </h5>
                  <p className="text-[11px] text-indigo-600/80 mt-0.5">
                    {data.progressMessage || '문서 2D 레이아웃 및 Tiptap 구조 추론 중...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <ProviderExecutionBadge execution={data.execution} />
                <span className="text-[11px] text-slate-600">
                  {providerExecutionMessage(data.execution)}
                </span>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Loader2 className="size-4 animate-spin text-indigo-600" />
                  문서 구조와 편집 슬롯을 생성하고 있습니다
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500">공급자가 실제 단계별 진행률을 제공하지 않아 임의의 백분율은 표시하지 않습니다.</p>
              </div>
            </div>

            {/* 하단 팁 */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                완료 즉시 카드 상에 Tiptap 인터랙티브 편집기가 렌더링됩니다
              </span>
            </div>
          </div>
        )}

        {/* CASE 2: 완료 시 원본 카드와 '= 동급'의 Tiptap 서식 에디터 화면 직접 렌더링 (핵심!) */}
        {status === 'completed' && (
          <div
            ref={editorContainerRef}
            className="flex-1 w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-50 nodrag nowheel"
          >
            <div className="max-w-full mx-auto">
              <ScaffoldCanvasEditor
                initialContent={data.htmlContent}
                slots={data.slots as SlotMappingItem[] | undefined}
                onChangeHtml={handleUpdateHtml}
                onChangeMarkdown={handleUpdateMarkdown}
                onHoverSlot={handleHoverSlot}
                activeMappingNumber={activeNumberForEditor}
              />
            </div>
          </div>
        )}

        {/* CASE 3: 에러 발생 시 */}
        {status === 'error' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-4 text-slate-600">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">서식 추출에 실패했습니다</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {data.errorMessage || '문서 분석 중 오류가 발생했습니다. 원본 카드의 버튼을 눌러 다시 시도해 주세요.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 메타 바 */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span>연동: {data.sourcePdfFileName || 'PDF'}</span>
          {data.difficulty && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 uppercase font-mono font-medium">
              {data.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {data.archive?.overlayImageUrl && (
            <a
              href={data.archive.overlayImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 font-medium transition-colors flex items-center gap-1 cursor-pointer hover:underline"
              title="슬롯 오버레이 비전 검증 이미지 열기"
            >
              <span>비전 검증 👁️</span>
            </a>
          )}
          <button
            onClick={handleOpenFocus}
            className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer transition-colors flex items-center gap-1"
          >
            <span>Playground 전체화면 ↗</span>
          </button>
        </div>
      </div>

      {/* 4. React Flow 엣지 핸들 (미로 스타일 연결점) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3.5 !h-3.5 !bg-indigo-600 !border-2 !border-white !shadow-sm transition-transform hover:!scale-125"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3.5 !h-3.5 !bg-indigo-600 !border-2 !border-white !shadow-sm transition-transform hover:!scale-125"
      />
    </div>
  );
});
