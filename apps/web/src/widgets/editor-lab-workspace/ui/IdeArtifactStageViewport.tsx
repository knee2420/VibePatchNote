import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Package,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Check,
  Code,
  FileDiff,
  FileText,
  ExternalLink,
  RotateCcw,
  BrainCircuit,
  Pin,
  RefreshCw,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';
import { extractAllPages } from '../lib/scaffoldPageUtils';
import type { EditorTabItem, SlotBindingInfo } from '../model/types';
import { SLOT_MODIFICATIONS, type SlotCandidateItem } from './IdeSecondarySidebar';

export interface IdeArtifactStageViewportProps {
  tab: EditorTabItem;
  scaffoldId?: string;
  liveHtml?: string;
  slotBindings?: Record<string, SlotBindingInfo>;
  onApplySlotToCanvas?: (slotId: string, value: string, resourceName?: string) => void;
  onUnbindSlot?: (slotId: string) => void;
  onOpenSlotProvenance?: (binding: SlotBindingInfo) => void;
  onOpenReasoning?: (slotId?: string) => void;
  onApplyAllToCanvas?: () => void;
  onSelectPageTab?: (pageNumber: number) => void;
}

type ArtifactViewMode = 'wireframe' | 'diff' | 'json';

const BASE_PAGE_WIDTH = 595; // A4 표준 너비
const BASE_PAGE_HEIGHT = 842; // A4 표준 높이

// 기본 회의비 사용 내역 서식 템플릿 (liveHtml 로딩 전 안전 폴백)
const FALLBACK_WIREFRAME_HTML = `
<div data-type="scaffold-page" data-page="1">
  <h2 style="text-align:center;font-weight:bold;margin-bottom:1rem;color:#0f172a;">회의비 사용 내역</h2>
  <table style="width:100%;border-collapse:collapse;border:1px solid #94a3b8;font-size:12px;">
    <tbody>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="width:110px;padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">일 시</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s1" data-mapping-num="1" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">장 소</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s2" data-mapping-num="2" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">참석자</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s3" data-mapping-num="3" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">안 건</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s4" data-mapping-num="4" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">회의내용</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s5" data-mapping-num="5" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">지출금액</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s6" data-mapping-num="6" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">증빙자료</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s7" data-mapping-num="7" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
    </tbody>
  </table>
</div>
<div data-type="scaffold-page" data-page="2">
  <h2 style="text-align:center;font-weight:bold;margin-bottom:1rem;color:#0f172a;">회의비 사용 내역 (2차)</h2>
  <table style="width:100%;border-collapse:collapse;border:1px solid #94a3b8;font-size:12px;">
    <tbody>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="width:110px;padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">일 시</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s8" data-mapping-num="8" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">장 소</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s9" data-mapping-num="9" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">참석자</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s10" data-mapping-num="10" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">안 건</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s11" data-mapping-num="11" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">회의내용</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s12" data-mapping-num="12" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">지출금액</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s13" data-mapping-num="13" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
      <tr><td style="padding:8px;background:#f8fafc;font-weight:bold;border-right:1px solid #cbd5e1;text-align:center;">증빙자료</td><td style="padding:8px;"><span data-type="scaffold-slot" data-slot-id="s14" data-mapping-num="14" style="border:1px dashed #a855f7;padding:2px 6px;border-radius:4px;display:inline-block;min-width:120px;"></span></td></tr>
    </tbody>
  </table>
</div>
`;

/**
 * [ArtifactPageCanvas]
 * 피드백 3대 핵심 적용:
 * 1) 변경 내용(추가 내용)을 시각적으로 선명하게 강조 (초록빛 뱃지 & Diff 태그)
 * 2) 반영(Apply) ⟷ 반영 해제(Unbind/Revert) 토글 버튼 지원
 * 3) 출처 표기 뱃지 제공 & 클릭 시 헵타베이스 리소스 모달 + 하이라이트 즉시 연동
 */
interface ArtifactPageCanvasProps {
  pageNumber: number;
  pageHtml: string;
  slotBindings: Record<string, SlotBindingInfo>;
  mergedSlotIds: Set<string>;
  fixedSlotIds: Set<string>;
  selectedCandidates: Record<string, string>;
  activeCandidateSlotId: string | null;
  onToggleSlot: (slotId: string, isCurrentlyMerged: boolean, suggestedVal: string, resourceName?: string) => void;
  onToggleFix: (slotId: string) => void;
  onSelectCandidate: (slotId: string, candidate: SlotCandidateItem) => void;
  onToggleCandidateMenu: (slotId: string) => void;
  onOpenProvenance?: (binding: SlotBindingInfo) => void;
  onOpenReasoning?: (slotId?: string) => void;
  containerWidth: number;
}

