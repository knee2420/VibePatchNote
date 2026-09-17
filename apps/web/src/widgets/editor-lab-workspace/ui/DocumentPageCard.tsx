import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Maximize2,
  Sparkles,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  Calculator,
  Zap,
} from 'lucide-react';
import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';

export interface DocumentPageCardProps {
  pageNumber: number;
  totalPages?: number;
  pageHtml: string;
  documentKey: string;
  containerWidth: number;
  onChangeHtml: (pageNumber: number, html: string) => void;
  onChangeMarkdown?: (md: string) => void;
  onOpenSoloTab?: (pageNumber: number) => void;
  customScale?: number;
  autoFit?: boolean;
  activeMappingNumber?: number | null;
  activeSlotId?: string | null;
  onSlotClick?: (slotId: string, pageNumber: number, slotNumber?: number) => void;
  onBindSlot?: (slotId: string, value: string, resourceName?: string, resourceId?: string) => void;

  // 2D 문서 AI 에이전트 확장 기능 props
  onJumpToSourceAnchor?: (slotId: string) => void;
  onAcceptSlotSuggestion?: (slotId: string) => void;
  slotBindings?: Record<string, { status: string; value: string; suggestedValue?: string; resourceName?: string }>;
}

const BASE_PAGE_WIDTH = 595; // A4 표준 너비 (pt/px)
const BASE_PAGE_HEIGHT = 842; // A4 표준 높이 (pt/px)

// 2D 레이아웃 진단기 규칙 (Page별 다이그노스틱스)
const PAGE_DIAGNOSTICS: Record<number, Array<{ slotId: string; type: 'error' | 'warning' | 'suggestion'; message: string; quickFix: string }>> = {
  1: [
    {
      slotId: 's7',
      type: 'warning',
      message: '지출금액(₩40,000)에 대응하는 영수증 증빙 미첨부 (Coupling Rule)',
      quickFix: '영수증 자동 부착 (receipt-20181108.png)',
    },
    {
      slotId: 's5',
      type: 'suggestion',
      message: '회의내용 개조식 번호 매기기(1., 2., 3.) 서식 권장',
      quickFix: '번호 목록 서식 변환',
    },
  ],
  2: [
    {
      slotId: 's13',
      type: 'suggestion',
      message: '지출금액 ₩29,000 (1인당 9,666원) 한도 규정 준수 확인',
      quickFix: '예산 집행 인증 마크 첨부',
    },
  ],
};

