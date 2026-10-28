import { useState, useEffect } from 'react';
import {
  X,
  ArrowUp,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Zap,
  CheckCircle2,
  Mic,
  FileDiff,
  Check,
  Plus,
  Paperclip,
  Package,
} from 'lucide-react';
import type { ChatMessageItem, SlotBindingInfo } from '../model/types';
import type { AiPanelMode } from './IdeSecondaryActivityBar';

interface IdeSecondarySidebarProps {
  activeMode?: AiPanelMode;
  onSelectMode?: (mode: AiPanelMode) => void;
  messages: ChatMessageItem[];
  promptInput: string;
  onChangePromptInput: (val: string) => void;
  onSendPrompt: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isStreaming?: boolean;
  onClose: () => void;
  slotBindings?: Record<string, SlotBindingInfo>;
  onApplySuggested?: (slotId: string) => void;
  onApplyAllSuggestions?: () => void;
  onSelectSlot?: (slotId: string) => void;
  onBindSlot?: (slotId: string, value: string, resourceName?: string) => void;
  selectedSlotIds?: string[];
  onClearSelectedSlots?: () => void;
  onOpenArtifactStage?: (version?: number) => void;
}

const availableModels = [
  'Gemini 3.8 Flash High',
  'Gemini 3.1 Pro',
  'Gemini 3.5 Flash Lite',
  'Gemma 4 31B',
];

export interface SlotCandidateItem {
  id: string;
  value: string;
  confidence: string;
  note: string;
}

export interface SlotModificationItem {
  slotId: string;
  pageNumber: number;
  name: string;
  icon: string;
  target: string;
  changeText: string;
  diffAdded: string;
  diffRemoved: string;
  category: string;
  resourceName: string;
  candidates?: SlotCandidateItem[];
}

// 첨부 2의 14개 슬롯 및 와이어프레임 타겟 정의 (Fix & Candidate 지원)
export const SLOT_MODIFICATIONS: SlotModificationItem[] = [
  {
    slotId: 's1',
    pageNumber: 1,
    name: '일시',
    icon: '🎯',
    target: 'Page 1.canvas #s1',
    changeText: '2018.11.08',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'metadata',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '2018.11.08', confidence: '98%', note: '본 회의 일시 표준 YYYY.MM.DD' },
      { id: 'c2', value: '2018.11.08 14:00~19:30', confidence: '84%', note: '회의 시간 범위 포함 표기' },
      { id: 'c3', value: '2018.11.07', confidence: '62%', note: '전날 사전 준비 미팅 일시' },
    ],
  },
  {
    slotId: 's2',
    pageNumber: 1,
    name: '장소',
    icon: '🎯',
    target: 'Page 1.canvas #s2',
    changeText: '6공학관 6108-1호',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'metadata',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '6공학관 6108-1호', confidence: '96%', note: '호수 포함 정밀 공간 표기' },
      { id: 'c2', value: '6공학관 6층 멀티미디어실', confidence: '78%', note: '회의록 서두 공간명' },
      { id: 'c3', value: '교내 6공학관', confidence: '65%', note: '건물 단위 약식 표기' },
    ],
  },
  {
    slotId: 's3',
    pageNumber: 1,
    name: '참석자',
    icon: '🎯',
    target: 'Page 1.canvas #s3',
    changeText: '4명 [팀원 전원]',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'attendees',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '4명 [팀원 전원]', confidence: '96%', note: '레시피 인원수 규격 준수' },
      { id: 'c2', value: '홍길동, 김철수, 이영희, 박지성 (4명)', confidence: '91%', note: '참석자 실명 명단 병기' },
      { id: 'c3', value: '팀원 전원 (4인)', confidence: '75%', note: '약식 표기' },
    ],
  },
  {
    slotId: 's4',
    pageNumber: 1,
    name: '안건',
    icon: '🎯',
    target: 'Page 1.canvas #s4',
    changeText: 'GPS + 동영상 촬영 및 프로그램 테스트 최종 확인',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'agenda',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: 'GPS + 동영상 촬영 및 프로그램 테스트 최종 확인', confidence: '95%', note: '본문 안건 통합 요약문' },
      { id: 'c2', value: '1. GPS 모듈 2. 영상 인코딩 3. 시연 리허설', confidence: '88%', note: '3대 아젠다 개조식 나열' },
      { id: 'c3', value: '중간 점검 및 테스트 리허설', confidence: '70%', note: '총괄 개요' },
    ],
  },
  {
    slotId: 's5',
    pageNumber: 1,
    name: '회의내용',
    icon: '🎯',
    target: 'Page 1.canvas #s5',
    changeText: '1. GPS 모듈 핀맵 점검\n2. 영상 인코딩 50ms\n3. 시연 리허설',
    diffAdded: '+3',
    diffRemoved: '-1',
    category: 'minutes',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '1. GPS 모듈 핀맵 점검\n2. 영상 인코딩 50ms\n3. 시연 리허설', confidence: '96%', note: '핵심 결정사항 3단 요약' },
      { id: 'c2', value: 'GPS 모듈 핀맵 이상 없음 확인, 무선 영상 인코딩 지연시간 50ms 달성 성공, 최종 시연 리허설 완료.', confidence: '89%', note: '완결형 서술 문장형' },
      { id: 'c3', value: '하드웨어 점검 완료 및 인코딩 50ms 목표 달성 보고', confidence: '78%', note: '성과 중심 압축문' },
    ],
  },
  {
    slotId: 's6',
    pageNumber: 1,
    name: '지출금액',
    icon: '💰',
    target: 'Page 1.canvas #s6',
    changeText: '₩ 40,000',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'finance',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '₩ 40,000', confidence: '98%', note: '영수증 카드 승인 최종 합계액' },
      { id: 'c2', value: '₩ 36,364', confidence: '72%', note: '부가세(VAT ₩3,636) 제외 공급가액' },
      { id: 'c3', value: '금 사만 원정 (₩40,000)', confidence: '60%', note: '한글 금액 병기 서식' },
    ],
  },
  {
    slotId: 's7',
    pageNumber: 1,
    name: '증빙자료',
    icon: '📎',
    target: 'Page 1.canvas #s7',
    changeText: 'receipt-20181108.png (영수증 부착)',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'receipt',
    resourceName: 'receipt-20181108.png',
    candidates: [
      { id: 'c1', value: 'receipt-20181108.png (영수증 부착)', confidence: '98%', note: '영수증 파일명 및 캡션 매칭' },
      { id: 'c2', value: '법인/개인 카드 매출전표 (승인번호 038291)', confidence: '85%', note: '승인번호 포함 전표 서식' },
      { id: 'c3', value: '신용카드 영수증 1부 첨부', confidence: '74%', note: '일반 증빙 서식 표기' },
    ],
  },
  {
    slotId: 's8',
    pageNumber: 2,
    name: '일시(P2)',
    icon: '🎯',
    target: 'Page 2.canvas #s8',
    changeText: '2018.11.16',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'metadata',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '2018.11.16', confidence: '97%', note: '2차 회의 일시' },
      { id: 'c2', value: '2018.11.16 15:00', confidence: '82%', note: '시간 포함 표기' },
    ],
  },
  {
    slotId: 's10',
    pageNumber: 2,
    name: '참석자(P2)',
    icon: '🎯',
    target: 'Page 2.canvas #s10',
    changeText: '3명',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'attendees',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '3명', confidence: '95%', note: '레시피 인원수 규격' },
      { id: 'c2', value: '3명 (팀원 1인 부재)', confidence: '88%', note: '사유 부기' },
    ],
  },
  {
    slotId: 's13',
    pageNumber: 2,
    name: '지출금액(P2)',
    icon: '💰',
    target: 'Page 2.canvas #s13',
    changeText: '₩ 29,000',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'finance',
    resourceName: '11월 디딤돌 회의록.pdf',
    candidates: [
      { id: 'c1', value: '₩ 29,000', confidence: '98%', note: '2차 회의 영수증 금액' },
      { id: 'c2', value: '₩ 26,364', confidence: '70%', note: '부가세 제외 공급가액' },
    ],
  },
  {
    slotId: 's14',
    pageNumber: 2,
    name: '증빙자료(P2)',
    icon: '📎',
    target: 'Page 2.canvas #s14',
    changeText: 'receipt-20181116.png (영수증 부착)',
    diffAdded: '+1',
    diffRemoved: '-0',
    category: 'receipt',
    resourceName: 'receipt-20181116.png',
    candidates: [
      { id: 'c1', value: 'receipt-20181116.png (영수증 부착)', confidence: '98%', note: '영수증 파일명 매칭' },
      { id: 'c2', value: '카드 영수증 부착', confidence: '80%', note: '일반 캡션' },
    ],
  },
];