function ArtifactPageCanvas({
  pageNumber,
  pageHtml,
  slotBindings,
  mergedSlotIds,
  fixedSlotIds,
  selectedCandidates,
  activeCandidateSlotId,
  onToggleSlot,
  onToggleFix,
  onSelectCandidate,
  onToggleCandidateMenu,
  onOpenProvenance,
  onOpenReasoning,
  containerWidth,
}: ArtifactPageCanvasProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [slotOverlays, setSlotOverlays] = useState<
    Array<{
      slotId: string;
      name: string;
      pageNumber: number;
      top: number;
      left: number;
      width: number;
      height: number;
      suggestedVal: string;
      resourceName?: string;
      sourceLocation?: string;
      isMultiline?: boolean;
    }>
  >([]);

  // 컨테이너 폭에 따른 A4 스케일 계산
  const scale = useMemo(() => {
    if (containerWidth <= 0) return 1;
    const availableWidth = Math.max(300, containerWidth - 48);
    return Math.min(1.0, availableWidth / BASE_PAGE_WIDTH);
  }, [containerWidth]);

  // A4 종이 캔버스 내부의 실제 슬롯 위치(span[data-type="scaffold-slot"])를 스캔하여 오버레이 위치 계산
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updateOverlays = () => {
      const containerRect = card.getBoundingClientRect();
      const currentScale = containerRect.width > 0 ? containerRect.width / BASE_PAGE_WIDTH : scale;
      const slots = card.querySelectorAll<HTMLElement>('span[data-type="scaffold-slot"]');
      const items: Array<{
        slotId: string;
        name: string;
        pageNumber: number;
        top: number;
        left: number;
        width: number;
        height: number;
        suggestedVal: string;
        resourceName?: string;
        sourceLocation?: string;
        isMultiline?: boolean;
      }> = [];

      slots.forEach((el) => {
        const slotId = el.getAttribute('data-slot-id');
        if (!slotId) return;

        const mod = SLOT_MODIFICATIONS.find((m) => m.slotId === slotId);
        if (!mod) return;

        // 부모 table cell (td) 이 존재하면 셀 전체 영역을 타겟팅하여 넓고 시원한 뷰 제공!
        const td = el.closest('td');
        const targetEl = td || el;
        const targetRect = targetEl.getBoundingClientRect();

        // 부모 cardRef 기준 상대 좌표 계산
        const rawTop = (targetRect.top - containerRect.top) / currentScale;
        const rawLeft = (targetRect.left - containerRect.left) / currentScale;
        const rawWidth = targetRect.width / currentScale;
        const rawHeight = targetRect.height / currentScale;

        // 셀 내부 여백 및 최소 크기 정규화
        const inset = td ? 2 : 0;
        const top = rawTop + inset;
        const left = rawLeft + inset;
        const width = td ? Math.max(rawWidth - inset * 2, 320) : Math.max(rawWidth + 120, 260);
        const height = td ? Math.max(rawHeight - inset * 2, 34) : Math.max(rawHeight, 32);
        const isMultiline = height > 50 || mod.changeText.length > 40;

        items.push({
          slotId,
          name: mod.name,
          pageNumber: mod.pageNumber,
          top,
          left,
          width,
          height,
          suggestedVal: mod.changeText,
          resourceName: mod.resourceName,
          sourceLocation: '2p 17L',
          isMultiline,
        });
      });

      setSlotOverlays(items);
    };

    const timer = setTimeout(updateOverlays, 80);
    window.addEventListener('resize', updateOverlays);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateOverlays);
    };
  }, [pageHtml, scale]);

  const scaledWidth = Math.round(BASE_PAGE_WIDTH * scale);
  const scaledHeight = Math.round(BASE_PAGE_HEIGHT * scale);

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        minHeight: `${scaledHeight}px`,
      }}
      className="relative group shrink-0 my-5 select-none transition-all"
    >
      {/* 1. 상단 미니멀 플로팅 메타 뱃지 */}
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-1 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">PAGE {pageNumber}</span>
          <span className="px-2 py-0.2 rounded bg-indigo-950/90 text-indigo-300 border border-indigo-700/80 font-bold text-[10px] font-sans">
            📦 Artifact 에이전트 완성본
          </span>
          <span className="text-[10px] text-slate-500 font-sans">A4 규격 서식</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReasoning && (
            <button
              type="button"
              onClick={() => onOpenReasoning()}
              className="px-2 py-0.5 rounded bg-indigo-900/90 hover:bg-indigo-700 active:scale-95 text-indigo-200 hover:text-white border border-indigo-500/70 font-sans font-bold text-[10px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="에이전트 산출물 추론 근거(Prompt Goal · 바인더 아웃라인 맥락 · 레시피 규격) 좌측 모달 열기"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-300" />
              <span>🧠 Reasoning: 생성 근거</span>
            </button>
          )}

          <span className="text-[10px] text-emerald-400 font-sans font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>에이전트 제안값 완성 서식</span>
          </span>
        </div>
      </div>

      {/* 2. 실제 A4 종이 캔버스 (좌측과 100% 동일한 비주얼 구조!) */}
      <div
        ref={cardRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${BASE_PAGE_WIDTH}px`,
          minHeight: `${BASE_PAGE_HEIGHT}px`,
        }}
        className="artifact-stage-canvas bg-white text-slate-900 shadow-[0_12px_40px_rgba(0,0,0,0.35)] border-2 border-indigo-500/70 rounded-[2px] p-6 overflow-visible relative transition-colors"
      >
        {/* 인라인 스타일로 에디터 내 슬롯 폰트 및 스타일 보강 */}
        <style>{`
          .artifact-stage-canvas span[data-type="scaffold-slot"] {
            color: #0f172a !important;
            font-size: 12px !important;
            font-style: normal !important;
            font-weight: 600 !important;
            border-color: #cbd5e1 !important;
            background-color: transparent !important;
          }
        `}</style>

        {/* 내용이 완성된 와이어프레임 에디터 */}
        <ScaffoldCanvasEditor
          key={`artifact-editor-p${pageNumber}`}
          initialContent={pageHtml}
        />

        {/* 🌟 Fix, Candidate, Reasoning, Toggle, Provenance 완벽 지원 슬롯 오버레이 🌟 */}
        {slotOverlays.map((ov) => {
          const isMerged =
            slotBindings[ov.slotId]?.status === 'bound' || mergedSlotIds.has(ov.slotId);
          const isFixed = fixedSlotIds.has(ov.slotId);
          const activeVal = selectedCandidates[ov.slotId] || ov.suggestedVal;
          const currentVal = slotBindings[ov.slotId]?.currentValue;
          const candidates = SLOT_MODIFICATIONS.find((m) => m.slotId === ov.slotId)?.candidates || [];
          const isCandidateOpen = activeCandidateSlotId === ov.slotId;

          return (
            <div
              key={ov.slotId}
              style={{
                position: 'absolute',
                top: `${ov.top}px`,
                left: `${ov.left}px`,
                width: `${ov.width}px`,
                height: `${ov.height}px`,
              }}
              className={`rounded-[4px] transition-all flex z-20 group/slot select-none ${
                isFixed
                  ? 'bg-amber-50/95 border-2 border-amber-500 shadow-[0_2px_10px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/50'
                  : isMerged
                  ? 'bg-emerald-50/95 border-1.5 border-emerald-500 shadow-[0_1px_4px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/30'
                  : 'bg-indigo-50/95 border-2 border-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.25)] ring-2 ring-indigo-400/40'
              }`}
            >
              {ov.isMultiline ? (
                /* 멀티라인 행 (예: 회의내용 등 높이가 높은 셀) */
                <div className="w-full h-full flex flex-col justify-between p-2 relative">
                  {/* 상단 툴바: 태그 + 라벨 + Candidate + Fix + 출처 + 근거 + 토글버튼 */}
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/70">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] shrink-0 shadow-xs flex items-center gap-0.5 ${
                          isFixed
                            ? 'bg-amber-700 text-white'
                            : isMerged
                            ? 'bg-emerald-700 text-white'
                            : 'bg-indigo-700 text-white'
                        }`}
                      >
                        {isFixed && <Pin className="w-2.5 h-2.5 fill-white" />}
                        <span>{isFixed ? '고정' : '+추가'}</span>
                        <span>#{ov.slotId}</span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {ov.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* [1. Candidate 후보군 드롭다운] */}
                      {candidates.length > 0 && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCandidateMenu(ov.slotId);
                            }}
                            className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                              isCandidateOpen
                                ? 'bg-purple-600 text-white border border-purple-400'
                                : 'bg-slate-900 hover:bg-purple-950 text-purple-300 hover:text-purple-100 border border-purple-800/60'
                            }`}
                            title={`대안 후보군 (${candidates.length}개) 확인 및 교체`}
                          >
                            <SlidersHorizontal className="w-2.5 h-2.5 text-purple-400" />
                            <span>옵션 {candidates.length}</span>
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>

                          {/* 후보군 팝오버 */}
                          {isCandidateOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-slate-950/98 backdrop-blur-md rounded-lg border border-purple-500/80 shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
                            >
                              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800 text-[10px] text-slate-400">
                                <span className="font-bold text-purple-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-400" />
                                  대안 옵션 선택 (Candidates)
                                </span>
                                <span>#{ov.slotId}</span>
                              </div>

                              <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                                {candidates.map((cand) => {
                                  const isCurrent = activeVal === cand.value;
                                  return (
                                    <div
                                      key={cand.id}
                                      onClick={() => onSelectCandidate(ov.slotId, cand)}
                                      className={`p-1.5 rounded-md border cursor-pointer transition-all flex flex-col gap-0.5 ${
                                        isCurrent
                                          ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                                          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-[11px] truncate flex items-center gap-1">
                                          {isCurrent && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                                          <span>{cand.value}</span>
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 border border-purple-700/50 font-mono shrink-0">
                                          {cand.confidence}
                                        </span>
                                      </div>
                                      <span className="text-[9.5px] text-slate-400 font-sans leading-tight">
                                        {cand.note}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* [2. Fix (고정) 토글 버튼] */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFix(ov.slotId);
                        }}
                        className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                          isFixed
                            ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-500'
                            : 'bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-600'
                        }`}
                        title={isFixed ? '클릭 시 고정 해제 (재생성 대상)' : '클릭 시 고정(Fix) — 재생성 시 보존'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed ? 'fill-white text-white' : ''}`} />
                        <span>{isFixed ? '고정됨' : 'Fix'}</span>
                      </button>

                      {/* [3. 출처 뱃지] */}
                      {onOpenProvenance && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const binding: SlotBindingInfo = slotBindings[ov.slotId] || {
                              slotId: ov.slotId,
                              slotNumber: parseInt(ov.slotId.replace('s', ''), 10) || 1,
                              label: ov.name,
                              pageNumber: ov.pageNumber,
                              status: isMerged ? 'bound' : 'suggested',
                              currentValue: activeVal,
                              suggestedValue: activeVal,
                              resourceName: ov.resourceName || '11월 디딤돌 회의록.pdf',
                              sourceLocation: ov.sourceLocation || '2p 17L',
                              confidence: '98%',
                            };
                            onOpenProvenance(binding);
                          }}
                          className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 hover:text-indigo-600 border border-slate-300 hover:border-indigo-400 flex items-center gap-1 cursor-pointer transition-all shadow-xs text-[10px] font-sans"
                          title={`출처 문서 열기 및 인용 위치(${ov.sourceLocation || '2p 17L'}) 하이라이트 확인`}
                        >
                          <FileText className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[100px] font-medium">
                            {ov.resourceName || '11월 디딤돌 회의록.pdf'}
                          </span>
                          <ExternalLink className="w-2 h-2 text-slate-400 shrink-0" />
                        </button>
                      )}

                      {/* [4. Reasoning 근거 버튼] */}
                      {onOpenReasoning && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReasoning(ov.slotId);
                          }}
                          className="px-1.5 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/80 flex items-center gap-1 cursor-pointer transition-colors shadow-xs text-[10px] font-sans"
                          title="이 슬롯의 도출 근거 (Prompt Goal · 바인더 아웃라인 맥락 · 레시피 규격) 좌측 모달 열기"
                        >
                          <BrainCircuit className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="font-bold">근거</span>
                        </button>
                      )}

                      {/* [5. 반영 / 해제 토글 버튼] */}
                      {isMerged ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSlot(ov.slotId, true, activeVal, ov.resourceName);
                          }}
                          className="group/toggle px-2 py-0.5 rounded bg-emerald-600 hover:bg-rose-600 active:scale-95 text-white text-[10px] font-bold shadow-xs cursor-pointer transition-all border border-emerald-500 hover:border-rose-500 flex items-center gap-1 font-sans"
                          title="클릭 시 좌측 최종 캔버스에서 해당 슬롯 반영 해제(되돌리기)"
                        >
                          <span className="flex items-center gap-1 group-hover/toggle:hidden">
                            <Check className="w-2.5 h-2.5" />
                            <span>반영됨</span>
                          </span>
                          <span className="hidden group-hover/toggle:flex items-center gap-1 text-white">
                            <RotateCcw className="w-2.5 h-2.5 animate-spin-reverse" />
                            <span>해제 ↩</span>
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSlot(ov.slotId, false, activeVal, ov.resourceName);
                          }}
                          className="px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[10px] font-bold shadow-sm shadow-indigo-600/30 border border-indigo-500 cursor-pointer transition-all flex items-center gap-1 font-sans"
                          title="이 슬롯 데이터를 좌측 최종 캔버스(SSOT)로 커밋"
                        >
                          <span>Apply ➔</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 하단: 변경 내용(추가 내용) 시원하고 선명한 텍스트 표시 */}
                  <div className="pt-1.5 flex-1 flex items-start">
                    <div className="w-full text-[12.5px] font-bold text-slate-900 leading-relaxed bg-white/90 p-1.5 rounded border border-emerald-300/80 shadow-2xs">
                      <span className="inline-block text-emerald-600 font-bold mr-1.5">+</span>
                      <span>{activeVal}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* 싱글라인 행 (일시, 장소, 참석자, 안건, 지출금액 등) */
                <div className="w-full h-full flex items-center justify-between px-2.5 gap-2 relative">
                  {/* 좌측: 추가 뱃지 + 시원하고 선명한 본문 내용 */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9.5px] shrink-0 shadow-xs flex items-center gap-0.5 ${
                        isFixed
                          ? 'bg-amber-700 text-white'
                          : isMerged
                          ? 'bg-emerald-700 text-white'
                          : 'bg-indigo-700 text-white'
                      }`}
                    >
                      {isFixed && <Pin className="w-2.5 h-2.5 fill-white" />}
                      <span>{isFixed ? '고정' : '+추가'}</span>
                      <span>#{ov.slotId}</span>
                    </span>

                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-emerald-600 font-bold text-xs shrink-0">+</span>
                      <span className="text-[13px] font-bold text-slate-900 truncate tracking-tight">
                        {activeVal}
                      </span>
                    </div>
                  </div>

                  {/* 우측: Candidate + Fix + 출처 + 근거 + 토글 버튼 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* [1. Candidate 후보군 드롭다운] */}
                    {candidates.length > 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCandidateMenu(ov.slotId);
                          }}
                          className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                            isCandidateOpen
                              ? 'bg-purple-600 text-white border border-purple-400'
                              : 'bg-slate-900 hover:bg-purple-950 text-purple-300 hover:text-purple-100 border border-purple-800/60'
                          }`}
                          title={`대안 후보군 (${candidates.length}개) 확인 및 교체`}
                        >
                          <SlidersHorizontal className="w-2.5 h-2.5 text-purple-400" />
                          <span>옵션 {candidates.length}</span>
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>

                        {/* 후보군 팝오버 */}
                        {isCandidateOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-slate-950/98 backdrop-blur-md rounded-lg border border-purple-500/80 shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800 text-[10px] text-slate-400">
                              <span className="font-bold text-purple-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                대안 옵션 선택 (Candidates)
                              </span>
                              <span>#{ov.slotId}</span>
                            </div>

                            <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                              {candidates.map((cand) => {
                                const isCurrent = activeVal === cand.value;
                                return (
                                  <div
                                    key={cand.id}
                                    onClick={() => onSelectCandidate(ov.slotId, cand)}
                                    className={`p-1.5 rounded-md border cursor-pointer transition-all flex flex-col gap-0.5 ${
                                      isCurrent
                                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[11px] truncate flex items-center gap-1">
                                        {isCurrent && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                                        <span>{cand.value}</span>
                                      </span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 border border-purple-700/50 font-mono shrink-0">
                                        {cand.confidence}
                                      </span>
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 font-sans leading-tight">
                                      {cand.note}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* [2. Fix (고정) 토글 버튼] */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFix(ov.slotId);
                      }}
                      className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                        isFixed
                          ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-500'
                          : 'bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-600'
                      }`}
                      title={isFixed ? '클릭 시 고정 해제 (재생성 대상)' : '클릭 시 고정(Fix) — 재생성 시 보존'}
                    >
                      <Pin className={`w-2.5 h-2.5 ${isFixed ? 'fill-white text-white' : ''}`} />
                      <span>{isFixed ? '고정됨' : 'Fix'}</span>
                    </button>

                    {/* [3. 출처 뱃지] */}
                    {onOpenProvenance && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const binding: SlotBindingInfo = slotBindings[ov.slotId] || {
                            slotId: ov.slotId,
                            slotNumber: parseInt(ov.slotId.replace('s', ''), 10) || 1,
                            label: ov.name,
                            pageNumber: ov.pageNumber,
                            status: isMerged ? 'bound' : 'suggested',
                            currentValue: activeVal,
                            suggestedValue: activeVal,
                            resourceName: ov.resourceName || '11월 디딤돌 회의록.pdf',
                            sourceLocation: ov.sourceLocation || '2p 17L',
                            confidence: '98%',
                          };
                          onOpenProvenance(binding);
                        }}
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 hover:text-indigo-600 border border-slate-300 hover:border-indigo-400 flex items-center gap-1 cursor-pointer transition-all shadow-xs text-[10px] font-sans"
                        title={`출처 문서 열기 및 인용 위치(${ov.sourceLocation || '2p 17L'}) 하이라이트 확인`}
                      >
                        <FileText className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[95px] font-medium">
                          {ov.resourceName || '11월 디딤돌 회의록.pdf'}
                        </span>
                        <ExternalLink className="w-2 h-2 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {/* [4. Reasoning 근거 버튼] */}
                    {onOpenReasoning && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReasoning(ov.slotId);
                        }}
                        className="px-1.5 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/80 flex items-center gap-1 cursor-pointer transition-colors shadow-xs text-[10px] font-sans"
                        title="이 슬롯의 도출 근거 (Prompt Goal · 바인더 아웃라인 맥락 · 레시피 규격) 좌측 모달 열기"
                      >
                        <BrainCircuit className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="font-bold">근거</span>
                      </button>
                    )}

                    {/* [5. 반영 / 해제 토글 버튼] */}
                    {isMerged ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSlot(ov.slotId, true, activeVal, ov.resourceName);
                        }}
                        className="group/toggle px-2 py-0.5 rounded bg-emerald-600 hover:bg-rose-600 active:scale-95 text-white text-[10px] font-bold shadow-xs cursor-pointer transition-all border border-emerald-500 hover:border-rose-500 flex items-center gap-1 font-sans"
                        title="클릭 시 좌측 최종 캔버스에서 해당 슬롯 반영 해제(되돌리기)"
                      >
                        <span className="flex items-center gap-1 group-hover/toggle:hidden">
                          <Check className="w-2.5 h-2.5" />
                          <span>반영됨</span>
                        </span>
                        <span className="hidden group-hover/toggle:flex items-center gap-1 text-white">
                          <RotateCcw className="w-2.5 h-2.5 animate-spin-reverse" />
                          <span>해제 ↩</span>
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSlot(ov.slotId, false, activeVal, ov.resourceName);
                        }}
                        className="px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[10px] font-bold shadow-sm shadow-indigo-600/30 border border-indigo-500 cursor-pointer transition-all flex items-center gap-1 font-sans"
                        title="이 슬롯 데이터를 좌측 최종 캔버스(SSOT)로 커밋"
                      >
                        <span>Apply ➔</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 호버 시 나타나는 Before / After 비교 툴팁 */}
              <div className="absolute -bottom-7 left-2 z-30 opacity-0 group-hover/slot:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[10px] px-2 py-1 rounded shadow-xl border border-slate-800 pointer-events-none whitespace-nowrap font-sans flex items-center gap-2">
                <span className="text-slate-400">
                  기존:{' '}
                  {currentVal ? (
                    <strong className="text-slate-300 line-through">{currentVal}</strong>
                  ) : (
                    '(공란)'
                  )}
                </span>
                <span className="text-indigo-400">➔</span>
                <span className="text-emerald-400 font-bold">신규: {activeVal}</span>
                {isFixed && (
                  <span className="text-amber-400 font-mono font-bold flex items-center gap-1 ml-1">
                    <Pin className="w-2.5 h-2.5 fill-amber-400" /> [고정됨]
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function IdeArtifactStageViewport({
  tab,
  liveHtml = '',
  slotBindings = {},
  onApplySlotToCanvas,
  onUnbindSlot,
  onOpenSlotProvenance,
  onOpenReasoning,
  onApplyAllToCanvas,
}: IdeArtifactStageViewportProps) {
  const [viewMode, setViewMode] = useState<ArtifactViewMode>('wireframe');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>(
    SLOT_MODIFICATIONS.map((m) => m.slotId)
  );
  const [mergedSlotIds, setMergedSlotIds] = useState<Set<string>>(new Set());

  // [양방향 확장 1 & 2] Fix(고정) 슬롯 ID 목록 & Candidate(대안 후보군) 선택값 & 재생성 상태
  const [fixedSlotIds, setFixedSlotIds] = useState<Set<string>>(new Set(['s1', 's2']));
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [activeCandidateSlotId, setActiveCandidateSlotId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenerateToast, setRegenerateToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(650);

  // 전역 클릭 시 후보군 팝오버 닫기
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveCandidateSlotId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // 컨테이너 폭 실시간 감지
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    setContainerWidth(el.clientWidth || 650);

    return () => observer.disconnect();
  }, []);

  // [피드백 1] 와이어프레임 복사 & 에이전트 완성 내용(선택된 후보군 포함)을 시각적으로 선명하게 주입
  const stagedHtml = useMemo(() => {
    const sourceHtml =
      liveHtml && liveHtml.includes('data-type="scaffold-slot"')
        ? liveHtml
        : FALLBACK_WIREFRAME_HTML;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sourceHtml, 'text/html');

      SLOT_MODIFICATIONS.forEach((m) => {
        const slotEl = doc.querySelector(`span[data-type="scaffold-slot"][data-slot-id="${m.slotId}"]`);
        if (slotEl) {
          slotEl.textContent = selectedCandidates[m.slotId] || m.changeText;
        }
      });

      return doc.body.innerHTML;
    } catch {
      return sourceHtml;
    }
  }, [liveHtml, selectedCandidates]);

  // 채워진 완성본 와이어프레임을 페이지별로 분할
  const stagedPages = useMemo(() => {
    return extractAllPages(stagedHtml);
  }, [stagedHtml]);

  // [Fix 기능] 특정 슬롯 고정/고정 해제 토글
  const handleToggleFix = (slotId: string) => {
    setFixedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  };

  // [Candidate 기능] 특정 슬롯의 대안 후보군 선택 및 즉시 교체
  const handleSelectCandidate = (slotId: string, candidate: SlotCandidateItem) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [slotId]: candidate.value,
    }));
    setActiveCandidateSlotId(null);

    // 이미 좌측 캔버스에 병합(merged)된 슬롯이면 좌측 SSOT 캔버스도 새 후보값으로 즉시 동기화
    if (mergedSlotIds.has(slotId) || slotBindings[slotId]?.status === 'bound') {
      const mod = SLOT_MODIFICATIONS.find((m) => m.slotId === slotId);
      onApplySlotToCanvas?.(slotId, candidate.value, mod?.resourceName);
    }
  };

  // 대안 후보군 메뉴 열기/닫기
  const handleToggleCandidateMenu = (slotId: string) => {
    setActiveCandidateSlotId((prev) => (prev === slotId ? null : slotId));
  };

  // [Re-generation 기능] 고정(Fix)되지 않은 슬롯들만 AI 재추론 / 대안 후보군 리프레시
  const handleRegenerateUnfixed = () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setActiveCandidateSlotId(null);

    setTimeout(() => {
      setSelectedCandidates((prev) => {
        const next = { ...prev };
        SLOT_MODIFICATIONS.forEach((m) => {
          if (fixedSlotIds.has(m.slotId)) {
            // 📌 고정된 슬롯은 변경하지 않고 안전하게 보존!
            return;
          }
          // 미고정 슬롯: 후보군 중 다른 대안 옵션으로 순환 반영 또는 신규 추론값 적용
          if (m.candidates && m.candidates.length > 0) {
            const currentVal = next[m.slotId] || m.changeText;
            const currentIndex = m.candidates.findIndex((c) => c.value === currentVal);
            const nextIndex = (currentIndex + 1) % m.candidates.length;
            next[m.slotId] = m.candidates[nextIndex].value;
          }
        });
        return next;
      });

      setIsRegenerating(false);
      const fixedCount = fixedSlotIds.size;
      const unfixedCount = SLOT_MODIFICATIONS.length - fixedCount;
      setRegenerateToast(
        `📌 고정 항목 ${fixedCount}개 보존됨 · 🔄 미고정 항목 ${unfixedCount}개 AI 재추론 및 대안 후보군 갱신 완료!`
      );
      setTimeout(() => setRegenerateToast(null), 4000);
    }, 700);
  };

  // [피드백 2] 단일 슬롯 반영(Apply) ⟷ 반영 해제(Unbind/Revert) 토글 핸들러
  const handleToggleSlot = (
    slotId: string,
    isCurrentlyMerged: boolean,
    suggestedVal: string,
    resourceName?: string
  ) => {
    if (isCurrentlyMerged) {
      // 이미 반영된 경우: 반영 해제 (Unbind)
      onUnbindSlot?.(slotId);
      setMergedSlotIds((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    } else {
      // 미반영 상태인 경우: 반영 (Apply)
      onApplySlotToCanvas?.(slotId, suggestedVal, resourceName);
      setMergedSlotIds((prev) => new Set([...prev, slotId]));
    }
  };

  // 선택된 슬롯들만 체리픽하여 좌측 최종 캔버스에 커밋
  const handleApplySelected = () => {
    selectedSlotIds.forEach((sId) => {
      const mod = SLOT_MODIFICATIONS.find((m) => m.slotId === sId);
      if (mod) {
        const val = selectedCandidates[sId] || mod.changeText;
        onApplySlotToCanvas?.(sId, val, mod.resourceName);
      }
    });
    setMergedSlotIds((prev) => new Set([...prev, ...selectedSlotIds]));
  };

  // 14개 전체 일괄 커밋
  const handleApplyAll = () => {
    if (onApplyAllToCanvas && Object.keys(selectedCandidates).length === 0) {
      onApplyAllToCanvas();
    } else {
      SLOT_MODIFICATIONS.forEach((m) => {
        const val = selectedCandidates[m.slotId] || m.changeText;
        onApplySlotToCanvas?.(m.slotId, val, m.resourceName);
      });
      onApplyAllToCanvas?.();
    }
    setMergedSlotIds(new Set(SLOT_MODIFICATIONS.map((m) => m.slotId)));
  };

  // 체크박스 토글
  const handleToggleSelect = (slotId: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  // 전체 선택/해제
  const handleToggleSelectAll = () => {
    if (selectedSlotIds.length === SLOT_MODIFICATIONS.length) {
      setSelectedSlotIds([]);
    } else {
      setSelectedSlotIds(SLOT_MODIFICATIONS.map((m) => m.slotId));
    }
  };

  // 캔버스에 이미 반영되었는지 여부 계산
  const mergedCount = useMemo(() => {
    return SLOT_MODIFICATIONS.filter((m) => {
      const binding = slotBindings[m.slotId];
      return binding?.status === 'bound' || mergedSlotIds.has(m.slotId);
    }).length;
  }, [slotBindings, mergedSlotIds]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#090b10] text-slate-200 overflow-hidden font-sans select-none relative"
    >
      {/* 토스트 알림 (Fix 보존 및 미고정 재생성 알림) */}
      {regenerateToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-950/95 border border-purple-500/90 text-purple-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
          <span>{regenerateToast}</span>
        </div>
      )}

      {/* 1. 상단 컨트롤 헤더 바 */}
      <div className="p-3 bg-[#0e1118] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/90 text-indigo-300 border border-indigo-500/50 shadow-xs font-mono text-xs font-bold">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Artifact 완성본 (v1)</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <span>출처:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
              <span>📄</span>
              <span className="truncate max-w-[140px]">11월 디딤돌 회의록.pdf</span>
            </span>
          </div>

          {/* Fix & Re-generation 제어부 */}
          <div className="flex items-center gap-1.5 pl-1">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950/70 border border-amber-500/60 text-amber-300 text-[11px] font-mono font-bold"
              title="고정(Fix)된 슬롯 개수 — 재생성 시 이 슬롯들은 수정되지 않고 그대로 보존됩니다"
            >
              <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>고정 {fixedSlotIds.size}개</span>
            </div>

            <button
              type="button"
              onClick={handleRegenerateUnfixed}
              disabled={isRegenerating}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                isRegenerating
                  ? 'bg-purple-950 text-purple-300 border-purple-500/70 cursor-wait'
                  : 'bg-purple-900/90 hover:bg-purple-800 text-white border-purple-500/80 hover:border-purple-400 active:scale-95'
              }`}
              title={`고정된 ${fixedSlotIds.size}개를 제외한 ${SLOT_MODIFICATIONS.length - fixedSlotIds.size}개 미고정 슬롯을 AI로 재추론하고 대안 후보군을 재배치합니다`}
            >
              <RefreshCw className={`w-3 h-3 text-purple-300 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? '재추론 중...' : '미고정 항목 재생성'}</span>
            </button>
          </div>
        </div>

        {/* 3대 뷰 모드 전환 탭 & 일괄 병합 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('wireframe')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'wireframe'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="완성된 A4 와이어프레임 문서 서식 위에서 슬롯별 Diff 확인 및 개별 커밋"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>완성 와이어프레임</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'diff'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Before / After 변경 대조 카드 리스트 리뷰"
            >
              <FileDiff className="w-3.5 h-3.5" />
              <span>블록 카드 Diff</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('json')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'json'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="JSON 정형 데이터 원본"
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>

          {/* 체리픽 병합 버튼 */}
          {selectedSlotIds.length > 0 && selectedSlotIds.length < SLOT_MODIFICATIONS.length && (
            <button
              type="button"
              onClick={handleApplySelected}
              className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/80 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="체크된 슬롯들만 좌측 최종 캔버스에 주입"
            >
              <ArrowRight className="w-3 h-3 text-amber-300" />
              <span>선택 {selectedSlotIds.length}개 병합 ➔</span>
            </button>
          )}

          {/* 전체 일괄 병합 버튼 */}
          <button
            type="button"
            onClick={handleApplyAll}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-600/30"
            title="14개 모든 슬롯을 좌측 최종 캔버스에 병합"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>14개 전체 캔버스에 병합 ➔</span>
          </button>
        </div>
      </div>

      {/* 2. 본문 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col items-center">
        {/* ========================================================================= */}
        {/* [모드 1: 기본] 🌟 완성된 와이어프레임 캔버스 뷰 (Side-by-Side Wireframe) 🌟 */}
        {/* ========================================================================= */}
        {viewMode === 'wireframe' && (
          <div className="flex flex-col items-center gap-8 pb-12 w-full">
            {/* 상단 완료 안내 배너 */}
            <div className="w-full max-w-3xl flex flex-wrap items-center justify-between px-4 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-slate-300 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  와이어프레임에서 <strong className="text-amber-300">[Fix]</strong>로 고정하거나{' '}
                  <strong className="text-purple-300">[옵션]</strong>으로 대안 후보군을 선택할 수 있습니다.{' '}
                  <strong className="text-purple-400">[미고정 항목 재생성]</strong> 클릭 시 고정된 항목은 보존되고 나머지만 AI 재추론됩니다.
                </span>
              </div>
              <span className="text-emerald-400 font-mono text-[11px] font-bold shrink-0">
                {mergedCount} / 14 커밋 완료
              </span>
            </div>

            {/* 좌측과 100% 동일한 실제 A4 페이지들을 복사하여 완성 내용과 효과/버튼을 얹어 렌더링! */}
            {stagedPages.map(({ pageNumber, html }) => (
              <ArtifactPageCanvas
                key={pageNumber}
                pageNumber={pageNumber}
                pageHtml={html}
                slotBindings={slotBindings}
                mergedSlotIds={mergedSlotIds}
                fixedSlotIds={fixedSlotIds}
                selectedCandidates={selectedCandidates}
                activeCandidateSlotId={activeCandidateSlotId}
                onToggleSlot={handleToggleSlot}
                onToggleFix={handleToggleFix}
                onSelectCandidate={handleSelectCandidate}
                onToggleCandidateMenu={handleToggleCandidateMenu}
                onOpenProvenance={onOpenSlotProvenance}
                onOpenReasoning={onOpenReasoning}
                containerWidth={containerWidth}
              />
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* [모드 2] 📋 Cursor 스타일 블록 카드 Diff 리뷰 (선택형 뷰) */}
        {/* ========================================================================= */}
        {viewMode === 'diff' && (
          <div className="max-w-4xl w-full mx-auto space-y-3 pb-8">
            {/* 전체 선택 및 통계 바 */}
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 border-b border-slate-800/80 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedSlotIds.length === SLOT_MODIFICATIONS.length}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span className="font-semibold text-slate-300">
                  전체 슬롯 선택 ({selectedSlotIds.length}/{SLOT_MODIFICATIONS.length})
                </span>
              </label>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{mergedCount} / 14 캔버스 반영됨</span>
                </span>
              </div>
            </div>

            {/* 14개 슬롯 Diff 카드 리스트 */}
            <div className="space-y-2.5">
              {SLOT_MODIFICATIONS.map((m) => {
                const isChecked = selectedSlotIds.includes(m.slotId);
                const isMerged =
                  slotBindings[m.slotId]?.status === 'bound' || mergedSlotIds.has(m.slotId);
                const isFixed = fixedSlotIds.has(m.slotId);
                const activeVal = selectedCandidates[m.slotId] || m.changeText;
                const currentValue = slotBindings[m.slotId]?.currentValue;
                const candidates = m.candidates || [];
                const isCandidateOpen = activeCandidateSlotId === m.slotId;

                return (
                  <div
                    key={m.slotId}
                    className={`p-3 rounded-xl border transition-all ${
                      isFixed
                        ? 'bg-[#18150e] border-amber-500/60 shadow-md ring-1 ring-amber-400/30'
                        : isMerged
                        ? 'bg-slate-900/40 border-emerald-500/30'
                        : isChecked
                        ? 'bg-[#121620] border-indigo-500/50 shadow-sm'
                        : 'bg-[#0f1219] border-slate-800/80 opacity-70'
                    }`}
                  >
                    {/* 카드 헤더 */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(m.slotId)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                        />
                        <span className="text-base shrink-0">{m.icon}</span>
                        <span className="font-bold text-slate-100 font-mono truncate">
                          Slot #{m.slotId.replace('s', '')} [{m.name}]
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          P.{m.pageNumber}
                        </span>

                        {/* 출처 뱃지 */}
                        {onOpenSlotProvenance && (
                          <button
                            type="button"
                            onClick={() => {
                              const binding: SlotBindingInfo = slotBindings[m.slotId] || {
                                slotId: m.slotId,
                                slotNumber: parseInt(m.slotId.replace('s', ''), 10) || 1,
                                label: m.name,
                                pageNumber: m.pageNumber,
                                status: isMerged ? 'bound' : 'suggested',
                                currentValue: activeVal,
                                suggestedValue: activeVal,
                                resourceName: m.resourceName,
                                sourceLocation: '2p 17L',
                                confidence: '98%',
                              };
                              onOpenSlotProvenance(binding);
                            }}
                            className="px-1.5 py-0.2 rounded bg-slate-800 hover:bg-indigo-950 text-slate-300 hover:text-indigo-200 border border-slate-700 text-[10px] flex items-center gap-1 cursor-pointer font-sans"
                          >
                            <FileText className="w-2.5 h-2.5 text-indigo-400" />
                            <span>{m.resourceName}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Candidate 후보군 선택 */}
                        {candidates.length > 0 && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCandidateMenu(m.slotId);
                              }}
                              className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                                isCandidateOpen
                                  ? 'bg-purple-600 text-white border border-purple-400'
                                  : 'bg-slate-900 hover:bg-purple-950 text-purple-300 border border-purple-800/60'
                              }`}
                              title={`대안 후보군 (${candidates.length}개) 확인 및 교체`}
                            >
                              <SlidersHorizontal className="w-2.5 h-2.5 text-purple-400" />
                              <span>옵션 {candidates.length}</span>
                              <ChevronDown className="w-2.5 h-2.5" />
                            </button>

                            {/* 후보군 팝오버 */}
                            {isCandidateOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-slate-950/98 backdrop-blur-md rounded-lg border border-purple-500/80 shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800 text-[10px] text-slate-400">
                                  <span className="font-bold text-purple-300 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    대안 옵션 선택 (Candidates)
                                  </span>
                                  <span>#{m.slotId}</span>
                                </div>

                                <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                                  {candidates.map((cand) => {
                                    const isCurrent = activeVal === cand.value;
                                    return (
                                      <div
                                        key={cand.id}
                                        onClick={() => handleSelectCandidate(m.slotId, cand)}
                                        className={`p-1.5 rounded-md border cursor-pointer transition-all flex flex-col gap-0.5 ${
                                          isCurrent
                                            ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                                            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-[11px] truncate flex items-center gap-1">
                                            {isCurrent && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                                            <span>{cand.value}</span>
                                          </span>
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 border border-purple-700/50 font-mono shrink-0">
                                            {cand.confidence}
                                          </span>
                                        </div>
                                        <span className="text-[9.5px] text-slate-400 font-sans leading-tight">
                                          {cand.note}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fix 토글 버튼 */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFix(m.slotId);
                          }}
                          className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                            isFixed
                              ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-500'
                              : 'bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-600'
                          }`}
                          title={isFixed ? '고정 해제' : '고정(Fix)'}
                        >
                          <Pin className={`w-2.5 h-2.5 ${isFixed ? 'fill-white text-white' : ''}`} />
                          <span>{isFixed ? '고정됨' : 'Fix'}</span>
                        </button>

                        <span className="font-mono text-[11px] text-emerald-400 font-bold">
                          {m.diffAdded}
                        </span>
                        <span className="font-mono text-[11px] text-rose-400">
                          {m.diffRemoved}
                        </span>

                        {/* 토글 적용 버튼 */}
                        {isMerged ? (
                          <button
                            type="button"
                            onClick={() => handleToggleSlot(m.slotId, true, activeVal, m.resourceName)}
                            className="group/btn inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 hover:bg-rose-950 text-emerald-300 hover:text-rose-200 border border-emerald-500/40 hover:border-rose-500 text-[11px] font-bold cursor-pointer transition-all"
                            title="클릭 시 좌측 캔버스에서 반영 해제"
                          >
                            <span className="group-hover/btn:hidden flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>반영 완료</span>
                            </span>
                            <span className="hidden group-hover/btn:flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-rose-400" />
                              <span>해제 ↩</span>
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleSlot(m.slotId, false, activeVal, m.resourceName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                            title="이 슬롯만 좌측 최종 캔버스에 즉시 주입"
                          >
                            <span>Apply to Canvas</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Diff 대조 본문 (Before vs After) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2.5 text-xs font-mono">
                      {/* Left: Before (현재 캔버스 상태) */}
                      <div className="p-2 rounded-lg bg-[#0a0c10] border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500 font-sans font-semibold">
                          [현재 캔버스 SSOT 값]
                        </div>
                        <div className="text-slate-400 whitespace-pre-wrap leading-relaxed min-h-[28px] text-[11px]">
                          {currentValue ? (
                            <span className="text-slate-300">{currentValue}</span>
                          ) : (
                            <span className="italic text-slate-600">(비어 있음)</span>
                          )}
                        </div>
                      </div>

                      {/* Right: After (에이전트 제안값) */}
                      <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/40 space-y-1">
                        <div className="text-[10px] text-indigo-300 font-sans font-semibold flex items-center justify-between">
                          <span>[Artifact 에이전트 초안]</span>
                          <span className="text-slate-500 text-[9px] font-mono truncate max-w-[120px]">
                            {m.resourceName}
                          </span>
                        </div>
                        <div className="text-emerald-300 whitespace-pre-wrap leading-relaxed min-h-[28px] text-[11px] font-bold">
                          {activeVal}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* [모드 3] 💻 JSON 원본 데이터 뷰 */}
        {/* ========================================================================= */}
        {viewMode === 'json' && (
          <div className="max-w-3xl w-full mx-auto space-y-2 pb-8">
            <div className="text-xs text-slate-400 font-mono">
              // 에이전트가 추출한 정형 JSON 데이터 원본 (Fix 상태 및 선택 후보군 동기화)
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed shadow-inner">
              {JSON.stringify(
                SLOT_MODIFICATIONS.map((m) => ({
                  slotId: m.slotId,
                  name: m.name,
                  pageNumber: m.pageNumber,
                  extractedValue: selectedCandidates[m.slotId] || m.changeText,
                  isFixed: fixedSlotIds.has(m.slotId),
                  availableCandidatesCount: m.candidates?.length || 0,
                  sourceResource: m.resourceName,
                  isMerged:
                    slotBindings[m.slotId]?.status === 'bound' || mergedSlotIds.has(m.slotId),
                })),
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* 3. 하단 상태 바 */}
      <div className="h-9 px-4 bg-[#080a0e] border-t border-slate-800/90 flex items-center justify-between text-xs text-slate-400 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Artifact: {tab.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            선택된 슬롯: <strong className="text-indigo-300">{selectedSlotIds.length}</strong>개
          </span>
          <span>|</span>
          <span>
            캔버스 병합률:{' '}
            <strong className="text-emerald-400">
              {Math.round((mergedCount / SLOT_MODIFICATIONS.length) * 100)}%
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
