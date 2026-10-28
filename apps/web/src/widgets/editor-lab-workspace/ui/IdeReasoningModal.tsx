import { useState } from 'react';
import {
  X,
  BrainCircuit,
  Sparkles,
  Layers,
  FileText,
  CheckCircle2,
  ExternalLink,
  Target,
  FileCheck,
  Cpu,
} from 'lucide-react';
import { SLOT_MODIFICATIONS } from './IdeSecondarySidebar';

export interface IdeReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  focusedSlotId?: string | null;
  onSelectSlot?: (slotId: string) => void;
  onOpenProvenanceDoc?: (docName: string) => void;
}

export function IdeReasoningModal({
  isOpen,
  onClose,
  focusedSlotId,
  onSelectSlot,
  onOpenProvenanceDoc,
}: IdeReasoningModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'goal' | 'binder' | 'recipe'>('all');

  if (!isOpen) return null;

  const currentMod = focusedSlotId
    ? SLOT_MODIFICATIONS.find((m) => m.slotId === focusedSlotId)
    : null;

  return (
    <div className="fixed left-12 top-9 bottom-6 z-40 w-[540px] bg-slate-900/98 backdrop-blur-xl border-r border-slate-800 shadow-2xl flex flex-col transition-all duration-200 select-none font-sans text-slate-200">
      {/* 1. 상단 모달 헤더 */}
      <div className="h-11 px-4 border-b border-slate-800/90 flex items-center justify-between shrink-0 bg-slate-950/70">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">에이전트 추론 근거 (Reasoning)</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono text-[9px] font-bold">
                Context Pipeline
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Prompt(Goal) · 바인더 아웃라인(시계열 맥락) · 레시피 규격
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="닫기 (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 네비게이션 탭 칩 */}
      <div className="h-9 px-4 border-b border-slate-800/70 flex items-center gap-2 shrink-0 bg-slate-950/40 text-[11px] font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>전체 조망</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('goal')}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'goal'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Target className="w-3 h-3 text-amber-400" />
          <span>1. Prompt (Goal)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('binder')}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'binder'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3 h-3 text-sky-400" />
          <span>2. 바인더 아웃라인</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recipe')}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recipe'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileCheck className="w-3 h-3 text-emerald-400" />
          <span>3. 레시피 규격</span>
        </button>
      </div>

      {/* 슬롯별 퀵 선택 칩 */}
      <div className="px-4 py-1.5 border-b border-slate-800/50 flex items-center gap-1.5 overflow-x-auto text-[10px] bg-slate-950/20 shrink-0">
        <span className="text-slate-500 shrink-0 font-medium">슬롯별 근거:</span>
        {SLOT_MODIFICATIONS.map((m) => (
          <button
            key={m.slotId}
            type="button"
            onClick={() => onSelectSlot?.(m.slotId)}
            className={`px-1.5 py-0.5 rounded font-mono shrink-0 transition-colors cursor-pointer ${
              focusedSlotId === m.slotId
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            #{m.slotId}
          </button>
        ))}
      </div>

      {/* 3. 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px] leading-relaxed select-text">
        {/* 포커스된 슬롯이 있을 때 표시되는 전용 카드 */}
        {currentMod && (
          <div className="p-3 rounded-lg bg-indigo-950/70 border border-indigo-500/70 shadow-lg space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold">
                  선택 슬롯 #{currentMod.slotId}
                </span>
                <span className="font-bold text-slate-100 text-[13px]">{currentMod.name}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                신뢰도 98.4%
              </span>
            </div>

            <div className="p-2 rounded bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center justify-between">
              <span className="text-slate-400">제안값:</span>
              <span className="text-emerald-400 font-bold">{currentMod.changeText}</span>
            </div>

            <p className="text-[11px] text-slate-300">
              <strong className="text-indigo-300">판단 근거:</strong> 회의록 본문 및 바인더 아웃라인의 시계열 순서(기안 ➔ 회의 ➔ 영수증 결제)에 따라 표준 서식 규격에 맞게 추출 및 변환 완료.
            </p>
          </div>
        )}

        {/* [섹션 1] 🎯 Prompt (Goal & 작업 스코프) */}
        {(activeTab === 'all' || activeTab === 'goal') && (
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-slate-100 text-xs">1. Prompt & 작업 목표 (Goal)</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Gemini 3.8 Flash High
              </span>
            </div>

            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed">
              <p className="text-amber-300/90 font-bold mb-1">[작업 지시 스코프]</p>
              &quot;11월 디딤돌 회의록 PDF와 당일 결제 영수증 이미지를 바탕으로 A4 회의비 사용 내역 서식의 14개 슬롯 항목(일시, 장소, 참석자, 3대 안건, 회의내용, 지출금액, 증빙)을 누락 없이 정확하게 추출 및 매핑하라.&quot;
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>추론 토큰(Thinking Tokens): <strong>840 tok</strong></span>
              <span>작업 스코프: <strong>14개 슬롯 전수 매핑</strong></span>
            </div>
          </div>
        )}

        {/* [섹션 2] 📚 바인더 아웃라인 (Cross-Document Outline & Context) */}
        {(activeTab === 'all' || activeTab === 'binder') && (
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h4 className="font-bold text-slate-100 text-xs">2. 바인더 아웃라인 (문서 간 시계열 맥락)</h4>
              </div>
              <span className="text-[10px] font-mono text-sky-400 font-bold">
                시계열 맥락 파이프라인
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              단일 파일 조회를 넘어, <strong>기안서 ➔ 11월 회의록 ➔ 결제 영수증</strong>으로 이어지는 바인더 내 여러 문서 간의 전후 인과관계를 종합적으로 교차 검증했습니다.
            </p>

            {/* 타임라인 아웃라인 트리 */}
            <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
              {/* 노드 1 */}
              <div className="relative pl-7 group">
                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-900 group-hover:bg-indigo-400 transition-colors" />
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200 text-[11.5px] flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-slate-400" />
                      1단계: 2018 하반기 사전 연구 기안서
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">2018.10.15</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    전체 프로젝트 예산 중 <strong className="text-slate-300">회의비 배정액(₩500,000)</strong> 및 회의 집행 가이드라인 기준 확인.
                  </p>
                </div>
              </div>

              {/* 노드 2 */}
              <div className="relative pl-7 group">
                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                <div className="p-2.5 rounded bg-indigo-950/30 border border-indigo-800/60 hover:border-indigo-600 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-300 text-[11.5px] flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-indigo-400" />
                      2단계: 11월 디딤돌 회의록.pdf (직접 출처)
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300">2018.11.08</span>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-normal mb-1.5">
                    14:00~19:30 본 회의 진행. 4명 참석, GPS 모듈 촬영·영상 인코딩 50ms 등 3대 안건 확정 (13개 슬롯의 직접 텍스트 근거).
                  </p>
                  {onOpenProvenanceDoc && (
                    <button
                      type="button"
                      onClick={() => onOpenProvenanceDoc('11월 디딤돌 회의록.pdf')}
                      className="px-2 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors border border-indigo-700/50"
                    >
                      <span>원문 PDF 뷰어로 바로 보기</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 노드 3 */}
              <div className="relative pl-7 group">
                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-800/60 hover:border-emerald-600 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-300 text-[11.5px] flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      3단계: receipt-20181108.png (영수증 증빙)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300">2018.11.08 19:42</span>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-normal mb-1.5">
                    회의 종료(19:30) 12분 후 결제된 영수증 승인액 <strong>₩40,000</strong> 확인. 회의비 예산 규정 및 기안서 한도 부합 여부 교차 검증 완료.
                  </p>
                  {onOpenProvenanceDoc && (
                    <button
                      type="button"
                      onClick={() => onOpenProvenanceDoc('receipt-20181108.png')}
                      className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors border border-emerald-700/50"
                    >
                      <span>영수증 이미지 원본 확인</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 교차 검증 요약 박스 */}
            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
              <strong className="text-sky-300 block mb-0.5">💡 바인더 맥락 종합 평가</strong>
              기안서의 회의비 예산 한도(₩500,000) 내에서 11월 8일 회의를 정상 집행하였으며, 회의 종료 직후 발생한 영수증 내역(19:42)과 일치함을 교차 확인하여 지출금액(₩40,000) 및 증빙으로 매핑함.
            </div>
          </div>
        )}

        {/* [섹션 3] 📜 레시피 규격 (Recipe Specification) */}
        {(activeTab === 'all' || activeTab === 'recipe') && (
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-slate-100 text-xs">3. 레시피 서식 규격 (Recipe Spec)</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                정기 회의록 규용 v1.2
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              산출물 생성 시 서식 엔진이 요구하는 슬롯 타입, 문자열 포맷, 제약 조건을 100% 충족하여 생성되었습니다.
            </p>

            {/* 규격 검증 체크리스트 */}
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  일시 규격 (YYYY.MM.DD)
                </span>
                <span className="text-emerald-400 font-bold">&apos;2018.11.08&apos; 표준화 완료</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  참석자 규격 [N명 (구성원)]
                </span>
                <span className="text-emerald-400 font-bold">&apos;4명 (팀원 전원)&apos; 준수</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  지출금액 통화 기호 표기
                </span>
                <span className="text-emerald-400 font-bold">&apos;₩ 40,000&apos; 서식 완료</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  증빙자료 파일명 캡션
                </span>
                <span className="text-emerald-400 font-bold">&apos;영수증 부착&apos; 캡션 부착</span>
              </div>
            </div>

            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 font-bold">14개 전체 슬롯 규격 충족률</span>
              <span className="text-emerald-400 font-mono font-bold text-xs">14 / 14 (100%)</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. 하단 액션 바 */}
      <div className="h-10 px-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>전체 검증 완료 · 반영(Apply) 대기 중</span>
        </span>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