// Flowith 스타일 Context Building 풀 항목들
export interface FlowithContextTag {
  id: string;
  type: 'doc' | 'recipe' | 'slot' | 'asset';
  icon: string;
  label: string;
  thumbnail?: string;
}

// 프롬프트 컴포저 내에 쏙 잡히는 인라인 멘션 칩 인터페이스
export interface PromptChipItem {
  id: string;
  type: 'doc' | 'recipe' | 'slot' | 'asset';
  icon: string;
  label: string;
  slotId?: string;
  resourceName?: string;
}

const INITIAL_CONTEXT_TAGS: FlowithContextTag[] = [
  { id: 'ctx-doc', type: 'doc', icon: '📄', label: '11월 디딤돌 회의록.pdf' },
  { id: 'ctx-rcp', type: 'recipe', icon: '📋', label: 'Recipe: 정기 회의록 규격' },
  { id: 'ctx-s1', type: 'slot', icon: '🎯', label: 'Slot #1 일시' },
  { id: 'ctx-s6', type: 'slot', icon: '💰', label: 'Slot #6 지출금액' },
  { id: 'ctx-img', type: 'asset', icon: '🖼️', label: 'receipt-20181108.png' },
];

export function IdeSecondarySidebar({
  activeMode = 'chat',
  onSelectMode,
  messages,
  promptInput,
  onChangePromptInput,
  onSendPrompt,
  selectedModel,
  onSelectModel,
  isStreaming = false,
  onClose,
  slotBindings = {},
  onApplySuggested,
  onApplyAllSuggestions,
  onSelectSlot,
  onBindSlot,
  selectedSlotIds = [],
  onClearSelectedSlots,
  onOpenArtifactStage,
}: IdeSecondarySidebarProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [isChangesExpanded, setIsChangesExpanded] = useState(true);

  const handleInternalSend = () => {
    onSendPrompt();
    // [컨셉 B] 사용자가 에이전트에게 지시를 내리면 자동으로 Pane 2에 Artifact 탭이 열림!
    onOpenArtifactStage?.(1);
  };

  // Flowith 컨텍스트 풀 태그 목록 상태
  const [contextTags, setContextTags] = useState<FlowithContextTag[]>(INITIAL_CONTEXT_TAGS);
  const [isContextPickerOpen, setIsContextPickerOpen] = useState(false);

  // 🌟 프롬프트 컴포저 내에 잡힌 인라인 멘션 칩 목록 (Flowith 스타일) 🌟
  const [promptChips, setPromptChips] = useState<PromptChipItem[]>([
    { id: 'chip-init-doc', type: 'doc', icon: '📄', label: '11월 디딤돌 회의록.pdf', resourceName: '11월 디딤돌 회의록.pdf' },
    { id: 'chip-init-slot', type: 'slot', icon: '🎯', label: 'Slot #5 회의내용', slotId: 's5' },
  ]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  // 캔버스 다중 선택(selectedSlotIds) 변경 시 Flowith Context 태그 바 & 프롬프트 컴포저 칩 동시 자동 캡처(잡기)!
  useEffect(() => {
    if (!selectedSlotIds || selectedSlotIds.length === 0) {
      return;
    }

    // 1. Context 태그 바 실시간 동기화
    setContextTags((prev) => {
      const nonSlotTags = prev.filter((t) => t.type !== 'slot');
      const newSlotTags: FlowithContextTag[] = selectedSlotIds.map((sId) => {
        const mod = SLOT_MODIFICATIONS.find((m) => m.slotId === sId);
        const binding = slotBindings[sId];
        const num = sId.replace(/\D/g, '');
        const label = mod?.name || binding?.label || `슬롯 #${num}`;
        const icon = mod?.icon || '🎯';
        return {
          id: `ctx-slot-${sId}`,
          type: 'slot',
          icon,
          label: `Slot #${num} ${label}`,
        };
      });

      return [...nonSlotTags, ...newSlotTags];
    });

    // 2. 프롬프트 컴포저 내 인라인 칩 자동 주입 (선택된 슬롯 + 해당 슬롯의 출처 문서(예: 11월 디딤돌 회의록.pdf))
    setPromptChips((prev) => {
      const updated = [...prev];

      // 출처 문서(11월 디딤돌 회의록.pdf) 칩 자동 주입
      const resourceNames = Array.from(
        new Set(
          selectedSlotIds
            .map((sId) => SLOT_MODIFICATIONS.find((m) => m.slotId === sId)?.resourceName)
            .filter(Boolean)
        )
      ) as string[];

      resourceNames.forEach((res) => {
        if (!updated.some((c) => c.label === res)) {
          updated.push({
            id: `chip-doc-${res}`,
            type: 'doc',
            icon: '📄',
            label: res,
            resourceName: res,
          });
        }
      });

      // 선택된 슬롯 칩 자동 주입
      selectedSlotIds.forEach((sId) => {
        const mod = SLOT_MODIFICATIONS.find((m) => m.slotId === sId);
        const binding = slotBindings[sId];
        const num = sId.replace(/\D/g, '');
        const label = mod?.name || binding?.label || `슬롯 #${num}`;
        const icon = mod?.icon || '🎯';
        const chipLabel = `Slot #${num} ${label}`;

        if (!updated.some((c) => c.slotId === sId)) {
          updated.push({
            id: `chip-slot-${sId}`,
            type: 'slot',
            icon,
            label: chipLabel,
            slotId: sId,
          });
        }
      });

      return updated;
    });
  }, [selectedSlotIds, slotBindings]);

  // Antigravity 트레이스 아코디언 토글 상태
  const [expandedTrace, setExpandedTrace] = useState<Record<string, boolean>>({
    explore1: false,
    thought1: false,
    explore2: false,
    explore3: true,
  });

  const toggleTrace = (key: string) => {
    setExpandedTrace((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 선택된 슬롯들만 일괄 바인딩 처리
  const handleApplySelectedSlots = () => {
    if (!selectedSlotIds || selectedSlotIds.length === 0) return;
    selectedSlotIds.forEach((sId) => {
      const mod = SLOT_MODIFICATIONS.find((m) => m.slotId === sId);
      if (mod) {
        if (onBindSlot) {
          onBindSlot(sId, mod.changeText, mod.resourceName);
        } else if (onApplySuggested) {
          onApplySuggested(sId);
        }
      }
    });
  };

  const handleAcceptAll = () => {
    setAcceptedAll(true);
    if (onApplyAllSuggestions) {
      onApplyAllSuggestions();
    }
  };

  const handleRejectAll = () => {
    setAcceptedAll(false);
  };

  const handleSlotClick = (slotId: string, val: string, resourceName?: string) => {
    if (onSelectSlot) onSelectSlot(slotId);
    if (onBindSlot) {
      onBindSlot(slotId, val, resourceName);
    } else if (onApplySuggested) {
      onApplySuggested(slotId);
    }
  };

  // 컨텍스트 태그 추가
  const handleAddContextTag = (tag: FlowithContextTag) => {
    if (!contextTags.find((t) => t.id === tag.id)) {
      setContextTags((prev) => [...prev, tag]);
    }
    setIsContextPickerOpen(false);
  };

  // 컨텍스트 태그 제거
  const handleRemoveContextTag = (id: string) => {
    setContextTags((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="w-full h-full bg-[#111318] border-l border-slate-800/90 flex flex-col overflow-hidden text-slate-200 select-none z-10 font-sans text-xs">
      {/* 1. 패널 상단 윈도우 타이틀바 */}
      <div className="h-9 px-3 bg-[#0d0f14] border-b border-slate-800/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-200 text-xs truncate">
            {activeMode === 'audit'
              ? 'Grammarly Audit (규격 감사)'
              : activeMode === 'extract'
              ? 'Slot Auto-Fill (14개 슬롯 추출)'
              : activeMode === 'calculation'
              ? 'Finance Check (지출 정산 검증)'
              : activeMode === 'telemetry'
              ? 'Run Telemetry (실행 계측)'
              : '회의비 사용 내역 저작 어시스턴트'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {onSelectMode && activeMode !== 'chat' && (
            <button
              type="button"
              onClick={() => onSelectMode('chat')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 cursor-pointer transition-colors"
            >
              대화창 보기
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer transition-colors"
            title="AI 패널 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 활성 컨텍스트 서브헤더 (첨부 2 기반 와이어프레임 & 레퍼런스 타겟 바인딩) */}
      <div className="px-3 py-1.5 bg-[#0a0c10] border-b border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-semibold truncate">회의비 사용 내역 (P.1~P.2)</span>
          <span className="text-slate-600">·</span>
          <span className="text-indigo-300 truncate">11월 디딤돌 회의록.pdf</span>
        </div>
        <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-bold shrink-0">
          14 Slots SSOT
        </span>
      </div>

      {/* 3. 대화 피드 및 Antigravity Trajectory 궤적 영역 (Flowith Context 빌딩 카드 반영) */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3.5 custom-scrollbar select-text text-xs leading-relaxed">
        {/* 추가된 사용자 대화 목록 */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[94%] px-3.5 py-2.5 rounded-2xl text-xs shadow-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#1e222d] border border-slate-700/60 text-slate-100'
                  : 'bg-[#141720] border border-slate-800 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* 🌟 Flowith.io 레퍼런스: Context Building 프롬프트 카드 🌟 */}
        <div className="flex justify-end">
          <div className="max-w-[96%] w-full p-4 rounded-2xl bg-gradient-to-br from-[#181b24] to-[#12151c] border-2 border-indigo-500/50 shadow-xl space-y-3">
            {/* 상단: 참조 문서/영수증 썸네일 카드 (Flowith 상단 썸네일 1:1 재현) */}
            <div className="flex justify-center">
              <div className="relative group cursor-pointer">
                <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-indigo-400/60 shadow-lg overflow-hidden flex flex-col items-center justify-center p-1 hover:border-indigo-400 transition-colors">
                  <span className="text-2xl">📄</span>
                  <span className="text-[8px] text-indigo-200 font-mono font-bold leading-none mt-1">
                    회의록.pdf
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] shadow-xs">
                  ✓
                </div>
              </div>
            </div>

            {/* 본문: Flowith 스타일의 인라인 컨텍스트 칩 문장 구성 */}
            <div className="text-[12px] text-slate-200 leading-relaxed tracking-wide">
              회의비 사용 내역{' '}
              <span
                onClick={() => {
                  if (!promptChips.some((c) => c.label.includes('Recipe'))) {
                    setPromptChips((prev) => [
                      ...prev,
                      { id: 'chip-rcp', type: 'recipe', icon: '📋', label: 'Recipe: 회의록 서식' },
                    ]);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-slate-100 hover:ring-2 hover:ring-indigo-400 transition-all"
                title="클릭하여 프롬프트에 이 레시피 잡기"
              >
                <span>📋</span>
                <span>Recipe: 회의록 서식</span>
              </span>{' '}
              저작 규격에 맞춰{' '}
              <span
                onClick={() => {
                  if (!promptChips.some((c) => c.label === '11월 디딤돌 회의록.pdf')) {
                    setPromptChips((prev) => [
                      ...prev,
                      {
                        id: 'chip-doc-11월디딤돌',
                        type: 'doc',
                        icon: '📄',
                        label: '11월 디딤돌 회의록.pdf',
                        resourceName: '11월 디딤돌 회의록.pdf',
                      },
                    ]);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-indigo-400 shadow-sm text-[11px] font-bold align-middle cursor-pointer hover:bg-indigo-50 hover:ring-2 hover:ring-indigo-500 transition-all"
                title="클릭하여 프롬프트에 이 참조 문서 쏙 잡기 (@멘션)"
              >
                <span>📄</span>
                <span>11월 디딤돌 회의록.pdf</span>
              </span>{' '}
              에서 데이터를 추출하고,{' '}
              <span
                onClick={() => {
                  onSelectSlot?.('s1');
                  if (!promptChips.some((c) => c.slotId === 's1')) {
                    setPromptChips((prev) => [
                      ...prev,
                      { id: 'chip-slot-s1', type: 'slot', icon: '🎯', label: 'Slot #1 일시', slotId: 's1' },
                    ]);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-indigo-50 hover:ring-2 hover:ring-indigo-400 transition-all"
                title="클릭하여 캔버스 선택 & 프롬프트에 잡기"
              >
                <span>🎯</span>
                <span>Slot #1 일시</span>
              </span>{' '}
              ,{' '}
              <span
                onClick={() => {
                  onSelectSlot?.('s5');
                  if (!promptChips.some((c) => c.slotId === 's5')) {
                    setPromptChips((prev) => [
                      ...prev,
                      { id: 'chip-slot-s5', type: 'slot', icon: '🎯', label: 'Slot #5 회의내용', slotId: 's5' },
                    ]);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-indigo-400 shadow-sm text-[11px] font-bold align-middle cursor-pointer hover:bg-indigo-50 hover:ring-2 hover:ring-indigo-500 transition-all"
                title="클릭하여 캔버스 선택 & 프롬프트에 잡기"
              >
                <span>🎯</span>
                <span>Slot #5 회의내용</span>
              </span>{' '}
              ,{' '}
              <span
                onClick={() => {
                  onSelectSlot?.('s6');
                  if (!promptChips.some((c) => c.slotId === 's6')) {
                    setPromptChips((prev) => [
                      ...prev,
                      { id: 'chip-slot-s6', type: 'slot', icon: '💰', label: 'Slot #6 지출금액', slotId: 's6' },
                    ]);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-amber-50 hover:ring-2 hover:ring-amber-400 transition-all"
                title="클릭하여 캔버스 선택 & 프롬프트에 잡기"
              >
                <span>💰</span>
                <span>Slot #6 지출금액</span>
              </span>{' '}
              및{' '}
              <span
                onClick={() => {
                  onSelectSlot?.('s7');
                  if (!promptChips.some((c) => c.label.includes('receipt'))) {
                    setPromptChips((prev) => [
                      ...prev,
                      { id: 'chip-asset-receipt', type: 'asset', icon: '🖼️', label: 'receipt-20181108.png' },
                    ]);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-cyan-50 hover:ring-2 hover:ring-cyan-400 transition-all"
                title="클릭하여 영수증 증빙 잡기"
              >
                <span>🖼️</span>
                <span>receipt-20181108.png</span>
              </span>{' '}
              영수증 증빙을 바인딩해줘.
            </div>

            {/* 하단: 프로필 아이콘과 날짜 타임스탬프 (Flowith 레퍼런스 하단과 1:1) */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-[10px] font-bold">
                  나
                </span>
                <span className="text-slate-400 font-medium">사용자</span>
              </div>
              <span className="font-mono text-[10px]">26-09-17</span>
            </div>
          </div>
        </div>

        {/* (2) Antigravity Agent 실행 궤적 (첨부 1의 Explored, Edited, Thought 블록) */}
        <div className="space-y-1.5 font-sans pt-1">
          {/* 스텝 1: 문서 및 레시피 탐색 (Explored) */}
          <div className="text-[11px]">
            <button
              type="button"
              onClick={() => toggleTrace('explore1')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer py-0.5"
            >
              <span>Explored 2 documents, 1 recipe</span>
              {expandedTrace.explore1 ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedTrace.explore1 && (
              <div className="pl-3.5 py-1 text-[10px] font-mono text-slate-500 space-y-0.5 border-l border-slate-800 my-1">
                <div>📄 doc-1a0897500d9: 11월 디딤돌 회의록.pdf (별지 제3호 서식)</div>
                <div>📋 recipe-1a09fffe0a2: 정기 회의 세션 저작 규격 (14 Slots)</div>
                <div>🖼️ assets/media/receipt-20181108.png</div>
              </div>
            )}
          </div>

          {/* 스텝 2: 슬롯 바인딩 실행 (Bound 🎯 Slot #1 [일시]) */}
          <div
            className={`flex items-center gap-1.5 text-[11px] py-0.5 px-1 rounded transition-colors ${
              selectedSlotIds.includes('s1')
                ? 'bg-indigo-950/80 border border-indigo-500/60 ring-1 ring-indigo-400/40 text-white'
                : 'text-slate-300'
            }`}
          >
            <span className="text-slate-400 font-mono">Bound</span>
            <span className="text-indigo-400">🎯</span>
            <span
              onClick={() => onSelectSlot && onSelectSlot('s1')}
              className="font-semibold text-slate-200 hover:text-indigo-300 cursor-pointer underline decoration-dotted"
            >
              Slot #1 [일시]
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">+1 -0</span>
            <span className="text-slate-500 font-mono text-[10px] truncate">"2018.11.08"</span>
            {selectedSlotIds.includes('s1') && (
              <span className="ml-auto text-[9px] bg-indigo-500 text-white font-bold px-1 rounded">선택됨</span>
            )}
          </div>

          {/* 스텝 3: 슬롯 바인딩 실행 (Bound 🎯 Slot #2 [장소]) */}
          <div
            className={`flex items-center gap-1.5 text-[11px] py-0.5 px-1 rounded transition-colors ${
              selectedSlotIds.includes('s2')
                ? 'bg-indigo-950/80 border border-indigo-500/60 ring-1 ring-indigo-400/40 text-white'
                : 'text-slate-300'
            }`}
          >
            <span className="text-slate-400 font-mono">Bound</span>
            <span className="text-indigo-400">🎯</span>
            <span
              onClick={() => onSelectSlot && onSelectSlot('s2')}
              className="font-semibold text-slate-200 hover:text-indigo-300 cursor-pointer underline decoration-dotted"
            >
              Slot #2 [장소]
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">+1 -0</span>
            <span className="text-slate-500 font-mono text-[10px] truncate">"6공학관 6108-1호"</span>
            {selectedSlotIds.includes('s2') && (
              <span className="ml-auto text-[9px] bg-indigo-500 text-white font-bold px-1 rounded">선택됨</span>
            )}
          </div>

          {/* 스텝 4: 에이전트 생각 궤적 (Thought for 1s >) */}
          <div className="text-[11px]">
            <button
              type="button"
              onClick={() => toggleTrace('thought1')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer py-0.5"
            >
              <span>Thought for 1s</span>
              {expandedTrace.thought1 ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedTrace.thought1 && (
              <div className="pl-3.5 py-1.5 text-[11px] text-slate-400 italic bg-[#0e1015] border-l-2 border-indigo-500 rounded-r my-1 space-y-1">
                <div>
                  11월 8일자 1차 회의록 원본에서 일시, 장소, 참석자 4명, 주요 안건을 파싱했습니다.
                  지출 금액은 40,000원으로 확인되었으며, 이에 대응하는 영수증 자산(receipt-20181108.png)을 슬롯 #7에 바인딩합니다.
                </div>
              </div>
            )}
          </div>

          {/* 스텝 5: 서식 교정 바인딩 (Bound 🎯 Slot #5 [회의내용]) */}
          <div
            className={`flex items-center gap-1.5 text-[11px] py-0.5 px-1 rounded transition-colors ${
              selectedSlotIds.includes('s5')
                ? 'bg-indigo-950/80 border border-indigo-500/60 ring-1 ring-indigo-400/40 text-white'
                : 'text-slate-300'
            }`}
          >
            <span className="text-slate-400 font-mono">Bound</span>
            <span className="text-indigo-400">🎯</span>
            <span
              onClick={() => onSelectSlot && onSelectSlot('s5')}
              className="font-semibold text-slate-200 hover:text-indigo-300 cursor-pointer underline decoration-dotted"
            >
              Slot #5 [회의내용]
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">+3 -1</span>
            <span className="text-slate-500 font-mono text-[10px] truncate">번호 목록 규격 변환</span>
            {selectedSlotIds.includes('s5') && (
              <span className="ml-auto text-[9px] bg-indigo-500 text-white font-bold px-1 rounded">선택됨</span>
            )}
          </div>

          {/* 스텝 6: 지출 금액 바인딩 (Bound 💰 Slot #6 [지출금액]) */}
          <div
            className={`flex items-center gap-1.5 text-[11px] py-0.5 px-1 rounded transition-colors ${
              selectedSlotIds.includes('s6')
                ? 'bg-indigo-950/80 border border-indigo-500/60 ring-1 ring-indigo-400/40 text-white'
                : 'text-slate-300'
            }`}
          >
            <span className="text-slate-400 font-mono">Bound</span>
            <span className="text-amber-400">💰</span>
            <span
              onClick={() => onSelectSlot && onSelectSlot('s6')}
              className="font-semibold text-slate-200 hover:text-amber-300 cursor-pointer underline decoration-dotted"
            >
              Slot #6 [지출금액]
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">+1 -0</span>
            <span className="text-slate-500 font-mono text-[10px]">₩ 40,000</span>
            {selectedSlotIds.includes('s6') && (
              <span className="ml-auto text-[9px] bg-indigo-500 text-white font-bold px-1 rounded">선택됨</span>
            )}
          </div>

          {/* 스텝 7: 증빙 영수증 연결 (Linked 📎 Slot #7 [증빙자료]) */}
          <div
            className={`flex items-center gap-1.5 text-[11px] py-0.5 px-1 rounded transition-colors ${
              selectedSlotIds.includes('s7')
                ? 'bg-indigo-950/80 border border-indigo-500/60 ring-1 ring-indigo-400/40 text-white'
                : 'text-slate-300'
            }`}
          >
            <span className="text-slate-400 font-mono">Linked</span>
            <span className="text-cyan-400">📎</span>
            <span
              onClick={() => onSelectSlot && onSelectSlot('s7')}
              className="font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer underline decoration-dotted"
            >
              Slot #7 [증빙자료]
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">+1 -0</span>
            <span className="text-slate-500 font-mono text-[10px] truncate">receipt-20181108.png</span>
            {selectedSlotIds.includes('s7') && (
              <span className="ml-auto text-[9px] bg-indigo-500 text-white font-bold px-1 rounded">선택됨</span>
            )}
          </div>

          {/* 스텝 8: Page 2 7개 슬롯 일괄 추출 진행 상황 (Exploring / Completed) */}
          <div className="text-[11px]">
            <button
              type="button"
              onClick={() => toggleTrace('explore3')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer py-0.5"
            >
              <span>Exploring Page 2 canvas & slots</span>
              {expandedTrace.explore3 ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedTrace.explore3 && (
              <div className="pl-3.5 py-1 text-[10px] font-mono text-slate-400 space-y-1 border-l border-slate-800 my-1">
                <div className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span>Mapped 🎯 Page 2 (s8~s14: 2018.11.16, ₩29,000, 3명, 영수증)</span>
                </div>
                <div className="text-slate-500">
                  Analyzed 🧩 Wireframe Element #회의 기본정보 및 지출 내역 표
                </div>
                <div className="text-indigo-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Completed: 14 slots ready to bind to canvas SSOT</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🌟 [컨셉 B] 에이전트 생성본 Artifact 초안 즉시 열기 카드 (Cursor Diff 스타일) 🌟 */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/80 border border-indigo-500/60 shadow-xl space-y-2.5 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs">
              <Package className="w-4 h-4 text-amber-400 shrink-0" />
              <span>에이전트 산출물: 회의록 데이터 초안 (v1)</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40">
              14 Slots Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            좌측 캔버스(SSOT)는 보존하고, 우측(Pane 2)에 <strong className="text-indigo-300">Cursor Diff 스타일</strong>의 스테이징 탭을 열어 개별 슬롯 검토 및 병합을 진행할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => onOpenArtifactStage?.(1)}
            className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all border border-indigo-400/40"
          >
            <Package className="w-3.5 h-3.5 text-amber-300" />
            <span>우측 Pane 2에 Artifact Diff 스테이지 열기 ➔</span>
          </button>
        </div>

        {/* (3) 실시간 에이전트 추론 로딩 인디케이터 (isStreaming 시 노출) */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs py-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Antigravity Agent is reasoning and mapping slots...</span>
          </div>
        )}
      </div>

      {/* 4. 하단 슬롯 변경 사항 검토 트레이 (첨부 1의 Changes Overview 재현!) */}
      <div className="border-t border-slate-800 bg-[#0d0f14] shrink-0 select-none">
        {/* 슬롯 변경 목록 (접기/펼치기 가능) */}
        {isChangesExpanded && (
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-2.5 space-y-1 font-mono text-[11px] border-b border-slate-800/80 bg-[#080a0e]">
            <div className="text-[10px] text-slate-400 font-sans px-1 pb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-300">슬롯 및 와이어프레임 폼 변경 내역</span>
              <div className="flex items-center gap-1.5">
                {onOpenArtifactStage && (
                  <button
                    type="button"
                    onClick={() => onOpenArtifactStage(1)}
                    className="px-1.5 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] font-medium border border-indigo-700/60 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Cursor Diff 스타일 분할 탭(Pane 2)으로 아티팩트 열기"
                  >
                    <span>📦 Stage Diff 열기</span>
                  </button>
                )}
                <span className="text-emerald-400 font-mono">14 Items</span>
              </div>
            </div>

            {SLOT_MODIFICATIONS.map((m) => {
              const isBound = slotBindings[m.slotId]?.status === 'bound' || acceptedAll;
              const isSelected = selectedSlotIds.includes(m.slotId);
              return (
                <div
                  key={m.slotId}
                  onClick={() => handleSlotClick(m.slotId, m.changeText, m.resourceName)}
                  className={`p-1.5 rounded flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/80 border border-indigo-500 ring-1 ring-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                      : isBound
                      ? 'bg-slate-900/50 hover:bg-slate-850 border border-transparent'
                      : 'bg-[#12151c] hover:bg-[#191d26] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-emerald-400 shrink-0 font-bold">{m.diffAdded}</span>
                    <span className="text-rose-400 shrink-0">{m.diffRemoved}</span>
                    <span className="text-slate-400 shrink-0">{m.icon}</span>
                    <span className="font-semibold text-slate-200 truncate">
                      Slot #{m.slotId.replace('s', '')} [{m.name}]
                    </span>
                    {isSelected && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-indigo-500 text-white font-bold shrink-0 animate-pulse">
                        선택됨
                      </span>
                    )}
                    <span className="text-slate-500 text-[10px] truncate font-sans">
                      {m.changeText}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0 truncate max-w-[110px]">
                    {m.target}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 첨부 1 하단 바: 14 Slots Ready to Bind + Reject all + [Accept all] */}
        <div className="h-11 px-3 flex items-center justify-between bg-[#0e1015]">
          <button
            type="button"
            onClick={() => setIsChangesExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer font-sans"
          >
            <FileDiff className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">
              {acceptedAll ? '14 Slots Bound to Canvas' : '14 Slots Ready to Bind'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                isChangesExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRejectAll}
              className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reject all
            </button>

            {selectedSlotIds.length > 0 && (
              <button
                type="button"
                onClick={handleApplySelectedSlots}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/50 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title="캔버스에서 선택된 슬롯만 일괄 바인딩 적용"
              >
                <Sparkles className="w-3 h-3 text-indigo-300" />
                <span>선택 {selectedSlotIds.length}개 적용</span>
              </button>
            )}

            {onOpenArtifactStage && (
              <button
                type="button"
                onClick={() => onOpenArtifactStage(1)}
                className="px-2 py-1 rounded-md text-xs font-semibold bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-600/60 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title="Cursor Diff 스타일 분할 탭(Pane 2)으로 아티팩트 열기"
              >
                <span>📦 Stage</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptAll}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                acceptedAll
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {acceptedAll ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>적용 완료 (Accepted)</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Accept all (전체 적용)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. 🌟 Flowith Context Building 바 + 인텔리전트 프롬프트 컴포저 🌟 */}
      <div className="p-2.5 bg-[#090b0e] border-t border-slate-800/80 shrink-0 space-y-2 select-none">
        {/* 캔버스 다중 선택 스마트 액션 칩 바 */}
        {selectedSlotIds.length > 0 && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/60 shadow-lg text-[11px] animate-fadeIn">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-bold text-indigo-200 shrink-0">
                캔버스 {selectedSlotIds.length}개 슬롯 선택됨
              </span>
              <span className="font-mono text-indigo-300/80 text-[10px] truncate">
                ({selectedSlotIds.map((s) => `#${s}`).join(', ')})
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const names = selectedSlotIds
                    .map((s) => {
                      const m = SLOT_MODIFICATIONS.find((item) => item.slotId === s);
                      return `#${s} ${m?.name || ''}`;
                    })
                    .join(', ');
                  onChangePromptInput(
                    `선택한 슬롯 [${names}]에 맞는 권장 데이터를 추출해서 자동으로 채워줘.`
                  );
                }}
                className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] cursor-pointer transition-colors shadow-xs"
              >
                값 채우기 지시
              </button>
              <button
                type="button"
                onClick={() => {
                  const names = selectedSlotIds.map((s) => `#${s}`).join(', ');
                  onChangePromptInput(
                    `선택된 슬롯 (${names})의 서식 규격 및 연관 규칙을 감사하고 제안해줘.`
                  );
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-medium text-[10px] cursor-pointer border border-slate-700 transition-colors"
              >
                규격 감사
              </button>
              {onClearSelectedSlots && (
                <button
                  type="button"
                  onClick={onClearSelectedSlots}
                  className="p-0.5 rounded text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                  title="선택 해제"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Flowith Context Pool 바 (현재 프롬프트에 주입된 컨텍스트 태그 목록) */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10px]">
          <div className="flex items-center gap-1 text-slate-400 font-mono font-bold shrink-0">
            <Paperclip className="w-3 h-3 text-indigo-400" />
            <span>Context:</span>
          </div>

          {contextTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-2xs shrink-0"
            >
              <span>{tag.icon}</span>
              <span className="truncate max-w-[120px] font-medium">{tag.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveContextTag(tag.id)}
                className="text-slate-400 hover:text-rose-400 cursor-pointer ml-0.5"
              >
                ×
              </button>
            </span>
          ))}

          {/* 컨텍스트 추가 버튼 및 팝업 */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsContextPickerOpen((v) => !v)}
              className="px-2 py-0.5 rounded-full bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>@추가</span>
            </button>

            {isContextPickerOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-52 bg-[#161922] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 text-[11px]">
                <div className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5">
                  주입할 컨텍스트 선택
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleAddContextTag({
                      id: 'ctx-doc-full',
                      type: 'doc',
                      icon: '📄',
                      label: '11월 디딤돌 회의록.pdf',
                    })
                  }
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📄</span>
                  <span className="truncate">11월 디딤돌 회의록.pdf</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddContextTag({
                      id: 'ctx-s5',
                      type: 'slot',
                      icon: '🎯',
                      label: 'Slot #5 회의내용',
                    })
                  }
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🎯</span>
                  <span className="truncate">Slot #5 회의내용</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddContextTag({
                      id: 'ctx-s6',
                      type: 'slot',
                      icon: '💰',
                      label: 'Slot #6 지출금액',
                    })
                  }
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💰</span>
                  <span className="truncate">Slot #6 지출금액</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddContextTag({
                      id: 'ctx-img-rcp',
                      type: 'asset',
                      icon: '🖼️',
                      label: 'receipt-20181108.png',
                    })
                  }
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖼️</span>
                  <span className="truncate">receipt-20181108.png</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 텍스트에어리어 컴포저 입력창 (Flowith Rich Mention Pill Composer) */}
        <div className="relative bg-[#161922] rounded-xl border border-slate-750 p-2.5 space-y-2 focus-within:border-indigo-500 transition-colors shadow-inner">
          {/* 🌟 캔버스/메시지에서 잡힌 인라인 멘션 칩들 (Flowith 레퍼런스와 1:1 완벽 일치!) 🌟 */}
          {promptChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-[#0e1118] border border-slate-700/80 shadow-inner">
              <span className="text-[10px] text-indigo-400 font-mono font-bold flex items-center gap-1 shrink-0 mr-0.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>잡힌 컨텍스트:</span>
              </span>

              {promptChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold select-none group transition-all hover:scale-105 animate-in fade-in duration-100"
                >
                  <span>{chip.icon}</span>
                  <span className="truncate max-w-[130px]">{chip.label}</span>
                  <button
                    type="button"
                    onClick={() => setPromptChips((prev) => prev.filter((c) => c.id !== chip.id))}
                    className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer leading-none"
                    title="프롬프트에서 제거"
                  >
                    ×
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={() => setPromptChips([])}
                className="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer ml-auto shrink-0 transition-colors"
                title="모든 칩 비우기"
              >
                비우기
              </button>
            </div>
          )}

          {/* @ 멘션 자동완성 팝업 메뉴 */}
          {showMentionMenu && (
            <div className="absolute left-2.5 bottom-full mb-2 w-72 bg-[#161922] border border-indigo-500/70 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 text-[11px] animate-in fade-in duration-100 backdrop-blur-md">
              <div className="text-[10px] text-indigo-300 font-bold px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>@ 멘션하여 프롬프트에 잡기</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMentionMenu(false)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!promptChips.some((c) => c.label === '11월 디딤돌 회의록.pdf')) {
                      setPromptChips((prev) => [
                        ...prev,
                        { id: 'chip-doc-11', type: 'doc', icon: '📄', label: '11월 디딤돌 회의록.pdf', resourceName: '11월 디딤돌 회의록.pdf' },
                      ]);
                    }
                    setShowMentionMenu(false);
                    onChangePromptInput(promptInput.replace(/@\S*$/, ''));
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="text-base">📄</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-100 truncate">11월 디딤돌 회의록.pdf</div>
                    <div className="text-[9px] text-slate-400">참조 원본 문서 (별지 제3호 서식)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!promptChips.some((c) => c.label.includes('Recipe'))) {
                      setPromptChips((prev) => [
                        ...prev,
                        { id: 'chip-rcp-main', type: 'recipe', icon: '📋', label: 'Recipe: 회의록 서식' },
                      ]);
                    }
                    setShowMentionMenu(false);
                    onChangePromptInput(promptInput.replace(/@\S*$/, ''));
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="text-base">📋</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-100 truncate">Recipe: 회의록 서식</div>
                    <div className="text-[9px] text-slate-400">저작 규격 템플릿</div>
                  </div>
                </button>

                {SLOT_MODIFICATIONS.slice(0, 7).map((m) => (
                  <button
                    key={m.slotId}
                    type="button"
                    onClick={() => {
                      if (!promptChips.some((c) => c.slotId === m.slotId)) {
                        setPromptChips((prev) => [
                          ...prev,
                          { id: `chip-slot-${m.slotId}`, type: 'slot', icon: m.icon, label: `Slot #${m.slotId.replace('s', '')} ${m.name}`, slotId: m.slotId },
                        ]);
                      }
                      setShowMentionMenu(false);
                      onChangePromptInput(promptInput.replace(/@\S*$/, ''));
                    }}
                    className="w-full text-left px-2 py-1 rounded-md hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>{m.icon}</span>
                    <span className="font-semibold text-slate-200 truncate">Slot #{m.slotId.replace('s', '')} {m.name}</span>
                    <span className="text-[10px] text-slate-400 truncate ml-auto font-mono">{m.changeText}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={promptInput}
            onChange={(e) => {
              const val = e.target.value;
              onChangePromptInput(val);
              if (val.endsWith('@')) {
                setShowMentionMenu(true);
              } else if (!val.includes('@') && showMentionMenu) {
                setShowMentionMenu(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowMentionMenu(false);
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleInternalSend();
              }
            }}
            placeholder="Ask anything, @ to mention slots/docs, / for actions"
            rows={2}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-sans leading-relaxed placeholder-slate-500"
          />

          {/* 컴포저 하단 모델 피커 및 마이크/전송 버튼 */}
          <div className="flex items-center justify-between pt-0.5">
            {/* 모델 셀렉터 & @멘션 트리거 버튼 */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-750 cursor-pointer border border-slate-700/60"
                >
                  <span>+</span>
                  <span className="font-medium text-slate-300">{selectedModel}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-1.5 w-48 bg-[#161922] border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-[11px]">
                    {availableModels.map((m) => (
                      <div
                        key={m}
                        onClick={() => {
                          onSelectModel(m);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`px-3 py-1.5 hover:bg-slate-800 cursor-pointer ${
                          m === selectedModel ? 'text-indigo-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* @멘션 빠른 삽입 버튼 */}
              <button
                type="button"
                onClick={() => setShowMentionMenu((v) => !v)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 cursor-pointer transition-colors flex items-center gap-1"
                title="문서 또는 슬롯을 멘션하여 프롬프트에 칩으로 잡기"
              >
                <span>@</span>
                <span>멘션</span>
              </button>
            </div>

            {/* 마이크 및 전송 버튼 */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
                title="음성 입력"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleInternalSend}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  promptInput.trim() || promptChips.length > 0
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Send Prompt (Enter)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
