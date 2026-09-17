import { useState } from 'react';
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
}

const availableModels = [
  'Gemini 3.8 Flash High',
  'Gemini 3.1 Pro',
  'Gemini 3.5 Flash Lite',
  'Gemma 4 31B',
];

// 첨부 2의 14개 슬롯 및 와이어프레임 타겟 정의
const SLOT_MODIFICATIONS = [
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
  },
];

// Flowith 스타일 Context Building 풀 항목들
interface FlowithContextTag {
  id: string;
  type: 'doc' | 'recipe' | 'slot' | 'asset';
  icon: string;
  label: string;
  thumbnail?: string;
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
}: IdeSecondarySidebarProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [isChangesExpanded, setIsChangesExpanded] = useState(true);

  // Flowith 컨텍스트 풀 태그 목록 상태
  const [contextTags, setContextTags] = useState<FlowithContextTag[]>(INITIAL_CONTEXT_TAGS);
  const [isContextPickerOpen, setIsContextPickerOpen] = useState(false);

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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-slate-100 transition-colors">
                <span>📋</span>
                <span>Recipe: 회의록 서식</span>
              </span>{' '}
              저작 규격에 맞춰{' '}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-slate-100 transition-colors">
                <span>📄</span>
                <span>11월 디딤돌 회의록.pdf</span>
              </span>{' '}
              에서 데이터를 추출하고,{' '}
              <span
                onClick={() => onSelectSlot && onSelectSlot('s1')}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <span>🎯</span>
                <span>Slot #1 일시</span>
              </span>{' '}
              ,{' '}
              <span
                onClick={() => onSelectSlot && onSelectSlot('s5')}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <span>🎯</span>
                <span>Slot #5 회의내용</span>
              </span>{' '}
              ,{' '}
              <span
                onClick={() => onSelectSlot && onSelectSlot('s6')}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <span>💰</span>
                <span>Slot #6 지출금액</span>
              </span>{' '}
              및{' '}
              <span
                onClick={() => onSelectSlot && onSelectSlot('s7')}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-white text-slate-900 border border-slate-200 shadow-2xs text-[11px] font-semibold align-middle cursor-pointer hover:bg-cyan-50 transition-colors"
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
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 py-0.5">
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
          </div>

          {/* 스텝 3: 슬롯 바인딩 실행 (Bound 🎯 Slot #2 [장소]) */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 py-0.5">
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
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 py-0.5">
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
          </div>

          {/* 스텝 6: 지출 금액 바인딩 (Bound 💰 Slot #6 [지출금액]) */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 py-0.5">
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
          </div>

          {/* 스텝 7: 증빙 영수증 연결 (Linked 📎 Slot #7 [증빙자료]) */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 py-0.5">
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
              <span className="text-emerald-400 font-mono">14 Items</span>
            </div>

            {SLOT_MODIFICATIONS.map((m) => {
              const isBound = slotBindings[m.slotId]?.status === 'bound' || acceptedAll;
              return (
                <div
                  key={m.slotId}
                  onClick={() => handleSlotClick(m.slotId, m.changeText, m.resourceName)}
                  className={`p-1.5 rounded flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isBound ? 'bg-slate-900/50 hover:bg-slate-850' : 'bg-[#12151c] hover:bg-[#191d26]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-emerald-400 shrink-0 font-bold">{m.diffAdded}</span>
                    <span className="text-rose-400 shrink-0">{m.diffRemoved}</span>
                    <span className="text-slate-400 shrink-0">{m.icon}</span>
                    <span className="font-semibold text-slate-200 truncate">
                      Slot #{m.slotId.replace('s', '')} [{m.name}]
                    </span>
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

        {/* 텍스트에어리어 컴포저 입력창 */}
        <div className="relative bg-[#161922] rounded-xl border border-slate-750 p-2.5 space-y-2 focus-within:border-indigo-500 transition-colors shadow-inner">
          <textarea
            value={promptInput}
            onChange={(e) => onChangePromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendPrompt();
              }
            }}
            placeholder="Ask anything, @ to mention slots/docs, / for actions"
            rows={2}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-sans leading-relaxed placeholder-slate-500"
          />

          {/* 컴포저 하단 모델 피커 및 마이크/전송 버튼 */}
          <div className="flex items-center justify-between pt-0.5">
            {/* 모델 셀렉터 */}
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
                onClick={onSendPrompt}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  promptInput.trim()
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