export function DocumentPageCard({
  pageNumber,
  pageHtml,
  documentKey,
  containerWidth,
  onChangeHtml,
  onChangeMarkdown,
  onOpenSoloTab,
  customScale,
  autoFit = true,
  activeMappingNumber,
  activeSlotId,
  onSlotClick,
  onBindSlot,
  onJumpToSourceAnchor,
  onAcceptSlotSuggestion,
  slotBindings = {},
}: DocumentPageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragTargetSlotRef = useRef<HTMLElement | null>(null);

  // 인라인 플로팅 프롬프트 바 상태 (Cmd+K)
  const [inlinePromptSlotId, setInlinePromptSlotId] = useState<string | null>(null);
  const [inlinePromptInput, setInlinePromptInput] = useState('');
  const [showInlinePrompt, setShowInlinePrompt] = useState(false);

  // 컨테이너 너비에 맞춘 자동 배율 계산
  const scale = useMemo(() => {
    if (customScale !== undefined) {
      return customScale;
    }
    if (!autoFit || containerWidth <= 0) {
      return 1;
    }
    const availableWidth = Math.max(280, containerWidth - 48);
    return Math.min(1.0, availableWidth / BASE_PAGE_WIDTH);
  }, [containerWidth, customScale, autoFit]);

  // 슬롯 선택 시 부드러운 스크롤 포커스
  useEffect(() => {
    if (!cardRef.current) return;
    if (activeMappingNumber == null && !activeSlotId) return;

    const selector = activeSlotId
      ? `span[data-type="scaffold-slot"][data-slot-id="${activeSlotId}"]`
      : `span[data-type="scaffold-slot"][data-mapping-num="${activeMappingNumber}"]`;

    const el = cardRef.current.querySelector<HTMLElement>(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      // 2D 인라인 액션 바 위치 설정
      if (activeSlotId) {
        setInlinePromptSlotId(activeSlotId);
      }
    }
  }, [activeMappingNumber, activeSlotId]);

  // 캔버스 내 슬롯 클릭 시 역방향 동기화 및 인라인 툴바 활성화
  const handleCardClick = (e: React.MouseEvent) => {
    const slotEl = (e.target as HTMLElement | null)?.closest<HTMLElement>('span[data-type="scaffold-slot"]');
    if (slotEl) {
      const slotId = slotEl.getAttribute('data-slot-id') || '';
      const numStr = slotEl.getAttribute('data-mapping-num');
      const num = numStr ? parseInt(numStr, 10) : undefined;
      onSlotClick?.(slotId, pageNumber, num);
      setInlinePromptSlotId(slotId);
      setShowInlinePrompt(true);
    } else {
      setShowInlinePrompt(false);
    }
  };

  // 캔버스 슬롯 위로 드래그 오버 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('span[data-type="scaffold-slot"]');
    if (target) {
      e.dataTransfer.dropEffect = 'copy';
      if (dragTargetSlotRef.current && dragTargetSlotRef.current !== target) {
        dragTargetSlotRef.current.style.outline = '';
        dragTargetSlotRef.current.style.backgroundColor = '';
      }
      dragTargetSlotRef.current = target;
      target.style.outline = '2px dashed #6366f1';
      target.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
    } else if (dragTargetSlotRef.current) {
      dragTargetSlotRef.current.style.outline = '';
      dragTargetSlotRef.current.style.backgroundColor = '';
      dragTargetSlotRef.current = null;
    }
  };

  const handleDragLeave = () => {
    if (dragTargetSlotRef.current) {
      dragTargetSlotRef.current.style.outline = '';
      dragTargetSlotRef.current.style.backgroundColor = '';
      dragTargetSlotRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragTargetSlotRef.current) {
      dragTargetSlotRef.current.style.outline = '';
      dragTargetSlotRef.current.style.backgroundColor = '';
    }

    const slotEl =
      (e.target as HTMLElement | null)?.closest<HTMLElement>('span[data-type="scaffold-slot"]') ||
      dragTargetSlotRef.current;
    dragTargetSlotRef.current = null;

    if (!slotEl) return;
    const slotId = slotEl.getAttribute('data-slot-id');
    if (!slotId) return;

    const rawJson = e.dataTransfer.getData('application/json');
    if (rawJson) {
      try {
        const payload = JSON.parse(rawJson);
        if (payload.type === 'resource') {
          onBindSlot?.(slotId, payload.name, payload.name, payload.resourceId);
          return;
        }
      } catch {
        // Fallthrough
      }
    }

    const plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      onBindSlot?.(slotId, plainText, '텍스트 드롭');
    }
  };

  const scaledWidth = Math.round(BASE_PAGE_WIDTH * scale);
  const scaledHeight = Math.round(BASE_PAGE_HEIGHT * scale);
  const pageDiagnostics = PAGE_DIAGNOSTICS[pageNumber] || [];

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        minHeight: `${scaledHeight}px`,
      }}
      className="relative group shrink-0 my-5 transition-all duration-150 select-none"
    >
      {/* 1. 상단 미니멀 플로팅 메타 뱃지 및 다이그노스틱스 요약 */}
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-1 text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-slate-200">PAGE {pageNumber}</span>
          <span className="text-[10px] text-slate-500 font-sans hidden sm:inline-block">A4 규격</span>

          {/* 2D 레이아웃 다이그노스틱스 배지 */}
          {pageDiagnostics.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-sans">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{pageDiagnostics.length}개 서식 개선 제안</span>
            </span>
          )}

          {scale < 0.99 && (
            <span className="text-[10px] bg-slate-800/90 text-indigo-300 px-1.5 py-0.2 rounded font-mono border border-slate-700/60 font-semibold">
              {Math.round(scale * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* 수치 계산 검증 요약 태그 (1페이지 40,000원 / 2페이지 29,000원) */}
          {pageNumber === 1 && (
            <span className="hidden md:flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 font-mono">
              <Calculator className="w-2.5 h-2.5" />
              <span>지출: ₩40,000 (합계 ₩69,000 연계)</span>
            </span>
          )}
          {pageNumber === 2 && (
            <span className="hidden md:flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 font-mono">
              <Calculator className="w-2.5 h-2.5" />
              <span>지출: ₩29,000 (정합 100%)</span>
            </span>
          )}

          {onOpenSoloTab && (
            <button
              type="button"
              onClick={() => onOpenSoloTab(pageNumber)}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-200 bg-slate-900/90 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-xs"
              title="이 페이지만 단독 편집 탭으로 분리하여 열기"
            >
              <Maximize2 className="w-3 h-3 text-indigo-400" />
              <span>단독 탭</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 2D 영역 선택 인라인 프롬프트 바 (Selection Cmd+K) */}
      {showInlinePrompt && inlinePromptSlotId && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-indigo-500/80 rounded-xl shadow-2xl px-3 py-2 flex items-center gap-2 text-xs font-sans animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-1 text-indigo-300 font-mono text-[11px] font-bold shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Slot #{inlinePromptSlotId}</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-700" />

          {/* 원본 출처 역추적 버튼 */}
          <button
            type="button"
            onClick={() => onJumpToSourceAnchor?.(inlinePromptSlotId)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
            title="원본 문서(11월 디딤돌 회의록.pdf)의 해당 위치로 줌인"
          >
            <ExternalLink className="w-3 h-3 text-indigo-400" />
            <span>출처 역추적</span>
          </button>

          {/* 고스트 제안 수락 버튼 */}
          {slotBindings[inlinePromptSlotId]?.status !== 'bound' && (
            <button
              type="button"
              onClick={() => onAcceptSlotSuggestion?.(inlinePromptSlotId)}
              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition-colors shadow-xs"
            >
              <Check className="w-3 h-3" />
              <span>추천값 적용</span>
            </button>
          )}

          {/* 인라인 Cmd+K 입력창 */}
          <input
            type="text"
            value={inlinePromptInput}
            onChange={(e) => setInlinePromptInput(e.target.value)}
            placeholder="Cmd+K: 이 슬롯에 지시..."
            className="w-36 bg-slate-800 text-slate-100 px-2 py-0.5 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-400 font-sans"
          />

          <button
            type="button"
            onClick={() => setShowInlinePrompt(false)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. 실제 A4 종이 캔버스 (Scale 변환 적용) */}
      <div
        ref={cardRef}
        onClick={handleCardClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${BASE_PAGE_WIDTH}px`,
          minHeight: `${BASE_PAGE_HEIGHT}px`,
        }}
        className="bg-white text-slate-900 shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-slate-300/80 rounded-[2px] p-6 select-text overflow-hidden hover:border-indigo-400/60 transition-colors relative"
      >
        <ScaffoldCanvasEditor
          key={`${documentKey}-p${pageNumber}`}
          initialContent={pageHtml}
          activeMappingNumber={activeMappingNumber}
          onChangeHtml={(html) => onChangeHtml(pageNumber, html)}
          onChangeMarkdown={onChangeMarkdown}
        />
      </div>

      {/* 4. 캔버스 하단 레이아웃 진단기 & 퀵픽스 바 (Visual Red Squiggles & Quick Fix) */}
      {pageDiagnostics.length > 0 && (
        <div className="mt-2 space-y-1 select-none">
          {pageDiagnostics.map((diag, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-[11px] font-sans text-slate-300 shadow-xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-indigo-400 font-bold shrink-0">
                  #{diag.slotId}
                </span>
                <span className="truncate text-slate-300">{diag.message}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (diag.slotId === 's7') {
                    onBindSlot?.('s7', 'receipt-20181108.png (영수증 부착)', '11월8일영수증.png');
                  } else if (diag.slotId === 's5') {
                    onBindSlot?.(
                      's5',
                      '1. GPS 모듈 핀맵 재점검\n2. 영상 인코딩 스트리밍 레이턴시 50ms 이내 안정화\n3. 시연 동선 리허설',
                      '서식 교정'
                    );
                  }
                }}
                className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/50 text-[10px] font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1"
              >
                <Zap className="w-2.5 h-2.5 text-amber-300" />
                <span>Quick Fix</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
